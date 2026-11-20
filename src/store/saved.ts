import apiClient from '../api/client';
import { authStore } from './auth';
import { PLACE_KIND_LABELS, type PlaceDto } from '../api/catalog';
import type { ChatPlace, SavedPlace, SavedTrain, TrainPurpose } from '../types/neareast';

interface SavedResponse {
  places: { id: string; placeId: string; name: string; kind: PlaceDto['kind']; createdAt: string }[];
  trains: { id: string; trainNo: string; action: 'ride' | 'observe'; stationId: string;
    stationName: string; trainType: string; origin: string; destination: string;
    available: boolean; createdAt: string }[];
}

interface SavedState {
  places: SavedPlace[];
  trains: SavedTrain[];
  loading: boolean;
  pending: boolean;
  error: string | null;
}

let state: SavedState = { places: [], trains: [], loading: false, pending: false, error: null };
let owner = authStore.getSnapshot()?.id ?? authStore.getSnapshot()?.email ?? null;
let generation = 0;
const listeners = new Set<() => void>();
function update(patch: Partial<SavedState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

async function loadSaved(expectedGeneration = generation): Promise<void> {
  if (owner === null) return;
  update({ loading: true, error: null });
  try {
    const result = await apiClient.get<SavedResponse>('/saved');
    if (expectedGeneration !== generation) return;
    update({
      places: result.places.map((place) => ({
        id: place.placeId, savedId: place.id, name: place.name,
        category: PLACE_KIND_LABELS[place.kind], description: '',
        savedFrom: '관심 목록', savedAt: place.createdAt,
      })),
      trains: result.trains.map((train) => ({
        id: `${train.trainNo}:${train.stationId}`, savedId: train.id,
        trainNo: train.trainNo, stationId: train.stationId, stationName: train.stationName,
        trainName: `${train.trainType} ${train.trainNo}`, route: `${train.origin} → ${train.destination}`,
        purpose: train.action === 'ride' ? 'board' : 'watch', available: train.available,
        savedFrom: train.stationName, savedAt: train.createdAt,
      })),
    });
  } catch {
    if (expectedGeneration === generation) update({ error: '담아둔 목록을 불러오지 못했어요. 다시 시도해 주세요.' });
  } finally {
    if (expectedGeneration === generation) update({ loading: false });
  }
}

async function mutateSaved(operation: () => Promise<unknown>): Promise<void> {
  if (owner === null) {
    update({ error: '로그인 후 관심 목록에 담을 수 있어요.' });
    return;
  }
  if (state.pending || state.loading) return;
  const expectedGeneration = generation;
  update({ pending: true, error: null });
  try {
    await operation();
    if (expectedGeneration === generation) await loadSaved(expectedGeneration);
  } catch {
    if (expectedGeneration === generation) update({ error: '관심 목록을 변경하지 못했어요. 다시 시도해 주세요.' });
  } finally {
    if (expectedGeneration === generation) update({ pending: false });
  }
}

authStore.subscribe(() => {
  const user = authStore.getSnapshot();
  const nextOwner = user?.id ?? user?.email ?? null;
  if (owner === nextOwner) return;
  owner = nextOwner;
  generation += 1;
  update({ places: [], trains: [], loading: false, pending: false, error: null });
  void loadSaved();
});
if (owner !== null) void loadSaved();

export const savedStore = {
  getSnapshot: () => state,
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  reload: () => loadSaved(),
  addPlace(place: ChatPlace) {
    if (state.places.some((entry) => entry.id === place.id)) return;
    void mutateSaved(() => apiClient.post('/saved/places', { placeId: place.id }));
  },
  removePlace(placeId: string) {
    const savedId = state.places.find((entry) => entry.id === placeId)?.savedId;
    if (savedId) void mutateSaved(() => apiClient.delete(`/saved/places/${encodeURIComponent(savedId)}`));
  },
  removeTrain(trainId: string) {
    const savedId = state.trains.find((entry) => entry.id === trainId)?.savedId;
    if (savedId) void mutateSaved(() => apiClient.delete(`/saved/trains/${encodeURIComponent(savedId)}`));
  },
  toggleTrain(train: Omit<SavedTrain, 'purpose' | 'savedAt'>, purpose: TrainPurpose) {
    if (!train.trainNo || !train.stationId) {
      update({ error: '열차 번호와 담을 역을 먼저 선택해 주세요.' });
      return;
    }
    const existing = state.trains.find((entry) => entry.trainNo === train.trainNo && entry.stationId === train.stationId);
    const action = purpose === 'board' ? 'ride' : 'observe';
    void mutateSaved(() => existing?.savedId
      ? existing.purpose === purpose
        ? apiClient.delete(`/saved/trains/${encodeURIComponent(existing.savedId)}`)
        : apiClient.patch(`/saved/trains/${encodeURIComponent(existing.savedId)}`, { action })
      : apiClient.post('/saved/trains', { trainNo: train.trainNo, stationId: train.stationId, action }));
  },
};
