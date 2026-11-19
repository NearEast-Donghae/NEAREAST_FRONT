import apiClient from './client';
import { IS_MOCK_AUTH, logout } from './auth';
import { mockChangePassword, mockDeleteAccount, mockUpdateProfile } from './mockAuth';
import { authStore } from '../store/auth';
import type { AuthUser, ChangePasswordRequest, UpdateProfileRequest } from '../types/neareast';

// 마이페이지 계정 관리 API — 형식: docs/auth-api.md 의 '마이페이지' 절
// 데모 인증일 때는 mockAuth.ts의 데모 함수를 쓴다.

// 통합 백엔드의 본인 프로필·비밀번호·탈퇴 API와 연결한다.
export const IS_ACCOUNT_EDIT_SUPPORTED = true;

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

// HttpOnly 쿠키를 서버가 해제한 뒤 화면의 인증 상태도 지운다.
export async function signOut(): Promise<void> {
  await logout();
  authStore.setUser(null);
}
