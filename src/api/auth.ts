import apiClient from './client';
import { mockLogin, mockSignup } from './mockAuth';
import type { AuthUser, LoginRequest, SignupRequest } from '../types/neareast';

// 백엔드 인증 API가 준비되면 .env에 VITE_USE_MOCK_AUTH=false 를 넣는다. 형식: docs/auth-api.md
// 그 전(값이 없을 때)에는 데모 인증을 쓴다.
const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH !== 'false';

// 화면에서 '데모 모드' 안내를 보여줄지 정할 때 쓴다
export const IS_MOCK_AUTH = USE_MOCK_AUTH;

export const signup = (request: SignupRequest): Promise<AuthUser> =>
  USE_MOCK_AUTH ? mockSignup(request) : apiClient.post<AuthUser>('/auth/signup', request);

export const login = (request: LoginRequest): Promise<AuthUser> =>
  USE_MOCK_AUTH ? mockLogin(request) : apiClient.post<AuthUser>('/auth/login', request);

export const logout = (): Promise<void> =>
  USE_MOCK_AUTH ? Promise.resolve() : apiClient.post<void>('/auth/logout', {});
