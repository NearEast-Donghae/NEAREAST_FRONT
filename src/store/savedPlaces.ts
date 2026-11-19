import { savedStore } from './saved';
import type { ChatPlace } from '../types/neareast';

// 여행 후보로 담아둔 장소 — 챗봇에서 담고, 챗봇 첫 화면·여행 계획하기에서 보여준다

export const savedPlacesStore = {
  getSnapshot: () => savedStore.getSnapshot().places,
  subscribe: savedStore.subscribe,
  remove: savedStore.removePlace,

  add(place: ChatPlace, _savedFrom: string): void {
    savedStore.addPlace(place);
  },
};
