import apiClient from './client';
import { IS_MOCK_AUTH, logout } from './auth';
import { mockChangePassword, mockDeleteAccount, mockUpdateProfile } from './mockAuth';
import { authStore } from '../store/auth';
import type { AuthUser, ChangePasswordRequest, UpdateProfileRequest } from '../types/neareast';

// 마이페이지 계정 관리 API — 형식: docs/auth-api.md 의 '마이페이지' 절
// 데모 인증일 때는 mockAuth.ts의 데모 함수를 쓴다.

function requireUser(): AuthUser {
  const user = authStore.getSnapshot();
  if (user === null) throw new Error('로그인이 필요해요.');
  return user;
}

export const updateProfile = (request: UpdateProfileRequest): Promise<AuthUser> =>
  IS_MOCK_AUTH
    ? mockUpdateProfile(requireUser().email, request.nickname)
    : apiClient.patch<AuthUser>('/users/me', request);

export const changePassword = (request: ChangePasswordRequest): Promise<void> =>
  IS_MOCK_AUTH ? mockChangePassword() : apiClient.put<void>('/users/me/password', request);

export const deleteAccount = (): Promise<void> =>
  IS_MOCK_AUTH ? mockDeleteAccount(requireUser().email) : apiClient.delete<void>('/users/me');

// 헤더와 마이페이지가 같이 쓰는 로그아웃 — 서버 로그아웃이 실패해도 이 브라우저에서는 로그아웃 상태로 만든다
export async function signOut(): Promise<void> {
  try {
    await logout();
  } finally {
    authStore.setUser(null);
  }
}
