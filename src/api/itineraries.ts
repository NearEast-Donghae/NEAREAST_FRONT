import type { NewSavedTrip, SavedTrip } from '../types/neareast';

// 백엔드 연결 전까지는 브라우저 localStorage에 저장한다.
// 백엔드가 생기면 함수 본문만 apiClient 호출로 바꾸면 되고, 호출하는 화면 코드는 그대로 둔다.
//   getItineraries   → apiClient.get<SavedTrip[]>('/itineraries')
//   createItinerary  → apiClient.post<SavedTrip>('/itineraries', body)
//   deleteItinerary  → apiClient.delete<void>(`/itineraries/${itineraryId}`)
// 지금도 async로 둔 것은 그때 호출부를 고치지 않기 위해서다.

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

export async function getItineraries(): Promise<SavedTrip[]> {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createItinerary(body: NewSavedTrip): Promise<SavedTrip> {
  const trip: SavedTrip = { ...body, id: createId(), createdAt: new Date().toISOString() };
  writeAll([...readAll(), trip]);
  return trip;
}

export async function deleteItinerary(itineraryId: string): Promise<void> {
  writeAll(readAll().filter((trip) => trip.id !== itineraryId));
}
