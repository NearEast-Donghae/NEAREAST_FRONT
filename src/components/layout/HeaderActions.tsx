import React from 'react';
import MyPageButton from './MyPageButton';
import { useAuthUser } from '../../hooks/useAuthUser';
import { logout } from '../../api/auth';
import { authStore } from '../../store/auth';
import { ROUTES } from '../../routes';
import './HeaderActions.css';

interface HeaderActionsProps {
  isMyPageActive?: boolean;
  isAuthPageActive?: boolean;
}

// 모든 헤더 오른쪽 끝 — 마이페이지 + 로그인(로그인 후에는 닉네임·로그아웃)
const HeaderActions: React.FC<HeaderActionsProps> = ({ isMyPageActive = false, isAuthPageActive = false }) => {
  const user = useAuthUser();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      // 서버 로그아웃이 실패해도 이 브라우저에서는 로그아웃 상태로 만든다
      authStore.setUser(null);
    }
  };

  return (
    <div className="HeaderActions">
      <MyPageButton isActive={isMyPageActive} />
      {user === null ? (
        <a
          href={ROUTES.login}
          className={`HeaderActions-LoginButton${isAuthPageActive ? ' HeaderActions-LoginButton--active' : ''}`}
          aria-current={isAuthPageActive ? 'page' : undefined}
        >
          로그인
        </a>
      ) : (
        <div className="HeaderActions-User">
          <span className="HeaderActions-Nickname">{user.nickname}님</span>
          <button className="HeaderActions-LogoutButton" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
};

export default HeaderActions;
