import { useState } from 'react';
import Step1BasicInfo, { TravelBasicInfo } from '../components/planning/Step1BasicInfo';
import Step2Stations from '../components/planning/Step2Stations';
import Step2_1Trains from '../components/planning/Step2_1Trains';
import Step2A_TrainDetail, { TrainDetailInfo } from '../components/planning/Step2A_TrainDetail';
import Step3Schedule, { ScheduleItem } from '../components/planning/Step3Schedule';
import Step4FreeTime, { FreeTimeSlot } from '../components/planning/Step4FreeTime';
import Step5Confirm, { FinalScheduleItem, TravelSummary } from '../components/planning/Step5Confirm';

type PlanningView =
  | 'step1'
  | 'step2'
  | 'step2_1'
  | 'step2A'
  | 'step3'
  | 'step4'
  | 'step5';

// 샘플 열차 상세정보 (실제로는 API에서 받아옴)
const SAMPLE_TRAIN_DETAILS: Record<string, TrainDetailInfo> = {
  'itx-maum': {
    trainType: 'ITX-마음',
    trainNumber: 'ITX-마음 2101',
    route: '동해 → 강릉',
    departureTime: '10:20',
    arrivalTime: '11:34',
    durationMinutes: 74,
    stops: [
      { stationName: '동해역', stopType: '정차' },
      { stationName: '묵호역', stopType: '정차' },
      { stationName: '추암역', stopType: '통과' },
      { stationName: '삼척역', stopType: '정차' },
      { stationName: '근덕역', stopType: '통과' },
      { stationName: '호산역', stopType: '통과' },
      { stationName: '매원역', stopType: '통과' },
      { stationName: '임원역', stopType: '정차' },
      { stationName: '원덕역', stopType: '통과' },
      { stationName: '강릉역', stopType: '정차' },
    ],
  },
  'mugunghwa': {
    trainType: '무궁화호',
    trainNumber: '무궁화호 1693',
    route: '동해 → 강릉',
    departureTime: '14:20',
    arrivalTime: '15:34',
    durationMinutes: 74,
    stops: [
      { stationName: '동해역', stopType: '정차' },
      { stationName: '묵호역', stopType: '정차' },
      { stationName: '추암역', stopType: '통과' },
      { stationName: '삼척역', stopType: '정차' },
      { stationName: '강릉역', stopType: '정차' },
    ],
  },
};

// 기본 일정 생성 함수 (선택된 역/열차/시간 기반)
const buildDefaultSchedule = (
  stations: string[],
  trains: string[],
  startTime: string,
): ScheduleItem[] => {
  const items: ScheduleItem[] = [];
  let currentTime = startTime;

  const addMinutes = (time: string, minutes: number): string => {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + minutes;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  };

  if (stations.length > 0) {
    items.push({
      id: `station-depart-${stations[0]}`,
      time: currentTime,
      label: `${stations[0]} 출발`,
      type: 'station',
    });
  }

  if (trains.length > 0) {
    currentTime = addMinutes(currentTime, 20);
    items.push({
      id: `train-${trains[0]}`,
      time: currentTime,
      label: `${trains[0]} 탑승`,
      type: 'train',
    });
  }

  if (stations.length > 1) {
    currentTime = addMinutes(currentTime, 40);
    items.push({
      id: `station-arrive-${stations[1]}`,
      time: currentTime,
      label: `${stations[1]} 탐방`,
      type: 'station',
    });

    // 빈 시간 추가
    const freeStart = addMinutes(currentTime, 60);
    const freeEnd   = addMinutes(freeStart, 90);
    items.push({
      id: `free-slot-1`,
      time: freeStart,
      endTime: freeEnd,
      label: `빈 시간 (1시간 30분)`,
      type: 'free',
      durationLabel: '1시간 30분',
    });
    currentTime = freeEnd;
  }

  return items;
};

