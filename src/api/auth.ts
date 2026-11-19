import apiClient, { ApiError, setCsrfToken } from './client';
import { mockLogin, mockSignup } from './mockAuth';
import type { AuthUser, LoginRequest, SignupRequest } from '../types/neareast';

// .env에 VITE_USE_MOCK_AUTH=false 이면 백엔드(NEAREAST_BACK) 인증 API를 쓴다.
// 값이 없거나 true면 백엔드 없이 데모 인증을 쓴다.
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';

// 화면에서 '데모 모드' 안내를 보여줄지 정할 때 쓴다
export const IS_MOCK_AUTH = USE_MOCK_AUTH;

// 백엔드 응답 형식 (POST /auth/signup·/auth/login, GET /users/me)
interface BackendAuthResponse {
  user: { id: string; email: string; nickname: string; createdAt: string };
  csrfToken: string;
}

function toAuthUser(response: BackendAuthResponse): AuthUser {
  setCsrfToken(response.csrfToken);
  return { id: response.user.id, email: response.user.email, nickname: response.user.nickname };
}

export const signup = async (request: SignupRequest): Promise<AuthUser> =>
  USE_MOCK_AUTH ? mockSignup(request) : toAuthUser(await apiClient.post<BackendAuthResponse>('/auth/signup', request));

export const login = async (request: LoginRequest): Promise<AuthUser> =>
  USE_MOCK_AUTH ? mockLogin(request) : toAuthUser(await apiClient.post<BackendAuthResponse>('/auth/login', request));

export const logout = async (): Promise<void> => {
  if (USE_MOCK_AUTH) return;
  await apiClient.post<void>('/auth/logout');
  setCsrfToken(null);
};

// 새로고침 뒤 로그인 상태 되살리기 — 쿠키가 살아 있으면 사용자와 새 CSRF 토큰을 받는다.
// 로그인돼 있지 않으면(401) null. 데모 인증은 브라우저에 저장된 사용자를 그대로 쓰므로 undefined(확인 안 함).
export async function restoreSession(): Promise<AuthUser | null | undefined> {
  if (USE_MOCK_AUTH) return undefined;
  try {
    return toAuthUser(await apiClient.get<BackendAuthResponse>('/users/me'));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      setCsrfToken(null);
      return null;
    }
    throw error;
  }
}
