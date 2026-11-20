// 라우터 라이브러리 없이 해시로 페이지를 나눈다 — main.tsx가 해시를 보고 페이지를 고른다
export const ROUTES = {
  main: '',
  planning: '#/planning',
  myTrips: '#/my-trips', // 헤더 '나의 여행 일정' 탭 — 저장한 여행 일정
  myTripsSaved: '#/my-trips/saved', // 헤더 '나의 여행 일정' 탭 — 담아둔 장소·열차
  myPage: '#/mypage', // 마이페이지 — 내 정보, 비밀번호 변경, 로그아웃, 탈퇴
  login: '#/login',
  signup: '#/signup',
} as const;

// 한동안 '담아둔 장소·열차'가 마이페이지 안에 있었던 주소 — 북마크해 둔 사람도 열리게 받아준다
export const LEGACY_MY_PAGE_SAVED_HASH = '#/mypage/saved';

export type Route = (typeof ROUTES)[keyof typeof ROUTES] | `#/places/${string}` | `#/trains${string}` | `#/chat${string}` | '#/map';

export function conversationRoute(conversationId?: string): Route {
  return conversationId ? `#/chat?conversation=${encodeURIComponent(conversationId)}` : '#/chat';
}

export function navigateTo(route: Route): void {
  window.location.hash = route;
}
