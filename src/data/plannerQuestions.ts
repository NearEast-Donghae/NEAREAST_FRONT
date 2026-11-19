import type { PlanConditionKey } from '../types/neareast';

export interface PlannerQuestion {
  key: PlanConditionKey;
  label: string;
  question: string;
  options: string[];
}

// 일정을 만들 때 필요한 여행 조건 — 화면(진행 단계·조건 현황)과 데모 응답이 같이 쓴다
export const PLANNER_QUESTIONS: PlannerQuestion[] = [
  {
    key: 'travelDate',
    label: '여행 날짜',
    question: '언제 떠나실 건가요?',
    options: ['이번 주 주말', '다음 주 주말', '직접 입력할게요'],
  },
  {
    key: 'travelDuration',
    label: '여행 시간',
    question: '여행 시간은 어느 정도로 생각하세요?',
    options: ['반나절 (약 4시간)', '하루 (약 8시간)', '1박 2일'],
  },
  {
    key: 'departureStation',
    label: '출발지',
    question: '어느 역에서 출발하세요?',
    options: ['동해역', '묵호역', '정동진역', '강릉역'],
  },
  {
    key: 'arrivalStation',
    label: '도착지',
    question: '여행은 어느 역에서 마칠까요?',
    options: ['출발역으로 돌아오기', '동해역', '삼척해변역', '강릉역'],
  },
  {
    key: 'requiredStop',
    label: '중간 방문역',
    question: '중간에 꼭 들르고 싶은 역이 있나요?',
    options: ['망상해변역', '추암역', '정동진역', '없어요'],
  },
];

export const NO_STOP_OPTION = '없어요';
export const CREATE_ITINERARY_OPTION = '일정 만들기 →';
