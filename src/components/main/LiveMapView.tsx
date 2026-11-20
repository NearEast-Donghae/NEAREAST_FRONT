import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { loadKakaoSdk } from '../../api/mapSdk';
import { getPlaces, getStationTrains, getTrain, type PlaceDto } from '../../api/catalog';
import { LIVE_STATIONS, resolveStationCoords } from '../../data/liveStations';
import {
  arrivalsAt, formatTime, passingCount, positionAt, railPath, railSegments, toLiveTrain,
  type LatLng, type LiveTrain,
} from '../../utils/liveTrains';
import trainIcon from '../../assets/icons/train.png';
import './LiveMapView.css';
import { TRAIN_TYPE_COLORS, trainTypeColor } from '../../utils/trainColors';

// 첫 화면: 시간표를 바탕으로 열차가 대강 움직이는 철도 지도 (디자인 시안 J)
//  - 열차 위치는 시간표 기준 추정이다. 실제 위치가 아니라는 안내를 항상 보여 준다.
//  - 역을 고르면 그 역에 설 열차 시간표를 보여 주고, 나머지 지도는 흐리게 한다.

export interface LiveMapViewProps {
  onOpenPlace: (placeId: string) => void;
  onOpenTrains: (placeId: string) => void;
}

const TYPE_COLORS = TRAIN_TYPE_COLORS;
// 노선 색: 동해선은 진한 남색, 영동선은 파랑
// 지도 위에서 튀지 않게 조금 차분한 색 + 살짝 투명하게 (레퍼런스의 부드러운 경로선 느낌)
const LINE_COLORS: Record<string, string> = { 동해선: '#0E4D3E', 강릉선: '#0E4D3E', 영동선: '#13896F' }; // 딥그린 시안: 동해선 딥그린, 영동선 청록
const typeColor = trainTypeColor;
const shortType = (type: string) => type.replace('호', '').replace('KTX-이음', 'KTX').replace(/^ITX-/, 'ITX ');
const stationLabel = (name: string) => LIVE_STATIONS.find((station) => station.name === name)?.label ?? `${name}역`;

const FAST_SPEED = 30; // 빠르게 보기: 1초에 30초
const STATION_ZOOM_LEVEL = 7; // 역을 고르면 한 단계만 확대 (2배) — 크게 확대하면 움직임이 급해 보여서
const PHONE_STATION_ZOOM_LEVEL = 9; // 스마트폰은 화면이 좁아 같은 확대면 너무 가까워 보여서 두 단계 덜 확대
const nowMinutes = () => { const now = new Date(); return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60; };

