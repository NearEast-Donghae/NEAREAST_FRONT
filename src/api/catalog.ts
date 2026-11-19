import apiClient from './client';

export interface PlaceDto {
  id: string;
  name: string;
  kind: 'station' | 'poi' | 'heritage' | 'spot';
  passenger_stop: boolean | null;
  aliases: string[];
  lat: number | null;
  lng: number | null;
}

export interface PlaceDetailDto extends PlaceDto {
  summary: string | null;
  description: string | null;
  source: string | null;
  has_trains: boolean;
}

export interface TimetableBasis {
  summary: string;
  target_date?: string | null;
  limits?: string[];
  certainty?: string;
}

export interface TrainDto {
  no: string;
  type: string | null;
  line: string;
  origin: string;
  destination: string;
  time?: string | null;
  arr?: string | null;
  dep?: string | null;
  passing?: boolean;
  time_basis?: string;
}

export function isPassengerStop(stop: TrainDetailDto['stops'][number]): boolean {
  return !stop.stop_type.includes('통과') && (stop.arr !== null || stop.dep !== null);
}

export interface TrainDetailDto extends TrainDto {
  stops: { name: string; place_id: string | null; arr: string | null; dep: string | null;
    pass_time: string | null; stop_type: string; time_basis: string }[];
  basis: TimetableBasis;
}

export const PLACE_KIND_LABELS: Record<PlaceDto['kind'], string> = {
  station: '역', poi: '관광지', heritage: '문화유산', spot: '명소',
};

export const getPlaces = () => apiClient.get<{ places: PlaceDto[] }>('/places').then((result) => result.places);
export const getPlace = (placeId: string) => apiClient.get<PlaceDetailDto>(`/places/${encodeURIComponent(placeId)}`);
export const getTrain = (trainNo: string) => apiClient.get<TrainDetailDto>(`/trains/${encodeURIComponent(trainNo)}`);
export const getStationTrains = (stationId: string, after = '00:00') =>
  apiClient.get<{ trains: TrainDto[]; basis: TimetableBasis; note: string | null }>(
    `/stations/${encodeURIComponent(stationId)}/trains?after=${encodeURIComponent(after)}`);
export const searchTrains = (fromId: string, toId: string, after: string) =>
  apiClient.get<{ trains: TrainDto[]; basis: TimetableBasis }>(
    `/trains?${new URLSearchParams({ from: fromId, to: toId, after })}`);
