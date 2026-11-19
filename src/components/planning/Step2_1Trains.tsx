import { useState } from 'react';
import PlanningLayout from './PlanningLayout';
import './PlanningLayout.css';
import './Step2_1Trains.css';

interface TrainItem {
  name: string;
  id: string;
}

const ALL_TRAINS: TrainItem[] = [
  { id: 'itx-maum',    name: 'ITX-마음' },
  { id: 'mugunghwa',   name: '무궁화호' },
  { id: 'nuriro',      name: '누리로' },
  { id: 'ktx',         name: 'KTX' },
];

interface Step2_1TrainsProps {
  selectedStations: string[];
  selectedTrains: string[];
  onTrainsChange: (trains: string[]) => void;
  onPrevToStations: () => void;
  onViewTrainDetail: (trainId: string) => void;
  onNext: () => void;
}

const Step2_1Trains = ({
  selectedStations,
  selectedTrains,
  onTrainsChange,
  onPrevToStations,
  onViewTrainDetail,
  onNext,
}: Step2_1TrainsProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTrains = ALL_TRAINS.filter((train) =>
    train.name.includes(searchQuery)
  );

  const toggleTrain = (trainName: string) => {
    const isSelected = selectedTrains.includes(trainName);
    if (isSelected) {
      onTrainsChange(selectedTrains.filter((t) => t !== trainName));
    } else {
      onTrainsChange([...selectedTrains, trainName]);
    }
  };

  return (
    <PlanningLayout
      currentStep={2.1}
      pageTitle="어떤 열차를 보고 싶나요?"
      pageSubtitle="방문할 열차를 선택하고, 전체 노선도를 확인해 보세요."
      navigationSlot={
        <>
          <button className="PlanningButton PlanningButton--secondary" onClick={onPrevToStations}>
            ← 방문할 역
          </button>
          <button className="PlanningButton PlanningButton--primary" onClick={onNext}>
            다음: 일정 구성 →
          </button>
        </>
      }
    >
      {/* 열차 선택 영역 */}
      <div className="Step2_1Trains__selectionArea">
        {/* 탭 헤더 (방문할 역 / 방문할 열차) */}
        <div className="Step2_1Trains__tabs">
          <button
            className="Step2_1Trains__tab"
            onClick={onPrevToStations}
          >
            방문할 역 ({selectedStations.length})
          </button>
          <button className="Step2_1Trains__tab Step2_1Trains__tab--active">
            방문할 열차 ({selectedTrains.length})
          </button>
        </div>

        {/* 검색 */}
        <div className="Step2_1Trains__searchBar">
          <span className="Step2_1Trains__searchIcon">⌕</span>
          <input
            type="text"
            placeholder="열차 이름 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="Step2_1Trains__searchInput"
          />
        </div>

        {/* 열차 목록 */}
        <ul className="Step2_1Trains__trainList">
          {filteredTrains.map((train) => {
            const isChecked = selectedTrains.includes(train.name);
            return (
              <li key={train.id} className="Step2_1Trains__trainItem">
                <label className="Step2_1Trains__trainLabel">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleTrain(train.name)}
                    className="Step2_1Trains__checkbox"
                  />
                  <span className="Step2_1Trains__trainName">{train.name}</span>
                </label>
                <button
                  className="Step2_1Trains__detailLink"
                  onClick={() => onViewTrainDetail(train.id)}
                >
                  전체 노선도 · 상세정보 보기 ›
                </button>
              </li>
            );
          })}
        </ul>

        <p className="Step2_1Trains__hint">
          열차를 선택하면 열차 상세정보에서 정차·통과와 전체 노선도를 볼 수 있어요.
        </p>
      </div>

      {/* 선택한 항목 요약 카드 */}
      <div className="PlanningCard Step2_1Trains__summaryCard">
        <p className="Step2_1Trains__summaryTitle">선택한 항목</p>

        <p className="Step2_1Trains__summaryCategory">
          방문할 역&nbsp;&nbsp;{selectedStations.length}
        </p>
        <p className="Step2_1Trains__summaryItems">
          {selectedStations.length > 0
            ? selectedStations.join(', ')
            : '아직 선택한 역이 없습니다.'}
        </p>

        <p className="Step2_1Trains__summaryCategory">
          방문할 열차&nbsp;&nbsp;{selectedTrains.length}
        </p>
        <p className="Step2_1Trains__summaryItems">
          {selectedTrains.length > 0
            ? selectedTrains.join(', ')
            : '아직 선택한 열차가 없습니다.'}
        </p>
      </div>
    </PlanningLayout>
  );
};

export default Step2_1Trains;
