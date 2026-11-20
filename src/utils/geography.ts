import type { PlaceDto } from '../api/catalog';

export function distanceKm(origin: PlaceDto, destination: PlaceDto): number | null {
  if (origin.lat === null || origin.lng === null || destination.lat === null || destination.lng === null) return null;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(destination.lat - origin.lat);
  const longitudeDelta = radians(destination.lng - origin.lng);
  const haversine = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(origin.lat)) *
    Math.cos(radians(destination.lat)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, haversine)));
}
