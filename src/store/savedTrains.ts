import { savedStore } from './saved';
import type { SavedTrain, TrainPurpose } from '../types/neareast';

// 열차 상세에서 '탑승할 열차' / '관찰할 열차'로 담아둔 열차

export const savedTrainsStore = {
  getSnapshot: () => savedStore.getSnapshot().trains,
  subscribe: savedStore.subscribe,
  remove: savedStore.removeTrain,

  // 한 열차는 탑승·관찰 중 하나로만 담긴다 — 같은 용도를 다시 누르면 빼고, 다른 용도를 누르면 바꾼다
  toggle(train: Omit<SavedTrain, 'purpose' | 'savedAt'>, purpose: TrainPurpose): void {
    savedStore.toggleTrain(train, purpose);
  },
};

export const TRAIN_PURPOSE_LABELS: Record<TrainPurpose, string> = {
  board: '탑승',
  watch: '관찰',
};
