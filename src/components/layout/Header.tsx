import React from 'react';
import './Header.css';

export type NavItem = '철도 지도' | '열차 정보' | 'AI 여행 플래너' | '나의 여행 일정';

interface HeaderProps {
  activeNav: NavItem;
  savedItemCount?: number;
  isLoggedIn?: boolean;
  onNavClick: (item: NavItem) => void;
}

const NAV_ITEMS: NavItem[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '나의 여행 일정'];

const Header: React.FC<HeaderProps> = ({
  activeNav,
  savedItemCount = 0,
  isLoggedIn = false,
  onNavClick,
}) => {
  return (
    <header className="header">
      <div className="header__inner">
        <div className="header__brand">
          <span className="header__logo-icon" aria-hidden="true">🚃</span>
          <span className="header__logo-text">NEAREAST</span>
        </div>

        <div className="header__divider" aria-hidden="true" />

        <nav className="header__nav" aria-label="주요 메뉴">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              className={`header__nav-item ${activeNav === item ? 'header__nav-item--active' : ''}`}
              onClick={() => onNavClick(item)}
              aria-current={activeNav === item ? 'page' : undefined}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="header__actions">
          {savedItemCount > 0 && (
            <button className="header__saved-badge" aria-label={`담은 역·열차 ${savedItemCount}개`}>
              <span className="header__saved-icon" aria-hidden="true">🔖</span>
              담은 역·열차
              <span className="header__saved-count">{savedItemCount}</span>
            </button>
          )}

          {isLoggedIn && (
            <button className="header__user-icon" aria-label="내 계정">
              <span aria-hidden="true">👤</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
