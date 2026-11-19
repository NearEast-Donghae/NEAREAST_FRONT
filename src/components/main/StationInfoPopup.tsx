import React, { useEffect, useRef } from 'react';
import './StationInfoPopup.css';

// 열차 종류 타입 — 역을 지나는 열차 목록
type TrainType = string;

interface StationInfoPopupProps {
  stationName: string;
  operationStatus: '운영 중' | '운영 중단';
  description: string;
  trains: TrainType[];
  // 관심 목록(담아둔 장소)에 이미 담겼는지
  isSaved: boolean;
  onClose: () => void;
  onAddToWishlist: (stationName: string) => void;
}

export default function StationInfoPopup({
  stationName,
  operationStatus,
  description,
  trains,
  isSaved,
  onClose,
  onAddToWishlist,
}: StationInfoPopupProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 열리면 닫기 버튼에 포커스를 두고, Esc로 닫는다
  useEffect(() => {
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  function handleAddToWishlist() {
    onAddToWishlist(stationName);
  }

  return (
    // 바깥 어두운 영역을 누르면 닫힌다 (팝업 안을 누른 건 무시)
    <div
      className="StationInfoPopup-Overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="StationInfoPopup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="StationInfoPopup-Name"
      >
        <div className="StationInfoPopup-Content">

          {/* 팝업 상단 */}
          <div className="StationInfoPopup-Header">
            <span className="StationInfoPopup-Title">역 상세정보</span>
            <button
              ref={closeButtonRef}
              className="StationInfoPopup-CloseButton"
              onClick={onClose}
              aria-label="닫기"
            >
              ×
            </button>
          </div>

          {/* 역 소개 */}
          <div className="StationInfoPopup-Body">
            <div className="StationInfoPopup-Photo">
              <span className="StationInfoPopup-PhotoPlaceholder">역 사진</span>
            </div>
            <div className="StationInfoPopup-Info">
              <div className="StationInfoPopup-NameRow">
                <h2 id="StationInfoPopup-Name" className="StationInfoPopup-Name">{stationName}</h2>
                <span className="StationInfoPopup-Status">{operationStatus}</span>
              </div>
              <p className="StationInfoPopup-Description">{description}</p>
              <p className="StationInfoPopup-TrainsLabel">이 역을 지나는 열차</p>
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
        </div>

        {/* 관심 목록에 담기 — 담은 역은 여행 계획하기의 역 선택에 자동으로 들어간다 */}
        <button
          className={`StationInfoPopup-WishlistButton${isSaved ? ' StationInfoPopup-WishlistButton--saved' : ''}`}
          onClick={handleAddToWishlist}
          aria-pressed={isSaved}
        >
          {isSaved ? '✓ 관심 목록에 담음 · 다시 누르면 빠져요' : '관심 목록에 담기'}
        </button>
      </div>
    </div>
  );
}
