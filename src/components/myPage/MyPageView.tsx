import React, { ReactNode } from 'react';
import { ROUTES } from '../../routes';
import type { AuthUser } from '../../types/neareast';
import './MyPageView.css';

export type MyPageTab = 'trips' | 'saved';

interface MyPageViewProps {
  user: AuthUser | null;
  activeTab: MyPageTab;
  children: ReactNode;
}

// 탭마다 주소가 달라서 새로고침·뒤로가기해도 보던 탭이 유지된다
const MY_PAGE_TABS: { tab: MyPageTab; label: string; href: string }[] = [
  { tab: 'trips', label: '나의 여행 일정', href: ROUTES.myPage },
  { tab: 'saved', label: '담아둔 장소·열차', href: ROUTES.myPageSaved },
];

const MyPageView: React.FC<MyPageViewProps> = ({ user, activeTab, children }) => {
  return (
    <div className="MyPageView">
      <h1 className="MyPageView-Title">마이페이지</h1>

      {/* 프로필 */}
      <section className="MyPageView-Profile" aria-label="내 정보">
        <span className="MyPageView-Avatar" aria-hidden="true">
          {user === null ? '?' : user.nickname.slice(0, 1)}
        </span>
        {user === null ? (
          <div className="MyPageView-ProfileText">
            <p className="MyPageView-Nickname">로그인하지 않았어요</p>
            <p className="MyPageView-Email">
              지금 저장한 일정은 이 브라우저에만 남아요. 로그인하면 계정으로 관리할 수 있어요.
            </p>
          </div>
        ) : (
          <div className="MyPageView-ProfileText">
            <p className="MyPageView-Nickname">{user.nickname}님</p>
            <p className="MyPageView-Email">{user.email}</p>
          </div>
        )}
        {user === null && (
          <a href={ROUTES.login} className="MyPageView-LoginLink">
            로그인
          </a>
        )}
      </section>

      {/* 탭 */}
      <nav className="MyPageView-Tabs" aria-label="마이페이지 메뉴">
        {MY_PAGE_TABS.map(({ tab, label, href }) => (
          <a
            key={tab}
            href={href}
            className={`MyPageView-Tab${activeTab === tab ? ' MyPageView-Tab--active' : ''}`}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="MyPageView-Content">{children}</div>
    </div>
  );
};

export default MyPageView;
