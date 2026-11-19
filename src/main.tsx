import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import MainPage from './pages/MainPage';
import PlanningPage from './pages/PlanningPage';
import PlanningHeader from './components/layout/PlanningHeader';
import type { MainNavTab } from './components/main/MapView';
import './index.css';

// 스크롤바가 생기고 사라질 때도 폭이 바뀌므로 resize 이벤트 대신 ResizeObserver 사용
new ResizeObserver(() => {
  document.documentElement.style.setProperty(
    '--page-width',
    `${document.documentElement.clientWidth}px`
  );
}).observe(document.documentElement);

// 라우터 라이브러리 없이 해시(#/planning)로 페이지 전환 — 브라우저 뒤로가기도 동작
function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [mainNav, setMainNav] = useState<MainNavTab>('철도 지도');

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handlePlanningNavigate = (tab: MainNavTab) => {
    if (tab === '여행 계획하기') return;
    setMainNav(tab);
    window.location.hash = '';
  };

  if (hash === '#/planning') {
    return (
      <>
        <PlanningHeader onNavigate={handlePlanningNavigate} />
        <PlanningPage />
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
