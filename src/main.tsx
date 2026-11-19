import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MainPage from './pages/MainPage';
import PlanningPage from './pages/PlanningPage';
import MyPage from './pages/MyPage';
import TripsPage from './pages/TripsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AppHeader from './components/layout/AppHeader';
import LoginGate from './components/layout/LoginGate';
import type { MainNavTab } from './components/main/MapView';
import { LEGACY_MY_PAGE_SAVED_HASH, ROUTES, navigateTo } from './routes';
import { returnToStore } from './store/returnTo';
import './index.css';

// 스크롤바가 생기고 사라질 때도 폭이 바뀌므로 resize 이벤트 대신 ResizeObserver 사용
new ResizeObserver(() => {
  document.documentElement.style.setProperty(
    '--page-width',
    `${document.documentElement.clientWidth}px`
  );
}).observe(document.documentElement);

// 라우터 라이브러리 없이 해시(routes.ts)로 페이지 전환 — 브라우저 뒤로가기도 동작
function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [mainNav, setMainNav] = useState<MainNavTab>('철도 지도');

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
      // 해시만 바뀌면 브라우저가 스크롤을 그대로 둬서, 새 페이지가 중간부터 보이지 않게
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 메인 뷰 밖(계획하기·마이페이지·로그인)의 헤더에서 탭을 눌렀을 때
  const handleNavigate = (tab: MainNavTab) => {
    if (tab === '여행 계획하기') {
      navigateTo(ROUTES.planning);
      return;
    }
    if (tab === '나의 여행 일정') {
      navigateTo(ROUTES.myTrips);
      return;
    }
    setMainNav(tab);
    navigateTo(ROUTES.main);
  };

  // 로그인·가입에 성공하면, 로그인 안내를 띄웠던 화면(LoginGate가 기억해 둔 곳)으로 돌려보낸다
  const handleAuthenticated = () => {
    const target = returnToStore.consume();
    if (target?.mainNav !== undefined) setMainNav(target.mainNav);
    navigateTo(target?.route ?? ROUTES.main);
  };

  if (hash === ROUTES.planning) {
    return (
      <>
        <AppHeader activeNav="여행 계획하기" onNavigate={handleNavigate} />
        <LoginGate serviceName="여행 계획하기" returnTo={{ route: ROUTES.planning }}>
          <PlanningPage />
        </LoginGate>
      </>
    );
  }

  if (hash === ROUTES.login || hash === ROUTES.signup) {
    return (
      <>
        <AppHeader isAuthPageActive onNavigate={handleNavigate} />
        {hash === ROUTES.login ? (
          <LoginPage onAuthenticated={handleAuthenticated} />
        ) : (
          <SignupPage onAuthenticated={handleAuthenticated} />
        )}
      </>
    );
  }

  if (hash === ROUTES.myTrips || hash === ROUTES.myTripsSaved || hash === LEGACY_MY_PAGE_SAVED_HASH) {
    return (
      <>
        <AppHeader activeNav="나의 여행 일정" onNavigate={handleNavigate} />
        <TripsPage activeTab={hash === ROUTES.myTrips ? 'trips' : 'saved'} onNavigate={handleNavigate} />
      </>
    );
  }

  if (hash === ROUTES.myPage) {
    return (
      <>
        <AppHeader isMyPageActive onNavigate={handleNavigate} />
        <LoginGate serviceName="마이페이지" returnTo={{ route: ROUTES.myPage }}>
          <MyPage />
        </LoginGate>
      </>
    );
  }

  // key: 로그인 후 복귀처럼 주소 변경(hashchange)이 탭 지정(setMainNav)보다 먼저 반영되면
  // 메인이 이전 탭으로 먼저 열려 버린다. 탭 값이 바뀌면 그 탭으로 다시 열리게 한다.
  return <MainPage key={mainNav} initialNav={mainNav} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
