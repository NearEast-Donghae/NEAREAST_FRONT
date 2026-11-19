import React from 'react';
import HeaderActions from '../layout/HeaderActions';
import './FinalItineraryView.css';
import type { MainNavTab } from './MapView';
import travelRouteMap from '../../assets/icons/travel-route-map.svg';

interface TimelineRow {
  id: string;
  time: string;
  // ○ = 일반, ● = 하이라이트
  timeMarker: '○' | '●';
  // 활동 아이콘 유니코드 (▣ ◉ ⌂ ♧ ♨ 등)
  icon: string;
  description: string;
}

interface TravelSummary {
  date: string;
  timeRange: string;
  visitedStations: string;
  trainName: string;
  extraActivities: string;
}

interface FinalItineraryViewProps {
  activeNav: MainNavTab;
  onNavigate: (tab: MainNavTab) => void;
  timeline: TimelineRow[];
  summary: TravelSummary;
  onBack: () => void;
  onSave: () => void;
}

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기'];

const FinalItineraryView: React.FC<FinalItineraryViewProps> = ({
  activeNav,
  onNavigate,
  timeline,
  summary,
  onBack,
  onSave,
}) => {
  return (
    <div className="FinalItineraryView">
      {/* 상단 메뉴 */}
      <header className="FinalItineraryView-Header">
        <button className="FinalItineraryView-Logo" onClick={() => onNavigate('철도 지도')}>NEAREAST</button>
        <nav className="FinalItineraryView-Nav">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              className={`FinalItineraryView-NavItem${activeNav === tab ? ' FinalItineraryView-NavItem--active' : ''}`}
              onClick={() => onNavigate(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <HeaderActions />
      </header>

      {/* 제목 (top-121, left-100) */}
      <div className="FinalItineraryView-TitleBlock">
        <p className="FinalItineraryView-Title">최종 여행 일정</p>
        <p className="FinalItineraryView-Subtitle">
          {'AI가 계획해준 최종 여행  일정을 확인하고, 여행 계획에 저장해주세요.'}
        </p>
      </div>

      {/* 메인 콘텐츠 (top-267, left-95, w-1230) */}
      <div className="FinalItineraryView-Content">
        {/* 왼쪽: 시간순 여행 일정 (w-900) */}
        <div className="FinalItineraryView-Timeline">
          <p className="FinalItineraryView-TimelineTitle">최종 여행 일정</p>

          {timeline.map((row) => (
            <div key={row.id} className="FinalItineraryView-TimelineRow">
              <span className="FinalItineraryView-TimeLabel">
                {row.timeMarker}{'  '}{row.time}
              </span>
              <span className="FinalItineraryView-RowIcon">{row.icon}</span>
              <span className="FinalItineraryView-RowDesc">{row.description}</span>
              {/* 편집 아이콘 */}
              <span className="FinalItineraryView-EditIcon" aria-label="편집">✎</span>
            </div>
          ))}
        </div>

        {/* 오른쪽: 지도 + 요약 (w-298) */}
        <div className="FinalItineraryView-Sidebar">
          {/* 여행 동선 카드 */}
          <div className="FinalItineraryView-RouteCard">
            <p className="FinalItineraryView-RouteCardTitle">여행 동선</p>
            <div className="FinalItineraryView-RouteMapWrap">
              <img
                src={travelRouteMap}
                alt="여행 동선 지도"
                className="FinalItineraryView-RouteMapImg"
              />
            </div>
          </div>

          {/* 여행 요약 카드 */}
          <div className="FinalItineraryView-SummaryCard">
            <p className="FinalItineraryView-SummaryTitle">여행 요약</p>
            <p className="FinalItineraryView-SummaryRow">{`날짜      ${summary.date}`}</p>
            <p className="FinalItineraryView-SummaryRow">{`시간      ${summary.timeRange}`}</p>
            <p className="FinalItineraryView-SummaryRow">{`방문 역   ${summary.visitedStations}`}</p>
            <p className="FinalItineraryView-SummaryRow">{`방문할 열차   ${summary.trainName}`}</p>
            <p className="FinalItineraryView-SummaryRow">{`추가 활동    ${summary.extraActivities}`}</p>
          </div>
        </div>
      </div>

      {/* 이전 · 저장 버튼 (top-805, left-95) */}
      <div className="FinalItineraryView-ActionRow">
        <button className="FinalItineraryView-PrevButton" onClick={onBack}>
          ← 이전
        </button>
        <button className="FinalItineraryView-SaveButton" onClick={onSave}>
          여행 계획 저장 ✓
        </button>
      </div>
    </div>
  );
};

export type { FinalItineraryViewProps, TimelineRow, TravelSummary };
export default FinalItineraryView;