// 지도를 목표 지점까지 '한 번에 이어지는' 움직임으로 옮긴다.
// 카카오 지도는 확대 단계가 끊어져 있고 이동·확대를 동시에 못 해서, 이어 붙이면 딱딱하다.
// 그래서 지도 판 전체를 화면 효과(transform)로 '이동 + 확대'를 한 번에 부드럽게 움직인 뒤,
// 끝나는 순간 실제 지도 위치·확대를 같은 모습으로 바꿔 끼운다 (눈에는 이어진 한 동작).
//  - 확대할 때: 지금 화면을 키우며 목표로 이동 → 끝에서 실제 지도로 교체 (빈 곳이 보이지 않음)
//  - 축소할 때: 실제 지도를 먼저 바꾸고, 이전 모습처럼 키워 둔 상태에서 원래 크기로 줄어듦
//  - 목표가 화면 밖이면: 먼저 둘 다 보이게 축소 → 이어서 확대
// 돌려주는 함수를 부르면 진행 중인 이동을 멈춘다 (다른 역을 연달아 누를 때)
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FLY_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // 처음엔 자연스럽게 출발하고, 끝에서 아주 천천히 내려앉음
const ZOOM_IN_MS = 1000;
const ZOOM_OUT_MS = 850;
function flyTo(map: any, target: { lat: number; lng: number }, targetLevel: number, onDone?: () => void): () => void {
  const { maps } = window.kakao;
  const destination = new maps.LatLng(target.lat, target.lng);
  const box = map.getNode() as HTMLElement;
  if (reducedMotion()) { map.setLevel(targetLevel); map.setCenter(destination); onDone?.(); return () => {}; }
  let cancelled = false;
  let running: Animation | null = null;
  const cx = box.clientWidth / 2;
  const cy = box.clientHeight / 2;
  const px = (latLng: any) => map.getProjection().containerPointFromCoords(latLng);
  const markerAnims: Animation[] = [];
  const ghosts: HTMLElement[] = [];
  // 역·열차 표시는 지도와 함께 커지면 어색하므로, 지도 확대만큼 반대로 줄여 원래 크기를 유지한다 (숨겼다 다시 보이는 깜빡임 없음)
  const counterScale = (fromScale: number, toScale: number, ms: number) => {
    box.querySelectorAll<HTMLElement>('.LiveMap-Station, .LiveMap-Train').forEach((marker) => {
      marker.style.transformOrigin = marker.classList.contains('LiveMap-Station') ? 'calc(100% - 10px) 50%' : '50% 50%';
      markerAnims.push(marker.animate([{ transform: `scale(${1 / fromScale})` }, { transform: `scale(${1 / toScale})` }],
        { duration: ms, easing: FLY_EASE, fill: 'forwards', composite: 'add' }));
    });
  };
  const play = (from: string, to: string, fromScale: number, toScale: number, ms: number, done: () => void) => {
    box.style.transformOrigin = '0 0';
    running = box.animate([{ transform: from }, { transform: to }], { duration: ms, easing: FLY_EASE, fill: 'forwards' });
    counterScale(fromScale, toScale, ms);
    running.onfinish = () => { if (!cancelled) done(); };
  };
  const clearAnims = () => { running?.cancel(); running = null; markerAnims.splice(0).forEach((anim) => anim.cancel()); };
  // 지금 보이는 지도 모습을 그대로 복사해 위에 덮어 둔다 → 실제 지도의 새 그림이 다 그려지면 서서히 걷어낸다 (빈 화면 깜빡임 방지)
  const makeGhost = (transform: string) => {
    const ghost = box.cloneNode(true) as HTMLElement;
    ghost.querySelectorAll('.LiveMap-Station, .LiveMap-Train').forEach((marker) => marker.remove());
    ghost.removeAttribute('aria-label');
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, { position: 'absolute', inset: '0', pointerEvents: 'none', transformOrigin: '0 0', transform });
    box.after(ghost);
    ghosts.push(ghost);
    return ghost;
  };
  const fadeGhostWhenLoaded = (ghost: HTMLElement) => {
    let gone = false;
    const fade = () => {
      if (gone) return; gone = true;
      maps.event.removeListener(map, 'tilesloaded', fade);
      ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: 'ease-out', fill: 'forwards' }).onfinish = () => ghost.remove();
    };
    maps.event.addListener(map, 'tilesloaded', fade);
    window.setTimeout(fade, 700); // 이미 다 그려져서 신호가 안 오는 경우
  };
  const finish = () => { clearAnims(); onDone?.(); };

  // 확대: 목표 점을 가운데로 끌어오며 키운다 → 끝에서 실제로 확대·이동 (교체 순간은 복사본으로 가림)
  const zoomIn = (from: number, to: number) => {
    const k = 2 ** (from - to);
    const p = px(destination);
    const end = `translate(${cx - k * p.x}px, ${cy - k * p.y}px) scale(${k})`;
    play('none', end, 1, k, ZOOM_IN_MS, () => {
      const ghost = makeGhost(end);
      map.setLevel(to); map.setCenter(destination); finish();
      fadeGhostWhenLoaded(ghost);
    });
  };
  // 축소: 실제 지도를 먼저 바꾸고, 바뀌기 전 모습(크게)에서 원래 크기로 줄어들게.
  // 새 그림이 그려지는 동안 바뀌기 전 모습의 복사본이 함께 줄어들며 서서히 사라진다
  const zoomOut = (center: any, to: number, next: () => void) => {
    const k = 2 ** (to - map.getLevel());
    const old = map.getCenter();
    const ghost = makeGhost('none');
    map.setLevel(to); map.setCenter(center);
    const q = px(old);
    ghost.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${q.x - cx / k}px, ${q.y - cy / k}px) scale(${1 / k})`, opacity: 0 }],
      { duration: ZOOM_OUT_MS, easing: FLY_EASE, fill: 'forwards' }).onfinish = () => ghost.remove();
    play(`translate(${cx - k * q.x}px, ${cy - k * q.y}px) scale(${k})`, 'none', k, 1, ZOOM_OUT_MS, () => { clearAnims(); next(); });
  };

  const level = map.getLevel();
  const p = px(destination);
  const visible = p.x > box.clientWidth * 0.05 && p.x < box.clientWidth * 0.95 && p.y > box.clientHeight * 0.05 && p.y < box.clientHeight * 0.95;
  if (targetLevel > level) {
    zoomOut(destination, targetLevel, finish); // 더 넓게 보기 (닫을 때)
  } else if (visible && targetLevel === level) {
    // 화면 안에서 같은 확대면 지도 자체의 부드러운 이동 (이동 끝 신호가 안 와도 잠시 뒤 마무리)
    map.panTo(destination);
    let done = false;
    const end = () => { if (done || cancelled) return; done = true; maps.event.removeListener(map, 'idle', end); window.clearTimeout(timer); onDone?.(); };
    maps.event.addListener(map, 'idle', end);
    const timer = window.setTimeout(end, 1200);
    return () => { cancelled = true; maps.event.removeListener(map, 'idle', end); window.clearTimeout(timer); };
  } else if (visible) {
    zoomIn(level, targetLevel);
  } else {
    // 화면 밖: 지금 위치와 목표의 중간을 기준으로 둘 다 보일 만큼 축소한 뒤 확대
    const now = map.getCenter();
    const middle = new maps.LatLng((now.getLat() + target.lat) / 2, (now.getLng() + target.lng) / 2);
    let overview = Math.max(level + 1, 8);
    const dx = Math.abs(p.x - cx) * 2; const dy = Math.abs(p.y - cy) * 2;
    while (overview < 12 && (dx / 2 ** (overview - level) > box.clientWidth * 0.8 || dy / 2 ** (overview - level) > box.clientHeight * 0.8)) overview += 1;
    zoomOut(middle, overview, () => zoomIn(overview, targetLevel));
  }
  return () => { cancelled = true; clearAnims(); ghosts.forEach((ghost) => ghost.remove()); };
}

// 스마트폰 화면인지 — mobile.css의 기준(760px)과 같게
const isPhone = () => window.matchMedia('(max-width: 760px)').matches;

async function inBatches<T, R>(items: T[], size: number, task: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) results.push(...await Promise.all(items.slice(i, i + size).map(task)));
  return results;
}

export default function LiveMapView({ onOpenPlace, onOpenTrains }: LiveMapViewProps) {
  const mapBoxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorText, setErrorText] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [trains, setTrains] = useState<LiveTrain[]>([]);
  const [coords, setCoords] = useState<Map<string, LatLng>>(new Map());
  const [places, setPlaces] = useState<PlaceDto[]>([]);
  const [basis, setBasis] = useState('');

  // 시계: 'live'는 실제 시각, 'fast'는 빠르게 흐르는 가상 시각
  const [mode, setMode] = useState<'live' | 'fast'>('live');
  const [playing, setPlaying] = useState(true);
  const timeRef = useRef(nowMinutes());
  const [minute, setMinute] = useState(() => Math.floor(timeRef.current));

  const [selected, setSelected] = useState<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;
  const [focus, setFocus] = useState<{ x: number; y: number } | null>(null);
  const [flying, setFlying] = useState(false); // 역으로 날아가는 중
  const [query, setQuery] = useState('');
  const [searchMiss, setSearchMiss] = useState(false);
  const stationElements = useRef(new Map<string, HTMLElement>());

  // ── 데이터 + 지도 준비 ──
  useEffect(() => {
    let cancelled = false;
    const overlays: { setMap: (map: null) => void }[] = [];
    setStatus('loading');
    (async () => {
      await loadKakaoSdk();
      if (cancelled || !mapBoxRef.current) return;
      const { maps } = window.kakao;
      const map = new maps.Map(mapBoxRef.current, { center: new maps.LatLng(37.52, 129.12), level: 8 });
      mapRef.current = map;
      maps.event.addListener(map, 'click', () => setSelected(null));

      const [placeList, donghae, mukho] = await Promise.all([
        getPlaces(), getStationTrains('station_donghae'), getStationTrains('station_mukho'),
      ]);
      const numbers = [...new Set([...donghae.trains, ...mukho.trains].map((train) => train.no))];
      const details = await inBatches(numbers, 6, (no) => getTrain(no).catch(() => null));
      const live = details.filter((detail): detail is NonNullable<typeof detail> => detail !== null).map(toLiveTrain);
      const dbCoords = new Map<string, LatLng>();
      placeList.forEach((place) => {
        if (place.kind === 'station' && place.lat !== null && place.lng !== null) dbCoords.set(place.name.replace(/역$/, ''), { lat: place.lat, lng: place.lng });
      });
      const resolved = await resolveStationCoords(dbCoords);
      if (cancelled) return;

      // 노선: 열차들이 실제로 이어 달리는 이웃 역끼리, 실제 선로 모양(OpenStreetMap)을 부드럽게 다듬어 그린다.
      // 흰 테두리 없이 단색 선 하나만, 살짝 투명하게. 노선마다 색을 다르게
      const segments = railSegments(live, resolved);
      const segmentKeys = new Set(segments.map(([a, b]) => [a, b].sort().join('|')));
      const hasKey = (a: string, b: string) => segmentKeys.has([a, b].sort().join('|'));
      // 동해→삼척처럼 중간역을 건너뛰는 열차의 구간은 동해→추암→… 선과 같은 선로라 겹쳐 그리지 않는다
      // 중간역 c가 실제로 a와 b 사이에 있는지(a→c→b 거리가 a→b와 거의 같은지)까지 확인한다
      const km = (x: string, y: string) => { const p1 = resolved.get(x)!, p2 = resolved.get(y)!; return Math.hypot(p1.lat - p2.lat, (p1.lng - p2.lng) * 0.79) * 111; };
      const skipsStation = (a: string, b: string) => LIVE_STATIONS.some(({ name }) => name !== a && name !== b
        && hasKey(a, name) && hasKey(name, b) && km(a, name) + km(name, b) <= km(a, b) * 1.25);
      segments.filter(([a, b]) => !skipsStation(a, b)).forEach(([a, b, line]) => {
        const path = (railPath(a, b, resolved) ?? []).map((point) => new maps.LatLng(point.lat, point.lng));
        const color = LINE_COLORS[line] ?? LINE_COLORS.동해선;
        overlays.push(new maps.Polyline({ map, path, strokeWeight: 5, strokeColor: color, strokeOpacity: 0.75 }));
      });

      // 역 표시
      const bounds = new maps.LatLngBounds();
      LIVE_STATIONS.forEach((station) => {
        const point = resolved.get(station.name);
        if (!point) return;
        const position = new maps.LatLng(point.lat, point.lng);
        if (station.main) bounds.extend(position);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `LiveMap-Station${station.main ? '' : ' LiveMap-Station--minor'}`;
        button.setAttribute('aria-label', `${station.label} 도착 시간표 보기`);
        button.innerHTML = `<span class="LiveMap-StationLabel"></span><span class="LiveMap-StationDot"></span>`;
        button.querySelector('.LiveMap-StationLabel')!.textContent = station.label;
        button.addEventListener('click', (event) => { event.stopPropagation(); setSelected(station.name); });
        stationElements.current.set(station.name, button);
        overlays.push(new maps.CustomOverlay({ map, position, content: button, xAnchor: 1, yAnchor: 0.5, clickable: true, zIndex: 3 }));
      });
      // 왼쪽 패널에 가리지 않게 왼쪽 여백을 크게
      // 스마트폰: 위는 검색·시계, 아래는 '지금 달리는 열차' 시트가 가리므로 위아래 여백을 크게
      if (isPhone()) {
        const height = mapBoxRef.current.clientHeight;
        map.setBounds(bounds, 150, 40, Math.round(height * 0.46) + 20, 40);
      } else {
        map.setBounds(bounds, 80, 120, 80, 440);
      }

      setPlaces(placeList);
      setTrains(live);
      setCoords(resolved);
      setBasis(donghae.basis?.summary ?? '');
      setStatus('ready');
    })().catch((error: Error) => {
      if (cancelled) return;
      setErrorText(error.message || '지도를 불러오지 못했어요.');
      setStatus('error');
    });
    return () => {
      cancelled = true;
      overlays.forEach((overlay) => overlay.setMap(null));
      stationElements.current.clear();
    };
  }, [attempt]);

  // ── 열차 움직이기 ──
  const trainOverlays = useRef(new Map<string, any>());
  useEffect(() => {
    if (status !== 'ready') return;
    const { maps } = window.kakao;
    const map = mapRef.current;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const elapsed = (now - last) / 1000;
      last = now;
      if (mode === 'live') timeRef.current = nowMinutes();
      else if (playing) timeRef.current = (timeRef.current + (elapsed * FAST_SPEED) / 60) % 1440;
      const time = timeRef.current;
      setMinute((previous) => (Math.floor(time) === previous ? previous : Math.floor(time)));

      for (const train of trains) {
        const position = positionAt(train, time, coords) ?? positionAt(train, time + 1440, coords);
        let overlay = trainOverlays.current.get(train.no);
        if (!position) { if (overlay) overlay.setMap(null); continue; }
        const latLng = new maps.LatLng(position.lat, position.lng);
        if (!overlay) {
          const element = document.createElement('div');
          element.className = 'LiveMap-Train';
          element.style.setProperty('--train-color', typeColor(train.type));
          element.style.setProperty('--train-icon', `url("${trainIcon}")`);
          element.innerHTML = '<span class="LiveMap-TrainBody"></span><span class="LiveMap-TrainLabel"></span>';
          element.querySelector('.LiveMap-TrainLabel')!.textContent = `${shortType(train.type)} ${train.no}`;
          element.title = `${train.type} ${train.no} · ${train.destination}행 (시간표 기준 추정 위치)`;
          overlay = new maps.CustomOverlay({ position: latLng, content: element, xAnchor: 0.5, yAnchor: 0.5, zIndex: 5 });
          trainOverlays.current.set(train.no, overlay);
        }
        if (!overlay.getMap()) overlay.setMap(map);
        overlay.setPosition(latLng);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status, trains, coords, mode, playing]);
  useEffect(() => () => { trainOverlays.current.forEach((overlay) => overlay.setMap(null)); trainOverlays.current.clear(); }, []);

  // ── 역 선택: 그 역으로 확대해 가운데에 두고, 둘레만 선명하게. 닫으면 고르기 전 화면으로 ──
  const viewBeforeSelect = useRef<{ level: number; center: { lat: number; lng: number } } | null>(null);
  useEffect(() => {
    stationElements.current.forEach((element, name) => element.classList.toggle('LiveMap-Station--selected', name === selected));
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
    const { maps } = window.kakao;
    if (!selected) {
      setFocus(null);
      const before = viewBeforeSelect.current;
      viewBeforeSelect.current = null;
      // 고르기 전에 보던 화면으로 같은 방식(축소 → 미끄러지듯 이동)으로 돌아간다
      if (!before) return;
      setFlying(true);
      const cancelBack = flyTo(map, before.center, before.level, () => setFlying(false));
      return () => { cancelBack(); setFlying(false); };
    }
    const point = coords.get(selected);
    if (!point) return;
    const latLng = new maps.LatLng(point.lat, point.lng);
    const update = () => {
      const pixel = map.getProjection().containerPointFromCoords(latLng);
      setFocus({ x: pixel.x, y: pixel.y });
    };
    // 처음 고를 때만 지금 화면을 기억해 둔다 (다른 역으로 바꿀 때는 처음 화면을 그대로 유지)
    if (!viewBeforeSelect.current) {
      const center = map.getCenter();
      viewBeforeSelect.current = { level: map.getLevel(), center: { lat: center.getLat(), lng: center.getLng() } };
    }
    // 어디를 보고 있든 그 역까지 미끄러지듯 이동한 뒤 확대
    // 누르자마자 팝업·흐림을 띄운다: 역은 언제나 지도 가운데로 오므로, 팝업을 처음부터 그 도착 자리 옆에 둔다.
    // 지도가 그 아래로 미끄러져 와서 역이 선명한 원 안에 내려앉는다
    const node = mapBoxRef.current;
    const targetLevel = Math.min(map.getLevel(), isPhone() ? PHONE_STATION_ZOOM_LEVEL : STATION_ZOOM_LEVEL);
    // 스마트폰: 역 정보가 아래에서 올라오는 시트로 보이므로, 역은 가운데가 아니라 지도 위쪽(28%)에 내려앉게 한다
    let target = point;
    const height = node?.clientHeight ?? 0;
    const anchorY = isPhone() ? height * 0.28 : height / 2;
    if (anchorY !== height / 2) {
      const projection = map.getProjection();
      const pixel = projection.containerPointFromCoords(latLng);
      // 도착 확대에서 (가운데 - 위쪽 자리)만큼 아래 지점을 지도 가운데로 — 지금 확대 기준 픽셀로 바꿔 계산
      const shift = (height / 2 - anchorY) * 2 ** (targetLevel - map.getLevel());
      const below = projection.coordsFromContainerPoint(new maps.Point(pixel.x, pixel.y + shift));
      target = { lat: below.getLat(), lng: below.getLng() };
    }
    setFocus(node ? { x: node.clientWidth / 2, y: anchorY } : null);
    setFlying(true);
    let landed = false;
    const cancelFlight = flyTo(map, target, targetLevel, () => { landed = true; setFlying(false); update(); });
    const updateIfLanded = () => { if (landed) update(); };
    maps.event.addListener(map, 'center_changed', updateIfLanded);
    maps.event.addListener(map, 'zoom_changed', updateIfLanded);
    maps.event.addListener(map, 'idle', updateIfLanded);
    return () => {
      cancelFlight();
      setFlying(false);
      maps.event.removeListener(map, 'center_changed', updateIfLanded);
      maps.event.removeListener(map, 'zoom_changed', updateIfLanded);
      maps.event.removeListener(map, 'idle', updateIfLanded);
    };
  }, [selected, status, coords]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── 패널에 보여 줄 값 (분이 바뀔 때마다 다시 계산) ──
  const running = useMemo(() => trains
    .map((train) => ({ train, position: positionAt(train, minute + 0.5, coords) }))
    .filter((item): item is { train: LiveTrain; position: NonNullable<typeof item.position> } => item.position !== null)
    .sort((left, right) => (left.position.nextStop?.time ?? 9999) - (right.position.nextStop?.time ?? 9999)),
  [trains, coords, minute]);
  const nextDeparture = useMemo(() => {
    const times = trains.flatMap((train) => train.stops
      .filter((stop) => LIVE_STATIONS.some((station) => station.main && station.name === stop.name) && !stop.passing)
      .map((stop) => stop.depart ?? stop.arrive)
      .filter((time): time is number => time !== null && time > minute));
    return times.length ? Math.min(...times) : null;
  }, [trains, minute]);
  const selectedInfo = LIVE_STATIONS.find((station) => station.name === selected);
  const selectedPlace = places.find((place) => place.kind === 'station' && place.name.replace(/역$/, '') === selected);
  const arrivals = useMemo(() => (selected ? arrivalsAt(trains, selected, minute).slice(0, 6) : []), [trains, selected, minute]);
  const passing = selected ? passingCount(trains, selected, minute, 60) : 0;

  // 팝업 위치: 역 오른쪽(자리가 없으면 왼쪽), 위아래는 화면 밖으로 나가지 않게
  const rootRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLElement>(null);
  const [popup, setPopup] = useState({ left: 0, top: 0, tail: 60, side: 'right' as 'right' | 'left' });
  useLayoutEffect(() => {
    const root = rootRef.current;
    const element = popupRef.current;
    if (!focus || !root || !element) return;
    const GAP = 26;
    const MARGIN = 16;
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const rightFits = focus.x + GAP + width <= root.clientWidth - MARGIN;
    const left = rightFits ? focus.x + GAP : Math.max(MARGIN, focus.x - GAP - width);
    const top = Math.min(Math.max(MARGIN, focus.y - 60), Math.max(MARGIN, root.clientHeight - height - MARGIN));
    const tail = Math.min(Math.max(20, focus.y - top), height - 20);
    setPopup((previous) => (previous.left === left && previous.top === top && previous.tail === tail && previous.side === (rightFits ? 'right' : 'left')
      ? previous : { left, top, tail, side: rightFits ? 'right' : 'left' }));
  }, [focus, selected, arrivals.length, passing]);

  // 카카오 지도는 레벨 숫자가 작을수록 확대
  const zoomBy = (delta: number) => {
    const map = mapRef.current;
    if (!map) return;
    const level = Math.min(14, Math.max(1, map.getLevel() + delta));
    map.setLevel(level, { animate: { duration: 250 } });
  };

  const jumpTo = (time: number) => { setMode('fast'); setPlaying(true); timeRef.current = Math.max(0, time - 3); };
  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const text = query.trim().replace(/역$/, '');
    const hit = LIVE_STATIONS.find((station) => station.name === text || station.label.startsWith(text));
    setSearchMiss(!hit && text !== '');
    if (hit) setSelected(hit.name);
  };

  return <div ref={rootRef} className={`LiveMap${selected ? ' LiveMap--focused' : ''}${flying ? ' LiveMap--flying' : ''}`}>
    <div ref={mapBoxRef} className="LiveMap-Map" aria-label="동해 철도 지도" />
    <div className="LiveMap-Blur" aria-hidden="true"
      style={focus ? { '--fx': `${focus.x}px`, '--fy': `${focus.y}px` } as CSSProperties : undefined} />

    {status !== 'ready' && <div className="LiveMap-Status" role="status">
      {status === 'loading' ? '열차 시간표와 지도를 불러오고 있어요…' : <>{errorText} <button type="button" onClick={() => setAttempt((value) => value + 1)}>다시 불러오기</button></>}
    </div>}

    {/* 역 정보 팝업: 누른 역 바로 옆(기본은 오른쪽)에 띄운다 */}
    {selectedInfo && focus && <section key={selectedInfo.name} ref={popupRef} role="dialog" aria-label={`${selectedInfo.label} 도착 예정 열차`}
      className={`LiveMap-Card LiveMap-Popup LiveMap-Popup--${popup.side}`}
      style={{ left: popup.left, top: popup.top, '--tail-y': `${popup.tail}px` } as CSSProperties}>
        <button type="button" className="LiveMap-Close" aria-label="역 선택 해제" onClick={() => setSelected(null)}>×</button>
        <span className="LiveMap-Pill">{arrivals.length ? '여객열차 정차' : '통과만 해요'}</span>
        <h1 className="LiveMap-StationName">{selectedInfo.label}</h1>
        <p className="LiveMap-Sub">{selectedInfo.desc}</p>
        <div className="LiveMap-SectionTitle">도착 예정 열차 <small>{formatTime(minute)} 기준</small></div>
        {arrivals.length ? <>
          <div className="LiveMap-TableHead"><span>시각</span><span>열차</span><span>남은 시간</span></div>
          {arrivals.map((row, index) => {
            const stopped = minute + 0.5 >= row.time && minute + 0.5 <= row.depart;
            const left = row.time - (minute + 0.5);
            const eta = stopped ? '정차 중' : left < 1 ? '곧 도착' : `${Math.ceil(left)}분 후`;
            return <div key={`${row.train.no}-${row.time}`} className={`LiveMap-Row${index === 0 ? ' LiveMap-Row--next' : ''}${stopped ? ' LiveMap-Row--here' : ''}`}>
              <time>{formatTime(row.time)}</time>
              <span className="LiveMap-Who"><b><i style={{ background: typeColor(row.train.type) }} />{row.train.type} {row.train.no}</b>
                <small>{row.isOrigin ? '이 역 출발 · ' : ''}{row.train.destination}행</small></span>
              <span className="LiveMap-Eta">{eta}</span>
            </div>;
          })}
        </> : <p className="LiveMap-Empty">오늘 이 역에 남은 여객열차가 없어요.</p>}
        <p className="LiveMap-Fine">{passing ? `앞으로 1시간 동안 ${passing}편은 서지 않고 지나가요. · ` : ''}{basis ? basis.replace(/ 기준$/, '') : '시간표'} 기준 추정</p>
        {selectedPlace && <div className="LiveMap-Actions">
          <button type="button" className="LiveMap-Secondary" onClick={() => onOpenPlace(selectedPlace.id)}>역 정보 보기</button>
          <button type="button" className="LiveMap-Primary" onClick={() => onOpenTrains(selectedPlace.id)}>전체 시간표</button>
        </div>}
    </section>}

    <aside className="LiveMap-Panel" aria-live="polite">
      {/* 역 팝업을 보는 동안에는 목록을 작은 버튼으로 접어 둔다 — 누르면 팝업을 닫고 목록을 다시 펼침 */}
      {selected ? <button key="pill" type="button" className="LiveMap-PanelPill LiveMap-Enter" onClick={() => setSelected(null)}
        aria-label={`지금 달리는 열차 ${running.length}편 목록 펼치기`}>
        <span className="LiveMap-PanelPillDot" aria-hidden="true" />지금 달리는 열차 <b>{running.length}편</b><span aria-hidden="true">▸</span>
      </button> : <section key="list" className="LiveMap-Card LiveMap-Enter">
        <div className="LiveMap-SectionTitle">지금 달리는 열차 <small>{running.length}편 · 지도 안</small></div>
        {running.length ? running.slice(0, 6).map(({ train, position }) => <div key={train.no} className="LiveMap-Running">
          <i style={{ background: typeColor(train.type) }} />
          <span><b>{train.type} {train.no}</b>
            <small>{position.atStation ? `${stationLabel(position.atStation)} 정차 중` : position.nextStop ? `다음 ${stationLabel(position.nextStop.name)}` : ''} · {train.destination}행</small></span>
          <em>{!position.atStation && position.nextStop ? `${Math.max(1, Math.ceil(position.nextStop.time - minute))}분` : ''}</em>
        </div>) : <div className="LiveMap-Empty">
          지금은 지도 안을 달리는 열차가 없어요.
          {nextDeparture !== null && <button type="button" className="LiveMap-Jump" onClick={() => jumpTo(nextDeparture)}>
            다음 열차 시간({formatTime(nextDeparture)})으로 빠르게 보기</button>}
        </div>}
        <div className="LiveMap-SectionTitle LiveMap-SectionTitle--gap">역 고르기 <small>누르면 도착 시간표가 보여요</small></div>
        <div className="LiveMap-Chips">{LIVE_STATIONS.filter((station) => station.main).map((station) =>
          <button key={station.name} type="button" onClick={() => setSelected(station.name)}>
            <b>{station.label}</b><small>{station.desc}</small></button>)}</div>
      </section>}
    </aside>

    {/* 확대·축소 버튼 — 지도 오른쪽 가운데 */}
    <div className="LiveMap-Zoom" role="group" aria-label="지도 확대·축소">
      <button type="button" aria-label="지도 확대" onClick={() => zoomBy(-1)}>+</button>
      <button type="button" aria-label="지도 축소" onClick={() => zoomBy(1)}>−</button>
    </div>

    <div className="LiveMap-Top">
      <form className="LiveMap-Search" onSubmit={handleSearch} role="search">
        <input aria-label="역 이름 검색" placeholder="역 이름 (예: 묵호)" value={query}
          onChange={(event) => { setQuery(event.target.value); setSearchMiss(false); }} />
        <button type="submit">찾기</button>
      </form>
      {searchMiss && <p className="LiveMap-SearchMiss" role="status">지도에 없는 역이에요. 동해·묵호·추암·망상 중에서 찾아 주세요.</p>}
      <div className="LiveMap-Clock">
        <span className="LiveMap-ClockTime">{formatTime(minute)}</span>
        <small>{mode === 'live' ? '지금 시각' : `빠르게 보기 ×${FAST_SPEED}`}</small>
        <button type="button" className={mode === 'live' ? 'is-on' : ''} onClick={() => setMode('live')}>지금</button>
        <button type="button" className={mode === 'fast' ? 'is-on' : ''} onClick={() => { setMode('fast'); setPlaying(true); }}>×{FAST_SPEED}</button>
        {mode === 'fast' && <button type="button" onClick={() => setPlaying((value) => !value)}>{playing ? '멈춤' : '재생'}</button>}
      </div>
    </div>

    <div className="LiveMap-Legend">
      {(['동해선', '영동선'] as const).map((line) => <span key={line}>
        <i className="LiveMap-LegendRail" style={{ '--rail-color': LINE_COLORS[line] } as CSSProperties} />{line}</span>)}
      {Object.entries(TYPE_COLORS).filter(([type]) => trains.some((train) => train.type === type))
        .map(([type, color]) => <span key={type}><i style={{ background: color }} />{type}</span>)}</div>
    <p className="LiveMap-Note">열차 위치는 시간표로 추정한 것이며 실제 위치와 다를 수 있어요.<br />
      선로 모양 © OpenStreetMap 기여자 · 열차 아이콘 <a href="https://icons8.com" target="_blank" rel="noreferrer">Icons8</a></p>
  </div>;
}
