import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';
import { createPlanningRequest, generatePlanningRequest, getPlanningOptions, type PlanningConditions, type PlanningOptions } from '../api/planning';
import { getItineraries, getItinerary } from '../api/itineraries';
import { getPlaces, type PlaceDto } from '../api/catalog';
import { planningDraftStore } from '../store/planningDraft';
import { useSavedPlaces } from '../hooks/useSavedPlaces';
import { useSavedTrains } from '../hooks/useSavedTrains';
import { ROUTES, navigateTo, conversationRoute } from '../routes';
import StepIndicator from '../components/planning/StepIndicator';
import TripRoute from '../components/planning/TripRoute';
import PlanningSummary from '../components/planning/PlanningSummary';
import { getMissingPlanningFields, getUnsupportedPlanningConditions, getVisitIds } from '../utils/planningConditions';
import type { SavedTrip } from '../types/neareast';
import '../components/planning/PlanningLayout.css';

const UNAVAILABLE_REASONS: Record<string, string> = {
  coordinates_unverified: '좌표 확인 필요', public_access_unverified: '방문 가능 여부 확인 필요',
  stay_duration_missing: '체류 시간 확인 필요',
};

export default function PlanningPage() {
  const [draft, setDraft] = useState(() => planningDraftStore.get());
  const [conditions, setConditions] = useState<PlanningConditions>(() => ({
    ...(draft?.source === 'chat' ? {} : {
      travelDate: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }), startTime: '09:00', endTime: '18:00',
    }), requiredPlaceIds: [], ...draft?.conditions,
  }));
  const [catalog, setCatalog] = useState<PlaceDto[]>([]);
  const [options, setOptions] = useState<PlanningOptions | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(() => draft?.source === 'chat' && !getMissingPlanningFields(draft.conditions).length ? 2 : 1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SavedTrip | null>(null);
  const [acceptWalking, setAcceptWalking] = useState(false);
  const [visitsExpanded, setVisitsExpanded] = useState(() => draft?.source !== 'chat' || !getVisitIds(draft.conditions).length);
  const savedPlaces = useSavedPlaces();
  const savedTrains = useSavedTrains();
  const generationBusy = useRef(false);
  const requestRef = useRef<{ id: string; signature: string } | null>(null);
  const alive = useRef(true);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [step]);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);
  useEffect(() => {
    if (!result && !draft?.itineraryId) planningDraftStore.set({ source: draft?.source ?? 'planner', conversationId: draft?.conversationId, conditions });
  }, [conditions, draft, result]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(null);
    void Promise.all([getPlaces(), getPlanningOptions(), draft?.itineraryId ? getItinerary(draft.itineraryId) : Promise.resolve(null)]).then(([places, planningOptions, restoredTrip]) => {
      if (cancelled) return;
      setCatalog(places); setOptions(planningOptions);
      if (restoredTrip) { setResult(restoredTrip); setStep(3); }
    }).catch(() => { if (!cancelled) setError(draft?.itineraryId ? '저장된 일정을 불러오지 못했어요. 다시 불러오거나 새 계획을 시작해 주세요.' : '계획에 사용할 장소를 불러오지 못했어요.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [attempt]);

  const optionIndex = new Map(options?.places.map((place) => [place.id, place]));
  const placeName = (placeId: string) => catalog.find((place) => place.id === placeId)?.name ?? '장소 확인 필요';
  const requiredIds = conditions.requiredPlaceIds ?? [];
  const unsupportedLabels = getUnsupportedPlanningConditions(conditions);
  const unsupportedConditions = unsupportedLabels.length > 0;
  const missingFields = getMissingPlanningFields(conditions);
  const visitIds = getVisitIds(conditions);
  const unavailableIds = visitIds.filter((identifier) => !optionIndex.get(identifier)?.canVisit);
  const invalidTime = !!(conditions.startTime && conditions.endTime && conditions.endTime <= conditions.startTime);
  const departureUnavailable = !!conditions.departurePlaceId && !optionIndex.get(conditions.departurePlaceId)?.canDepart;
  const canGenerate = !loading && !!options && !missingFields.length && !invalidTime && !departureUnavailable &&
    !unavailableIds.length && visitIds.length <= (options?.maxDestinations ?? 5) && (!unsupportedConditions || acceptWalking);
  useEffect(() => { if (options && unavailableIds.length) setVisitsExpanded(true); }, [options, unavailableIds.length]);
  const departureOptions = catalog.filter((place) => optionIndex.get(place.id)?.canDepart || place.id === conditions.departurePlaceId);
  const displayedPlaces = catalog.filter((place) => optionIndex.get(place.id)?.canVisit || requiredIds.includes(place.id) || savedPlaces.some((saved) => saved.id === place.id));
  function patchConditions(patch: Partial<PlanningConditions>) {
    setConditions((previous) => ({ ...previous, ...patch })); setError(null);
    setAcceptWalking(false);
  }
  function startNewPlan() {
    if (!result && !window.confirm('입력 중인 조건을 지우고 새 계획을 시작할까요? 저장된 일정은 유지돼요.')) return;
    planningDraftStore.clear(); setDraft(null); setConditions({
      travelDate: new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' }), startTime: '09:00', endTime: '18:00', requiredPlaceIds: [],
    });
    setStep(1); setResult(null); setError(null); setAcceptWalking(false); requestRef.current = null;
    setVisitsExpanded(true);
    setAttempt((value) => value + 1);
  }
  function showGeneratedTrip(trip: SavedTrip) {
    setResult(trip); setStep(3);
    planningDraftStore.set({ source: draft?.source ?? 'planner', conversationId: draft?.conversationId, conditions, itineraryId: trip.id });
  }
  function nextStep(event: React.FormEvent) {
    event.preventDefault();
    if (!conditions.travelDate || !conditions.departurePlaceId || !conditions.startTime || !conditions.endTime) {
      setError('날짜와 출발 장소, 시작·종료 시각을 입력해 주세요.'); return;
    }
    if (conditions.endTime <= conditions.startTime) { setError('종료 시각은 시작 시각보다 늦어야 해요.'); return; }
    if (!optionIndex.get(conditions.departurePlaceId)?.canDepart) { setError('출발 장소의 좌표와 방문 가능 여부 확인이 필요해요.'); return; }
    setError(null); setStep(2);
  }
  async function generate() {
    if (generationBusy.current) return;
    if (missingFields.length || invalidTime || departureUnavailable) { setError('기본 정보를 확인해 주세요.'); setStep(1); return; }
    const identifiers = new Set(requiredIds.filter((identifier) => identifier !== conditions.departurePlaceId));
    if (conditions.arrivalPlaceId && conditions.arrivalPlaceId !== conditions.departurePlaceId) identifiers.add(conditions.arrivalPlaceId);
    if (!identifiers.size || identifiers.size > (options?.maxDestinations ?? 5)) {
      setError('출발 장소 이외의 방문지를 1~5곳 선택해 주세요. 도착 장소도 방문지에 포함돼요.'); return;
    }
    const unavailable = [...identifiers].filter((identifier) => !optionIndex.get(identifier)?.canVisit);
    if (unavailable.length) { setError(`아직 계획에 포함할 수 없는 장소예요: ${unavailable.map(placeName).join(', ')}. 제외하려면 선택을 해제해 주세요.`); return; }
    if (unsupportedConditions && !acceptWalking) { setError('현재 지원하는 당일 도보 일정으로 변경할지 확인해 주세요.'); return; }
    const acceptedConditions: PlanningConditions = { ...conditions };
    if (unsupportedConditions) {
      acceptedConditions.endDate = conditions.travelDate;
      acceptedConditions.selectedTrainIds = [];
      acceptedConditions.selectedTrains = null;
      acceptedConditions.preferredTrainTypes = [];
    }
    generationBusy.current = true; setGenerating(true); setError(null);
    try {
      const signature = JSON.stringify(acceptedConditions);
      if (!requestRef.current || requestRef.current.signature !== signature) {
        const request = await createPlanningRequest({
          source: draft?.source ?? 'planner', conversationId: draft?.conversationId,
          conditions: acceptedConditions,
        });
        requestRef.current = { id: request.id, signature };
      } else {
        // 응답만 유실된 경우 이미 저장된 일정을 먼저 찾아 중복 생성을 줄인다.
        const existing = (await getItineraries()).find((trip) => trip.planningRequestId === requestRef.current?.id);
        if (existing) { if (alive.current) showGeneratedTrip(existing); return; }
      }
      const response = await generatePlanningRequest(requestRef.current.id);
      if (!alive.current) return;
      if (response.itinerary) {
        showGeneratedTrip(response.itinerary);
      } else {
        setError(response.plan.reason === 'walking_limit_exceeded'
          ? '이동 시간이 설정한 도보 한도를 넘어요. 방문지나 도보 한도를 조정해 주세요.'
          : '선택한 시간 안에 일정을 만들기 어려워요. 방문지를 줄이거나 여행 시간을 늘려 주세요.');
      }
    } catch (exception) {
      if (!alive.current) return;
      setError(exception instanceof ApiError && exception.status === 503
        ? '현재 경로 서비스를 이용할 수 없어요. 잠시 후 다시 시도해 주세요.'
        : '계획을 생성하지 못했어요. 입력 조건과 연결 상태를 확인해 주세요. 저장 여부는 나의 여행 일정에서도 확인할 수 있어요.');
    } finally {
      generationBusy.current = false;
      if (alive.current) setGenerating(false);
    }
  }

  return <div className="PlanningLayout">
    <StepIndicator currentStep={step} labels={['1 기본 정보', '2 조건 확인', '3 생성된 일정']} />
    <header className="PlanningLayout__header"><h1 ref={headingRef} tabIndex={-1} className="PlanningLayout__title">{step === 3 ? '여행 일정이 완성됐어요' : draft?.source === 'chat' ? '대화에서 이어서 계획하기' : '여행 계획하기'}</h1>
      <p className="PlanningLayout__subtitle">{step === 3 ? '선택한 장소를 잇는 도보 일정과 이동 경로가 내 계정에 저장됐어요.' : draft?.source === 'chat' ? step === 1 ? '대화에서 받은 내용은 채워 두었어요. 비어 있는 항목만 보완해 주세요.' : '대화에서 정한 조건이에요. 맞다면 바로 일정을 생성할 수 있어요.' : '출발 장소와 방문지를 선택해 실제 이동 경로가 있는 일정을 만들어 보세요.'}</p>
      <div className="Integration-Actions">
        {draft?.conversationId && <button disabled={generating} onClick={() => navigateTo(conversationRoute(draft.conversationId))}>← 원래 대화로 돌아가기</button>}
        <button disabled={generating} onClick={startNewPlan}>새 계획 시작</button>
      </div>
    </header>
    <main className="PlanningLayout__content">
      <section className="PlanningCard Integration-Panel">
        <p className="Integration-Note">현재 자동 생성은 당일 도보 여행을 지원해요. 열차 탑승·관찰 조건을 넣은 일정은 아직 지원하지 않아요.</p>
        {loading && <p role="status">장소를 불러오고 있어요…</p>}
        {!loading && !options && <button onClick={() => setAttempt((value) => value + 1)}>다시 불러오기</button>}
        {error && <p ref={errorRef} tabIndex={-1} className="Integration-Error" role="alert">{error}</p>}
        {!loading && options && step === 1 && <form onSubmit={nextStep}>
          {draft?.source === 'chat' && !!missingFields.length && <p role="status">추가로 정할 정보: {missingFields.join(', ')}</p>}
          <div className="Integration-Fields">
            <label>여행 날짜<input type="date" required value={conditions.travelDate ?? ''} onChange={(event) => patchConditions({ travelDate: event.target.value })} /></label>
            <label>시작 시각<input type="time" required value={conditions.startTime ?? ''} onChange={(event) => patchConditions({ startTime: event.target.value })} /></label>
            <label>종료 시각<input type="time" required value={conditions.endTime ?? ''} onChange={(event) => patchConditions({ endTime: event.target.value })} /></label>
          </div>
          <div className="Integration-Fields">
            <label>출발 장소<select aria-label="출발 장소" required value={conditions.departurePlaceId ?? ''} onChange={(event) => patchConditions({ departurePlaceId: event.target.value })}>
              <option value="">출발 장소 선택</option>{departureOptions.map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
            </select></label>
            <label>마지막 도착 장소<select aria-label="마지막 도착 장소" value={conditions.arrivalPlaceId ?? ''} onChange={(event) => patchConditions({ arrivalPlaceId: event.target.value || null })}>
              <option value="">방문지 중에서 결정</option>{catalog.filter((place) => optionIndex.get(place.id)?.canVisit || place.id === conditions.arrivalPlaceId).map((place) => <option key={place.id} value={place.id}>{place.name}</option>)}
            </select></label>
            <label>도보 한도 (분, 선택)<input type="number" min={0} max={1440} value={conditions.maxWalkingMinutes ?? ''} onChange={(event) => patchConditions({ maxWalkingMinutes: event.target.value === '' ? null : Number(event.target.value) })} /></label>
          </div>
          {requiredIds.length > 0 && <p>포함할 장소: {requiredIds.map(placeName).join(', ')}</p>}
          <button className="PlanningButton PlanningButton--primary" type="submit">방문지 확인 →</button>
        </form>}
        {!loading && options && step === 2 && <>
          <h2>이 조건으로 여행해요</h2>
          <PlanningSummary conditions={conditions} placeName={placeName} />
          <button disabled={generating} onClick={() => { setStep(1); setError(null); }}>날짜·시간·출발지 수정</button>
          {!!conditions.interests?.length && <p className="Integration-Note">관심사는 계획 조건에 보관돼요. 관심사에 맞춘 장소 자동 추천은 아직 지원하지 않아요.</p>}
          <details className="PlanningReview-Places" open={visitsExpanded} onToggle={(event) => setVisitsExpanded(event.currentTarget.open)}>
          <summary>방문지 추가·변경</summary>
          <p className="Integration-Note">마지막 도착 장소는 일정에 포함돼요. 더 방문할 곳이 있다면 선택해 주세요. 현재 자동 계획에 사용할 수 있는 장소만 선택할 수 있어요.</p>
          <fieldset disabled={generating} className="Integration-Checks"><legend>방문지 선택</legend>
            {displayedPlaces.map((place) => {
              const option = optionIndex.get(place.id);
              const selected = requiredIds.includes(place.id);
              const isArrival = place.id === conditions.arrivalPlaceId;
              return <label key={place.id}><input type="checkbox" checked={selected || isArrival} disabled={isArrival || (!selected && (!option?.canVisit || place.id === conditions.departurePlaceId))}
                onChange={(event) => patchConditions({ requiredPlaceIds: event.target.checked ? [...requiredIds, place.id] : requiredIds.filter((identifier) => identifier !== place.id) })} />
                {place.name}{place.id === conditions.departurePlaceId ? ' · 출발 장소' : isArrival ? ' · 마지막 도착 장소로 포함' : ''}
                {!option?.canVisit && ` · ${UNAVAILABLE_REASONS[option?.reason ?? ''] ?? '계획용 정보 확인 필요'}`}
              </label>;
            })}
          </fieldset>
          </details>
          {requiredIds.filter((identifier) => !catalog.some((place) => place.id === identifier)).map((identifier) =>
            <p key={identifier} role="status">목록에서 찾을 수 없는 방문지가 있어요. <button disabled={generating} onClick={() => patchConditions({ requiredPlaceIds: requiredIds.filter((placeId) => placeId !== identifier) })}>확인되지 않은 방문지 제외</button></p>)}
          {(!visitIds.length || unavailableIds.length > 0 || departureUnavailable || invalidTime || visitIds.length > options.maxDestinations) && <div className="PlanningReview-Notice" role="status">
            {!visitIds.length && <p>출발 장소 이외의 방문지나 마지막 도착 장소를 1곳 이상 정해 주세요.</p>}
            {unavailableIds.length > 0 && <p>아직 자동 계획에 넣을 수 없는 장소: {unavailableIds.map(placeName).join(', ')}. 해당 방문지를 제외하거나 마지막 도착 장소를 수정해 주세요.</p>}
            {departureUnavailable && <p>출발 장소를 자동 계획에 사용할 수 없어요. 출발지를 수정해 주세요.</p>}
            {invalidTime && <p>종료 시각은 시작 시각보다 늦어야 해요.</p>}
            {visitIds.length > options.maxDestinations && <p>방문지는 도착 장소를 포함해 {options.maxDestinations}곳까지 선택할 수 있어요.</p>}
          </div>}
          {savedTrains.length > 0 && <p className="Integration-Note">담아둔 열차 {savedTrains.length}개는 관심 목록에 유지되며, 이번 도보 일정에는 자동 포함되지 않아요.</p>}
          {unsupportedConditions && <div className="PlanningReview-Notice" role="status"><p>이번 자동 생성에서 지원하지 않는 조건: {unsupportedLabels.join(', ')}.</p>
            <p>동의하면 {conditions.travelDate} 하루의 도보 일정으로 생성하며, 열차 조건은 이번 일정에 반영하지 않아요. 원래 대화의 조건은 그대로 남아요.</p>
            <label><input type="checkbox" checked={acceptWalking} disabled={generating} onChange={(event) => setAcceptWalking(event.target.checked)} />이번 생성에 한해 당일 도보 일정으로 변경</label></div>}
          <div className="Integration-Actions">
            <button className="PlanningButton PlanningButton--primary" disabled={generating || !canGenerate} onClick={() => { void generate(); }}>{generating ? '경로를 확인하며 일정 생성 중…' : '이 조건으로 일정 생성하기'}</button>
          </div>
          {generating && <p role="status">실제 이동 경로를 조회하고 있어요. 생성된 일정은 내 계정에 저장돼요.</p>}
        </>}
        {step === 3 && result && <>
          <h2>{result.title}</h2><p role="status">일정이 내 계정에 저장됐어요.</p>
          <p>{result.travelDateLabel} · {result.timeRange}</p>
          <p className="Integration-Note">요청한 시간 범위는 {conditions.startTime}–{conditions.endTime}예요. 아래 일정은 방문과 이동에 필요한 시간을 반영하며, 남는 시간의 활동은 자동으로 채우지 않아요.</p>
          <ol>{result.timeline.map((row, index) => <li key={index}>{row.time} · {row.description}</li>)}</ol>
          <TripRoute trip={result} />
          <button onClick={() => navigateTo(ROUTES.myTrips)}>저장된 일정 보기 →</button>
        </>}
      </section>
    </main>
  </div>;
}
