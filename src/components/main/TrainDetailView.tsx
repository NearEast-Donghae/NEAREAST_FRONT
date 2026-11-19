import React from 'react';
import HeaderActions from '../layout/HeaderActions';
import './TrainDetailView.css';
import type { MainNavTab } from './MapView';
import type { TrainPurpose } from '../../types/neareast';
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
  // 이 열차를 담아둔 용도 (담지 않았으면 null)
  savedPurpose: TrainPurpose | null;
  onSaveTrain: (purpose: TrainPurpose) => void;
}

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기', '나의 여행 일정'];

const TrainDetailView: React.FC<TrainDetailViewProps> = ({
  activeNav,
  onNavigate,
  trainName,
  route,
  stops,
  operationDays,
  onBack,
  savedPurpose,
  onSaveTrain,
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
        <HeaderActions />
      </header>

      {/* 본문 */}
      <main className="TrainDetailView-Main motion-stagger">
        {/* 뒤로가기 + 타이틀 */}
        <div className="TrainDetailView-TitleRow">
          <button className="TrainDetailView-BackButton" onClick={onBack}>
            ← 열차 목록으로
          </button>
        </div>

        <div className="TrainDetailView-TitleBlock motion-stagger">
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
              {/* 첫 칸은 행의 정차·통과 아이콘 자리 — 비워 둬야 머리글이 아래 칸과 맞는다 */}
              <span aria-hidden="true" />
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
                style={{ '--row-index': index } as React.CSSProperties}
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

        {/* 여행에 담기 — 한 열차는 탑승·관찰 중 하나로만 담긴다 */}
        <section className="TrainDetailView-SaveSection" aria-label="이 열차를 여행에 담기">
          <div className="TrainDetailView-SaveButtons">
            <button
              className={`TrainDetailView-SaveButton TrainDetailView-SaveButton--board${savedPurpose === 'board' ? ' TrainDetailView-SaveButton--saved' : ''}`}
              onClick={() => onSaveTrain('board')}
              aria-pressed={savedPurpose === 'board'}
            >
              {savedPurpose === 'board' ? '✓ 탑승할 열차로 담음' : '탑승할 열차로 담기'}
            </button>
            <button
              className={`TrainDetailView-SaveButton TrainDetailView-SaveButton--watch${savedPurpose === 'watch' ? ' TrainDetailView-SaveButton--saved' : ''}`}
              onClick={() => onSaveTrain('watch')}
              aria-pressed={savedPurpose === 'watch'}
            >
              {savedPurpose === 'watch' ? '✓ 관찰할 열차로 담음' : '관찰할 열차로 담기'}
            </button>
          </div>
          {/* 안내 문구가 바뀔 때 토스트처럼 살짝 Fade in */}
          <p key={savedPurpose ?? 'none'} className="TrainDetailView-SaveHint motion-toast" role="status">
            {savedPurpose === null
              ? '직접 탈 열차인지, 지나가는 모습을 볼 열차인지 골라 여행에 담아 두세요.'
              : '담은 열차는 ‘여행 계획하기’에서 확인할 수 있어요. 한 번 더 누르면 빠져요.'}
          </p>
        </section>
      </main>
    </div>
  );
};

export type { TrainDetailViewProps, StopInfo };
export default TrainDetailView;
