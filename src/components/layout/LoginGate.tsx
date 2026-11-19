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

// 다른 계정으로 전환하면 보호된 화면의 입력·결과 상태도 새로 만든다.
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
        key={user?.id ?? user?.email ?? 'anonymous'}
        ref={contentRef}
        className={isLocked ? 'LoginGate-Content LoginGate-Content--locked' : 'LoginGate-Content'}
        aria-hidden={isLocked ? true : undefined}
      >
        {!isLocked && children}
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
