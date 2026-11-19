import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { signOut } from '../../api/account';
import { ROUTES, Route, navigateTo } from '../../routes';
import type { AuthUser } from '../../types/neareast';
import './ProfileMenu.css';

interface ProfileMenuProps {
  user: AuthUser;
  isMyPageActive?: boolean;
}

const MENU_LINKS: { label: string; route: Route }[] = [
  { label: '마이페이지', route: ROUTES.myPage },
  { label: '나의 여행 일정', route: ROUTES.myTrips },
  { label: '담아둔 장소·열차', route: ROUTES.myTripsSaved },
];

const MENU_GAP_PX = 8;
// 나가는 애니메이션 길이 — ProfileMenu.css의 퇴장 애니메이션(var(--motion-short))과 같게
const MENU_EXIT_MS = 200;

// 헤더 오른쪽 프로필 동그라미 — 누르면 아래로 작은 메뉴가 펼쳐진다
const ProfileMenu: React.FC<ProfileMenuProps> = ({ user, isMyPageActive = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  // 닫을 때 나가는 애니메이션(Ease in)이 끝날 때까지 메뉴를 남겨 둔다
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  const closeMenu = () => {
    if (!isOpen || isClosing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsOpen(false);
      return;
    }
    setIsClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, MENU_EXIT_MS);
  };

  useEffect(() => () => {
    if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
  }, []);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const initial = user.nickname.slice(0, 1);

  // 여러 헤더가 overflow: hidden이라 메뉴가 잘리므로, body에 띄우고 버튼 바로 아래에 맞춘다
  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect === undefined) return;
    setPosition({ top: rect.bottom + MENU_GAP_PX, right: window.innerWidth - rect.right });
  };

  useLayoutEffect(() => {
    if (isOpen) updatePosition();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const getMenuItems = () =>
      Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    getMenuItems()[0]?.focus();

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) closeMenu();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const items = getMenuItems();
      const currentIndex = items.indexOf(document.activeElement as HTMLElement);
      const step = event.key === 'ArrowDown' ? 1 : -1;
      items[(currentIndex + step + items.length) % items.length]?.focus();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen]);

  const handleGoTo = (route: Route) => {
    closeMenu();
    navigateTo(route);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true); setSignOutError(null);
    try { await signOut(); closeMenu(); }
    catch { setSignOutError('로그아웃하지 못했어요. 연결 상태를 확인하고 다시 시도해 주세요.'); }
    finally { setSigningOut(false); }
  };

  return (
    <>
      <button
        ref={buttonRef}
        className={`ProfileMenu-Button${isOpen || isMyPageActive ? ' ProfileMenu-Button--active' : ''}`}
        onClick={() => (isOpen ? closeMenu() : setIsOpen(true))}
        aria-haspopup="menu"
        aria-expanded={isOpen && !isClosing}
        aria-label={`${user.nickname}님 프로필 메뉴`}
      >
        {initial}
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="ProfileMenu-Panel"
            data-state={isClosing ? 'closing' : 'open'}
            style={{ top: position.top, right: position.right }}
            role="menu"
            aria-label="프로필 메뉴"
          >
            <div className="ProfileMenu-Head">
              <span className="ProfileMenu-HeadAvatar" aria-hidden="true">{initial}</span>
              <div className="ProfileMenu-HeadText">
                <span className="ProfileMenu-Nickname">{user.nickname}</span>
                <span className="ProfileMenu-Email">{user.email}</span>
              </div>
            </div>

            <div className="ProfileMenu-Divider" role="separator" />

            {MENU_LINKS.map(({ label, route }) => (
              <button key={route} className="ProfileMenu-Item" role="menuitem" onClick={() => handleGoTo(route)}>
                {label}
              </button>
            ))}

            <div className="ProfileMenu-Divider" role="separator" />

            <button className="ProfileMenu-Item" role="menuitem" onClick={handleSignOut} disabled={signingOut}>
              {signingOut ? '로그아웃 중…' : '로그아웃'}
            </button>
            {signOutError && <p role="alert">{signOutError}</p>}
          </div>,
          document.body
        )}
    </>
  );
};

export default ProfileMenu;
