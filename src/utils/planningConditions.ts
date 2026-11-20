import type { PlanningConditions } from '../api/planning';

export function getVisitIds(conditions: PlanningConditions): string[] {
  return [...new Set([...(conditions.requiredPlaceIds ?? []), conditions.arrivalPlaceId]
    .filter((identifier): identifier is string => !!identifier && identifier !== conditions.departurePlaceId))];
}

export function getMissingPlanningFields(conditions: PlanningConditions): string[] {
  const missing: string[] = [];
  if (!conditions.travelDate) missing.push('여행 날짜');
  if (!conditions.startTime) missing.push('시작 시각');
  if (!conditions.endTime) missing.push('종료 시각');
  if (!conditions.departurePlaceId) missing.push('출발 장소');
  if (!getVisitIds(conditions).length) missing.push('방문지 또는 도착 장소');
  return missing;
}

export function getUnsupportedPlanningConditions(conditions: PlanningConditions): string[] {
  const unsupported: string[] = [];
  if (conditions.endDate && conditions.endDate !== conditions.travelDate) unsupported.push('여러 날짜의 여행');
  if (conditions.selectedTrainIds?.length || conditions.selectedTrains?.length || conditions.preferredTrainTypes?.length) {
    unsupported.push('열차 탑승·관찰 조건');
  }
  return unsupported;
}
