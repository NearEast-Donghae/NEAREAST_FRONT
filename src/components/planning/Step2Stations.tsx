import { useState } from 'react';
import PlanningLayout from './PlanningLayout';
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
}

const Step2Stations = ({
  selectedStations,
  selectedTrains,
  onStationsChange,
  onPrev,
  onNextToTrains,
}: Step2StationsProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('stations');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStations = ALL_STATIONS.filter((station) =>
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
                    className="Step2Stations__checkbox"
                  />
                  <span className="Step2Stations__stationName">{station.name}</span>
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
