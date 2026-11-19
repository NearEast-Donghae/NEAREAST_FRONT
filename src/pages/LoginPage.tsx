import React from 'react';
import LoginView from '../components/auth/LoginView';
import { IS_MOCK_AUTH, login } from '../api/auth';
import { ApiError } from '../api/client';
import { authStore } from '../store/auth';
import type { LoginRequest } from '../types/neareast';

// 서버 문구는 영어이거나 내부 정보일 수 있어서, 상태 코드로 화면 문구를 정한다
function toLoginErrorMessage(error: unknown): string {
  if (error instanceof ApiError && [400, 401, 422].includes(error.status)) {
    return '이메일 또는 비밀번호를 확인해 주세요.';
  }
  if (error instanceof ApiError && error.status === 429) {
    return '로그인 시도가 너무 많아요. 잠시 후 다시 시도해 주세요.';
  }
  return '로그인하지 못했어요. 잠시 후 다시 시도해 주세요.';
}

interface LoginPageProps {
  // 성공하면 어디로 갈지는 App이 정한다 (로그인 안내를 띄웠던 화면으로 복귀)
  onAuthenticated: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onAuthenticated }) => {
  const handleLogin = async (request: LoginRequest) => {
    try {
      const user = await login(request);
      authStore.setUser(user);
    } catch (error) {
      throw new Error(toLoginErrorMessage(error));
    }
    onAuthenticated();
  };

  return <LoginView isDemoMode={IS_MOCK_AUTH} onLogin={handleLogin} />;
};

export default LoginPage;
