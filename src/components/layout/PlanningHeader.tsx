import React from 'react';
import type { MainNavTab } from '../main/MapView';
import './PlanningHeader.css';

interface PlanningHeaderProps {
  onNavigate: (tab: MainNavTab) => void;
}

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기'];

// 계획하기 페이지는 메인 뷰들과 달리 자체 헤더가 없어서, 메인 헤더와 같은 모양으로 위에 붙인다
const PlanningHeader: React.FC<PlanningHeaderProps> = ({ onNavigate }) => {
  return (
    <header className="PlanningHeader">
      <button className="PlanningHeader-Logo" onClick={() => onNavigate('철도 지도')}>
        NEAREAST
      </button>
      <nav className="PlanningHeader-Nav">
        {NAV_TABS.map((tab) => (
          <button
            key={tab}
            className={`PlanningHeader-NavItem${tab === '여행 계획하기' ? ' PlanningHeader-NavItem--active' : ''}`}
            onClick={() => onNavigate(tab)}
            aria-current={tab === '여행 계획하기' ? 'page' : undefined}
          >
            {tab}
          </button>
        ))}
      </nav>
    </header>
  );
};

export default PlanningHeader;
