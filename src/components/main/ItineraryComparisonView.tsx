import React, { useState } from 'react';
import HeaderActions from '../layout/HeaderActions';
import './ItineraryComparisonView.css';
import type { MainNavTab } from './MapView';

interface ComparisonOption {
  id: string;
  title: string;
  totalTime: string;
  timeRange: string;
  stationCount: number;
  stations: string[];
  trainExperiences: string[];
}

interface ItineraryComparisonViewProps {
  activeNav: MainNavTab;
  onNavigate: (tab: MainNavTab) => void;
  options: ComparisonOption[];
  onSelectOption: (id: string) => void;
  onBack: () => void;
}

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기', '나의 여행 일정'];

const ItineraryComparisonView: React.FC<ItineraryComparisonViewProps> = ({
  activeNav,
  onNavigate,
  options,
  onSelectOption,
  onBack,
}) => {
  // 첫 번째 옵션이 기본 선택 상태 (디자인 기준)
  const [selectedId, setSelectedId] = useState<string>(options[0]?.id ?? '');

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onSelectOption(id);
  };

  return (
    <div className="ItineraryComparisonView">
      {/* 상단 메뉴 */}
      <header className="ItineraryComparisonView-Header">
        <button className="ItineraryComparisonView-Logo" onClick={() => onNavigate('철도 지도')}>NEAREAST</button>
        <nav className="ItineraryComparisonView-Nav">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              className={`ItineraryComparisonView-NavItem${activeNav === tab ? ' ItineraryComparisonView-NavItem--active' : ''}`}
              onClick={() => onNavigate(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <HeaderActions />
      </header>

      {/* 이전으로 */}
      <button className="ItineraryComparisonView-BackLink" onClick={onBack}>
        {'‹  이전으로'}
      </button>

      {/* 타이틀 블록 (중앙) */}
      <div className="ItineraryComparisonView-TitleBlock">
        <p className="ItineraryComparisonView-TitleLabel">추천 여행 일정 비교</p>
        <p className="ItineraryComparisonView-TitleHeading">어떤 여행이 더 마음에 드시나요?</p>
      </div>

      {/* 비교 카드 3개 */}
      {options.map((option) => {
        const isSelected = selectedId === option.id;
        return (
          <div
            key={option.id}
            className={`ItineraryComparisonView-Card ItineraryComparisonView-Card--${option.id}${isSelected ? ' ItineraryComparisonView-Card--selected' : ''}`}
          >
            <p className="ItineraryComparisonView-CardTitle">{option.title}</p>

            {/* 구분선 */}
            <div className="ItineraryComparisonView-Divider" />

            {/* 정보 영역 */}
            <div className="ItineraryComparisonView-InfoSection">
              {/* 총 여행 시간 */}
              <div className="ItineraryComparisonView-InfoGroup">
                <p className="ItineraryComparisonView-InfoLabel">총 여행 시간</p>
                <div className="ItineraryComparisonView-TimeRow">
                  <span className="ItineraryComparisonView-TimeMain">{option.totalTime}</span>
                  <span className="ItineraryComparisonView-TimeRange">({option.timeRange})</span>
                </div>
              </div>

              {/* 방문하는 역 */}
              <div className="ItineraryComparisonView-InfoGroup">
                <p className="ItineraryComparisonView-InfoLabel">방문하는 역 ({option.stationCount}곳)</p>
                <div className="ItineraryComparisonView-StationTags">
                  {option.stations.map((station) => (
                    <span key={station} className="ItineraryComparisonView-StationTag">
                      {station}
                    </span>
                  ))}
                </div>
              </div>

              {/* 열차 체험 */}
              <div className="ItineraryComparisonView-InfoGroup">
                <p className="ItineraryComparisonView-InfoLabel">열차 체험</p>
                <div className="ItineraryComparisonView-TrainList">
                  {option.trainExperiences.map((exp) => (
                    <p key={exp} className="ItineraryComparisonView-TrainItem">
                      {exp}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* 선택 버튼 */}
            <button
              className={`ItineraryComparisonView-SelectButton${isSelected ? ' ItineraryComparisonView-SelectButton--active' : ''}`}
              onClick={() => handleSelect(option.id)}
            >
              {'이 일정 선택  >'}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export type { ItineraryComparisonViewProps, ComparisonOption };
export default ItineraryComparisonView;
