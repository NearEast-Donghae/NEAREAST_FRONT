import React from 'react';
import SignupView from '../components/auth/SignupView';
import { IS_MOCK_AUTH, signup } from '../api/auth';
import { ApiError } from '../api/client';
import { authStore } from '../store/auth';
import { ROUTES, navigateTo } from '../routes';
import type { SignupRequest } from '../types/neareast';

// 서버 문구는 영어이거나 내부 정보일 수 있어서, 상태 코드로 화면 문구를 정한다
function toSignupErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 409) return '이미 가입된 이메일이에요. 로그인해 주세요.';
  if (error instanceof ApiError && error.status === 400) return '입력한 내용을 다시 확인해 주세요.';
  return '가입하지 못했어요. 잠시 후 다시 시도해 주세요.';
}

const SignupPage: React.FC = () => {
  // 가입하면 바로 로그인된 상태로 메인으로 보낸다
  const handleSignup = async (request: SignupRequest) => {
    try {
      const user = await signup(request);
      authStore.setUser(user);
    } catch (error) {
      throw new Error(toSignupErrorMessage(error));
    }
    navigateTo(ROUTES.main);
  };

  return <SignupView isDemoMode={IS_MOCK_AUTH} onSignup={handleSignup} />;
};

export default SignupPage;
