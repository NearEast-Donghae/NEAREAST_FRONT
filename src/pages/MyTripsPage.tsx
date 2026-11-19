import React, { useEffect, useState } from 'react';
import MyTripsView from '../components/myTrips/MyTripsView';
import { deleteItinerary, getItineraries } from '../api/itineraries';
import type { SavedTrip } from '../types/neareast';
import type { MainNavTab } from '../components/main/MapView';

interface MyTripsPageProps {
  onNavigate: (tab: MainNavTab) => void;
}

const MyTripsPage: React.FC<MyTripsPageProps> = ({ onNavigate }) => {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    getItineraries()
      .then((loadedTrips) => {
        if (isCancelled) return;
        setTrips(loadedTrips);
        // 가장 최근에 저장한 여행(방금 저장하고 넘어온 경우 포함)을 바로 보여준다
        setSelectedTripId(loadedTrips[0]?.id ?? null);
      })
      .catch(() => {
        // 빈 목록으로 보이면 저장한 여행이 사라진 줄 알 수 있어서, 불러오지 못했다고 따로 알린다
        if (!isCancelled) setLoadError('저장한 여행을 불러오지 못했어요. 잠시 후 다시 열어 주세요.');
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleDeleteTrip = async (tripId: string) => {
    const trip = trips.find((item) => item.id === tripId);
    if (!window.confirm(`'${trip?.title ?? '이 여행'}'을(를) 삭제할까요?`)) return;

    try {
      await deleteItinerary(tripId);
    } catch {
      alert('삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    const remainingTrips = trips.filter((item) => item.id !== tripId);
    setTrips(remainingTrips);
    setSelectedTripId(remainingTrips[0]?.id ?? null);
  };

  return (
    <MyTripsView
      trips={trips}
      selectedTripId={selectedTripId}
      isLoading={isLoading}
      loadError={loadError}
      onSelectTrip={setSelectedTripId}
      onDeleteTrip={handleDeleteTrip}
      onStartPlanning={() => onNavigate('여행 계획하기')}
      onStartAiPlanner={() => onNavigate('AI 여행 플래너')}
    />
  );
};

export default MyTripsPage;
