import type { TrainDetailDto } from '../api/catalog';
import { RAIL_GEOMETRY } from '../data/railGeometry';

// 시간표(정차역별 도착·출발 시각)로 "지금 이 열차가 대강 어디쯤인지"를 계산한다.
// 실제 위치(GPS)가 아니라 시간표 기준 추정이므로, 화면에도 항상 그렇게 안내한다.

export interface LatLng { lat: number; lng: number; }

export interface LiveStop {
  name: string;
  placeId: string | null;
  arrive: number | null; // 하루 중 분 (00:00 = 0)
  depart: number | null;
  passing: boolean; // 서지 않고 지나감(통과 시각은 arrive=depart)
}

export interface LiveTrain {
  no: string;
  type: string;
  line: string;
  origin: string;
  destination: string;
  stops: LiveStop[];
}

export interface TrainPosition extends LatLng {
  atStation: string | null; // 정차 중인 역 이름
  nextStop: { name: string; time: number } | null; // 다음 정차역(통과역 제외)
}

export interface StationArrival {
  train: LiveTrain;
  time: number; // 도착 시각(이 역 출발 열차면 출발 시각)
  depart: number;
  isOrigin: boolean;
}

const parseTime = (value: string | null): number | null => {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? hours * 60 + minutes : null;
};

