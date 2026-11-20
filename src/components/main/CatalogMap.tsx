import { useEffect, useRef, useState } from 'react';
import { loadKakaoSdk } from '../../api/mapSdk';
import { PLACE_KIND_LABELS, type PlaceDto } from '../../api/catalog';
import type { TripLeg } from '../../types/neareast';
import './KakaoMap.css';

interface CatalogMapProps {
  places: PlaceDto[];
  onPlaceClick?: (placeId: string) => void;
  legs?: TripLeg[];
}

export default function CatalogMap({ places, onPlaceClick, legs }: CatalogMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const clickRef = useRef(onPlaceClick);
  clickRef.current = onPlaceClick;
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    let dispose = () => {};
    setError(null);
    setReady(false);
    void loadKakaoSdk().then(() => {
      if (cancelled || !containerRef.current) return;
      const { maps } = window.kakao;
      const map = new maps.Map(containerRef.current, { center: new maps.LatLng(37.515, 129.123), level: 8 });
      map.addControl(new maps.ZoomControl(), maps.ControlPosition.RIGHT);
      const bounds = new maps.LatLngBounds();
      let pointCount = 0;
      const overlays: { setMap: (map: null) => void }[] = [];
      places.forEach((place) => {
        if (place.lat === null || place.lng === null) return;
        const position = new maps.LatLng(place.lat, place.lng);
        bounds.extend(position);
        pointCount += 1;
        const button = document.createElement(onPlaceClick ? 'button' : 'div');
        if (button instanceof HTMLButtonElement) button.type = 'button';
        button.className = `KakaoMap-Station KakaoMap-Station--passenger CatalogMap-Marker--${place.kind}`;
        button.title = place.name;
        button.setAttribute('aria-label', onPlaceClick ? `${place.name} 상세 보기` : place.name);
        if (!onPlaceClick) button.setAttribute('role', 'img');
        const label = document.createElement('span');
        label.className = 'KakaoMap-StationLabel';
        label.textContent = `${place.name} · ${PLACE_KIND_LABELS[place.kind]}`;
        const pin = document.createElement('span');
        pin.className = 'KakaoMap-StationPin';
        button.append(label, pin);
        button.onclick = () => clickRef.current?.(place.id);
        overlays.push(new maps.CustomOverlay({ map, position, content: button, yAnchor: 1, clickable: true }));
      });
      (legs ?? []).forEach((leg) => {
        const path = leg.coordinates.map(([longitude, latitude]) => new maps.LatLng(latitude, longitude));
        path.forEach((position) => { bounds.extend(position); pointCount += 1; });
        if (path.length > 1) overlays.push(new maps.Polyline({ map, path, strokeWeight: 5, strokeColor: '#333333', strokeOpacity: 0.8 }));
      });
      if (pointCount) map.setBounds(bounds, 60, 60, 60, 60);
      const updateLabels = () => rootRef.current?.classList.toggle('CatalogMap--overview', map.getLevel() >= 6);
      updateLabels();
      maps.event.addListener(map, 'zoom_changed', updateLabels);
      resizeObserver = new ResizeObserver(() => map.relayout());
      resizeObserver.observe(containerRef.current);
      dispose = () => {
        maps.event.removeListener(map, 'zoom_changed', updateLabels);
        overlays.forEach((overlay) => overlay.setMap(null));
      };
      setReady(true);
    }).catch((exception: Error) => { if (!cancelled) setError(exception.message); });
    return () => { cancelled = true; resizeObserver?.disconnect(); dispose(); };
  }, [places, legs, attempt]);

  return <div ref={rootRef} className="KakaoMap">
    <div ref={containerRef} className="KakaoMap-Container" aria-label="장소와 이동 경로 지도" />
    {!ready && !error && <p className="KakaoMap-Error" role="status">지도를 불러오고 있어요…</p>}
    {error && <div className="KakaoMap-Error" role="status">{error} <button onClick={() => setAttempt((value) => value + 1)}>지도 다시 불러오기</button></div>}
  </div>;
}
