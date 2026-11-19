import { useSyncExternalStore } from 'react';
import { savedPlacesStore } from '../store/savedPlaces';
import type { SavedPlace } from '../types/neareast';

// 담아둔 장소 목록 — 어느 화면에서 담거나 빼도 이 훅을 쓰는 화면이 같이 다시 그려진다
export function useSavedPlaces(): SavedPlace[] {
  return useSyncExternalStore(savedPlacesStore.subscribe, savedPlacesStore.getSnapshot);
}
