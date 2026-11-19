import React, { ReactNode, useEffect, useRef } from 'react';
import { useAuthUser } from '../../hooks/useAuthUser';
import { returnToStore, ReturnTarget } from '../../store/returnTo';
import { ROUTES, navigateTo } from '../../routes';
import './LoginGate.css';

interface LoginGateProps {
  serviceName: string; // 안내 문구에 들어갈 서비스 이름 (예: 'AI 여행 플래너')
  returnTo: ReturnTarget; // 로그인 후 돌아올 곳
  children: ReactNode;
}

// 로그인해야 쓸 수 있는 화면을 감싼다 — 로그인 전이면 내용을 흐리게 막고 로그인 안내를 띄운다.
// 헤더는 감싸지 않아서 다른 탭으로는 자유롭게 이동할 수 있다.
const LoginGate: React.FC<LoginGateProps> = ({ serviceName, returnTo, children }) => {
  const user = useAuthUser();
  const isLocked = user === null;
  const contentRef = useRef<HTMLDivElement>(null);
  const loginButtonRef = useRef<HTMLButtonElement>(null);

  // 흐린 내용은 키보드(Tab)로도 닿지 않게 inert로 막는다 — React 18은 inert 속성을 직접 받지 못해서 DOM에 건다
  useEffect(() => {
    const content = contentRef.current;
    if (content === null) return;
    if (isLocked) {
      content.setAttribute('inert', '');
      loginButtonRef.current?.focus();
    } else {
      content.removeAttribute('inert');
    }
  }, [isLocked]);

  const handleGoTo = (route: typeof ROUTES.login | typeof ROUTES.signup) => {
    returnToStore.remember(returnTo);
    navigateTo(route);
  };

  return (
    <>
      <div
        ref={contentRef}
        className={isLocked ? 'LoginGate-Content LoginGate-Content--locked' : 'LoginGate-Content'}
        aria-hidden={isLocked ? true : undefined}
      >
        {children}
      </div>

      {isLocked && (
        <div className="LoginGate-Dialog" role="dialog" aria-labelledby="LoginGate-Title" aria-describedby="LoginGate-Text">
          <span className="LoginGate-Icon" aria-hidden="true">🔒</span>
          <h2 id="LoginGate-Title" className="LoginGate-Title">로그인이 필요한 서비스예요</h2>
          <p id="LoginGate-Text" className="LoginGate-Text">
            {serviceName}는 로그인 후 이용할 수 있어요.
            <br />
            로그인하면 지금 화면으로 바로 돌아와요.
          </p>
          <div className="LoginGate-Actions">
            <button
              ref={loginButtonRef}
              className="LoginGate-Button LoginGate-Button--primary"
              onClick={() => handleGoTo(ROUTES.login)}
            >
              로그인
            </button>
            <button className="LoginGate-Button" onClick={() => handleGoTo(ROUTES.signup)}>
              회원가입
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LoginGate;
