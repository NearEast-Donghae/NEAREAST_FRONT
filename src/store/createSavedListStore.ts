// 여러 화면이 같이 보는 '담아둔 목록'(장소, 열차)을 만드는 공통 저장소.
// 바뀌면 구독한 화면에 알리고, 백엔드 연결 전까지는 브라우저 localStorage에 보관한다.

export interface SavedListStore<Item extends { id: string }> {
  getSnapshot: () => Item[];
  subscribe: (listener: () => void) => () => void;
  // 같은 id가 있으면 바꾸고, 없으면 뒤에 붙인다
  upsert: (item: Item) => void;
  remove: (itemId: string) => void;
}

export function createSavedListStore<Item extends { id: string }>(storageKey: string): SavedListStore<Item> {
  const readFromStorage = (): Item[] => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed: unknown = raw === null ? [] : JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Item[]) : [];
    } catch {
      // 시크릿 창·저장소 차단·깨진 JSON이어도 빈 목록으로 동작
      return [];
    }
  };

  let items = readFromStorage();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());

  const update = (nextItems: Item[]) => {
    items = nextItems;
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextItems));
    } catch {
      // 저장이 막혀도 이번 방문 동안은 화면끼리 공유된다
    }
    notify();
  };

  // 다른 탭에서 담거나 뺀 것도 반영
  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey) return;
    items = readFromStorage();
    notify();
  });

  return {
    getSnapshot: () => items,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    upsert(item) {
      const exists = items.some((saved) => saved.id === item.id);
      update(exists ? items.map((saved) => (saved.id === item.id ? item : saved)) : [...items, item]);
    },
    remove(itemId) {
      update(items.filter((item) => item.id !== itemId));
    },
  };
}
