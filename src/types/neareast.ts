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
  places?: ChatPlace[]; // AI 답변에 붙는 장소 카드
}

// ── 채팅 API (POST /chat) — 형식 설명은 docs/chat-api.md ──

// AI가 답변과 함께 추천하는 장소
export interface ChatPlace {
  id: string;
  name: string;
  category: string; // '역' | '관광지' | '출사 포인트' | '식당·카페' 등
  stationName?: string; // 가장 가까운 역
  description: string;
  notice?: string; // 주의 사항 (예: 선로 접근 금지)
  source?: string; // 데이터 출처 (예: 공공데이터 역 정보)
}

export type PlanConditions = Partial<Record<PlanConditionKey, string>>;

export interface ChatRequest {
  messages: { role: 'user' | 'assistant'; text: string }[]; // 지금까지의 대화, 마지막이 방금 보낸 질문
  conditions: PlanConditions; // 지금까지 채워진 여행 조건
  savedPlaces: ChatPlace[]; // 사용자가 여행 후보로 담아둔 장소 — 일정을 짤 때 반영
}

export interface ChatResponse {
  reply: string;
  places?: ChatPlace[];
  conditionUpdates?: PlanConditions; // 이번 대화로 새로 알게 된 여행 조건
  quickReplies?: string[]; // 답변 아래 빠른 답변 버튼
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

// 저장된 여행 — '여행 계획하기'와 'AI 여행 플래너' 두 흐름이 같은 모양으로 저장한다
export type SavedTripSource = 'planner' | 'ai';

export interface SavedTripTimelineRow {
  time: string;
  icon: string; // ▣ ◉ ⌂ ♧ ♨ 등 일정 화면과 같은 기호
  description: string;
}

export interface SavedTrip {
  id: string;
  source: SavedTripSource;
  title: string;
  travelDateLabel: string; // 화면 표시용 '2026.11.21 (토)'
  timeRange: string;
  stations: string[];
  trains: string[];
  activities: string[];
  timeline: SavedTripTimelineRow[];
  createdAt: string; // ISO 8601
}

export type NewSavedTrip = Omit<SavedTrip, 'id' | 'createdAt'>;

// 여행 후보로 담아둔 장소 — 챗봇·지도 등에서 담고, 여행 계획하기에서 보여준다
export interface SavedPlace extends ChatPlace {
  savedFrom: string; // 담은 화면 이름 (예: 'AI 여행 플래너')
  savedAt: string; // ISO 8601
}

// 열차를 담는 용도 — 직접 타는 열차 / 지나가는 모습을 보는 열차
export type TrainPurpose = 'board' | 'watch';

// 열차 상세에서 담아둔 열차
export interface SavedTrain {
  id: string;
  trainName: string;
  route: string;
  purpose: TrainPurpose;
  savedFrom: string;
  savedAt: string; // ISO 8601
}

// 로그인한 사용자 — 비밀번호는 프론트에 두지 않는다
export interface AuthUser {
  email: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface UpdateProfileRequest {
  nickname: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// AI 여행 플래너의 지난 대화 하나 — 대화 목록에서 다시 열 수 있다
export interface ChatConversation {
  id: string;
  title: string; // 첫 질문으로 만든 제목
  messages: ChatMessage[];
  conditions: PlanConditions;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
