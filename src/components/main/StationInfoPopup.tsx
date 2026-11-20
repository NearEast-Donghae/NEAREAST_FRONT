import React, { useCallback, useEffect, useRef, useState } from 'react';
import './StationInfoPopup.css';

// 나가는 애니메이션 길이 — StationInfoPopup.css의 퇴장 애니메이션(var(--motion-short))과 같게
const POPUP_EXIT_MS = 200;

// 열차 종류 타입 — 역을 지나는 열차 목록
type TrainType = string;

interface StationInfoPopupProps {
  stationName: string;
  operationStatus: string;
  description: string;
  trains: TrainType[];
  // 관심 목록(담아둔 장소)에 이미 담겼는지
  isSaved: boolean;
  onClose: () => void;
  onAddToWishlist: (stationName: string) => void;
  children?: React.ReactNode;
  pending?: boolean;
}

export default function StationInfoPopup({
  stationName,
  operationStatus,
  description,
  trains,
  isSaved,
  onClose,
  onAddToWishlist,
  children,
  pending = false,
}: StationInfoPopupProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef(document.activeElement as HTMLElement | null);
  // 닫을 때 나가는 애니메이션(Ease in)을 보여준 뒤 실제로 닫는다
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    setIsClosing(true);
    closeTimer.current = window.setTimeout(onClose, POPUP_EXIT_MS);
  }, [isClosing, onClose]);

  // 열리면 닫기 버튼에 포커스를 두고, Esc로 닫는다
  useEffect(() => {
    closeButtonRef.current?.focus({ preventScroll: true });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
      if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input, select, textarea, [tabindex="0"]');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requestClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      if (previousFocus.current?.isConnected) previousFocus.current.focus({ preventScroll: true });
    };
  }, []);

  function handleAddToWishlist() {
    onAddToWishlist(stationName);
  }

  return (
    // 바깥 어두운 영역을 누르면 닫힌다 (팝업 안을 누른 건 무시)
    <div
      className="StationInfoPopup-Overlay"
      data-state={isClosing ? 'closing' : 'open'}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div
        ref={dialogRef}
        className="StationInfoPopup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="StationInfoPopup-Name"
      >
        <div className="StationInfoPopup-Content">

          {/* 팝업 상단 */}
          <div className="StationInfoPopup-Header">
            <span className="StationInfoPopup-Title">장소 상세정보</span>
            <button
              ref={closeButtonRef}
              className="StationInfoPopup-CloseButton"
              onClick={requestClose}
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          {/* 역 소개 */}
          <div className="StationInfoPopup-Body">
            <div className="StationInfoPopup-Info">
              <div className="StationInfoPopup-NameRow">
                <h2 id="StationInfoPopup-Name" className="StationInfoPopup-Name">{stationName}</h2>
                <span className="StationInfoPopup-Status">{operationStatus}</span>
              </div>
              <p className="StationInfoPopup-Description">{description}</p>
              {trains.length > 0 && <p className="StationInfoPopup-TrainsLabel">이 역을 지나는 열차</p>}
              <div className="StationInfoPopup-TrainList">
                {trains.map((train) => (
                  <span key={train} className="StationInfoPopup-TrainTag">
                    {train}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="StationInfoPopup-Divider" />
          {children}
        </div>

        {/* 관심 목록에 담기 — 담은 역은 여행 계획하기의 역 선택에 자동으로 들어간다 */}
        <button
          className={`StationInfoPopup-WishlistButton${isSaved ? ' StationInfoPopup-WishlistButton--saved' : ''}`}
          onClick={handleAddToWishlist}
          aria-pressed={isSaved}
          disabled={pending}
        >
          {isSaved ? '✓ 관심 목록에 담음 · 다시 누르면 빠져요' : '관심 목록에 담기'}
        </button>
      </div>
    </div>
  );
}
