import { useSyncExternalStore } from 'react';
import { savedStore } from '../../store/saved';

export default function SavedStatus() {
  const state = useSyncExternalStore(savedStore.subscribe, savedStore.getSnapshot);
  if (state.error) return <div className="Integration-Status" role="alert">
    {state.error} <button onClick={() => { void savedStore.reload(); }}>목록 다시 불러오기</button>
  </div>;
  if (state.pending || state.loading) return <p className="Integration-Status" role="status">관심 목록을 동기화하고 있어요…</p>;
  return null;
}
