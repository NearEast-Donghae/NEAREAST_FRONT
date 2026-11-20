import React from 'react';
import type { MainNavTab } from '../main/MapView';
import HeaderActions from './HeaderActions';
import './AppHeader.css';

interface AppHeaderProps {
  // 마이페이지·로그인처럼 탭에 없는 페이지면 비워 둔다
  activeNav?: MainNavTab;
  isMyPageActive?: boolean;
  isAuthPageActive?: boolean;
  onNavigate: (tab: MainNavTab) => void;
}

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기', '나의 여행 일정'];

// 스마트폰에서는 탭이 화면 아래 탭 막대로 내려가며, 아이콘과 짧은 이름으로 보인다
const NAV_SHORT: Record<MainNavTab, string> = {
  '철도 지도': '지도', '열차 정보': '열차', 'AI 여행 플래너': 'AI 플래너', '여행 계획하기': '계획', '나의 여행 일정': '내 일정',
};
const NAV_ICON: Record<MainNavTab, React.ReactNode> = {
  '철도 지도': <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14" />,
  '열차 정보': <><rect x="5" y="3" width="14" height="14" rx="4" /><path d="M5 11h14M9 14h.01M15 14h.01M8 21l2-4m6 4-2-4" /></>,
  'AI 여행 플래너': <path d="M20 12a8 8 0 0 1-11.7 7.1L4 20l1-4.1A8 8 0 1 1 20 12Zm-11-.5h.01m3 0h.01m3 0h.01" />,
  '여행 계획하기': <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4m6-4v4" /></>,
  '나의 여행 일정': <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1Z" />,
};

// 메인 뷰들은 각자 헤더를 갖고 있지만, 계획하기·나의 여행 일정 페이지는 헤더가 없어서 같은 모양으로 위에 붙인다
const AppHeader: React.FC<AppHeaderProps> = ({ activeNav, isMyPageActive = false, isAuthPageActive = false, onNavigate }) => {
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
            data-label={tab}
            aria-label={tab}
          >
            <svg className="AppHeader-NavIcon" viewBox="0 0 24 24" aria-hidden="true">{NAV_ICON[tab]}</svg>
            <span className="AppHeader-NavText">{tab}</span>
            <span className="AppHeader-NavShort" aria-hidden="true">{NAV_SHORT[tab]}</span>
          </button>
        ))}
      </nav>
      <HeaderActions isMyPageActive={isMyPageActive} isAuthPageActive={isAuthPageActive} />
    </header>
  );
};

export default AppHeader;
