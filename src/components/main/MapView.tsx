/*
 * MapView.tsx
 * 메인 화면 — 동해시 지도 뷰
 *
 * Props:
 *   onStationClick  - 역 클릭 시 역 정보 팝업 호출
 *   onNavigate      - 상단 메뉴 탭 클릭 시 뷰 전환
 *   activeNav       - 현재 활성화된 메뉴 탭
 */

import React, { useState } from 'react';
import KakaoMap from './KakaoMap';
import './MapView.css';

export type MainNavTab = '철도 지도' | '열차 정보' | 'AI 여행 플래너' | '여행 계획하기';

export interface MapViewProps {
  activeNav: MainNavTab;
  onNavigate: (tab: MainNavTab) => void;
  onStationClick: (stationName: string) => void;
}

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기'];

export default function MapView({ activeNav, onNavigate, onStationClick }: MapViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (searchQuery.trim()) {
      onStationClick(searchQuery.trim());
    }
  }

  return (
    <div className="MapView">
      {/* 상단 메뉴 */}
      <header className="MapView-Header">
        <button className="MapView-Logo" onClick={() => onNavigate('철도 지도')}>NEAREAST</button>
        <nav className="MapView-Nav">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              className={`MapView-NavItem${activeNav === tab ? ' MapView-NavItem--active' : ''}`}
              onClick={() => onNavigate(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* 검색바 */}
      <form className="MapView-SearchBar" onSubmit={handleSearchSubmit}>
        <div className="MapView-SearchInput">
          <span className="MapView-SearchIcon">⌕</span>
          <input
            type="text"
            className="MapView-SearchField"
            placeholder="역 이름으로 검색하세요."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="MapView-SearchButton">
          SEARCH
        </button>
      </form>

      {/* 지도 영역 */}
      <div className="MapView-MapArea">
        <KakaoMap />
      </div>
    </div>
  );
}
