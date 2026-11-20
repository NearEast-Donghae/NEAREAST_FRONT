import { useEffect, useMemo, useState } from 'react';
import CatalogMap from '../main/CatalogMap';
import { getPlaces, type PlaceDto } from '../../api/catalog';
import type { SavedTrip } from '../../types/neareast';

export default function TripRoute({ trip }: { trip: SavedTrip }) {
  const [catalog, setCatalog] = useState<PlaceDto[]>([]);
  const [catalogError, setCatalogError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setCatalogError(false);
    void getPlaces().then((places) => { if (!cancelled) setCatalog(places); })
      .catch(() => { if (!cancelled) setCatalogError(true); });
    return () => { cancelled = true; };
  }, [attempt]);
  const places = useMemo(() => {
    const identifiers = new Set(trip.timeline.map((row) => row.placeId));
    return catalog.filter((place) => identifiers.has(place.id));
  }, [catalog, trip.timeline]);
  const legs = trip.legs ?? [];
  if (!legs.length) return <p className="Integration-Note">이 일정에는 저장된 이동 경로가 없어요.</p>;
  const names = new Map<string, string>(trip.timeline.filter((row) => row.placeId).map((row) => [row.placeId!, row.description]));
  catalog.forEach((place) => names.set(place.id, place.name));
  return <section aria-label="여행 이동 경로">
    <h3>여행 이동 경로</h3>
    {catalogError && <p role="status">장소 표시를 불러오지 못했어요. 저장된 이동 경로는 확인할 수 있어요. <button onClick={() => setAttempt((value) => value + 1)}>장소 표시 다시 불러오기</button></p>}
    <div className="Integration-Route"><CatalogMap places={places} legs={trip.legs} /></div>
    <p className="Integration-Note">일정에 저장된 경로를 표시해요. 도보 경로는 TMAP 추정값이며 철도 선로를 나타내지 않아요.</p>
    <ol>{legs.map((leg, index) => <li key={`${leg.fromPlaceId}-${leg.toPlaceId}-${index}`}>
      {names.get(leg.fromPlaceId) ?? '출발 장소'} → {names.get(leg.toPlaceId) ?? '도착 장소'} · {leg.mode === 'walk' ? '도보' : leg.mode}
      {leg.durationMinutes !== null && ` 약 ${leg.durationMinutes}분`}
      {leg.distanceMeters !== null && ` · ${(leg.distanceMeters / 1000).toFixed(1)}km`}
      {!leg.coordinates.length && ' · 지도 경로 미확보'}
    </li>)}</ol>
  </section>;
}
