import React from 'react';
import ProfileMenu from './ProfileMenu';
import { useAuthUser } from '../../hooks/useAuthUser';
import { ROUTES } from '../../routes';
import './HeaderActions.css';

interface HeaderActionsProps {
  isMyPageActive?: boolean;
  isAuthPageActive?: boolean;
}

// 모든 헤더 오른쪽 끝 — 로그인 전에는 로그인 버튼, 로그인 후에는 프로필 메뉴(마이페이지·로그아웃 등)
const HeaderActions: React.FC<HeaderActionsProps> = ({ isMyPageActive = false, isAuthPageActive = false }) => {
  const user = useAuthUser();

  return (
    <div className="HeaderActions">
      {user === null ? (
        <a
          href={ROUTES.login}
          className={`HeaderActions-LoginButton${isAuthPageActive ? ' HeaderActions-LoginButton--active' : ''}`}
          aria-current={isAuthPageActive ? 'page' : undefined}
        >
          로그인
        </a>
      ) : (
        <ProfileMenu user={user} isMyPageActive={isMyPageActive} />
      )}
    </div>
  );
};

export default HeaderActions;
