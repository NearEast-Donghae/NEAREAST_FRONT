import { useState } from 'react';
import PlanningLayout from './PlanningLayout';
import './PlanningLayout.css';
import './Step4FreeTime.css';

type ActivityCategory = '전체' | '산책' | '식사' | '카페';

interface ActivitySuggestion {
  id: string;
  name: string;
  durationMinutes: number;
  category: ActivityCategory;
}

interface FreeTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  nearestStation: string;
  suggestions: ActivitySuggestion[];
}

interface Step4FreeTimeProps {
  freeTimeSlots: FreeTimeSlot[];
  selectedActivities: string[];
  onActivityToggle: (activityId: string) => void;
  onPrev: () => void;
  onConfirm: () => void;
}

const CATEGORIES: ActivityCategory[] = ['전체', '산책', '식사', '카페'];

const Step4FreeTime = ({
  freeTimeSlots,
  selectedActivities,
  onActivityToggle,
  onPrev,
  onConfirm,
}: Step4FreeTimeProps) => {
  const [activeCategory, setActiveCategory] = useState<ActivityCategory>('전체');

  const filterByCategory = (suggestions: ActivitySuggestion[]) => {
    if (activeCategory === '전체') return suggestions;
    return suggestions.filter((s) => s.category === activeCategory);
  };

  return (
    <PlanningLayout
      currentStep={4}
      pageTitle="빈 시간에 무엇을 할까요?"
      pageSubtitle="일정의 빈 시간에 갈 수 있는 장소를 선택하세요."
      navigationSlot={
        <>
          <button className="PlanningButton PlanningButton--secondary" onClick={onPrev}>
            ← 일정으로
          </button>
          <button className="PlanningButton PlanningButton--primary" onClick={onConfirm}>
            선택한 활동 추가 →
          </button>
        </>
      }
    >
      {/* 추천 목록 영역 */}
      <div className="Step4FreeTime__listArea">
        {freeTimeSlots.map((slot) => {
          const filtered = filterByCategory(slot.suggestions);
          return (
            <div key={slot.id} className="Step4FreeTime__slotSection">
              {/* 빈 시간 헤더 */}
              <p className="Step4FreeTime__slotTitle">
                {slot.startTime}–{slot.endTime} · {slot.nearestStation} 근처
              </p>

              {/* 카테고리 필터 */}
              <div className="Step4FreeTime__categoryFilter" role="group" aria-label="활동 분류 필터">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    className={`Step4FreeTime__categoryTag ${
                      activeCategory === category ? 'Step4FreeTime__categoryTag--active' : ''
                    }`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {/* 추천 활동 목록 */}
              <ul className="Step4FreeTime__activityList">
                {filtered.map((activity) => {
                  const isSelected = selectedActivities.includes(activity.id);
                  return (
                    <li key={activity.id} className="Step4FreeTime__activityItem">
                      <label className="Step4FreeTime__activityLabel">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onActivityToggle(activity.id)}
                          className="Step4FreeTime__checkbox"
                        />
                        <span className="Step4FreeTime__activityName">
                          {activity.name}&nbsp; · &nbsp;약 {activity.durationMinutes}분
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      {/* 안내 카드 */}
      <div className="PlanningCard Step4FreeTime__guideCard">
        <p className="Step4FreeTime__guideTitle">기존 일정은 유지돼요.</p>
        <p className="Step4FreeTime__guideText">
          선택한 장소를 추가하면 이동 및 체류 시간을 다시 계산합니다.
        </p>
      </div>
    </PlanningLayout>
  );
};

export default Step4FreeTime;
export type { FreeTimeSlot, ActivitySuggestion, ActivityCategory };
