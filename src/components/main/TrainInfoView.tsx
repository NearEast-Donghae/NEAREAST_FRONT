import { useEffect, useRef, useState } from 'react';
import { getPlaces, getStationTrains, searchTrains, type PlaceDto, type TrainDto, type TimetableBasis } from '../../api/catalog';
import './TrainInfoView.css';
import { readSessionState, writeSessionState } from '../../utils/sessionState';

export interface TrainResult {
  id: string;
  trainName: string;
  route: string;
  departureStation: string;
  departureTime: string;
  trainNo: string;
  stationId: string;
}
interface TrainInfoViewProps {
  onViewDetail: (train: TrainResult) => void;
  initialStationId?: string;
}
export default function TrainInfoView({ onViewDetail, initialStationId }: TrainInfoViewProps) {
  const [stations, setStations] = useState<PlaceDto[]>([]);
  const [previousSearch] = useState(() => readSessionState('neareast.trainSearch', { fromId: '', toId: '', after: '00:00', searched: false }));
  const [fromId, setFromId] = useState(initialStationId ?? previousSearch.fromId);
  const [toId, setToId] = useState(initialStationId ? '' : previousSearch.toId);
  const [after, setAfter] = useState(initialStationId ? '00:00' : previousSearch.after);
  const formRef = useRef<HTMLFormElement>(null);
  const restoreSearch = useRef(!initialStationId && previousSearch.searched);
  const [results, setResults] = useState<TrainDto[]>([]);
  const [basis, setBasis] = useState<TimetableBasis | null>(null);
  const [searchedStationId, setSearchedStationId] = useState('');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchVersion = useRef(0);
  const busy = useRef(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    void getPlaces().then((places) => {
      if (cancelled) return;
      const nextStations = places.filter((place) => place.kind === 'station');
      setStations(nextStations);
      setFromId((current) => current || nextStations.find((place) => place.name === '동해역')?.id || nextStations[0]?.id || '');
      setError(null);
    }).catch(() => { if (!cancelled) setError('역 목록을 불러오지 못했어요.'); });
    return () => { cancelled = true; searchVersion.current += 1; };
  }, [attempt]);
  useEffect(() => {
    if (stations.length && restoreSearch.current) {
      restoreSearch.current = false;
      formRef.current?.requestSubmit();
    }
  }, [stations]);
  function clearResults() {
    searchVersion.current += 1;
    setResults([]); setSearched(false); setBasis(null);
  }
  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    if (!fromId || busy.current) return;
    if (toId === fromId) { setError('출발역과 도착역을 다르게 선택해 주세요.'); return; }
    busy.current = true;
    const version = ++searchVersion.current;
    setLoading(true); setError(null); setResults([]); setSearched(false); setBasis(null);
    try {
      const response = toId ? await searchTrains(fromId, toId, after) : await getStationTrains(fromId, after);
      if (version !== searchVersion.current) return;
      setResults(response.trains); setBasis(response.basis); setSearched(true); setSearchedStationId(fromId);
      writeSessionState('neareast.trainSearch', { fromId, toId, after, searched: true });
    } catch { if (version === searchVersion.current) setError('열차 정보를 불러오지 못했어요. 조건을 확인하고 다시 시도해 주세요.'); }
    finally { busy.current = false; setLoading(false); }
  }
  const stationName = stations.find((station) => station.id === searchedStationId)?.name ?? '';
  return <div className="TrainInfoView">
    <main className="TrainInfoView-Main">
      <h1 className="TrainInfoView-Title">열차 정보</h1>
      <p className="TrainInfoView-Subtitle">구간을 조회하거나, 한 역을 지나는 열차를 찾아보세요.</p>
      <form ref={formRef} className="Integration-Fields" onSubmit={handleSearch}>
        <label>조회 역<select aria-label="조회 역" required value={fromId} disabled={loading} onChange={(event) => { setFromId(event.target.value); clearResults(); }}>
          <option value="">역 선택</option>{stations.map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
        </select></label>
        <label>도착역<select aria-label="도착역" value={toId} disabled={loading} onChange={(event) => { setToId(event.target.value); clearResults(); }}>
          <option value="">전체 · 이 역을 지나는 열차</option>{stations.filter((station) => station.id !== fromId && station.passenger_stop).map((station) => <option key={station.id} value={station.id}>{station.name}</option>)}
        </select></label>
        <label>조회 시작 시각<input type="time" required value={after} disabled={loading} onChange={(event) => { setAfter(event.target.value); clearResults(); }} /></label>
        <button type="submit" className="TrainInfoView-SearchButton" disabled={!fromId || loading}>{loading ? '조회 중…' : '열차 찾기'}</button>
      </form>
      <p className="Integration-Note">현재 제공되는 기준일 시간표예요. 실시간 운행·예약 가능 여부는 철도 운영사에서 확인해 주세요.</p>
      {error && <p role="alert">{error} {!stations.length && <button onClick={() => setAttempt((value) => value + 1)}>다시 시도</button>}</p>}
      {basis && <p className="Integration-Note">기준일: {basis.target_date ?? '자료별 상이'} · {basis.summary} {(basis.limits ?? []).join(' · ')}</p>}
      {searched && <p role="status">검색 결과 {results.length}건{!results.length && ' · 조건에 맞는 열차가 없어요.'}</p>}
      <div className="TrainInfoView-Results">{results.map((train) =>
        <div key={train.no} className="TrainInfoView-ResultCard">
          <div className="TrainInfoView-ResultInfo"><span className="TrainInfoView-TrainName">{train.type} {train.no}</span><span>{train.origin} → {train.destination}</span></div>
          <div className="TrainInfoView-DepartureInfo"><span>{stationName} {train.passing ? '통과 · 탑승 불가' : '정차'}</span>
            <span className="TrainInfoView-DepartureTime">{train.dep ?? train.time ?? train.arr ?? '시각 미확인'}</span></div>
          <button className="TrainInfoView-DetailButton" onClick={() => onViewDetail({
            id: `${train.no}:${searchedStationId}`, trainNo: train.no, stationId: searchedStationId,
            trainName: `${train.type} ${train.no}`, route: `${train.origin} → ${train.destination}`,
            departureStation: stationName, departureTime: train.dep ?? train.time ?? '',
          })}>상세 보기 →</button>
        </div>)}</div>
      <p><a href="https://www.korail.com" target="_blank" rel="noopener noreferrer">코레일에서 운행 확인·예약하기 ↗</a></p>
    </main>
  </div>;
}
