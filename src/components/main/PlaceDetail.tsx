import { useEffect, useState, useSyncExternalStore } from 'react';
import { getPlace, PLACE_KIND_LABELS, type PlaceDetailDto } from '../../api/catalog';
import StationInfoPopup from './StationInfoPopup';
import { savedStore } from '../../store/saved';
import { authStore } from '../../store/auth';
import { ROUTES, navigateTo } from '../../routes';
import { returnToStore } from '../../store/returnTo';

interface PlaceDetailProps {
  placeId: string;
  onClose: () => void;
  onPlan: (placeId: string) => void;
  onTrains: (placeId: string) => void;
}

export default function PlaceDetail({ placeId, onClose, onPlan, onTrains }: PlaceDetailProps) {
  const [place, setPlace] = useState<PlaceDetailDto | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const saved = useSyncExternalStore(savedStore.subscribe, savedStore.getSnapshot);
  useEffect(() => {
    let cancelled = false;
    setPlace(null); setError(false);
    void getPlace(placeId).then((result) => { if (!cancelled) setPlace(result); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [placeId, attempt]);

  function togglePlace() {
    if (!place) return;
    if (!authStore.getSnapshot()) {
      returnToStore.remember({ route: `#/places/${encodeURIComponent(placeId)}` });
      navigateTo(ROUTES.login);
      return;
    }
    if (saved.places.some((entry) => entry.id === placeId)) savedStore.removePlace(placeId);
    else savedStore.addPlace({ id: place.id, name: place.name, category: PLACE_KIND_LABELS[place.kind], description: place.summary ?? '' });
  }
  return <StationInfoPopup
    stationName={place?.name ?? (error ? '장소를 불러오지 못했어요' : '장소를 불러오는 중…')}
    operationStatus={place?.kind === 'station'
      ? place.passenger_stop === true ? '여객 정차역' : place.passenger_stop === false ? '여객 정차 없음' : '정차 여부 확인 중'
      : place ? PLACE_KIND_LABELS[place.kind] : ''}
    description={place?.description ?? place?.summary ?? '상세 설명을 확인 중이에요.'}
    trains={[]} isSaved={saved.places.some((entry) => entry.id === placeId)}
    onClose={onClose} onAddToWishlist={togglePlace} pending={!place || saved.pending || saved.loading}>
    {error && <p role="alert">연결 상태를 확인해 주세요. <button onClick={() => setAttempt((value) => value + 1)}>다시 시도</button></p>}
    {place && <>
      <p className="Integration-Note">{place.lat !== null && place.lng !== null ? `위치: ${place.lat}, ${place.lng}` : '위치 확인 중 · 지도에 표시되지 않아요.'}</p>
      <div className="Integration-Actions">
        <button onClick={() => onPlan(place.id)}>이 장소를 넣어 여행 계획하기</button>
        {place.kind === 'station' && <button onClick={() => onTrains(place.id)}>이 역의 열차 조회</button>}
      </div>
    </>}
  </StationInfoPopup>;
}
