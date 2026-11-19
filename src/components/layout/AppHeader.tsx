import React from 'react';
import type { MainNavTab } from '../main/MapView';
import MyTripsButton from './MyTripsButton';
import './AppHeader.css';

interface AppHeaderProps {
  // 나의 여행 일정 페이지처럼 탭에 없는 페이지면 비워 둔다
  activeNav?: MainNavTab;
  isMyTripsActive?: boolean;
  onNavigate: (tab: MainNavTab) => void;
}

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기'];

// 메인 뷰들은 각자 헤더를 갖고 있지만, 계획하기·나의 여행 일정 페이지는 헤더가 없어서 같은 모양으로 위에 붙인다
const AppHeader: React.FC<AppHeaderProps> = ({ activeNav, isMyTripsActive = false, onNavigate }) => {
  return (
    <header className="AppHeader">
      <button className="AppHeader-Logo" onClick={() => onNavigate('철도 지도')}>
        NEAREAST
      </button>
      <nav className="AppHeader-Nav">
        {NAV_TABS.map((tab) => (
          <button
            key={tab}
            className={`AppHeader-NavItem${tab === activeNav ? ' AppHeader-NavItem--active' : ''}`}
            onClick={() => onNavigate(tab)}
            aria-current={tab === activeNav ? 'page' : undefined}
          >
            {tab}
          </button>
        ))}
      </nav>
      <MyTripsButton isActive={isMyTripsActive} />
    </header>
  );
};

export default AppHeader;
