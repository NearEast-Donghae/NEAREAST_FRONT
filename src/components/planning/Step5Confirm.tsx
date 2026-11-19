import PlanningLayout from './PlanningLayout';
import './PlanningLayout.css';
import './Step5Confirm.css';

type FinalItemType = 'station' | 'train' | 'activity';

interface FinalScheduleItem {
  id: string;
  time: string;
  label: string;
  type: FinalItemType;
}

interface TravelSummary {
  date: string;
  startTime: string;
  endTime: string;
  visitedStations: string[];
  visitedTrains: string[];
  activities: string[];
}

interface Step5ConfirmProps {
  scheduleItems: FinalScheduleItem[];
  summary: TravelSummary;
  onEditItem: (itemId: string) => void;
  onAddItem: () => void;
  onPrev: () => void;
  onSave: () => void;
}

// 일정 타입별 아이콘
const FINAL_ICON: Record<FinalItemType, string> = {
  station:  '▣',
  train:    '◉',
  activity: '♧',
};

const Step5Confirm = ({
  scheduleItems,
  summary,
  onEditItem,
  onAddItem,
  onPrev,
  onSave,
}: Step5ConfirmProps) => {
  return (
    <PlanningLayout
      currentStep={5}
      pageTitle="최종 여행 일정"
      pageSubtitle="일정별 수정 버튼으로 내용을 바꾸고, 최종 계획을 저장하세요."
      navigationSlot={
        <>
          <button className="PlanningButton PlanningButton--secondary" onClick={onPrev}>
            ← 이전
          </button>
          <button className="PlanningButton PlanningButton--primary" onClick={onSave}>
            여행 계획 저장 ✓
          </button>
        </>
      }
    >
      {/* 최종 일정 타임라인 */}
      <div className="Step5Confirm__timelineArea">
        <div className="Step5Confirm__timelineHeader">
          <span className="Step5Confirm__timelineTitle">최종 여행 일정</span>
          <button className="Step5Confirm__addButton" onClick={onAddItem}>
            + 일정 추가
          </button>
        </div>

        <ul className="Step5Confirm__timeline" aria-label="최종 여행 일정">
          {scheduleItems.map((item) => (
            <li key={item.id} className="Step5Confirm__timelineItem">
              <span className="Step5Confirm__timelineDot" aria-hidden="true">○</span>
              <span className="Step5Confirm__timelineTime">{item.time}</span>
              <span className="Step5Confirm__timelineIcon" aria-hidden="true">
                {FINAL_ICON[item.type]}
              </span>
              <span className="Step5Confirm__timelineLabel">{item.label}</span>
              <button
                className="Step5Confirm__editButton"
                onClick={() => onEditItem(item.id)}
                aria-label={`${item.label} 수정`}
              >
                ✎
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* 지도 + 여행 요약 카드 */}
      <div className="Step5Confirm__sidePanel">
        {/* 이동 경로 지도 */}
        <div className="PlanningCard Step5Confirm__mapCard">
          <p className="Step5Confirm__mapTitle">여행 동선</p>
          <div className="Step5Confirm__mapPlaceholder" aria-label="여행 동선 지도">
            <span className="Step5Confirm__mapPlaceholderText">
              {summary.visitedStations.join(' → ')}
            </span>
          </div>
        </div>

        {/* 여행 요약 */}
        <div className="PlanningCard Step5Confirm__summaryCard">
          <p className="Step5Confirm__summaryTitle">여행 요약</p>

          <dl className="Step5Confirm__summaryList">
            <div className="Step5Confirm__summaryRow">
              <dt>날짜</dt>
              <dd>{summary.date}</dd>
            </div>
            <div className="Step5Confirm__summaryRow">
              <dt>시간</dt>
              <dd>{summary.startTime} – {summary.endTime}</dd>
            </div>
            <div className="Step5Confirm__summaryRow">
              <dt>방문 역</dt>
              <dd>{summary.visitedStations.join(' · ')}</dd>
            </div>
            <div className="Step5Confirm__summaryRow">
              <dt>방문할 열차</dt>
              <dd>{summary.visitedTrains.join(' · ') || '없음'}</dd>
            </div>
            {summary.activities.length > 0 && (
              <div className="Step5Confirm__summaryRow">
                <dt>추가 활동</dt>
                <dd>{summary.activities.join(' · ')}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </PlanningLayout>
  );
};

export default Step5Confirm;
export type { FinalScheduleItem, TravelSummary };
