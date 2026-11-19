import { ApiError } from './client';
import type { AuthUser, LoginRequest, SignupRequest } from '../types/neareast';

// 백엔드 /auth가 생기기 전까지 쓰는 데모 인증.
// 비밀번호는 저장하지도 확인하지도 않는다 — 가입한 이메일인지만 본다. 실제 서비스용이 아니다.

const REGISTERED_USERS_KEY = 'neareast.demoRegisteredUsers';
const MOCK_DELAY_MS = 500;

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

function readRegisteredUsers(): AuthUser[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(REGISTERED_USERS_KEY) ?? '[]');
    return Array.isArray(parsed) ? (parsed as AuthUser[]) : [];
  } catch {
    return [];
  }
}

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export async function mockSignup(request: SignupRequest): Promise<AuthUser> {
  await wait(MOCK_DELAY_MS);
  const users = readRegisteredUsers();
  const email = normalizeEmail(request.email);
  if (users.some((user) => user.email === email)) {
    throw new ApiError(409, '이미 가입된 이메일이에요.');
  }
  const user: AuthUser = { email, nickname: request.nickname.trim() };
  localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify([...users, user]));
  return user;
}

export async function mockLogin(request: LoginRequest): Promise<AuthUser> {
  await wait(MOCK_DELAY_MS);
  const user = readRegisteredUsers().find((registered) => registered.email === normalizeEmail(request.email));
  if (user === undefined) {
    throw new ApiError(401, '이메일 또는 비밀번호를 확인해 주세요.');
  }
  return user;
}
