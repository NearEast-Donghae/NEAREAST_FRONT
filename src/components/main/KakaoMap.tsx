import React, { useEffect, useRef, useState } from 'react';
import DONGHAE_BOUNDARY from '../../assets/donghae-boundary.json';
import './KakaoMap.css';

// 동해시 행정경계 [위도, 경도] — 통계청 2013 시군구 경계(southkorea-maps)를 1/3로 간략화
const BOUNDARY = DONGHAE_BOUNDARY as [number, number][];

// 경계 바깥을 덮는 마스크의 바깥 테두리 — 화면에 보일 수 있는 범위보다 충분히 크게
const MASK_OUTER: [number, number][] = [
  [39.5, 126.5],
  [39.5, 131.5],
  [35.5, 131.5],
  [35.5, 126.5],
];

// 경계에 딱 맞추면 해안선이 화면 끝에 붙어서, 이동 허용 범위를 조금 넓힌다
const PAN_MARGIN = 0.03;

let sdkPromise: Promise<void> | null = null;

function loadKakaoSdk(appKey: string): Promise<void> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.onload = () => window.kakao.maps.load(() => resolve());
    script.onerror = () => {
      sdkPromise = null;
      // 키는 맞는데 도메인 미등록이면 403으로 여기에 온다
      reject(new Error('카카오맵을 불러오지 못했습니다. 카카오 디벨로퍼스에 현재 주소가 JavaScript SDK 도메인으로 등록됐는지 확인하세요.'));
    };
    document.head.appendChild(script);
  });
  return sdkPromise;
}

const KakaoMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    if (!appKey) {
      setErrorMessage('.env에 VITE_KAKAO_MAP_KEY가 없습니다.');
      return;
    }

    let isCancelled = false;

    loadKakaoSdk(appKey)
      .then(() => {
        if (isCancelled || !containerRef.current) return;
        const { maps } = window.kakao;

        const toLatLngs = (points: [number, number][]) =>
          points.map(([lat, lng]) => new maps.LatLng(lat, lng));

        const boundaryPath = toLatLngs(BOUNDARY);
        const boundaryBounds = new maps.LatLngBounds();
        boundaryPath.forEach((point: any) => boundaryBounds.extend(point));

        const map = new maps.Map(containerRef.current, {
          center: boundaryBounds.getCenter?.() ?? boundaryPath[0],
          level: 8,
        });
        map.setBounds(boundaryBounds);
        // 동해시 전체가 보이는 배율보다 한 단계 이상은 축소 못 하게
        map.setMaxLevel(map.getLevel() + 1);

        // 구멍(동해시)이 뚫린 마스크: 두 번째 경로가 첫 번째 경로의 구멍이 된다
        new maps.Polygon({
          map,
          path: [toLatLngs(MASK_OUTER), boundaryPath],
          strokeWeight: 0,
          fillColor: '#f5f5f5',
          fillOpacity: 0.85,
        });

        new maps.Polyline({
          map,
          path: [...boundaryPath, boundaryPath[0]],
          strokeWeight: 2,
          strokeColor: '#333333',
          strokeOpacity: 0.8,
        });

        const southWest = boundaryBounds.getSouthWest();
        const northEast = boundaryBounds.getNorthEast();
        const minLat = southWest.getLat() - PAN_MARGIN;
        const maxLat = northEast.getLat() + PAN_MARGIN;
        const minLng = southWest.getLng() - PAN_MARGIN;
        const maxLng = northEast.getLng() + PAN_MARGIN;

        // 카카오맵에는 이동 범위 제한 옵션이 없어서, 벗어나면 중심을 범위 안으로 되돌린다
        const handleKeepInsideDonghae = () => {
          const center = map.getCenter();
          const lat = Math.min(Math.max(center.getLat(), minLat), maxLat);
          const lng = Math.min(Math.max(center.getLng(), minLng), maxLng);
          if (lat !== center.getLat() || lng !== center.getLng()) {
            map.panTo(new maps.LatLng(lat, lng));
          }
        };
        maps.event.addListener(map, 'dragend', handleKeepInsideDonghae);
        maps.event.addListener(map, 'zoom_changed', handleKeepInsideDonghae);
      })
      .catch((error: Error) => {
        if (!isCancelled) setErrorMessage(error.message);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="KakaoMap">
      <div ref={containerRef} className="KakaoMap-Container" />
      {errorMessage !== null && <p className="KakaoMap-Error">{errorMessage}</p>}
    </div>
  );
};

export default KakaoMap;
