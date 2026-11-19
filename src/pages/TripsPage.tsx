import React from 'react';
import MyTripsLayout, { MyTripsTab } from '../components/myTrips/MyTripsLayout';
import SavedPlacesCard from '../components/planning/SavedPlacesCard';
import MyTripsPage from './MyTripsPage';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { useSavedTrains } from '../hooks/useSavedTrains';
import { savedPlacesStore } from '../store/savedPlaces';
import { savedTrainsStore } from '../store/savedTrains';
import type { MainNavTab } from '../components/main/MapView';

interface TripsPageProps {
  activeTab: MyTripsTab;
  onNavigate: (tab: MainNavTab) => void;
}

// 헤더 '나의 여행 일정' 탭 — 저장한 여행 일정 / 담아둔 장소·열차
const TripsPage: React.FC<TripsPageProps> = ({ activeTab, onNavigate }) => {
  const savedPlaces = useSavedPlaces();
  const savedTrains = useSavedTrains();

  return (
    <MyTripsLayout activeTab={activeTab}>
      {activeTab === 'trips' ? (
        <MyTripsPage onNavigate={onNavigate} />
      ) : (
        <SavedPlacesCard
          places={savedPlaces}
          trains={savedTrains}
          onRemovePlace={savedPlacesStore.remove}
          onRemoveTrain={savedTrainsStore.remove}
        />
      )}
    </MyTripsLayout>
  );
};

export default TripsPage;
