import { useEffect, useState, useSyncExternalStore } from 'react';
import { getTrain, isPassengerStop, type TrainDetailDto } from '../../api/catalog';
import TrainDetailView from './TrainDetailView';
import type { MainNavTab } from './MapView';
import type { TrainPurpose } from '../../types/neareast';
import { savedStore } from '../../store/saved';
import { authStore } from '../../store/auth';
import { returnToStore } from '../../store/returnTo';
import { ROUTES, navigateTo } from '../../routes';

interface TrainDetailProps {
  trainNo: string;
  stationId?: string;
  onNavigate: (tab: MainNavTab) => void;
}

export default function TrainDetail({ trainNo, stationId, onNavigate }: TrainDetailProps) {
  const [train, setTrain] = useState<TrainDetailDto | null>(null);
  const [selectedStation, setSelectedStation] = useState(stationId ?? '');
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const saved = useSyncExternalStore(savedStore.subscribe, savedStore.getSnapshot);
  useEffect(() => {
    let cancelled = false;
    setError(false); setTrain(null);
    void getTrain(trainNo).then((result) => {
      if (cancelled) return;
      setTrain(result);
      setSelectedStation(result.stops.some((stop) => stop.place_id === stationId) ? stationId! : result.stops.find((stop) => stop.place_id)?.place_id ?? '');
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [trainNo, stationId, attempt]);
  const selectedStop = train?.stops.find((stop) => stop.place_id === selectedStation);
  function toggleTrain(purpose: TrainPurpose) {
    if (!train || !selectedStation) return;
    if (!authStore.getSnapshot()) {
      returnToStore.remember({ route: `#/trains/${encodeURIComponent(trainNo)}?station=${encodeURIComponent(selectedStation)}` });
      navigateTo(ROUTES.login);
      return;
    }
    savedStore.toggleTrain({ id: `${train.no}:${selectedStation}`, trainNo: train.no,
      stationId: selectedStation, trainName: `${train.type ?? '차종 미확인'} ${train.no}`,
      route: `${train.origin} → ${train.destination}`, savedFrom: selectedStop?.name ?? '열차 정보' }, purpose);
  }
  if (!train) return <main className="AppPage Integration-Panel">
    {error ? <p role="alert">열차 상세를 불러오지 못했어요. <button onClick={() => setAttempt((value) => value + 1)}>다시 시도</button></p> : <p role="status">열차 상세를 불러오고 있어요…</p>}
    <button onClick={() => onNavigate('열차 정보')}>열차 목록으로</button>
  </main>;
  return <TrainDetailView
    trainName={`${train.type ?? '차종 미확인'} ${train.no}`} route={`${train.origin} → ${train.destination}`}
    operationDays={`기준일 ${train.basis.target_date ?? '자료별 상이'} · ${train.basis.summary}`}
    stops={train.stops.map((stop) => ({ stationName: stop.name,
      arrivalTime: stop.arr, departureTime: stop.dep ?? stop.pass_time, isStop: isPassengerStop(stop) }))}
    savedPurpose={saved.trains.find((entry) => entry.trainNo === train.no && entry.stationId === selectedStation)?.purpose ?? null}
    onSaveTrain={toggleTrain} canBoard={!!selectedStop && isPassengerStop(selectedStop)}
    pending={saved.loading || saved.pending || !selectedStation} onBack={() => onNavigate('열차 정보')}>
    <div className="Integration-Fields"><label>담을 역<select aria-label="담을 역" value={selectedStation} onChange={(event) => setSelectedStation(event.target.value)}>
      {train.stops.filter((stop) => stop.place_id).map((stop) => <option key={stop.place_id} value={stop.place_id!}>{stop.name} · {isPassengerStop(stop) ? '정차' : '통과'}</option>)}
    </select></label></div>
    {selectedStop && !isPassengerStop(selectedStop) && <p className="Integration-Note">선택한 역에서는 탑승할 수 없어요. 관찰은 공개된 안전한 장소에서만 해 주세요.</p>}
    <p className="Integration-Note">{(train.basis.limits ?? []).join(' · ')} · 통과 시각은 추정값일 수 있어요.</p>
    <a href="https://www.korail.com" target="_blank" rel="noopener noreferrer">코레일에서 확인·예약하기 ↗</a>
  </TrainDetailView>;
}
