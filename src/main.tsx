import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MainPage from './pages/MainPage';
import PlanningPage from './pages/PlanningPage';
import MyTripsPage from './pages/MyTripsPage';
import AppHeader from './components/layout/AppHeader';
import type { MainNavTab } from './components/main/MapView';
import { ROUTES, navigateTo } from './routes';
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

  // 메인 뷰 밖(계획하기·나의 여행 일정)의 헤더에서 탭을 눌렀을 때
  const handleNavigate = (tab: MainNavTab) => {
    if (tab === '여행 계획하기') {
      navigateTo(ROUTES.planning);
      return;
    }
    setMainNav(tab);
    navigateTo(ROUTES.main);
  };

  if (hash === ROUTES.planning) {
    return (
      <>
        <AppHeader activeNav="여행 계획하기" onNavigate={handleNavigate} />
        <PlanningPage />
      </>
    );
  }

  if (hash === ROUTES.myTrips) {
    return (
      <>
        <AppHeader isMyTripsActive onNavigate={handleNavigate} />
        <MyTripsPage onNavigate={handleNavigate} />
      </>
    );
  }

  return <MainPage initialNav={mainNav} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
