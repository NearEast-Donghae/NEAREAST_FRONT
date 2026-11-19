import type { Route } from '../routes';
import type { MainNavTab } from '../components/main/MapView';

// 로그인이 필요한 화면에서 로그인하러 갔다가, 로그인 후 원래 화면으로 돌아오기 위한 기억.
// 메인 페이지의 탭(AI 여행 플래너 등)은 주소가 따로 없어서 탭 이름도 같이 기억한다.
export interface ReturnTarget {
  route: Route;
  mainNav?: MainNavTab;
}

// 탭을 닫으면 잊어도 되는 값이라 sessionStorage에 둔다
const STORAGE_KEY = 'neareast.returnTo';

export const returnToStore = {
  remember(target: ReturnTarget): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(target));
    } catch {
      // 저장이 막히면 로그인 후 메인으로 간다
    }
  },

  // 한 번 꺼내면 지운다 — 다음 로그인 때 엉뚱한 곳으로 가지 않게
  consume(): ReturnTarget | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      return raw === null ? null : (JSON.parse(raw) as ReturnTarget);
    } catch {
      return null;
    }
  },
};
