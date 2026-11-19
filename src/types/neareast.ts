// 역 운영 상태
export type StationStatus = 'active' | 'closed';

// 역 정보
export interface Station {
  id: string;
  name: string;
  status: StationStatus;
  description?: string;
  imageUrl?: string;
  passingTrains?: TrainType[];
}

// 열차 종류
export type TrainType = 'KTX-이음' | '무궁화호' | 'ITX-마음' | '누리로';

// 열차 정차 유형
export type StopType = 'stop' | 'pass';

// 열차 노선의 각 정차역 정보
export interface RouteStop {
  stationName: string;
  stopType: StopType;
}

// 열차 정보
export interface Train {
  id: string;
  trainType: TrainType;
  trainNumber: string;
  departureStation: string;
  arrivalStation: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stopCount: number;
  routeStops: RouteStop[];
}

// 여행 조건 항목
export type PlanConditionKey = 'travelDate' | 'travelDuration' | 'departureStation' | 'arrivalStation' | 'requiredStop';

// 여행 조건 상태
export type PlanConditionStatus = 'completed' | 'active' | 'pending';

// 여행 조건 항목 정보
export interface PlanConditionItem {
  key: PlanConditionKey;
  label: string;
  value: string | null;
  status: PlanConditionStatus;
}

// 채팅 메시지 발신자
export type MessageSender = 'ai' | 'user';

// 채팅 메시지
export interface ChatMessage {
  id: string;
  sender: MessageSender;
  text: string;
  options?: string[];
  selectedOption?: string;
}

// 일정 타입
export type ItineraryType = 'train-first' | 'spot-first' | 'balanced';

// 일정 카드 정보 (추천 일정 비교)
export interface ItineraryCard {
  id: string;
  type: ItineraryType;
  title: string;
  description: string;
  totalDurationText: string;
  timeRange: string;
  visitingStations: string[];
  boardingCount: number;
  watchingCount: number;
}

// 일정 세부 항목 타입
export type ScheduleItemType = 'start' | 'train' | 'visit' | 'watch' | 'meal' | 'break' | 'end';

// 일정 세부 항목
export interface ScheduleItem {
  id: string;
  timeRange: string;
  type: ScheduleItemType;
  title: string;
  description: string;
  location: string;
  tag?: string; // '탑승' | '관찰' 등
}

// 이동 경로의 역
export interface RouteStation {
  name: string;
  status: StationStatus;
}

// 선택된 역 및 열차 (사이드 패널)
export interface SelectedItems {
  stations: string[];
  trains: string[];
}
