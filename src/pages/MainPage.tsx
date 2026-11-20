import { useCallback } from 'react';
import MapView, { type MainNavTab } from '../components/main/MapView';
import AiPlannerView from '../components/main/AiPlannerView';
import TrainInfoView from '../components/main/TrainInfoView';
import TrainDetail from '../components/main/TrainDetail';
import PlaceDetail from '../components/main/PlaceDetail';
import { ROUTES, navigateTo, conversationRoute } from '../routes';
import { planningDraftStore } from '../store/planningDraft';
import type { PlanningConditions } from '../api/planning';

interface MainPageProps { initialNav?: MainNavTab; routeHash: string; }
const NAV_ROUTES = {
  '철도 지도': '#/map', '열차 정보': '#/trains', 'AI 여행 플래너': '#/chat',
  '여행 계획하기': ROUTES.planning, '나의 여행 일정': ROUTES.myTrips,
} as const;

export default function MainPage({ initialNav = '철도 지도', routeHash }: MainPageProps) {
  const route = routeHash || NAV_ROUTES[initialNav];
  const [path, query] = route.split('?');
  const stationId = new URLSearchParams(query).get('station') ?? undefined;
  const handleNavigate = (tab: MainNavTab) => navigateTo(NAV_ROUTES[tab]);
  const returnConversation = new URLSearchParams(query).get('conversation') ?? undefined;
  const closePlace = useCallback(() => navigateTo(returnConversation ? conversationRoute(returnConversation) : '#/map'), [returnConversation]);
  const startPlan = (conditions: PlanningConditions, conversationId?: string) => {
    planningDraftStore.set({ source: conversationId ? 'chat' : 'planner', conversationId, conditions });
    navigateTo(ROUTES.planning);
  };
  if (path.startsWith('#/trains/')) return <TrainDetail
    trainNo={decodeURIComponent(path.slice('#/trains/'.length))} stationId={stationId} onNavigate={handleNavigate} />;
  if (path === '#/trains') return <TrainInfoView key={stationId ?? 'all'}
    initialStationId={stationId}
    onViewDetail={(train) => navigateTo(`#/trains/${encodeURIComponent(train.trainNo)}?station=${encodeURIComponent(train.stationId)}`)} />;
  if (path === '#/chat') return <AiPlannerView
    initialConversationId={new URLSearchParams(query).get('conversation') ?? undefined}
    onCreateItinerary={(conditions, conversationId) => startPlan(conditions ?? {}, conversationId)}
    onPlaceDetail={(placeId, conversationId) => navigateTo(`#/places/${encodeURIComponent(placeId)}${conversationId ? `?conversation=${encodeURIComponent(conversationId)}` : ''}`)} />;
  const placeId = path.startsWith('#/places/') ? decodeURIComponent(path.slice('#/places/'.length)) : null;
  return <>
    <MapView
      onStationClick={(identifier) => navigateTo(`#/places/${encodeURIComponent(identifier)}`)} />
    {placeId && <PlaceDetail key={placeId} placeId={placeId} onClose={closePlace}
      onPlan={(identifier) => startPlan({ requiredPlaceIds: [identifier] })}
      onTrains={(identifier) => navigateTo(`#/trains?station=${encodeURIComponent(identifier)}`)} />}
  </>;
}
