import React from 'react';
import LoginView from '../components/auth/LoginView';
import { IS_MOCK_AUTH, login } from '../api/auth';
import { ApiError } from '../api/client';
import { authStore } from '../store/auth';
import { ROUTES, navigateTo } from '../routes';
import type { LoginRequest } from '../types/neareast';

// 서버 문구는 영어이거나 내부 정보일 수 있어서, 상태 코드로 화면 문구를 정한다
function toLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && (error.status === 400 || error.status === 401)) {
    return '이메일 또는 비밀번호를 확인해 주세요.';
  }
  return '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.';
}

const LoginPage: React.FC = () => {
  const handleLogin = async (request: LoginRequest) => {
    try {
      const user = await login(request);
      authStore.setUser(user);
    } catch (error) {
      throw new Error(toLoginErrorMessage(error));
    }
    navigateTo(ROUTES.main);
  };

  return <LoginView isDemoMode={IS_MOCK_AUTH} onLogin={handleLogin} />;
};

export default LoginPage;
