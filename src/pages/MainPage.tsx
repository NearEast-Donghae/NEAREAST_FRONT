import React, { useState } from 'react';
import {
  MapView,
  StationInfoPopup,
  AiPlannerView,
  TrainInfoView,
  TrainDetailView,
  ItineraryComparisonView,
  FinalItineraryView,
} from '../components/main';
import type {
  MainNavTab,
  TrainResult,
  StopInfo,
  ComparisonOption,
  TimelineRow,
  TravelSummary,
} from '../components/main';

type MainView =
  | 'map'
  | 'trainInfo'
  | 'trainDetail'
  | 'aiPlanner'
  | 'itineraryComparison'
  | 'finalItinerary';

// — 더미 데이터 (실제 API 연동 시 교체) —

const DUMMY_STOPS: StopInfo[] = [
  { stationName: '동해역', arrivalTime: null, departureTime: '08:00', isStop: true },
  { stationName: '묵호역', arrivalTime: '08:12', departureTime: '08:14', isStop: true },
  { stationName: '정동진역', arrivalTime: '08:35', departureTime: '08:37', isStop: true },
  { stationName: '강릉역', arrivalTime: null, departureTime: null, isStop: false },
  { stationName: '삼척해변역', arrivalTime: '09:10', departureTime: '09:12', isStop: true },
];

// 추천 일정 비교 옵션 3가지 (피그마 디자인 기준)
const COMPARISON_OPTIONS: ComparisonOption[] = [
  {
    id: 'option-1',
    title: '열차 우선',
    totalTime: '약 8시간 30분',
    timeRange: '09:00–17:30',
    stationCount: 3,
    stations: ['동해역', '묵호역', '정동진역'],
    trainExperiences: [
      '✓  탑승 2회 (동해→묵호역, 묵호→정동진역)',
      '✓  관찰 2회 (정동진역, 동해역)',
    ],
  },
  {
    id: 'option-2',
    title: '방문지 우선',
    totalTime: '약 8시간',
    timeRange: '09:00–17:00',
    stationCount: 5,
    stations: ['동해역', '묵호역', '망상역', '정동진역', '옥계역(폐역)'],
    trainExperiences: [
      '✓  탑승 1회 (동해역→묵호역)',
      '✓  관찰 1회 (정동진역)',
    ],
  },
  {
    id: 'option-3',
    title: '균형형',
    totalTime: '약 8시간 20분',
    timeRange: '09:00–17:20',
    stationCount: 4,
    stations: ['동해역', '묵호역', '망상역', '정동진역'],
    trainExperiences: [
      '✓  탑승 1회 (동해역→묵호역)',
      '✓  관찰 2회 (묵호역, 정동진역)',
    ],
  },
];

// 최종 여행 일정 타임라인 (피그마 디자인 기준)
const DUMMY_TIMELINE: TimelineRow[] = [
  { id: 'row-1', time: '10:00', timeMarker: '○', icon: '▣', description: '묵호역 출발' },
  { id: 'row-2', time: '10:20', timeMarker: '○', icon: '◉', description: 'ITX-마음 관찰 (묵호역)' },
  { id: 'row-3', time: '11:00', timeMarker: '○', icon: '⌂', description: '정동진역 탐방' },
  { id: 'row-4', time: '12:00', timeMarker: '●', icon: '♧', description: '정동진 해변 산책 (40분)' },
  { id: 'row-5', time: '12:40', timeMarker: '○', icon: '♨', description: '정동진 카페 휴식 (50분)' },
  { id: 'row-6', time: '14:00', timeMarker: '○', icon: '◉', description: '열차 관찰 (정동진역)' },
  { id: 'row-7', time: '15:00', timeMarker: '○', icon: '⌂', description: '묵호역 복귀 및 여행 마무리' },
];

const DUMMY_SUMMARY: TravelSummary = {
  date: '2026.11.21 (토)',
  timeRange: '10:00 – 17:00',
  visitedStations: '묵호역 · 정동진역',
  trainName: 'ITX-마음',
  extraActivities: '해변 산책 · 카페',
};

interface MainPageProps {
  // 계획하기 페이지 헤더에서 다른 탭을 눌러 돌아올 때 해당 탭으로 바로 열기 위함
  initialNav?: MainNavTab;
}

const INITIAL_VIEW_BY_NAV: Partial<Record<MainNavTab, MainView>> = {
  '철도 지도': 'map',
  '열차 정보': 'trainInfo',
  'AI 여행 플래너': 'aiPlanner',
};

const MainPage: React.FC<MainPageProps> = ({ initialNav = '철도 지도' }) => {
  const [currentView, setCurrentView] = useState<MainView>(INITIAL_VIEW_BY_NAV[initialNav] ?? 'map');
  const [activeNav, setActiveNav] = useState<MainNavTab>(initialNav);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [selectedTrain, setSelectedTrain] = useState<TrainResult | null>(null);

  const handleNavigate = (tab: MainNavTab) => {
    setActiveNav(tab);
    switch (tab) {
      case '철도 지도':     setCurrentView('map');        break;
      case '열차 정보':     setCurrentView('trainInfo');   break;
      case 'AI 여행 플래너': setCurrentView('aiPlanner');   break;
      case '여행 계획하기':  window.location.hash = '#/planning'; break; // 라우터 도입 전까지 main.tsx의 해시 라우팅 사용
    }
  };

  const handleViewTrainDetail = (train: TrainResult) => {
    setSelectedTrain(train);
    setCurrentView('trainDetail');
  };

  return (
    <>
      {currentView === 'map' && (
        <>
          <MapView
            activeNav={activeNav}
            onNavigate={handleNavigate}
            onStationClick={(name) => setSelectedStation(name)}
          />
          {selectedStation !== null && (
            <StationInfoPopup
              stationName={selectedStation}
              operationStatus="운영 중"
              description="동해안 해안선을 따라 운행하는 동해선의 주요 역입니다."
              trains={['동해산타열차', '바다열차', 'S-train']}
              onClose={() => setSelectedStation(null)}
              onAddToWishlist={() => {}}
            />
          )}
        </>
      )}

      {currentView === 'trainInfo' && (
        <TrainInfoView
          activeNav={activeNav}
          onNavigate={handleNavigate}
          onViewDetail={handleViewTrainDetail}
        />
      )}

      {currentView === 'trainDetail' && selectedTrain !== null && (
        <TrainDetailView
          activeNav={activeNav}
          onNavigate={handleNavigate}
          trainName={selectedTrain.trainName}
          route={selectedTrain.route}
          stops={DUMMY_STOPS}
          operationDays="매일 운행"
          onBack={() => setCurrentView('trainInfo')}
        />
      )}

      {currentView === 'aiPlanner' && (
        <AiPlannerView
          activeNav={activeNav}
          onNavigate={handleNavigate}
          onCreateItinerary={() => setCurrentView('itineraryComparison')}
        />
      )}

      {currentView === 'itineraryComparison' && (
        <ItineraryComparisonView
          activeNav={activeNav}
          onNavigate={handleNavigate}
          options={COMPARISON_OPTIONS}
          onSelectOption={() => setCurrentView('finalItinerary')}
          onBack={() => setCurrentView('aiPlanner')}
        />
      )}

      {currentView === 'finalItinerary' && (
        <FinalItineraryView
          activeNav={activeNav}
          onNavigate={handleNavigate}
          timeline={DUMMY_TIMELINE}
          summary={DUMMY_SUMMARY}
          onBack={() => setCurrentView('itineraryComparison')}
          onSave={() => alert('여행 계획이 저장되었습니다.')}
        />
      )}
    </>
  );
};

export default MainPage;
