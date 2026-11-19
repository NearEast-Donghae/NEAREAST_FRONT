# src/api

백엔드 REST API 호출 계층입니다. 컴포넌트에서 `fetch`를 직접 쓰지 말고 이 폴더의 함수를 사용하세요.

## 규칙

- **리소스 단위로 파일 분리**: `stations.ts`, `trains.ts`, `itineraries.ts` …
- **URL은 복수형 명사**, 동작은 HTTP 메서드로 표현

| 동작 | 메서드 + 경로 | 함수 이름 예시 |
|------|---------------|----------------|
| 목록 조회 | `GET /stations` | `getStations()` |
| 단건 조회 | `GET /stations/{stationId}` | `getStation(stationId)` |
| 하위 리소스 | `GET /stations/{stationId}/trains` | `getStationTrains(stationId)` |
| 생성 | `POST /itineraries` | `createItinerary(body)` |
| 전체 수정 | `PUT /itineraries/{id}` | `updateItinerary(id, body)` |
| 부분 수정 | `PATCH /itineraries/{id}` | `patchItinerary(id, body)` |
| 삭제 | `DELETE /itineraries/{id}` | `deleteItinerary(id)` |

## 예시 (`stations.ts`)

```ts
import apiClient from './client';
import type { Station } from '../types/neareast';

export const getStations = () => apiClient.get<Station[]>('/stations');
export const getStation = (stationId: string) =>
  apiClient.get<Station>(`/stations/${stationId}`);
```