const PlanningPage = () => {
  const [currentView, setCurrentView] = useState<PlanningView>('step1');
  const [viewingTrainId, setViewingTrainId] = useState<string>('');

  // 폼 상태
  const [basicInfo, setBasicInfo] = useState<TravelBasicInfo>({
    travelDate:        '2026-11-21',
    departureStation:  '묵호역',
    returnStation:     '묵호역',
    startTime:         '10:00',
    endTime:           '17:00',
  });
  const [selectedStations, setSelectedStations] = useState<string[]>(['묵호역', '정동진역']);
  const [selectedTrains,   setSelectedTrains]   = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);

  // 일정 아이템 (step3에서 편집)
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);

  // 빈 시간 추천 목록 (실제로는 API에서 받아옴)
  const freeTimeSlots: FreeTimeSlot[] = [
    {
      id: 'free-slot-1',
      startTime: '12:00',
      endTime:   '13:30',
      nearestStation: '정동진역',
      suggestions: [
        { id: 'act-1', name: '정동진 해변 산책', durationMinutes: 40, category: '산책' },
        { id: 'act-2', name: '역 주변 카페',      durationMinutes: 50, category: '카페' },
        { id: 'act-3', name: '점심 식사',          durationMinutes: 60, category: '식사' },
      ],
    },
  ];

  const handleBasicInfoChange = (updated: Partial<TravelBasicInfo>) => {
    setBasicInfo((prev) => ({ ...prev, ...updated }));
  };

  const handleStep1Next = () => {
    setCurrentView('step2');
  };

  const handleStep2ToTrains = () => {
    setCurrentView('step2_1');
  };

  const handleStep2_1Next = () => {
    // 선택된 역/열차로 기본 일정 생성
    const defaultSchedule = buildDefaultSchedule(
      selectedStations,
      selectedTrains,
      basicInfo.startTime,
    );
    setScheduleItems(defaultSchedule);
    setCurrentView('step3');
  };

  const handleViewTrainDetail = (trainId: string) => {
    setViewingTrainId(trainId);
    setCurrentView('step2A');
  };

  const handleAddTrainFromDetail = () => {
    const detail = SAMPLE_TRAIN_DETAILS[viewingTrainId];
    if (detail && !selectedTrains.includes(detail.trainType)) {
      setSelectedTrains([...selectedTrains, detail.trainType]);
    }
    setCurrentView('step2_1');
  };

  const handleAddActivity = (freeSlotId: string) => {
    // 빈 시간 활동 추가 → step4로 이동
    setCurrentView('step4');
  };

  const handleStep4Confirm = () => {
    setCurrentView('step5');
  };

  const handleActivityToggle = (activityId: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activityId)
        ? prev.filter((id) => id !== activityId)
        : [...prev, activityId]
    );
  };

  const handleSavePlan = () => {
    // 여행 계획 저장 처리 (실제로는 API 호출)
    alert('여행 계획이 저장되었습니다!');
  };

  // 최종 일정 아이템 변환
  const finalScheduleItems: FinalScheduleItem[] = scheduleItems
    .filter((item) => item.type !== 'free')
    .map((item) => ({
      id:    item.id,
      time:  item.time,
      label: item.label,
      type:  item.type as 'station' | 'train' | 'activity',
    }));

  const travelSummary: TravelSummary = {
    date:             basicInfo.travelDate,
    startTime:        basicInfo.startTime,
    endTime:          basicInfo.endTime,
    visitedStations:  selectedStations,
    visitedTrains:    selectedTrains,
    activities:       selectedActivities,
  };

  // 뷰별 렌더링
  switch (currentView) {
    case 'step1':
      return (
        <Step1BasicInfo
          formData={basicInfo}
          onFormChange={handleBasicInfoChange}
          onNext={handleStep1Next}
        />
      );

    case 'step2':
      return (
        <Step2Stations
          selectedStations={selectedStations}
          selectedTrains={selectedTrains}
          onStationsChange={setSelectedStations}
          onPrev={() => setCurrentView('step1')}
          onNextToTrains={handleStep2ToTrains}
          onNextToSchedule={handleStep2_1Next}
        />
      );

    case 'step2_1':
      return (
        <Step2_1Trains
          selectedStations={selectedStations}
          selectedTrains={selectedTrains}
          onTrainsChange={setSelectedTrains}
          onPrevToStations={() => setCurrentView('step2')}
          onViewTrainDetail={handleViewTrainDetail}
          onNext={handleStep2_1Next}
        />
      );

    case 'step2A':
      return (
        <>
          {/* 배경으로 step2_1 유지 */}
          <Step2_1Trains
            selectedStations={selectedStations}
            selectedTrains={selectedTrains}
            onTrainsChange={setSelectedTrains}
            onPrevToStations={() => setCurrentView('step2')}
            onViewTrainDetail={handleViewTrainDetail}
            onNext={handleStep2_1Next}
          />
          <Step2A_TrainDetail
            trainDetail={SAMPLE_TRAIN_DETAILS[viewingTrainId] ?? SAMPLE_TRAIN_DETAILS['itx-maum']}
            onBack={() => setCurrentView('step2_1')}
            onAddToSchedule={handleAddTrainFromDetail}
          />
        </>
      );

    case 'step3':
      return (
        <Step3Schedule
          scheduleItems={scheduleItems}
          selectedStations={selectedStations}
          selectedTrains={selectedTrains}
          onAddActivity={handleAddActivity}
          onAddItem={() => {}}
          onPrev={() => setCurrentView('step2_1')}
          onNext={() => setCurrentView('step4')}
        />
      );

    case 'step4':
      return (
        <Step4FreeTime
          freeTimeSlots={freeTimeSlots}
          selectedActivities={selectedActivities}
          onActivityToggle={handleActivityToggle}
          onPrev={() => setCurrentView('step3')}
          onConfirm={handleStep4Confirm}
        />
      );

    case 'step5':
      return (
        <Step5Confirm
          scheduleItems={finalScheduleItems}
          summary={travelSummary}
          onEditItem={() => {}}
          onAddItem={() => {}}
          onPrev={() => setCurrentView('step4')}
          onSave={handleSavePlan}
        />
      );

    default:
      return null;
  }
};

export default PlanningPage;
