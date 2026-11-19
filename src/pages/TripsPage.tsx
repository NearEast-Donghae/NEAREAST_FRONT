import React, { useSyncExternalStore } from 'react';
import MyTripsLayout, { MyTripsTab } from '../components/myTrips/MyTripsLayout';
import SavedPlacesCard from '../components/planning/SavedPlacesCard';
import MyTripsPage from './MyTripsPage';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { useSavedTrains } from '../hooks/useSavedTrains';
import { savedPlacesStore } from '../store/savedPlaces';
import { savedTrainsStore } from '../store/savedTrains';
import type { MainNavTab } from '../components/main/MapView';
import { savedStore } from '../store/saved';
import { navigateTo } from '../routes';

interface TripsPageProps {
  activeTab: MyTripsTab;
  onNavigate: (tab: MainNavTab) => void;
}

// 헤더 '나의 여행 일정' 탭 — 저장한 여행 일정 / 담아둔 장소·열차
const TripsPage: React.FC<TripsPageProps> = ({ activeTab, onNavigate }) => {
  const savedPlaces = useSavedPlaces();
  const savedTrains = useSavedTrains();
  const savedState = useSyncExternalStore(savedStore.subscribe, savedStore.getSnapshot);

  return (
    <MyTripsLayout activeTab={activeTab}>
      {activeTab === 'trips' ? (
        <MyTripsPage onNavigate={onNavigate} />
      ) : savedState.loading ? <p role="status">담아둔 장소·열차를 불러오고 있어요…</p> : savedState.error ? <p role="alert">{savedState.error} <button onClick={() => savedStore.reload()}>목록 다시 불러오기</button></p> : (
        <SavedPlacesCard
          places={savedPlaces}
          trains={savedTrains}
          onRemovePlace={savedPlacesStore.remove}
          onRemoveTrain={savedTrainsStore.remove}
          pending={savedState.pending}
          onViewPlace={(placeId) => navigateTo(`#/places/${encodeURIComponent(placeId)}`)}
          onViewTrain={(train) => train.trainNo && train.stationId && navigateTo(`#/trains/${encodeURIComponent(train.trainNo)}?station=${encodeURIComponent(train.stationId)}`)}
        />
      )}
    </MyTripsLayout>
  );
};

export default TripsPage;
