import { useSyncExternalStore } from 'react';
import { authStore } from '../store/auth';
import type { AuthUser } from '../types/neareast';

// 로그인한 사용자 (로그아웃 상태면 null) — 로그인·로그아웃하면 이 훅을 쓰는 화면이 같이 다시 그려진다
export function useAuthUser(): AuthUser | null {
  return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot);
}
