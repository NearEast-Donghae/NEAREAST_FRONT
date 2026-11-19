// 라우터 라이브러리 없이 해시로 페이지를 나눈다 — main.tsx가 해시를 보고 페이지를 고른다
export const ROUTES = {
  main: '',
  planning: '#/planning',
  myPage: '#/mypage', // 마이페이지 — 기본 탭은 나의 여행 일정
  myPageSaved: '#/mypage/saved', // 마이페이지 — 담아둔 장소·열차 탭
  login: '#/login',
  signup: '#/signup',
} as const;

// 마이페이지가 생기기 전 '나의 여행 일정' 주소 — 북마크해 둔 사람도 마이페이지로 열리게 받아준다
export const LEGACY_MY_TRIPS_HASH = '#/my-trips';

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

export function navigateTo(route: Route): void {
  window.location.hash = route;
}
