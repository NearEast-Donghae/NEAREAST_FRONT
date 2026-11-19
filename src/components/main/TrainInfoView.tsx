import React, { useState } from 'react';
import { MainNavTab } from './MapView';
import './TrainInfoView.css';

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기'];

// 열차 검색 결과 타입
export interface TrainResult {
  id: string;
  trainName: string;
  route: string;
  departureStation: string;
  departureTime: string;
}

interface TrainSearchParams {
  date: string;
  time: string;
  departureStation: string;
  arrivalStation: string;
}

interface TrainInfoViewProps {
  activeNav: MainNavTab;
  onNavigate: (tab: MainNavTab) => void;
  onViewDetail: (train: TrainResult) => void;
}

// 예시 열차 결과 데이터
const EXAMPLE_RESULTS: TrainResult[] = [
  {
    id: 'mugunghwa-1693',
    trainName: '무궁화호 1693',
    route: '동해역 → 묵호역',
    departureStation: '동해역',
    departureTime: '14:20',
  },
];

export default function TrainInfoView({
  activeNav,
  onNavigate,
  onViewDetail,
}: TrainInfoViewProps) {
  const [searchParams, setSearchParams] = useState<TrainSearchParams>({
    date: '3월 15일 (토)',
    time: '08:00 이후',
    departureStation: '동해역',
    arrivalStation: '묵호역',
  });
  const [results] = useState<TrainResult[]>(EXAMPLE_RESULTS);

  function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    // 실제 구현에서는 API 호출
  }

  function handleFieldChange(field: keyof TrainSearchParams, value: string) {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="TrainInfoView">
      {/* 상단 메뉴 */}
      <header className="TrainInfoView-Header">
        <button className="TrainInfoView-Logo" onClick={() => onNavigate('철도 지도')}>NEAREAST</button>
        <nav className="TrainInfoView-Nav">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              className={`TrainInfoView-NavItem${activeNav === tab ? ' TrainInfoView-NavItem--active' : ''}`}
              onClick={() => onNavigate(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>

      {/* 본문 */}
      <main className="TrainInfoView-Main">

        {/* 검색 제목 */}
        <div className="TrainInfoView-TitleBlock">
          <h1 className="TrainInfoView-Title">열차 정보</h1>
          <p className="TrainInfoView-Subtitle">날짜와 구간을 선택해 운행하는 열차를 찾아보세요.</p>
        </div>

        {/* 검색 조건 */}
        <form className="TrainInfoView-SearchForm" onSubmit={handleSearch}>
          <div className="TrainInfoView-SearchConditions">
            <div className="TrainInfoView-SearchField">
              <label className="TrainInfoView-FieldLabel">날짜</label>
              <div className="TrainInfoView-FieldInput">
                <span>{searchParams.date}</span>
                <span className="TrainInfoView-FieldArrow">▾</span>
              </div>
            </div>
            <div className="TrainInfoView-SearchField">
              <label className="TrainInfoView-FieldLabel">시간</label>
              <div className="TrainInfoView-FieldInput">
                <span>{searchParams.time}</span>
                <span className="TrainInfoView-FieldArrow">▾</span>
              </div>
            </div>
            <div className="TrainInfoView-SearchField">
              <label className="TrainInfoView-FieldLabel">출발역</label>
              <div className="TrainInfoView-FieldInput">
                <span>{searchParams.departureStation}</span>
                <span className="TrainInfoView-FieldArrow">▾</span>
              </div>
            </div>
            <div className="TrainInfoView-SearchField">
              <label className="TrainInfoView-FieldLabel">도착역</label>
              <div className="TrainInfoView-FieldInput">
                <span>{searchParams.arrivalStation}</span>
                <span className="TrainInfoView-FieldArrow">▾</span>
              </div>
            </div>
            <button type="submit" className="TrainInfoView-SearchButton">
              열차 찾기
            </button>
          </div>
        </form>

        {/* 검색 결과 */}
        <div className="TrainInfoView-Results">
          <div className="TrainInfoView-ResultsHeader">
            <span className="TrainInfoView-ResultCount">검색 결과 {results.length}건</span>
            <span className="TrainInfoView-ResultNote">예시 시간표</span>
          </div>
          {results.map((result) => (
            <div key={result.id} className="TrainInfoView-ResultCard">
              <div className="TrainInfoView-ResultInfo">
                <span className="TrainInfoView-TrainName">{result.trainName}</span>
                <span className="TrainInfoView-TrainRoute">{result.route}</span>
              </div>
              <div className="TrainInfoView-DepartureInfo">
                <span className="TrainInfoView-DepartureLabel">{result.departureStation} 출발</span>
                <span className="TrainInfoView-DepartureTime">{result.departureTime}</span>
              </div>
              <button
                className="TrainInfoView-DetailButton"
                onClick={() => onViewDetail(result)}
              >
                상세 보기 →
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
