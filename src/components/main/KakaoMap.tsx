import React, { useEffect, useRef, useState } from 'react';
import DONGHAE_BOUNDARY from '../../assets/donghae-boundary.json';
import './KakaoMap.css';

// 동해시 행정경계 [위도, 경도] — 통계청 2013 시군구 경계(southkorea-maps)를 1/3로 간략화.
// 화면에 그리지는 않고, 처음 배율·이동 범위를 동해시에 맞추는 데만 쓴다
const BOUNDARY = DONGHAE_BOUNDARY as [number, number][];

type LineKind = 'main' | 'closed' | 'freight';

// 역을 잇는 선 — 실제 노선의 연결 순서를 따른 직선(노선도식)이다. 선로 모양 자체는 카카오 지도에 이미 그려져 있다.
//   영동선: 망상해수욕장(임시) – 망상 – 묵호 – 동해,  삼척선: 동해 – 추암,
//   화물 지선: 묵호 – 묵호항화물(묵호항선), 동해 – 삼화화물(북평선)
// 이름은 카카오 장소 검색의 역 이름과 같아야 하고, 둘 중 한 역이라도 검색되지 않으면 그 선은 그리지 않는다
const STATION_LINKS: { from: string; to: string; kind: LineKind }[] = [
  { from: '묵호역', to: '동해역', kind: 'main' },
  { from: '동해역', to: '추암역', kind: 'main' },
  { from: '망상해수욕장역 임시승강장', to: '망상역', kind: 'closed' },
  { from: '망상역', to: '묵호역', kind: 'closed' },
  { from: '묵호역', to: '묵호항화물역', kind: 'freight' },
  { from: '동해역', to: '삼화화물역', kind: 'freight' },
];

const LINE_STYLES: Record<LineKind, { strokeWeight: number; strokeColor: string; strokeOpacity: number; strokeStyle: string }> = {
  main: { strokeWeight: 5, strokeColor: '#333333', strokeOpacity: 0.85, strokeStyle: 'solid' },
  closed: { strokeWeight: 3, strokeColor: '#707070', strokeOpacity: 0.8, strokeStyle: 'shortdash' },
  freight: { strokeWeight: 3, strokeColor: '#707070', strokeOpacity: 0.8, strokeStyle: 'shortdash' },
};

// 경계에 딱 맞추면 해안선이 화면 끝에 붙어서, 이동 허용 범위를 조금 넓힌다
const PAN_MARGIN = 0.03;

// 카카오 지도에서 가장 많이 확대한 레벨
const MIN_ZOOM_LEVEL = 1;

// 처음 화면의 중심 — 동해역 북쪽 시내. 묵호역부터 추암역, 삼화화물역까지 한 화면에 들어온다
const INITIAL_CENTER = { lat: 37.515, lng: 129.123 };

export type StationKind = 'passenger' | 'freight' | 'closed';

export interface MapStation {
  name: string;
  kind: StationKind;
  lat: number;
  lng: number;
  address: string;
}

const STATION_KIND_BADGES: Partial<Record<StationKind, string>> = {
  freight: '화물',
  closed: '폐역',
};

let sdkPromise: Promise<void> | null = null;

