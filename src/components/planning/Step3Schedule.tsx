import PlanningLayout from './PlanningLayout';
import './PlanningLayout.css';
import './Step3Schedule.css';

type ScheduleItemType = 'station' | 'train' | 'activity' | 'free';

interface ScheduleItem {
  id: string;
  time: string;
  label: string;
  type: ScheduleItemType;
  // 빈 시간인 경우 endTime과 durationLabel 존재
  endTime?: string;
  durationLabel?: string;
}

interface Step3ScheduleProps {
  scheduleItems: ScheduleItem[];
  selectedStations: string[];
  selectedTrains: string[];
  onAddActivity: (freeSlotId: string) => void;
  onAddItem: () => void;
  onPrev: () => void;
  onNext: () => void;
}

// 일정 타입별 아이콘
const SCHEDULE_ICON: Record<ScheduleItemType, string> = {
  station:  '▣',
  train:    '◉',
  activity: '♧',
  free:     '●',
};

const Step3Schedule = ({
  scheduleItems,
  selectedStations,
  selectedTrains,
  onAddActivity,
  onAddItem,
  onPrev,
  onNext,
}: Step3ScheduleProps) => {
  return (
    <PlanningLayout
      currentStep={3}
      pageTitle="여행 일정을 구성해요."
      pageSubtitle="방문할 역과 열차의 시간을 확인하고 빈 시간에 활동을 추가하세요."
      navigationSlot={
        <>
          <button className="PlanningButton PlanningButton--secondary" onClick={onPrev}>
            ← 이전
          </button>
          <button className="PlanningButton PlanningButton--primary" onClick={onNext}>
            빈 시간 채우러 가기 →
          </button>
        </>
      }
    >
      {/* 시간표 영역 */}
      <div className="Step3Schedule__timelineArea">
        <div className="Step3Schedule__timelineHeader">
          <span className="Step3Schedule__timelineTitle">여행 일정을 구성해요.</span>
          <button className="Step3Schedule__addButton" onClick={onAddItem}>
            + 일정 추가
          </button>
        </div>

        <ul className="Step3Schedule__timeline" aria-label="여행 일정">
          {scheduleItems.map((item) => {
            const isFreeSlot = item.type === 'free';
            return (
              <li
                key={item.id}
                className={`Step3Schedule__timelineItem ${
                  isFreeSlot ? 'Step3Schedule__timelineItem--free' : ''
                }`}
              >
                <span className="Step3Schedule__timelineDot" aria-hidden="true">
                  {isFreeSlot ? '●' : '○'}
                </span>
                <span className="Step3Schedule__timelineTime">
                  {item.time}{item.endTime ? `–${item.endTime}` : ''}
                </span>
                <span className="Step3Schedule__timelineIcon" aria-hidden="true">
                  {SCHEDULE_ICON[item.type]}
                </span>
                <span className="Step3Schedule__timelineLabel">
                  {isFreeSlot ? `↳  ${item.label}` : item.label}
                </span>

                {/* 빈 시간에만 활동 추가 버튼 표시 */}
                {isFreeSlot && (
                  <button
                    className="Step3Schedule__activityButton"
                    onClick={() => onAddActivity(item.id)}
                  >
                    + 활동 추가
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* 선택한 철도 자원 카드 */}
      <div className="PlanningCard Step3Schedule__resourceCard">
        <p className="Step3Schedule__resourceTitle">선택한 철도 자원</p>

        <p className="Step3Schedule__resourceCategory">
          방문할 역 {selectedStations.length}곳
        </p>
        <p className="Step3Schedule__resourceItems">
          {selectedStations.join(', ') || '없음'}
        </p>

        <p className="Step3Schedule__resourceCategory">
          방문할 열차 {selectedTrains.length}개
        </p>
        <p className="Step3Schedule__resourceItems">
          {selectedTrains.join(', ') || '없음'}
        </p>

        <p className="Step3Schedule__resourceHint">
          파란 빈 시간 항목을 눌러 활동을 추가할 수 있어요.
        </p>
      </div>
    </PlanningLayout>
  );
};

export default Step3Schedule;
export type { ScheduleItem, ScheduleItemType };
