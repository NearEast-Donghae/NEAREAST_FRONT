import React, { useState } from 'react';
import { MainNavTab } from './MapView';
import './AiPlannerView.css';

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기'];

// AI 플래너 하위 단계
type AiStep = '여행 날짜' | '여행 시간' | '출발지' | '도착지' | '중간 방문역';
const AI_STEPS: AiStep[] = ['여행 날짜', '여행 시간', '출발지', '도착지', '중간 방문역'];

// 각 질문에 대한 선택지
const DATE_OPTIONS = ['이번 주 주말', '다음 주 주말', '직접 선택하기 ▾'];
const DURATION_OPTIONS = ['반나절 (약 4시간)', '하루 (약 8시간)', '1박 2일'];

interface SelectedTravel {
  stations: string[];
  trains: string[];
}

interface AiPlannerViewProps {
  activeNav: MainNavTab;
  onNavigate: (tab: MainNavTab) => void;
  onCreateItinerary: () => void;
}

export default function AiPlannerView({
  activeNav,
  onNavigate,
  onCreateItinerary,
}: AiPlannerViewProps) {
  const [selectedDate, setSelectedDate] = useState<string>('다음 주 주말');
  const [selectedDuration, setSelectedDuration] = useState<string>('하루 (약 8시간)');
  const [currentAiStep] = useState<number>(1);

  // 사이드바에 선택된 역과 열차 (실제 구현에서는 상위 상태로 관리)
  const selectedTravel: SelectedTravel = {
    stations: ['동해역', '묵호역'],
    trains: ['무궁화호'],
  };

  return (
    <div className="AiPlannerView">
      {/* 상단 메뉴 */}
      <header className="AiPlannerView-Header">
        <button className="AiPlannerView-Logo" onClick={() => onNavigate('철도 지도')}>NEAREAST</button>
        <nav className="AiPlannerView-Nav">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              className={`AiPlannerView-NavItem${activeNav === tab ? ' AiPlannerView-NavItem--active' : ''}`}
              onClick={() => onNavigate(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* 페이지 제목 */}
      <h1 className="AiPlannerView-PageTitle">AI 여행 플래너</h1>

      {/* AI 대화 — 여행 날짜 질문 */}
      <div className="AiPlannerView-ChatBlock AiPlannerView-ChatBlock--date">
        <div className="AiPlannerView-ChatItem">
          <div className="AiPlannerView-AiAvatar" />
          <div className="AiPlannerView-ChatBubble">
            <span className="AiPlannerView-ChatBubbleText">여행 날짜 알려주기</span>
          </div>
        </div>
        <div className="AiPlannerView-ChoiceRow">
          {DATE_OPTIONS.map((option) => (
            <button
              key={option}
              className={`AiPlannerView-ChoiceButton${selectedDate === option ? ' AiPlannerView-ChoiceButton--selected' : ''}`}
              onClick={() => setSelectedDate(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* 사용자 답변 */}
      <div className="AiPlannerView-UserReply">
        <div className="AiPlannerView-UserBubble">
          <span className="AiPlannerView-UserBubbleText">{selectedDate}</span>
        </div>
        <div className="AiPlannerView-UserAvatar" />
      </div>

      {/* AI 대화 — 여행 시간 질문 */}
      <div className="AiPlannerView-ChatBlock AiPlannerView-ChatBlock--duration">
        <div className="AiPlannerView-ChatItem">
          <div className="AiPlannerView-AiAvatar" />
          <div className="AiPlannerView-ChatBubble">
            <span className="AiPlannerView-ChatBubbleText">대략적인 여행 시간 선택</span>
          </div>
        </div>
        <div className="AiPlannerView-ChoiceRow">
          {DURATION_OPTIONS.map((option) => (
            <button
              key={option}
              className={`AiPlannerView-ChoiceButton${selectedDuration === option ? ' AiPlannerView-ChoiceButton--selected' : ''}`}
              onClick={() => setSelectedDuration(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* 하위 탭 — 진행 단계 */}
      <div className="AiPlannerView-Divider" />
      <nav className="AiPlannerView-StepTabs" aria-label="AI 플래너 단계">
        {AI_STEPS.map((step, index) => (
          <div
            key={step}
            className={`AiPlannerView-StepTab${index === currentAiStep ? ' AiPlannerView-StepTab--active' : ''}`}
          >
            <div className="AiPlannerView-StepNumber">
              <span>{index + 1}</span>
            </div>
            <span className="AiPlannerView-StepLabel">{step}</span>
          </div>
        ))}
      </nav>

      {/* 우측 사이드바 — 선택한 역과 열차 */}
      <aside className="AiPlannerView-Sidebar">
        <div className="AiPlannerView-SidebarSection">
          <div className="AiPlannerView-SidebarHeader">
            <span className="AiPlannerView-SidebarTitle">선택한 역과 열차</span>
            <button className="AiPlannerView-EditButton">편집</button>
          </div>
          <div className="AiPlannerView-SidebarStations">
            <span className="AiPlannerView-SidebarLabel">역 ({selectedTravel.stations.length})</span>
            <div className="AiPlannerView-TagRow">
              {selectedTravel.stations.map((station) => (
                <span key={station} className="AiPlannerView-Tag">
                  {station} ×
                </span>
              ))}
            </div>
          </div>
          <div className="AiPlannerView-SidebarTrains">
            <span className="AiPlannerView-SidebarLabel">열차 ({selectedTravel.trains.length})</span>
            <div className="AiPlannerView-TagRow">
              {selectedTravel.trains.map((train) => (
                <span key={train} className="AiPlannerView-Tag">
                  {train} ×
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 여행 조건 입력 현황 */}
        <div className="AiPlannerView-ConditionBox">
          <span className="AiPlannerView-ConditionTitle">여행 조건 입력 현황</span>
          <ul className="AiPlannerView-ConditionList">
            <li className="AiPlannerView-ConditionItem">
              <span className="AiPlannerView-ConditionIcon AiPlannerView-ConditionIcon--filled" />
              <span className="AiPlannerView-ConditionKey">여행 날짜</span>
              <span className="AiPlannerView-ConditionValue">{selectedDate}</span>
            </li>
            <div className="AiPlannerView-ConditionDivider" />
            <li className="AiPlannerView-ConditionItem">
              <span className="AiPlannerView-ConditionIcon" />
              <span className="AiPlannerView-ConditionKey">여행 시간</span>
              <span className="AiPlannerView-ConditionValue">선택 중...</span>
            </li>
            <div className="AiPlannerView-ConditionDivider" />
            <li className="AiPlannerView-ConditionItem">
              <span className="AiPlannerView-ConditionIcon" />
              <span className="AiPlannerView-ConditionKey">출발지</span>
              <span className="AiPlannerView-ConditionValue">-</span>
            </li>
            <div className="AiPlannerView-ConditionDivider" />
            <li className="AiPlannerView-ConditionItem">
              <span className="AiPlannerView-ConditionIcon" />
              <span className="AiPlannerView-ConditionKey">도착지</span>
              <span className="AiPlannerView-ConditionValue">-</span>
            </li>
            <div className="AiPlannerView-ConditionDivider" />
            <li className="AiPlannerView-ConditionItem">
              <span className="AiPlannerView-ConditionIcon" />
              <span className="AiPlannerView-ConditionKey">중간 방문역</span>
              <span className="AiPlannerView-ConditionValue">-</span>
            </li>
          </ul>
        </div>

        {/* 일정 만들기 버튼 */}
        <button className="AiPlannerView-CreateButton" onClick={onCreateItinerary}>
          일정 만들기 →
        </button>
      </aside>
    </div>
  );
}
