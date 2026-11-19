import React from 'react';
import './StationInfoPopup.css';

// 열차 종류 타입 — 역을 지나는 열차 목록
type TrainType = string;

interface StationInfoPopupProps {
  stationName: string;
  operationStatus: '운영 중' | '운영 중단';
  description: string;
  trains: TrainType[];
  onClose: () => void;
  onAddToWishlist: (stationName: string) => void;
}

export default function StationInfoPopup({
  stationName,
  operationStatus,
  description,
  trains,
  onClose,
  onAddToWishlist,
}: StationInfoPopupProps) {
  function handleAddToWishlist() {
    onAddToWishlist(stationName);
  }

  return (
    <div className="StationInfoPopup">
      <div className="StationInfoPopup-Content">

        {/* 팝업 상단 */}
        <div className="StationInfoPopup-Header">
          <span className="StationInfoPopup-Title">역 상세정보</span>
          <button className="StationInfoPopup-CloseButton" onClick={onClose} aria-label="닫기">
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
              <h2 className="StationInfoPopup-Name">{stationName}</h2>
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

      {/* 관심 목록에 담기 */}
      <button className="StationInfoPopup-WishlistButton" onClick={handleAddToWishlist}>
        관심 목록에 담기
      </button>
    </div>
  );
}
