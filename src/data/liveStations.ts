import type { LatLng } from '../utils/liveTrains';

// 움직이는 철도 지도에 쓰는 동해 주변 역.
// 백엔드 DB에 좌표가 없는 역이 많아서, 대략 좌표를 기본값으로 두고
// 카카오 장소 검색("OO역")으로 더 정확한 좌표를 찾으면 그 값으로 바꾼다.
export interface LiveStationInfo {
  name: string; // 시간표의 역 이름 (예: '묵호')
  label: string; // 화면 표시 (예: '묵호역')
  fallback: LatLng; // 대략 좌표 — 표시용
  main: boolean; // 동해시 안의 역: 크게 표시하고 고를 수 있게
  desc: string;
}

export const LIVE_STATIONS: LiveStationInfo[] = [
  { name: '망상', label: '망상역', fallback: { lat: 37.5925, lng: 129.0868 }, main: true, desc: '망상해수욕장 근처 · 지금은 열차가 서지 않아요' },
  { name: '묵호', label: '묵호역', fallback: { lat: 37.5469, lng: 129.1077 }, main: true, desc: '논골담길 · 도째비골 스카이밸리 가까이' },
  { name: '동해', label: '동해역', fallback: { lat: 37.4982, lng: 129.1239 }, main: true, desc: '동해선 · 영동선이 만나는 역' },
  { name: '추암', label: '추암역', fallback: { lat: 37.4783, lng: 129.1543 }, main: true, desc: '촛대바위 · 추암해변 가까이' },
  { name: '정동진', label: '정동진역', fallback: { lat: 37.6914, lng: 129.0344 }, main: false, desc: '강릉 방면' },
  { name: '강릉', label: '강릉역', fallback: { lat: 37.7639, lng: 128.8996 }, main: false, desc: '강릉 방면 종착' },
  { name: '삼척해변', label: '삼척해변역', fallback: { lat: 37.4517, lng: 129.1705 }, main: false, desc: '삼척 방면' },
  { name: '삼척', label: '삼척역', fallback: { lat: 37.4412, lng: 129.1650 }, main: false, desc: '삼척 방면' },
  { name: '근덕', label: '근덕역', fallback: { lat: 37.3787, lng: 129.2228 }, main: false, desc: '삼척 남쪽' },
  { name: '신기', label: '신기역', fallback: { lat: 37.3541, lng: 129.1147 }, main: false, desc: '영동선 · 도계 방면' },
  { name: '도계', label: '도계역', fallback: { lat: 37.2304, lng: 129.0479 }, main: false, desc: '영동선 · 태백 방면' },
];

const CACHE_KEY = 'neareast.liveStationCoords.v1';
const MAX_SHIFT_KM = 8; // 검색 결과가 대략 좌표에서 이보다 멀면 다른 곳으로 보고 버린다

const distanceKm = (a: LatLng, b: LatLng) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

function readCache(): Record<string, LatLng> {
  try { return JSON.parse(sessionStorage.getItem(CACHE_KEY) ?? '{}') as Record<string, LatLng>; } catch { return {}; }
}

function searchStation(places: { keywordSearch: Function }, station: LiveStationInfo): Promise<LatLng | null> {
  const { kakao } = window;
  return new Promise((resolve) => {
    places.keywordSearch(station.label, (results: { category_name: string; x: string; y: string; place_name: string }[], status: string) => {
      if (status !== kakao.maps.services.Status.OK) { resolve(null); return; }
      const hit = results.find((place) => place.category_name.includes('기차역') && place.place_name.startsWith(station.label));
      if (!hit) { resolve(null); return; }
      const found = { lat: Number(hit.y), lng: Number(hit.x) };
      resolve(distanceKm(found, station.fallback) <= MAX_SHIFT_KM ? found : null);
    });
  });
}

// DB 좌표 > 카카오 검색 좌표(캐시) > 대략 좌표 순으로 쓴다
export async function resolveStationCoords(dbCoords: Map<string, LatLng>): Promise<Map<string, LatLng>> {
  const coords = new Map<string, LatLng>();
  const cache = readCache();
  LIVE_STATIONS.forEach((station) => coords.set(station.name, dbCoords.get(station.name) ?? cache[station.name] ?? station.fallback));
  const services = window.kakao?.maps?.services;
  if (!services) return coords;
  const places = new services.Places();
  const missing = LIVE_STATIONS.filter((station) => !dbCoords.has(station.name) && !cache[station.name]);
  const found = await Promise.all(missing.map((station) => searchStation(places, station)));
  missing.forEach((station, index) => {
    const value = found[index];
    if (value) { cache[station.name] = value; coords.set(station.name, value); }
  });
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch { /* 저장 못 해도 지도는 동작 */ }
  return coords;
}
