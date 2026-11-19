import React, { ReactNode } from 'react';
import { ROUTES } from '../../routes';
import './MyTripsLayout.css';

export type MyTripsTab = 'trips' | 'saved';

interface MyTripsLayoutProps {
  activeTab: MyTripsTab;
  children: ReactNode;
}

// 탭마다 주소가 달라서 새로고침·뒤로가기해도 보던 탭이 유지된다
const MY_TRIPS_TABS: { tab: MyTripsTab; label: string; href: string }[] = [
  { tab: 'trips', label: '여행 일정', href: ROUTES.myTrips },
  { tab: 'saved', label: '담아둔 장소·열차', href: ROUTES.myTripsSaved },
];

// 헤더 '나의 여행 일정' 탭 화면 — 저장한 여행 일정과 담아둔 장소·열차
const MyTripsLayout: React.FC<MyTripsLayoutProps> = ({ activeTab, children }) => {
  return (
    <div className="MyTripsLayout motion-stagger">
      <h1 className="MyTripsLayout-Title">나의 여행 일정</h1>

      <nav className="MyTripsLayout-Tabs" aria-label="나의 여행 일정 메뉴">
        {MY_TRIPS_TABS.map(({ tab, label, href }) => (
          <a
            key={tab}
            href={href}
            className={`MyTripsLayout-Tab${activeTab === tab ? ' MyTripsLayout-Tab--active' : ''}`}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="MyTripsLayout-Content">{children}</div>
    </div>
  );
};

export default MyTripsLayout;
