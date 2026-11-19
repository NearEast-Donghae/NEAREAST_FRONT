import { useState } from 'react';
import PlanningLayout from './PlanningLayout';
import CheckboxMark from '../common/CheckboxMark';
import './PlanningLayout.css';
import './Step2Stations.css';

interface StationItem {
  name: string;
  status: '운영역' | '임시중단' | '폐역';
}

const ALL_STATIONS: StationItem[] = [
  { name: '묵호역',    status: '운영역' },
  { name: '정동진역',  status: '운영역' },
  { name: '망상역',    status: '운영역' },
  { name: '동해역',    status: '운영역' },
  { name: '강릉역',    status: '운영역' },
  { name: '삼척역',    status: '운영역' },
  { name: '도계역',    status: '운영역' },
  { name: '태백역',    status: '운영역' },
];

type ActiveTab = 'stations' | 'trains';

interface Step2StationsProps {
  selectedStations: string[];
  selectedTrains: string[];
  onStationsChange: (stations: string[]) => void;
  onPrev: () => void;
  onNextToTrains: () => void;
  onNextToSchedule: () => void;
  // 다른 화면에서 담아둔 장소의 역 — '담아둔' 배지를 붙이고, 목록에 없는 역이면 추가해서 보여준다
  savedStationNames?: string[];
}

const Step2Stations = ({
  selectedStations,
  selectedTrains,
  onStationsChange,
  onPrev,
  onNextToTrains,
  savedStationNames = [],
}: Step2StationsProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('stations');
  const [searchQuery, setSearchQuery] = useState('');

  // 담아둔 역이 고정 목록에 없으면(예: 추암역) 맨 위에 붙여서 체크된 채로 보이게 한다
  const extraSavedStations: StationItem[] = savedStationNames
    .filter((name) => !ALL_STATIONS.some((station) => station.name === name))
    .map((name) => ({ name, status: '운영역' }));
  const stations = [...extraSavedStations, ...ALL_STATIONS];

  const filteredStations = stations.filter((station) =>
    station.name.includes(searchQuery)
  );

  const toggleStation = (stationName: string) => {
    const isSelected = selectedStations.includes(stationName);
    if (isSelected) {
      onStationsChange(selectedStations.filter((s) => s !== stationName));
    } else {
      onStationsChange([...selectedStations, stationName]);
    }
  };

  return (
    <PlanningLayout
      currentStep={2}
      pageTitle="어떤 역을 방문할까요?"
      pageSubtitle="반드시 방문할 역을 선택해 주세요."
      navigationSlot={
        <>
          <button className="PlanningButton PlanningButton--secondary" onClick={onPrev}>
            ← 이전
          </button>
          <button className="PlanningButton PlanningButton--primary" onClick={onNextToTrains}>
            다음: 방문할 열차 →
          </button>
        </>
      }
    >
      {/* 역/열차 선택 영역 */}
      <div className="Step2Stations__selectionArea">
        {/* 탭 */}
        <div className="Step2Stations__tabs">
          <button
            className={`Step2Stations__tab ${activeTab === 'stations' ? 'Step2Stations__tab--active' : ''}`}
            onClick={() => setActiveTab('stations')}
          >
            방문할 역 ({selectedStations.length})
          </button>
          <button
            className={`Step2Stations__tab ${activeTab === 'trains' ? 'Step2Stations__tab--active' : ''}`}
            onClick={() => setActiveTab('trains')}
          >
            방문할 열차 ({selectedTrains.length})
          </button>
        </div>

        {/* 검색 */}
        <div className="Step2Stations__searchBar">
          <span className="Step2Stations__searchIcon">⌕</span>
          <input
            type="text"
            placeholder="역 이름 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="Step2Stations__searchInput"
          />
        </div>

        {/* 역 목록 */}
        <ul className="Step2Stations__stationList">
          {filteredStations.map((station) => {
            const isChecked = selectedStations.includes(station.name);
            return (
              <li key={station.name} className="Step2Stations__stationItem">
                <label className="Step2Stations__stationLabel">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStation(station.name)}
                    className="motion-checkbox-input"
                  />
                  <CheckboxMark />
                  <span className="Step2Stations__stationName">{station.name}</span>
                  {savedStationNames.includes(station.name) && (
                    <span className="Step2Stations__savedBadge">담아둔 장소</span>
                  )}
                  <span className="Step2Stations__stationStatus">{station.status}</span>
                </label>
              </li>
            );
          })}
        </ul>

        <p className="Step2Stations__hint">
          선택한 역은 여행 일정에 반드시 포함됩니다.
        </p>
      </div>

      {/* 선택한 항목 요약 카드 */}
      <div className="PlanningCard Step2Stations__summaryCard">
        <p className="Step2Stations__summaryTitle">선택한 항목</p>

        <p className="Step2Stations__summaryCategory">
          방문할 역&nbsp;&nbsp;{selectedStations.length}
        </p>
        <p className="Step2Stations__summaryItems">
          {selectedStations.length > 0
            ? selectedStations.join(', ')
            : '아직 선택한 역이 없습니다.'}
        </p>

        <p className="Step2Stations__summaryCategory">
          방문할 열차&nbsp;&nbsp;{selectedTrains.length}
        </p>
        <p className="Step2Stations__summaryItems">
          {selectedTrains.length > 0
            ? selectedTrains.join(', ')
            : '아직 선택한 열차가 없습니다.'}
        </p>
      </div>
    </PlanningLayout>
  );
};

export default Step2Stations;
