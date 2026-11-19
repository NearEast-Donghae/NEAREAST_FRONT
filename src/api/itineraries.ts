import apiClient from './client';
import { IS_MOCK_AUTH } from './auth';
import type { NewSavedTrip, SavedTrip, SavedTripSource, SavedTripTimelineRow } from '../types/neareast';

// 저장한 여행 — 백엔드(VITE_USE_MOCK_AUTH=false)에서는 계정에 저장하고, 데모 인증이면 브라우저 localStorage에 저장한다.
// 백엔드 여행은 로그인한 사용자 것만 보이므로 인증 방식과 같이 바꾼다.

// ── 백엔드 (/itineraries) ──

interface BackendItinerary {
  id: string;
  source: SavedTripSource;
  title: string;
  travelDateLabel: string;
  timeRange: string;
  stations?: string[];
  trains?: string[];
  activities?: string[];
  timeline?: { time: string; icon?: string | null; description: string }[];
  createdAt: string;
}

function toSavedTrip(itinerary: BackendItinerary): SavedTrip {
  return {
    id: itinerary.id,
    source: itinerary.source,
    title: itinerary.title,
    travelDateLabel: itinerary.travelDateLabel,
    timeRange: itinerary.timeRange,
    stations: itinerary.stations ?? [],
    trains: itinerary.trains ?? [],
    activities: itinerary.activities ?? [],
    timeline: (itinerary.timeline ?? []).map(
      (row): SavedTripTimelineRow => ({ time: row.time, icon: row.icon ?? '', description: row.description })
    ),
    createdAt: itinerary.createdAt,
  };
}

// ── 데모 (localStorage) ──

const STORAGE_KEY = 'neareast.savedTrips';

function readAll(): SavedTrip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw === null ? [] : JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedTrip[]) : [];
  } catch {
    // 시크릿 창·저장소 차단·깨진 JSON이어도 화면은 빈 목록으로 뜨게
    return [];
  }
}

function writeAll(trips: SavedTrip[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

// crypto.randomUUID는 https·localhost에서만 동작해서, 같은 와이파이의 IP 주소로 접속해도 되도록 직접 만든다
function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── 화면에서 쓰는 함수 ──

export async function getItineraries(): Promise<SavedTrip[]> {
  if (!IS_MOCK_AUTH) {
    // 백엔드 목록은 이미 최신순
    return (await apiClient.get<BackendItinerary[]>('/itineraries?limit=100')).map(toSavedTrip);
  }
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createItinerary(body: NewSavedTrip): Promise<SavedTrip> {
  if (!IS_MOCK_AUTH) {
    return toSavedTrip(await apiClient.post<BackendItinerary>('/itineraries', body));
  }
  const trip: SavedTrip = { ...body, id: createId(), createdAt: new Date().toISOString() };
  writeAll([...readAll(), trip]);
  return trip;
}

export async function deleteItinerary(itineraryId: string): Promise<void> {
  if (!IS_MOCK_AUTH) {
    await apiClient.delete<void>(`/itineraries/${encodeURIComponent(itineraryId)}`);
    return;
  }
  writeAll(readAll().filter((trip) => trip.id !== itineraryId));
}
