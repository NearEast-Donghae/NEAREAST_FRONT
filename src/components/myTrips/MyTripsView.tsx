import React from 'react';
import type { SavedTrip, SavedTripSource } from '../../types/neareast';
import './MyTripsView.css';

interface MyTripsViewProps {
  trips: SavedTrip[];
  selectedTripId: string | null;
  isLoading: boolean;
  onSelectTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onStartPlanning: () => void;
  onStartAiPlanner: () => void;
}

const SOURCE_LABELS: Record<SavedTripSource, string> = {
  planner: '직접 계획',
  ai: 'AI 플래너',
};

function formatSavedAt(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} 저장`;
}

function joinOrDash(items: string[]): string {
  return items.length === 0 ? '—' : items.join(' · ');
}

const MyTripsView: React.FC<MyTripsViewProps> = ({
  trips,
  selectedTripId,
  isLoading,
  onSelectTrip,
  onDeleteTrip,
  onStartPlanning,
  onStartAiPlanner,
}) => {
  const selectedTrip = trips.find((trip) => trip.id === selectedTripId) ?? null;

  return (
    <div className="MyTripsView">
      <p className="MyTripsView-Subtitle">저장한 여행 계획을 다시 확인하고 관리하세요.</p>

      {isLoading && (
        <p className="MyTripsView-Status motion-loading-label" role="status">
          <span className="motion-spinner" aria-hidden="true" />
          불러오는 중…
        </p>
      )}

      {!isLoading && trips.length === 0 && (
        <section className="MyTripsView-Empty">
          <p className="MyTripsView-EmptyTitle">아직 저장한 여행이 없어요.</p>
          <p className="MyTripsView-EmptyText">
            여행 계획하기나 AI 여행 플래너에서 일정을 만들고 ‘여행 계획 저장’을 눌러 보세요.
          </p>
          <div className="MyTripsView-EmptyActions">
            <button className="MyTripsView-Button MyTripsView-Button--primary" onClick={onStartPlanning}>
              여행 계획하기
            </button>
            <button className="MyTripsView-Button" onClick={onStartAiPlanner}>
              AI 여행 플래너
            </button>
          </div>
        </section>
      )}

      {!isLoading && trips.length > 0 && (
        <div className="MyTripsView-Body">
          <ul className="MyTripsView-List" aria-label="저장한 여행 목록">
            {trips.map((trip) => {
              const isSelected = trip.id === selectedTripId;
              return (
                <li key={trip.id}>
                  <button
                    className={`MyTripsView-Card${isSelected ? ' MyTripsView-Card--selected' : ''}`}
                    onClick={() => onSelectTrip(trip.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="MyTripsView-CardBadge">{SOURCE_LABELS[trip.source]}</span>
                    <span className="MyTripsView-CardTitle">{trip.title}</span>
                    <span className="MyTripsView-CardMeta">
                      {trip.travelDateLabel} · {trip.timeRange}
                    </span>
                    <span className="MyTripsView-CardSavedAt">{formatSavedAt(trip.createdAt)}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selectedTrip !== null && (
            <article className="MyTripsView-Detail">
              <div className="MyTripsView-DetailHeader">
                <div>
                  <span className="MyTripsView-DetailBadge">{SOURCE_LABELS[selectedTrip.source]}</span>
                  <h2 className="MyTripsView-DetailTitle">{selectedTrip.title}</h2>
                  <p className="MyTripsView-DetailDate">
                    {selectedTrip.travelDateLabel} · {selectedTrip.timeRange}
                  </p>
                </div>
                <button
                  className="MyTripsView-Button MyTripsView-Button--danger"
                  onClick={() => onDeleteTrip(selectedTrip.id)}
                >
                  삭제
                </button>
              </div>

              <dl className="MyTripsView-Summary">
                <div className="MyTripsView-SummaryRow">
                  <dt>방문 역</dt>
                  <dd>{joinOrDash(selectedTrip.stations)}</dd>
                </div>
                <div className="MyTripsView-SummaryRow">
                  <dt>열차</dt>
                  <dd>{joinOrDash(selectedTrip.trains)}</dd>
                </div>
                <div className="MyTripsView-SummaryRow">
                  <dt>추가 활동</dt>
                  <dd>{joinOrDash(selectedTrip.activities)}</dd>
                </div>
              </dl>

              <h3 className="MyTripsView-TimelineTitle">일정</h3>
              {selectedTrip.timeline.length === 0 ? (
                <p className="MyTripsView-Status">저장된 세부 일정이 없어요.</p>
              ) : (
                <ol className="MyTripsView-Timeline">
                  {selectedTrip.timeline.map((row, index) => (
                    <li key={`${row.time}-${index}`} className="MyTripsView-TimelineRow">
                      <span className="MyTripsView-TimelineTime">{row.time}</span>
                      <span className="MyTripsView-TimelineIcon" aria-hidden="true">{row.icon}</span>
                      <span className="MyTripsView-TimelineText">{row.description}</span>
                    </li>
                  ))}
                </ol>
              )}
            </article>
          )}
        </div>
      )}
    </div>
  );
};

export type { MyTripsViewProps };
export default MyTripsView;
