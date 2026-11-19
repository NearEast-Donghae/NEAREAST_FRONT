import React from 'react';
import MyPageView, { MyPageTab } from '../components/myPage/MyPageView';
import SavedPlacesCard from '../components/planning/SavedPlacesCard';
import MyTripsPage from './MyTripsPage';
import { useAuthUser } from '../hooks/useAuthUser';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { useSavedTrains } from '../hooks/useSavedTrains';
import { savedPlacesStore } from '../store/savedPlaces';
import { savedTrainsStore } from '../store/savedTrains';
import type { MainNavTab } from '../components/main/MapView';

interface MyPageProps {
  activeTab: MyPageTab;
  onNavigate: (tab: MainNavTab) => void;
}

const MyPage: React.FC<MyPageProps> = ({ activeTab, onNavigate }) => {
  const user = useAuthUser();
  const savedPlaces = useSavedPlaces();
  const savedTrains = useSavedTrains();

  return (
    <MyPageView user={user} activeTab={activeTab}>
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
    </MyPageView>
  );
};

export default MyPage;
