import './Step2A_TrainDetail.css';

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

  return (
    <div className="Step2A_TrainDetail__overlay" role="dialog" aria-modal="true">
      <div className="Step2A_TrainDetail__panel">
        {/* 뒤로가기 헤더 */}
        <button className="Step2A_TrainDetail__backButton" onClick={onBack}>
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
