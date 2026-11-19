import React from 'react';
import MyPageView from '../components/myPage/MyPageView';
import { IS_MOCK_AUTH } from '../api/auth';
import { changePassword, deleteAccount, signOut, updateProfile } from '../api/account';
import { ApiError } from '../api/client';
import { authStore } from '../store/auth';
import { useAuthUser } from '../hooks/useAuthUser';
import { ROUTES, navigateTo } from '../routes';
import type { ChangePasswordRequest } from '../types/neareast';

// 서버 문구는 영어이거나 내부 정보일 수 있어서, 상태 코드로 화면 문구를 정한다
function toPasswordErrorMessage(error: unknown): string {
  if (error instanceof ApiError && (error.status === 400 || error.status === 401 || error.status === 403)) {
    return '현재 비밀번호가 맞지 않아요.';
  }
  return '비밀번호를 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.';
}

// 마이페이지 — 내 정보, 비밀번호 변경, 로그아웃, 회원 탈퇴 (로그인해야 열린다)
const MyPage: React.FC = () => {
  const user = useAuthUser();

  const handleUpdateNickname = async (nickname: string) => {
    try {
      authStore.setUser(await updateProfile({ nickname }));
    } catch {
      throw new Error('닉네임을 바꾸지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  const handleChangePassword = async (request: ChangePasswordRequest) => {
    try {
      await changePassword(request);
    } catch (error) {
      throw new Error(toPasswordErrorMessage(error));
    }
  };

  // 로그아웃·탈퇴 후 잠긴 마이페이지에 남아 있지 않도록 메인으로 보낸다
  const handleLogout = async () => {
    await signOut();
    navigateTo(ROUTES.main);
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch {
      throw new Error('탈퇴하지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
    authStore.setUser(null);
    navigateTo(ROUTES.main);
  };

  return (
    <MyPageView
      user={user}
      isDemoMode={IS_MOCK_AUTH}
      onUpdateNickname={handleUpdateNickname}
      onChangePassword={handleChangePassword}
      onLogout={handleLogout}
      onDeleteAccount={handleDeleteAccount}
    />
  );
};

export default MyPage;
