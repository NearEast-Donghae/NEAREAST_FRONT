// 라우터 라이브러리 없이 해시로 페이지를 나눈다 — main.tsx가 해시를 보고 페이지를 고른다
export const ROUTES = {
  main: '',
  planning: '#/planning',
  myTrips: '#/my-trips',
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];

export function navigateTo(route: Route): void {
  window.location.hash = route;
}
