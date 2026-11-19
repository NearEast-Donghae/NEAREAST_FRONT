import React from 'react';
import { ROUTES } from '../../routes';
import './MyPageButton.css';

interface MyPageButtonProps {
  isActive?: boolean;
}

// 다른 페이지로 가는 이동이라 button 대신 링크로 둔다 (새 탭 열기·주소 복사도 됨)
const MyPageButton: React.FC<MyPageButtonProps> = ({ isActive = false }) => {
  return (
    <a
      href={ROUTES.myPage}
      className={`MyPageButton${isActive ? ' MyPageButton--active' : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      마이페이지
    </a>
  );
};

export default MyPageButton;
