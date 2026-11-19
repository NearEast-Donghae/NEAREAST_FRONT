import { useSyncExternalStore } from 'react';
import { savedTrainsStore } from '../store/savedTrains';
import type { SavedTrain } from '../types/neareast';

// 담아둔 열차 목록 — 열차 상세에서 담으면 여행 계획하기 등 다른 화면도 같이 다시 그려진다
export function useSavedTrains(): SavedTrain[] {
  return useSyncExternalStore(savedTrainsStore.subscribe, savedTrainsStore.getSnapshot);
}