export const formatTime = (minutes: number): string => {
  const whole = Math.floor(minutes);
  return `${String(Math.floor(whole / 60) % 24).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
};

export function toLiveTrain(dto: TrainDetailDto): LiveTrain {
  // 자정을 넘기는 열차는 시각이 크게(12시간 넘게) 줄어드는 지점부터 하루(1440분)를 더한다.
  // 몇 분 줄어드는 건 자정이 아니라 시간표 자료의 오류라서 그대로 둔다 (그 구간은 그리지 않음)
  let offset = 0;
  let previous = -1;
  const stops = dto.stops.map((stop): LiveStop => {
    const passing = stop.stop_type.includes('통과');
    const pass = parseTime(stop.pass_time);
    let arrive = parseTime(stop.arr) ?? pass;
    let depart = parseTime(stop.dep) ?? pass;
    const first = arrive ?? depart;
    if (first !== null && previous - (first + offset) > 720) offset += 1440;
    if (arrive !== null) arrive += offset;
    if (depart !== null) depart += offset;
    const latest = depart ?? arrive;
    if (latest !== null) previous = latest;
    return { name: stop.name, placeId: stop.place_id, arrive, depart, passing };
  });
  return { no: dto.no, type: dto.type ?? '열차', line: dto.line, origin: dto.origin, destination: dto.destination, stops };
}

const smooth = (value: number) => value * value * (3 - 2 * value);

// 꺾인 선을 둥글게: 각 변을 1/4·3/4 지점으로 바꾸는 Chaikin 방식을 세 번 (양 끝점은 그대로 둔다)
function smoothLine(points: LatLng[], rounds = 3): LatLng[] {
  let line = points;
  for (let round = 0; round < rounds && line.length > 2; round += 1) {
    const next: LatLng[] = [line[0]];
    for (let i = 0; i < line.length - 1; i += 1) {
      const a = line[i];
      const b = line[i + 1];
      next.push({ lat: a.lat * 0.75 + b.lat * 0.25, lng: a.lng * 0.75 + b.lng * 0.25 });
      next.push({ lat: a.lat * 0.25 + b.lat * 0.75, lng: a.lng * 0.25 + b.lng * 0.75 });
    }
    next.push(line[line.length - 1]);
    line = next;
  }
  return line;
}

// 두 역 사이 선로 모양 (from → to 순서). 실제 선로 데이터가 없으면 두 역을 직선으로
export function railPath(from: string, to: string, coords: Map<string, LatLng>): LatLng[] | null {
  const key = [from, to].sort().join('|');
  const geometry = RAIL_GEOMETRY[key];
  if (geometry) {
    const points = smoothLine(geometry.map(([lat, lng]) => ({ lat, lng })));
    return key.split('|')[0] === from ? points : points.reverse();
  }
  const a = coords.get(from);
  const b = coords.get(to);
  return a && b ? [a, b] : null;
}

// 선을 따라 ratio(0~1)만큼 간 지점 — 구간마다 누적 거리를 한 번만 계산해 둔다
const cumulativeCache = new WeakMap<LatLng[], number[]>();
function pointAlong(path: LatLng[], ratio: number): LatLng {
  let cumulative = cumulativeCache.get(path);
  if (!cumulative) {
    cumulative = [0];
    for (let i = 1; i < path.length; i += 1) {
      const dLat = path[i].lat - path[i - 1].lat;
      const dLng = (path[i].lng - path[i - 1].lng) * Math.cos((path[i].lat * Math.PI) / 180);
      cumulative.push(cumulative[i - 1] + Math.hypot(dLat, dLng));
    }
    cumulativeCache.set(path, cumulative);
  }
  const target = cumulative[cumulative.length - 1] * Math.min(1, Math.max(0, ratio));
  let i = 1;
  while (i < cumulative.length - 1 && cumulative[i] < target) i += 1;
  const span = cumulative[i] - cumulative[i - 1] || 1;
  const k = (target - cumulative[i - 1]) / span;
  return { lat: path[i - 1].lat + (path[i].lat - path[i - 1].lat) * k, lng: path[i - 1].lng + (path[i].lng - path[i - 1].lng) * k };
}

// 같은 구간 경로를 매 프레임 새로 만들지 않도록 보관 (좌표 Map이 바뀌면 새로)
const pathCache = new WeakMap<Map<string, LatLng>, Map<string, LatLng[] | null>>();
function cachedRailPath(from: string, to: string, coords: Map<string, LatLng>): LatLng[] | null {
  let byKey = pathCache.get(coords);
  if (!byKey) { byKey = new Map(); pathCache.set(coords, byKey); }
  const key = `${from}>${to}`;
  if (!byKey.has(key)) byKey.set(key, railPath(from, to, coords));
  return byKey.get(key)!;
}

// 좌표를 아는 이웃한 두 역 사이를 달리는 중이면 그 사이를 이어서 계산한다.
// 사이에 좌표 모르는 역이 끼어 있으면 엉뚱한 직선이 되므로 그 구간은 그리지 않는다.
export function positionAt(train: LiveTrain, time: number, coords: Map<string, LatLng>): TrainPosition | null {
  const nextStopAfter = (index: number) => {
    for (let i = index; i < train.stops.length; i += 1) {
      const stop = train.stops[i];
      const at = stop.arrive ?? stop.depart;
      if (!stop.passing && at !== null && at > time) return { name: stop.name, time: at };
    }
    return null;
  };
  for (let i = 0; i < train.stops.length; i += 1) {
    const stop = train.stops[i];
    const here = coords.get(stop.name);
    const arrive = stop.arrive ?? stop.depart;
    const depart = stop.depart ?? stop.arrive;
    if (here && arrive !== null && depart !== null && time >= arrive && time <= depart && !stop.passing) {
      return { ...here, atStation: stop.name, nextStop: nextStopAfter(i + 1) };
    }
    const next = train.stops[i + 1];
    if (!next) break;
    const there = coords.get(next.name);
    const leave = depart;
    const reach = next.arrive ?? next.depart;
    if (!here || !there || leave === null || reach === null || reach <= leave) continue;
    if (time > leave && time < reach) {
      const raw = (time - leave) / (reach - leave);
      // 출발·도착하는 역에서는 천천히, 통과역에서는 같은 속도로
      const ratio = !stop.passing && !next.passing ? smooth(raw) : raw;
      // 실제 선로 모양을 따라 이동 (선로 데이터가 없는 구간은 직선)
      const path = cachedRailPath(stop.name, next.name, coords) ?? [here, there];
      return { ...pointAlong(path, ratio), atStation: null, nextStop: nextStopAfter(i + 1) };
    }
  }
  return null;
}

// 이 역에 앞으로 서는 열차 (통과 열차 제외), 시각순
export function arrivalsAt(trains: LiveTrain[], stationName: string, time: number): StationArrival[] {
  const rows: StationArrival[] = [];
  for (const train of trains) {
    const index = train.stops.findIndex((stop) => stop.name === stationName);
    if (index < 0) continue;
    const stop = train.stops[index];
    if (stop.passing) continue;
    const depart = stop.depart ?? stop.arrive;
    if (depart === null || depart < time - 0.01) continue;
    const isOrigin = stop.arrive === null;
    rows.push({ train, time: isOrigin ? depart : stop.arrive!, depart, isOrigin });
  }
  return rows.sort((left, right) => left.time - right.time);
}

export function passingCount(trains: LiveTrain[], stationName: string, from: number, minutes: number): number {
  return trains.filter((train) => train.stops.some((stop) =>
    stop.name === stationName && stop.passing && stop.arrive !== null && stop.arrive >= from && stop.arrive < from + minutes)).length;
}

// 지도에 그릴 노선: 열차들이 실제로 이어 달리는 이웃 역 쌍과 그 노선 이름
// 동해역에서 서쪽(신기·도계)으로 가는 구간은 영동선, 나머지 해안 구간은 동해선으로 본다
const YEONGDONG_STATIONS = new Set(['신기', '도계']);
export function railSegments(trains: LiveTrain[], coords: Map<string, LatLng>): [string, string, string][] {
  const seen = new Set<string>();
  const segments: [string, string, string][] = [];
  for (const train of trains) {
    for (let i = 0; i < train.stops.length - 1; i += 1) {
      const a = train.stops[i].name;
      const b = train.stops[i + 1].name;
      if (!coords.has(a) || !coords.has(b)) continue;
      const key = [a, b].sort().join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      segments.push([a, b, YEONGDONG_STATIONS.has(a) || YEONGDONG_STATIONS.has(b) ? '영동선' : '동해선']);
    }
  }
  return segments;
}
