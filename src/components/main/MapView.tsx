import { useEffect, useMemo, useState } from 'react';
import CatalogMap from './CatalogMap';
import { getPlaces, PLACE_KIND_LABELS, type PlaceDto } from '../../api/catalog';
import { distanceKm } from '../../utils/geography';
import { readSessionState, writeSessionState } from '../../utils/sessionState';
import './MapView.css';

export type MainNavTab = '철도 지도' | '열차 정보' | 'AI 여행 플래너' | '여행 계획하기' | '나의 여행 일정';
export interface MapViewProps {
  onStationClick: (placeId: string) => void;
}

export default function MapView({ onStationClick }: MapViewProps) {
  const [places, setPlaces] = useState<PlaceDto[]>([]);
  const [initialFilters] = useState(() => readSessionState('neareast.mapFilters', { query: '', kind: 'all', stationId: '', radiusKm: 3 }));
  const [query, setQuery] = useState(initialFilters.query);
  const [kind, setKind] = useState(initialFilters.kind);
  const [stationId, setStationId] = useState(initialFilters.stationId);
  const [radiusKm, setRadiusKm] = useState(initialFilters.radiusKm);
  useEffect(() => { writeSessionState('neareast.mapFilters', { query, kind, stationId, radiusKm }); }, [query, kind, stationId, radiusKm]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    void getPlaces().then((result) => { if (!cancelled) setPlaces(result); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);
  const selectedStation = places.find((place) => place.id === stationId);
  const filtered = useMemo(() => places.filter((place) =>
    (kind === 'all' || place.kind === kind) &&
    [place.name, ...place.aliases].some((name) => name.includes(query.trim())) &&
    (!selectedStation || place.id === selectedStation.id || (distanceKm(selectedStation, place) ?? Infinity) <= radiusKm))
    .sort((left, right) => selectedStation
      ? (distanceKm(selectedStation, left) ?? Infinity) - (distanceKm(selectedStation, right) ?? Infinity)
      : Number(right.kind === 'station') - Number(left.kind === 'station') || left.name.localeCompare(right.name, 'ko')),
  [places, kind, query, selectedStation, radiusKm]);

  return <div className="MapView">
    <form className="MapView-SearchBar" onSubmit={(event) => {
      event.preventDefault();
      document.getElementById('place-list')?.scrollIntoView({ behavior: 'smooth' });
    }}>
      <div className="MapView-SearchInput"><span aria-hidden="true">⌕</span>
        <input className="MapView-SearchField" aria-label="장소 검색" placeholder="역·관광지 이름으로 검색하세요." value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <button type="submit" className="MapView-SearchButton">검색</button>
    </form>
    <main className="MapView-Catalog">
      <div className="MapView-MapArea"><CatalogMap places={filtered} onPlaceClick={onStationClick} /></div>
      <section id="place-list" className="Integration-Panel" aria-label="장소 목록">
        <div className="Integration-Fields"><label>장소 종류
          <select aria-label="장소 종류" value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">전체</option>
            {Object.entries(PLACE_KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>역별로 보기<select aria-label="역별로 보기" value={stationId} onChange={(event) => setStationId(event.target.value)}>
            <option value="">모든 역·장소</option>{places.filter((place) => place.kind === 'station').map((station) =>
              <option key={station.id} value={station.id}>{station.name}{station.lat === null || station.lng === null ? ' · 위치 확인 중' : ''}</option>)}
          </select></label>
          {selectedStation && <label>역 주변 범위<select aria-label="역 주변 범위" value={radiusKm} onChange={(event) => setRadiusKm(Number(event.target.value))}>
            {[1, 3, 5, 10].map((radius) => <option key={radius} value={radius}>직선거리 {radius}km</option>)}
          </select></label>}
          <p role="status">{loading ? '장소를 불러오고 있어요…' : `검색 결과 ${filtered.length}곳`}</p>
          {(query || kind !== 'all' || stationId) && <button onClick={() => { setQuery(''); setKind('all'); setStationId(''); setRadiusKm(3); }}>검색 조건 초기화</button>}
        </div>
        <p className="Integration-Note">역·관광지 마커는 등록된 좌표를 표시해요. 지도 바탕의 선로와 여행 이동 경로는 서로 달라요.</p>
        {selectedStation && <p className="Integration-Note">{selectedStation.lat === null || selectedStation.lng === null
          ? '이 역의 좌표는 확인 중이라 주변 장소를 거리순으로 표시할 수 없어요.'
          : `${selectedStation.name} 중심 직선거리 순서예요. 실제 도보 거리·접근 가능 여부와는 다를 수 있어요. 좌표가 없는 장소는 주변 검색에서 제외돼요.`}</p>}
        {error ? <p role="alert">장소를 불러오지 못했어요. <button onClick={() => setAttempt((value) => value + 1)}>다시 시도</button></p> :
          !loading && filtered.length === 0 ? <p>조건에 맞는 장소가 없어요. 검색어나 종류를 바꿔 보세요.</p> :
          <ul className="Integration-List">{filtered.map((place) => <li key={place.id}>
            <span className="Integration-Note">{PLACE_KIND_LABELS[place.kind]}</span><h3>{place.name}</h3>
            {(place.lat === null || place.lng === null) && <p className="Integration-Note">위치 확인 중 · 지도 표시 제외</p>}
            {selectedStation && distanceKm(selectedStation, place) !== null && <p className="Integration-Note">역에서 직선거리 {distanceKm(selectedStation, place)!.toFixed(1)}km</p>}
            <button onClick={() => onStationClick(place.id)} aria-label={`${place.name} 상세 보기`}>상세 보기 →</button>
          </li>)}</ul>}
      </section>
    </main>
  </div>;
}
