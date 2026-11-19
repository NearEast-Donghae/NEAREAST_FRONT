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
import KakaoMap, { StationKind } from './KakaoMap';
import { findStationByName } from '../../data/stations';
import HeaderActions from '../layout/HeaderActions';
import './MapView.css';

export type MainNavTab = '철도 지도' | '열차 정보' | 'AI 여행 플래너' | '여행 계획하기' | '나의 여행 일정';

export interface MapViewProps {
  activeNav: MainNavTab;
  onNavigate: (tab: MainNavTab) => void;
  // 검색으로 열면 종류(kind)를 모른다 — 지도 마커로 열 때만 넘어온다
  onStationClick: (stationName: string, kind?: StationKind) => void;
}

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기', '나의 여행 일정'];

export default function MapView({ activeNav, onNavigate, onStationClick }: MapViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  // 없는 역 이름으로 역 상세가 열리지 않게, 아는 역일 때만 연다
  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (searchQuery.trim() === '') return;

    const stationName = findStationByName(searchQuery);
    if (stationName === undefined) {
      setSearchError(`‘${searchQuery.trim()}’ 역을 찾지 못했어요. 예: 묵호역, 동해역, 정동진역`);
      return;
    }
    setSearchError(null);
    onStationClick(stationName);
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
        <HeaderActions />
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
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchError(null);
            }}
            aria-invalid={searchError !== null}
            aria-describedby={searchError !== null ? 'MapView-SearchError' : undefined}
          />
        </div>
        <button type="submit" className="MapView-SearchButton">
          SEARCH
        </button>
        {searchError !== null && (
          <p id="MapView-SearchError" className="MapView-SearchError" role="alert">
            {searchError}
          </p>
        )}
      </form>

      {/* 지도 영역 */}
      <div className="MapView-MapArea">
        <KakaoMap onStationClick={(station) => onStationClick(station.name, station.kind)} />
      </div>
    </div>
  );
}
