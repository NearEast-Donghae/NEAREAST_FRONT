import { createSavedListStore } from './createSavedListStore';
import type { ChatPlace, SavedPlace } from '../types/neareast';

// 여행 후보로 담아둔 장소 — 챗봇에서 담고, 챗봇 첫 화면·여행 계획하기에서 보여준다
const store = createSavedListStore<SavedPlace>('neareast.savedPlaces');

export const savedPlacesStore = {
  getSnapshot: store.getSnapshot,
  subscribe: store.subscribe,
  remove: store.remove,

  add(place: ChatPlace, savedFrom: string): void {
    if (store.getSnapshot().some((saved) => saved.id === place.id)) return;
    store.upsert({ ...place, savedFrom, savedAt: new Date().toISOString() });
  },
};
