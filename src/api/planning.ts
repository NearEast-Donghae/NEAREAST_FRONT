import apiClient from './client';
import type { SavedTrip } from '../types/neareast';

export interface PlanningConditions {
  travelDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  departurePlaceId?: string | null;
  arrivalPlaceId?: string | null;
  requiredPlaceIds?: string[];
  preferredTrainTypes?: string[];
  selectedTrainIds?: string[];
  selectedTrains?: { trainNo: string; action: 'ride' | 'observe'; stationId: string }[] | null;
  interests?: string[];
  maxWalkingMinutes?: number | null;
}

export interface PlanningOptions {
  mode: 'walk';
  maxDestinations: number;
  places: { id: string; name: string; canDepart: boolean; canVisit: boolean; reason: string | null }[];
}

export interface PlanningDraft {
  source: 'planner' | 'chat';
  conversationId?: string;
  itineraryId?: string;
  conditions: PlanningConditions;
}

export interface GenerationResult {
  status: string;
  plan: { reason?: string | null; totalTravelSeconds?: number; overrunSeconds?: number };
  itinerary: SavedTrip | null;
}

export const getPlanningOptions = () => apiClient.get<PlanningOptions>('/planning-options');
export const createPlanningRequest = (draft: PlanningDraft) =>
  apiClient.post<{ id: string }>('/planning-requests', draft);
export const generatePlanningRequest = (requestId: string) =>
  apiClient.post<GenerationResult>(`/planning-requests/${encodeURIComponent(requestId)}/generations`);
