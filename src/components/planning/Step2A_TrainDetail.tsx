import { useCallback, useEffect, useState } from 'react';
import './Step2A_TrainDetail.css';

// 나가는 애니메이션 길이 — Step2A_TrainDetail.css의 퇴장 애니메이션(var(--motion-short))과 같게
const POPUP_EXIT_MS = 200;

interface RouteStop {
  stationName: string;
  stopType: '정차' | '통과';
}

interface TrainDetailInfo {
  trainType: string;
  trainNumber: string;
  route: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  stops: RouteStop[];
}

interface Step2A_TrainDetailProps {
  trainDetail: TrainDetailInfo;
  onBack: () => void;
  onAddToSchedule: () => void;
}

// 열차 상세정보 팝업 (2A 프레임)
// 피그마 디자인에서 오버레이/모달 형태로 사용됨
const Step2A_TrainDetail = ({
  trainDetail,
  onBack,
  onAddToSchedule,
}: Step2A_TrainDetailProps) => {
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins  = minutes % 60;
    if (hours === 0) return `${mins}분`;
    return mins === 0 ? `${hours}시간` : `${hours}시간 ${mins}분`;
  };

  // 닫을 때 나가는 애니메이션(Ease in)을 보여준 뒤 실제로 닫는다 — 철도 지도의 역 팝업과 같은 방식
  const [isClosing, setIsClosing] = useState(false);

  const requestClose = useCallback(() => {
    if (isClosing) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onBack();
      return;
    }
    setIsClosing(true);
    window.setTimeout(onBack, POPUP_EXIT_MS);
  }, [isClosing, onBack]);

  // Esc로도 닫는다
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [requestClose]);

  return (
    // 팝업 바깥(어두운 영역)을 누르면 닫힌다 — 팝업 안을 누른 건 무시
    <div
      className="Step2A_TrainDetail__overlay"
      role="dialog"
      aria-modal="true"
      data-state={isClosing ? 'closing' : 'open'}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div className="Step2A_TrainDetail__panel">
        {/* 뒤로가기 헤더 */}
        <button className="Step2A_TrainDetail__backButton" onClick={requestClose}>
          〈&nbsp; 열차 상세정보
        </button>

        {/* 열차 요약 카드 */}
        <div className="PlanningCard Step2A_TrainDetail__summaryCard">
          <div className="Step2A_TrainDetail__trainInfo">
            <div className="Step2A_TrainDetail__trainMeta">
              <div className="Step2A_TrainDetail__trainIcon" aria-hidden="true">
                🚂
              </div>
              <div className="Step2A_TrainDetail__trainNames">
                <span className="Step2A_TrainDetail__trainType">{trainDetail.trainType}</span>
                <span className="Step2A_TrainDetail__trainNumber">{trainDetail.trainNumber}</span>
                <span className="Step2A_TrainDetail__trainRoute">{trainDetail.route}</span>
              </div>
            </div>
            <div className="Step2A_TrainDetail__schedule">
              <span className="Step2A_TrainDetail__scheduleLabel">운행 시간</span>
              <span className="Step2A_TrainDetail__scheduleTime">
                {trainDetail.departureTime} ~ {trainDetail.arrivalTime}
              </span>
              <span className="Step2A_TrainDetail__scheduleDuration">
                (총 {formatDuration(trainDetail.durationMinutes)})
              </span>
            </div>
          </div>
        </div>

        {/* 전체 운행 구간 노선도 */}
        <div className="Step2A_TrainDetail__routeSection">
          <div className="Step2A_TrainDetail__routeHeader">
            <span className="Step2A_TrainDetail__routeTitle">전체 운행 구간</span>
            <span className="Step2A_TrainDetail__routeLegend">● 정차 &nbsp;·&nbsp; ○ 통과</span>
          </div>

          <div className="Step2A_TrainDetail__routeMap" role="list" aria-label="운행 구간 역 목록">
            {trainDetail.stops.map((stop, index) => (
              <div
                key={index}
                className="Step2A_TrainDetail__routeStop"
                role="listitem"
              >
                <span
                  className={`Step2A_TrainDetail__stopDot ${
                    stop.stopType === '정차'
                      ? 'Step2A_TrainDetail__stopDot--stop'
                      : 'Step2A_TrainDetail__stopDot--pass'
                  }`}
                  aria-label={stop.stopType}
                />
                <span className="Step2A_TrainDetail__stopName">{stop.stationName}</span>
                <span className="Step2A_TrainDetail__stopType">{stop.stopType}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 일정 추가 버튼 */}
        <button
          className="PlanningButton PlanningButton--primary Step2A_TrainDetail__addButton"
          onClick={onAddToSchedule}
        >
          일정에 추가하기
        </button>
      </div>
    </div>
  );
};

export default Step2A_TrainDetail;
export type { TrainDetailInfo, RouteStop };
