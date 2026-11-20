import type { AuthUser } from '../types/neareast';

// 로그인 상태 — 헤더 등 여러 화면이 같이 보므로 한 곳에 두고, 바뀌면 구독한 화면에 알린다.
// 새로고침해도 로그인이 유지되도록 사용자 정보(이메일·닉네임)만 localStorage에 둔다. 비밀번호는 저장하지 않는다.

const STORAGE_KEY = 'neareast.currentUser';

function readFromStorage(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Partial<AuthUser>;
    return typeof parsed.email === 'string' && typeof parsed.nickname === 'string'
      ? { email: parsed.email, nickname: parsed.nickname }
      : null;
  } catch {
    return null;
  }
}

const isMockAuth = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';
// 서버 인증에서는 브라우저 캐시를 로그인 증거로 사용하지 않는다.
let currentUser: AuthUser | null = isMockAuth ? readFromStorage() : null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

// 다른 탭에서 로그인·로그아웃한 것도 반영
window.addEventListener('storage', (event) => {
  if (event.key !== STORAGE_KEY) return;
  if (isMockAuth) {
    currentUser = readFromStorage();
    notify();
  } else {
    window.dispatchEvent(new Event('neareast:restore-session'));
  }
});

export const authStore = {
  getSnapshot: (): AuthUser | null => currentUser,

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  setUser(user: AuthUser | null): void {
    currentUser = user;
    try {
      if (user === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // 저장이 막혀도 이번 방문 동안은 로그인 상태가 유지된다
    }
    notify();
  },
};
