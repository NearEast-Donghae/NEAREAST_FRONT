import React from 'react';
import { ROUTES } from '../../routes';
import './MyTripsButton.css';

interface MyTripsButtonProps {
  isActive?: boolean;
}

// 다른 페이지로 가는 이동이라 button 대신 링크로 둔다 (새 탭 열기·주소 복사도 됨)
const MyTripsButton: React.FC<MyTripsButtonProps> = ({ isActive = false }) => {
  return (
    <a
      href={ROUTES.myTrips}
      className={`MyTripsButton${isActive ? ' MyTripsButton--active' : ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="MyTripsButton-Icon" aria-hidden="true"></span>
      나의 여행 일정
    </a>
  );
};

export default MyTripsButton;
