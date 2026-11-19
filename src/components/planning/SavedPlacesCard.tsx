import React from 'react';
import { TRAIN_PURPOSE_LABELS } from '../../store/savedTrains';
import type { SavedPlace, SavedTrain } from '../../types/neareast';
import './SavedPlacesCard.css';

interface SavedPlacesCardProps {
  places: SavedPlace[];
  trains: SavedTrain[];
  onRemovePlace: (placeId: string) => void;
  onRemoveTrain: (trainId: string) => void;
}

// 다른 화면(AI 여행 플래너, 열차 정보)에서 여행 후보로 담아둔 장소와 열차를 계획하기 화면에 보여준다
const SavedPlacesCard: React.FC<SavedPlacesCardProps> = ({ places, trains, onRemovePlace, onRemoveTrain }) => {
  const isEmpty = places.length === 0 && trains.length === 0;

  return (
    <section className="PlanningCard SavedPlacesCard" aria-label="담아둔 장소와 열차">
      <div className="SavedPlacesCard__header">
        <p className="SavedPlacesCard__title">담아둔 장소·열차</p>
        <span className="SavedPlacesCard__count">{places.length + trains.length}개</span>
      </div>

      {!isEmpty && (
        <p className="SavedPlacesCard__autoNote">여행 계획하기의 역·열차 선택에 자동으로 들어가요.</p>
      )}

      {isEmpty && (
        <p className="SavedPlacesCard__empty">
          AI 여행 플래너의 ‘여행에 담기’, 열차 상세의 ‘탑승할·관찰할 열차로 담기’를 누르면 여기에 모여요.
        </p>
      )}

      {places.length > 0 && (
        <div className="SavedPlacesCard__group">
          <span className="SavedPlacesCard__groupLabel">장소 {places.length}</span>
          <ul className="SavedPlacesCard__list">
            {places.map((place) => (
              <li key={place.id} className="SavedPlacesCard__item">
                <span className="SavedPlacesCard__dot" aria-hidden="true" />
                <div className="SavedPlacesCard__text">
                  <span className="SavedPlacesCard__name">{place.name}</span>
                  <span className="SavedPlacesCard__meta">
                    {place.stationName !== undefined && place.stationName !== place.name
                      ? `${place.stationName} 근처 · `
                      : ''}
                    {place.savedFrom}에서
                  </span>
                </div>
                <button
                  className="SavedPlacesCard__remove"
                  onClick={() => onRemovePlace(place.id)}
                  aria-label={`${place.name} 빼기`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {trains.length > 0 && (
        <div className="SavedPlacesCard__group">
          <span className="SavedPlacesCard__groupLabel">열차 {trains.length}</span>
          <ul className="SavedPlacesCard__list">
            {trains.map((train) => (
              <li key={train.id} className="SavedPlacesCard__item">
                <span className={`SavedPlacesCard__purpose SavedPlacesCard__purpose--${train.purpose}`}>
                  {TRAIN_PURPOSE_LABELS[train.purpose]}
                </span>
                <div className="SavedPlacesCard__text">
                  <span className="SavedPlacesCard__name">{train.trainName}</span>
                  <span className="SavedPlacesCard__meta">{train.route}</span>
                </div>
                <button
                  className="SavedPlacesCard__remove"
                  onClick={() => onRemoveTrain(train.id)}
                  aria-label={`${train.trainName} 빼기`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default SavedPlacesCard;
