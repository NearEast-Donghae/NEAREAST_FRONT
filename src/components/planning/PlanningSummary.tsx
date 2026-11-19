import type { PlanningConditions } from '../../api/planning';

interface PlanningSummaryProps {
  conditions: PlanningConditions;
  placeName: (identifier: string) => string;
}

export default function PlanningSummary({ conditions, placeName }: PlanningSummaryProps) {
  const required = (conditions.requiredPlaceIds ?? []).filter((identifier) => identifier !== conditions.departurePlaceId && identifier !== conditions.arrivalPlaceId);
  return <dl className="PlanningSummary">
    <div><dt>날짜</dt><dd>{conditions.travelDate || '아직 정하지 않았어요'}
      {conditions.endDate && conditions.endDate !== conditions.travelDate && ` ~ ${conditions.endDate}`}</dd></div>
    <div><dt>시간</dt><dd>{conditions.startTime || '시작 미정'} – {conditions.endTime || '종료 미정'}</dd></div>
    <div><dt>출발</dt><dd>{conditions.departurePlaceId ? placeName(conditions.departurePlaceId) : '아직 정하지 않았어요'}</dd></div>
    <div><dt>마지막 도착</dt><dd>{conditions.arrivalPlaceId ? placeName(conditions.arrivalPlaceId) : '방문지 중에서 결정'}</dd></div>
    <div><dt>추가 필수 방문지</dt><dd>{required.length ? required.map(placeName).join(', ') : '별도 지정 없음'}</dd></div>
    {conditions.maxWalkingMinutes != null && <div><dt>도보 한도</dt><dd>{conditions.maxWalkingMinutes}분</dd></div>}
    {!!conditions.interests?.length && <div><dt>관심사</dt><dd>{conditions.interests.join(', ')}</dd></div>}
  </dl>;
}
