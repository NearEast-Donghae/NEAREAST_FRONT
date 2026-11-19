import type { PlanningDraft } from '../api/planning';
import { authStore } from './auth';

let draft: PlanningDraft | null = null;
const STORAGE_KEY = 'neareast.planningDraft';
function clearDraft() {
  draft = null;
  try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* 브라우저 저장소 차단 시 메모리만 사용한다. */ }
}
let owner = authStore.getSnapshot()?.email ?? null;
authStore.subscribe(() => {
  const nextOwner = authStore.getSnapshot()?.email ?? null;
  if (owner !== null && owner !== nextOwner) clearDraft();
  owner = nextOwner;
});

export const planningDraftStore = {
  get: (): PlanningDraft | null => {
    if (draft) return draft;
    try {
      const stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null');
      if (stored && (stored.owner === null || stored.owner === authStore.getSnapshot()?.email)
        && ['planner', 'chat'].includes(stored.draft?.source) && stored.draft?.conditions) return stored.draft;
    } catch { return null; }
    return null;
  },
  set: (value: PlanningDraft) => {
    draft = value;
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ owner: authStore.getSnapshot()?.email ?? null, draft: value })); }
    catch { /* 브라우저 저장소 차단 시 메모리만 사용한다. */ }
  },
  clear: clearDraft,
};
