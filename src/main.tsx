import { StrictMode, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import MainPage from './pages/MainPage';
import PlanningPage from './pages/PlanningPage';
import MyPage from './pages/MyPage';
import TripsPage from './pages/TripsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AppHeader from './components/layout/AppHeader';
import LoginGate from './components/layout/LoginGate';
import SavedStatus from './components/layout/SavedStatus';
import type { MainNavTab } from './components/main/MapView';
import { LEGACY_MY_PAGE_SAVED_HASH, ROUTES, navigateTo } from './routes';
import { returnToStore } from './store/returnTo';
import { authStore } from './store/auth';
import { IS_MOCK_AUTH, restoreSession } from './api/auth';
import './index.css';
import './components/integration.css';
import './styles/layout.css';
import './styles/mobile.css'; // 스마트폰 화면 — 맨 마지막에 불러와야 다른 CSS를 덮는다

let sessionRefreshId = 0;
function refreshSession() {
  const refreshId = ++sessionRefreshId;
  return restoreSession()
    .then((user) => {
      if (refreshId === sessionRefreshId && user !== undefined) authStore.setUser(user);
    })
    .catch(() => { if (refreshId === sessionRefreshId) authStore.setUser(null); });
}
const sessionRestored = refreshSession();
window.addEventListener('neareast:restore-session', () => { void refreshSession(); });
window.addEventListener('neareast:session-expired', () => {
  sessionRefreshId += 1;
  authStore.setUser(null);
});

const MAIN_ROUTES = {
  '철도 지도': '#/map', '열차 정보': '#/trains', 'AI 여행 플래너': '#/chat',
  '여행 계획하기': ROUTES.planning, '나의 여행 일정': ROUTES.myTrips,
} as const;
function activeTab(hash: string): MainNavTab | undefined {
  if (hash === ROUTES.login || hash === ROUTES.signup || hash === ROUTES.myPage) return undefined;
  if (hash.startsWith('#/trains')) return '열차 정보';
  if (hash.split('?')[0] === '#/chat') return 'AI 여행 플래너';
  if (hash === ROUTES.planning) return '여행 계획하기';
  if (hash.startsWith(ROUTES.myTrips) || hash === LEGACY_MY_PAGE_SAVED_HASH) return '나의 여행 일정';
  return '철도 지도';
}
function isMapRoute(hash: string) {
  return !hash || hash === '#/map' || hash.startsWith('#/places/');
}

function App() {
  const [sessionReady, setSessionReady] = useState(IS_MOCK_AUTH);
  const [hash, setHash] = useState(window.location.hash);
  const previousHash = useRef(hash);
  useEffect(() => { void sessionRestored.finally(() => setSessionReady(true)); }, []);
  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
  useLayoutEffect(() => {
    if (!(isMapRoute(previousHash.current) && isMapRoute(hash))) window.scrollTo(0, 0);
    previousHash.current = hash;
  }, [hash]);

  const handleNavigate = (tab: MainNavTab) => navigateTo(MAIN_ROUTES[tab]);
  const handleAuthenticated = () => {
    sessionRefreshId += 1;
    const target = returnToStore.consume();
    navigateTo(target?.mainNav ? MAIN_ROUTES[target.mainNav] : target?.route ?? '#/map');
  };

  let content: ReactNode;
  if (!sessionReady) {
    content = <p className="AppSession-Status" role="status">로그인 상태를 확인하고 있어요…</p>;
  } else if (hash === ROUTES.planning) {
    content = <LoginGate serviceName="여행 계획하기" returnTo={{ route: ROUTES.planning }}><PlanningPage /></LoginGate>;
  } else if (hash === ROUTES.login || hash === ROUTES.signup) {
    content = hash === ROUTES.login ? <LoginPage onAuthenticated={handleAuthenticated} /> : <SignupPage onAuthenticated={handleAuthenticated} />;
  } else if (hash === ROUTES.myTrips || hash === ROUTES.myTripsSaved || hash === LEGACY_MY_PAGE_SAVED_HASH) {
    content = <LoginGate serviceName="나의 여행 일정" returnTo={{ route: hash === ROUTES.myTrips ? ROUTES.myTrips : ROUTES.myTripsSaved }}>
      <TripsPage activeTab={hash === ROUTES.myTrips ? 'trips' : 'saved'} onNavigate={handleNavigate} />
    </LoginGate>;
  } else if (hash === ROUTES.myPage) {
    content = <LoginGate serviceName="마이페이지" returnTo={{ route: ROUTES.myPage }}><MyPage /></LoginGate>;
  } else {
    content = <MainPage routeHash={hash} />;
  }

  return <>
    <AppHeader activeNav={activeTab(hash)} onNavigate={handleNavigate}
      isMyPageActive={hash === ROUTES.myPage} isAuthPageActive={hash === ROUTES.login || hash === ROUTES.signup} />
    {content}
  </>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /><SavedStatus /></StrictMode>
);
