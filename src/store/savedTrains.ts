import { createSavedListStore } from './createSavedListStore';
import type { SavedTrain, TrainPurpose } from '../types/neareast';

// 열차 상세에서 '탑승할 열차' / '관찰할 열차'로 담아둔 열차
const store = createSavedListStore<SavedTrain>('neareast.savedTrains');

export const savedTrainsStore = {
  getSnapshot: store.getSnapshot,
  subscribe: store.subscribe,
  remove: store.remove,

  // 한 열차는 탑승·관찰 중 하나로만 담긴다 — 같은 용도를 다시 누르면 빼고, 다른 용도를 누르면 바꾼다
  toggle(train: Omit<SavedTrain, 'purpose' | 'savedAt'>, purpose: TrainPurpose): void {
    const saved = store.getSnapshot().find((item) => item.id === train.id);
    if (saved?.purpose === purpose) {
      store.remove(train.id);
      return;
    }
    store.upsert({ ...train, purpose, savedAt: new Date().toISOString() });
  },
};

export const TRAIN_PURPOSE_LABELS: Record<TrainPurpose, string> = {
  board: '탑승',
  watch: '관찰',
};
