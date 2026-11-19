import PlanningLayout from './PlanningLayout';
import './PlanningLayout.css';
import SavedPlacesCard from './SavedPlacesCard';
import type { SavedPlace, SavedTrain } from '../../types/neareast';
import './Step1BasicInfo.css';

interface TravelBasicInfo {
  travelDate: string;
  departureStation: string;
  returnStation: string;
  startTime: string;
  endTime: string;
}

interface Step1BasicInfoProps {
  formData: TravelBasicInfo;
  onFormChange: (updated: Partial<TravelBasicInfo>) => void;
  onNext: () => void;
  savedPlaces: SavedPlace[];
  savedTrains: SavedTrain[];
  onRemoveSavedPlace: (placeId: string) => void;
  onRemoveSavedTrain: (trainId: string) => void;
}

const DONGHAI_STATIONS = [
  '묵호역', '동해역', '정동진역', '망상역', '강릉역',
  '삼척역', '도계역', '태백역',
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, hour) =>
  [`${String(hour).padStart(2, '0')}:00`, `${String(hour).padStart(2, '0')}:30`]
).flat();

// 여행 날짜를 "YYYY.MM.DD (요일)" 형식으로 포맷
const formatDateLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayLabel = days[date.getDay()];
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day} (${dayLabel})`;
};

const Step1BasicInfo = ({ formData, onFormChange, onNext, savedPlaces, savedTrains, onRemoveSavedPlace, onRemoveSavedTrain }: Step1BasicInfoProps) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFormChange({ travelDate: e.target.value });
  };

  return (
    <PlanningLayout
      currentStep={1}
      pageTitle="여행 기본 정보"
      pageSubtitle="날짜, 출발·귀환역, 시간을 정해주세요."
      navigationSlot={
        <button className="PlanningButton PlanningButton--primary" onClick={onNext}>
          다음 →
        </button>
      }
    >
      {/* 기본 입력 카드 */}
      <div className="PlanningCard Step1BasicInfo__mainCard">
        {/* 여행 날짜 */}
        <div className="PlanningField Step1BasicInfo__field">
          <label className="PlanningField__label">여행 날짜</label>
          <div className="PlanningField__select">
            <span className="PlanningField__selectValue">
              {formData.travelDate ? formatDateLabel(formData.travelDate) : '날짜 선택'}
            </span>
            <span className="PlanningField__selectArrow">⌄</span>
            {/* 접근성을 위한 숨김 date input */}
            <input
              type="date"
              value={formData.travelDate}
              onChange={handleDateChange}
              className="Step1BasicInfo__hiddenDateInput"
              aria-label="여행 날짜 선택"
            />
          </div>
        </div>

        {/* 출발역 / 귀환역 */}
        <div className="Step1BasicInfo__row">
          <div className="PlanningField Step1BasicInfo__field--half">
            <label className="PlanningField__label">출발역</label>
            <div className="PlanningField__select">
              <select
                className="PlanningField__selectValue"
                value={formData.departureStation}
                onChange={(e) => onFormChange({ departureStation: e.target.value })}
                aria-label="출발역 선택"
              >
                {DONGHAI_STATIONS.map((station) => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>
              <span className="PlanningField__selectArrow">⌄</span>
            </div>
          </div>

          <div className="PlanningField Step1BasicInfo__field--half">
            <label className="PlanningField__label">귀환역</label>
            <div className="PlanningField__select">
              <select
                className="PlanningField__selectValue"
                value={formData.returnStation}
                onChange={(e) => onFormChange({ returnStation: e.target.value })}
                aria-label="귀환역 선택"
              >
                {DONGHAI_STATIONS.map((station) => (
                  <option key={station} value={station}>{station}</option>
                ))}
              </select>
              <span className="PlanningField__selectArrow">⌄</span>
            </div>
          </div>
        </div>

        {/* 여행 시작 / 종료 시간 */}
        <div className="Step1BasicInfo__row">
          <div className="PlanningField Step1BasicInfo__field--half">
            <label className="PlanningField__label">여행 시작</label>
            <div className="PlanningField__select">
              <select
                className="PlanningField__selectValue"
                value={formData.startTime}
                onChange={(e) => onFormChange({ startTime: e.target.value })}
                aria-label="여행 시작 시간 선택"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <span className="PlanningField__selectArrow">⌄</span>
            </div>
          </div>

          <div className="PlanningField Step1BasicInfo__field--half">
            <label className="PlanningField__label">여행 종료</label>
            <div className="PlanningField__select">
              <select
                className="PlanningField__selectValue"
                value={formData.endTime}
                onChange={(e) => onFormChange({ endTime: e.target.value })}
                aria-label="여행 종료 시간 선택"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              <span className="PlanningField__selectArrow">⌄</span>
            </div>
          </div>
        </div>
      </div>

      {/* 오른쪽 — 안내 카드 + 다른 화면에서 담아둔 장소 */}
      <div className="Step1BasicInfo__sideColumn">
        <div className="PlanningCard Step1BasicInfo__guideCard">
          <p className="Step1BasicInfo__guideTitle">어디서부터 시작하나요?</p>
          <p className="Step1BasicInfo__guideText">
            정해진 시간 안에서 방문할 역과 열차를 골라 일정을 만들어요.
          </p>
        </div>
        <SavedPlacesCard
          places={savedPlaces}
          trains={savedTrains}
          onRemovePlace={onRemoveSavedPlace}
          onRemoveTrain={onRemoveSavedTrain}
        />
      </div>
    </PlanningLayout>
  );
};

export default Step1BasicInfo;
export type { TravelBasicInfo };
