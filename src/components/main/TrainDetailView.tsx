import React from 'react';
import MyTripsButton from '../layout/MyTripsButton';
import './TrainDetailView.css';
import type { MainNavTab } from './MapView';
import stationStopIcon from '../../assets/icons/station-stop.svg';
import stationPassIcon from '../../assets/icons/station-pass.svg';

interface StopInfo {
  stationName: string;
  arrivalTime: string | null;
  departureTime: string | null;
  // 정차: true, 통과: false
  isStop: boolean;
}

interface TrainDetailViewProps {
  activeNav: MainNavTab;
  onNavigate: (tab: MainNavTab) => void;
  trainName: string;
  route: string;
  stops: StopInfo[];
  operationDays: string;
  onBack: () => void;
}

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기'];

const TrainDetailView: React.FC<TrainDetailViewProps> = ({
  activeNav,
  onNavigate,
  trainName,
  route,
  stops,
  operationDays,
  onBack,
}) => {
  return (
    <div className="TrainDetailView">
      {/* 헤더 네비게이션 */}
      <header className="TrainDetailView-Header">
        <button className="TrainDetailView-Logo" onClick={() => onNavigate('철도 지도')}>NEAREAST</button>
        <nav className="TrainDetailView-Nav">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              className={`TrainDetailView-NavItem${activeNav === tab ? ' TrainDetailView-NavItem--active' : ''}`}
              onClick={() => onNavigate(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <MyTripsButton />
      </header>

      {/* 본문 */}
      <main className="TrainDetailView-Main">
        {/* 뒤로가기 + 타이틀 */}
        <div className="TrainDetailView-TitleRow">
          <button className="TrainDetailView-BackButton" onClick={onBack}>
            ← 열차 목록으로
          </button>
        </div>

        <div className="TrainDetailView-TitleBlock">
          <h1 className="TrainDetailView-Title">{trainName}</h1>
          <p className="TrainDetailView-Subtitle">{route}</p>
          <span className="TrainDetailView-OperationDays">{operationDays}</span>
        </div>

        {/* 정차역 목록 */}
        <section className="TrainDetailView-StopsSection">
          <h2 className="TrainDetailView-SectionTitle">정차역 및 시각표</h2>

          <div className="TrainDetailView-StopsTable">
            {/* 테이블 헤더 */}
            <div className="TrainDetailView-TableHeader">
              <span className="TrainDetailView-ColStation">역명</span>
              <span className="TrainDetailView-ColType">구분</span>
              <span className="TrainDetailView-ColArrival">도착</span>
              <span className="TrainDetailView-ColDeparture">출발</span>
            </div>

            {/* 역 목록 */}
            {stops.map((stop, index) => (
              <div
                key={`${stop.stationName}-${index}`}
                className={`TrainDetailView-StopRow${!stop.isStop ? ' TrainDetailView-StopRow--pass' : ''}`}
              >
                {/* 역 연결선 */}
                <div className="TrainDetailView-StopLine">
                  {index < stops.length - 1 && (
                    <div className="TrainDetailView-ConnectorLine" />
                  )}
                  <img
                    src={stop.isStop ? stationStopIcon : stationPassIcon}
                    alt={stop.isStop ? '정차' : '통과'}
                    className="TrainDetailView-StopIcon"
                  />
                </div>

                <span className="TrainDetailView-ColStation">{stop.stationName}</span>
                <span className="TrainDetailView-ColType">
                  {stop.isStop ? '정차' : '통과'}
                </span>
                <span className="TrainDetailView-ColArrival">
                  {stop.arrivalTime ?? '—'}
                </span>
                <span className="TrainDetailView-ColDeparture">
                  {stop.departureTime ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export type { TrainDetailViewProps, StopInfo };
export default TrainDetailView;