function loadKakaoSdk(appKey: string): Promise<void> {
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    // services: 역 위치를 카카오 장소 검색으로 받아오기 위해
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
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

// 카카오 장소 검색 결과에서 동해시의 기차역만 골라 종류를 붙인다.
// 좌표를 코드에 적어 두지 않고 매번 받아오는 건, 기억으로 적은 좌표가 틀릴 수 있고 역 정보가 바뀔 수 있어서다.
function toDonghaeStation(place: any): MapStation | null {
  const category: string = place.category_name ?? '';
  const address: string = place.address_name ?? '';
  if (!category.includes('기차역') || !address.includes('동해시')) return null;

  const isClosed = category.includes('폐역') || place.place_name.includes('폐역');
  const kind: StationKind = isClosed ? 'closed' : place.place_name.includes('화물') ? 'freight' : 'passenger';
  return {
    name: place.place_name.replace(/\s*\(폐역\)\s*/, '').trim(),
    kind,
    lat: Number(place.y),
    lng: Number(place.x),
    address,
  };
}

function searchDonghaeStations(maps: any, bounds: any): Promise<MapStation[]> {
  return new Promise((resolve) => {
    const places = new maps.services.Places();
    const found: MapStation[] = [];
    const handleResult = (data: any[], status: string, pagination: any) => {
      if (status === maps.services.Status.OK) {
        data.forEach((place) => {
          const station = toDonghaeStation(place);
          if (station !== null && !found.some((item) => item.name === station.name)) found.push(station);
        });
        if (pagination?.hasNextPage) {
          pagination.nextPage();
          return;
        }
      }
      // ZERO_RESULT·ERROR면 찾은 데까지만 — 역 마커가 없어도 지도는 쓸 수 있다
      resolve(found);
    };
    places.keywordSearch('기차역', handleResult, { bounds });
  });
}

function createStationElement(station: MapStation, onClick: () => void): HTMLButtonElement {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = `KakaoMap-Station KakaoMap-Station--${station.kind}`;
  const badge = STATION_KIND_BADGES[station.kind];
  element.setAttribute('aria-label', `${station.name}${badge ? ` (${badge})` : ''} 역 정보 보기`);

  const label = document.createElement('span');
  label.className = 'KakaoMap-StationLabel';
  label.textContent = station.name;
  if (badge !== undefined) {
    const badgeElement = document.createElement('span');
    badgeElement.className = 'KakaoMap-StationBadge';
    badgeElement.textContent = badge;
    label.appendChild(badgeElement);
  }

  const pin = document.createElement('span');
  pin.className = 'KakaoMap-StationPin';
  pin.setAttribute('aria-hidden', 'true');

  element.append(label, pin);
  element.addEventListener('click', onClick);
  return element;
}

interface KakaoMapProps {
  // 역 마커를 누르면 호출된다
  onStationClick?: (station: MapStation) => void;
}

const KakaoMap: React.FC<KakaoMapProps> = ({ onStationClick }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // 확대/축소 버튼용 — 카카오 지도는 레벨 숫자가 작을수록 확대된 상태
  const mapRef = useRef<any>(null);
  const [zoomLevel, setZoomLevel] = useState<number | null>(null);
  const [zoomLimits, setZoomLimits] = useState<{ min: number; max: number } | null>(null);
  // 마커는 지도를 만들 때 한 번만 붙이므로, 최신 콜백은 ref로 읽는다
  const onStationClickRef = useRef(onStationClick);
  onStationClickRef.current = onStationClick;

  useEffect(() => {
    const appKey = import.meta.env.VITE_KAKAO_MAP_KEY;
    if (!appKey) {
      setErrorMessage('.env에 VITE_KAKAO_MAP_KEY가 없습니다.');
      return;
    }

    let isCancelled = false;
    let resizeObserver: ResizeObserver | null = null;

    loadKakaoSdk(appKey)
      .then(async () => {
        if (isCancelled || !containerRef.current) return;
        const { maps } = window.kakao;

        const toLatLngs = (points: [number, number][]) =>
          points.map(([lat, lng]) => new maps.LatLng(lat, lng));

        const boundaryPath = toLatLngs(BOUNDARY);
        const boundaryBounds = new maps.LatLngBounds();
        boundaryPath.forEach((point: any) => boundaryBounds.extend(point));

        const map = new maps.Map(containerRef.current, { center: boundaryPath[0], level: 8 });

        // 동해시가 지도 영역을 최대한 채우게 — 여백 없이 맞춘 뒤, 한 단계 더 확대해도 다 들어가면 확대한다
        map.setBounds(boundaryBounds, 0, 0, 0, 0);
        const containsDonghae = () =>
          map.getBounds().contain(boundaryBounds.getSouthWest()) && map.getBounds().contain(boundaryBounds.getNorthEast());
        const fittedLevel = map.getLevel();
        map.setLevel(fittedLevel - 1);
        if (!containsDonghae()) map.setLevel(fittedLevel);
        const fullViewLevel = map.getLevel();
        // 동해시 서비스라 동해시 전체가 보이는 배율보다 더 축소하지는 않는다
        map.setMaxLevel(fullViewLevel);
        // 동해시는 세로로 길어서 전체를 넣으면 지도 좌우가 빈다 — 처음 화면은 동해시가 좌우를 꽉 채우는 배율로 열고, 위아래는 끌어서 보게 한다.
        // 지도 높이는 화면에 따라 바뀌지만 폭(1260px)은 같아서, 폭 기준으로 정해야 어느 화면에서나 같은 배율로 열린다
        const donghaeLngSpan = boundaryBounds.getNorthEast().getLng() - boundaryBounds.getSouthWest().getLng();
        const visibleLngSpan = () => map.getBounds().getNorthEast().getLng() - map.getBounds().getSouthWest().getLng();
        let initialLevel = fullViewLevel;
        for (let level = fullViewLevel - 1; level >= MIN_ZOOM_LEVEL; level -= 1) {
          map.setLevel(level);
          if (visibleLngSpan() < donghaeLngSpan) break; // 더 확대하면 동해시 좌우가 잘린다
          initialLevel = level;
        }
        map.setLevel(initialLevel);
        map.setCenter(new maps.LatLng(INITIAL_CENTER.lat, INITIAL_CENTER.lng));

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

        mapRef.current = map;

        // 지도 영역은 화면 높이에 맞춰 크기가 바뀌는데, 카카오 지도는 스스로 알아채지 못해서 직접 다시 그리게 한다.
        // (알려진 한계: 창 크기를 바꾸면 중심이 처음 위치에서 조금 밀릴 수 있다 — 처음 열 때는 정확하다)
        resizeObserver = new ResizeObserver(() => map.relayout());
        resizeObserver.observe(containerRef.current);
        setZoomLimits({ min: MIN_ZOOM_LEVEL, max: fullViewLevel });

        // 가장 축소했을 때는 가까운 역 이름이 겹쳐서, 화물역·폐역은 점만 보이게 한다 (CSS가 처리)
        const handleZoomChanged = () => {
          rootRef.current?.classList.toggle('KakaoMap--fullView', map.getLevel() >= fullViewLevel);
          setZoomLevel(map.getLevel());
        };
        handleZoomChanged();

        maps.event.addListener(map, 'dragend', handleKeepInsideDonghae);
        maps.event.addListener(map, 'zoom_changed', () => {
          handleKeepInsideDonghae();
          handleZoomChanged();
        });

        const stations = await searchDonghaeStations(maps, boundaryBounds);
        if (isCancelled) return;

        // 역을 잇는 선 — 마커(CustomOverlay)보다 아래 층에 그려진다
        STATION_LINKS.forEach(({ from, to, kind }) => {
          const fromStation = stations.find((station) => station.name === from);
          const toStation = stations.find((station) => station.name === to);
          if (fromStation === undefined || toStation === undefined) return;
          new maps.Polyline({
            map,
            path: [new maps.LatLng(fromStation.lat, fromStation.lng), new maps.LatLng(toStation.lat, toStation.lng)],
            ...LINE_STYLES[kind],
          });
        });

        // 역 마커
        stations.forEach((station) => {
          new maps.CustomOverlay({
            map,
            position: new maps.LatLng(station.lat, station.lng),
            content: createStationElement(station, () => onStationClickRef.current?.(station)),
            xAnchor: 0.5,
            yAnchor: 1, // 핀 끝이 역 위치를 가리키게
            clickable: true, // 마커를 누를 때 지도가 끌리지 않게
            zIndex: station.kind === 'passenger' ? 3 : 2,
          });
        });
      })
      .catch((error: Error) => {
        if (!isCancelled) setErrorMessage(error.message);
      });

    return () => {
      isCancelled = true;
      resizeObserver?.disconnect();
    };
  }, []);

  const handleZoom = (delta: -1 | 1) => {
    const map = mapRef.current;
    if (map === null) return;
    map.setLevel(map.getLevel() + delta, { animate: true });
  };

  const isMapReady = zoomLevel !== null && zoomLimits !== null;

  return (
    <div ref={rootRef} className="KakaoMap">
      <div ref={containerRef} className="KakaoMap-Container" />

      {isMapReady && (
        <div className="KakaoMap-ZoomControls" role="group" aria-label="지도 확대·축소">
          <button
            type="button"
            className="KakaoMap-ZoomButton"
            onClick={() => handleZoom(-1)}
            disabled={zoomLevel <= zoomLimits.min}
            aria-label="지도 확대"
          >
            +
          </button>
          <button
            type="button"
            className="KakaoMap-ZoomButton"
            onClick={() => handleZoom(1)}
            disabled={zoomLevel >= zoomLimits.max}
            aria-label="지도 축소"
          >
            −
          </button>
        </div>
      )}

      {errorMessage !== null && <p className="KakaoMap-Error">{errorMessage}</p>}
    </div>
  );
};

export default KakaoMap;
