import React, { useEffect, useRef, useState } from 'react';
import LoginGate from '../layout/LoginGate';
import { conversationRoute } from '../../routes';
import {
  ConversationSummary,
  IS_SERVER_CHAT,
  deleteConversation,
  listConversations,
  loadConversation,
  saveLocalConversationSnapshot,
  sendConversationMessage,
  createRequestId,
} from '../../api/conversations';
import { CREATE_ITINERARY_OPTION, PLANNER_QUESTIONS } from '../../data/plannerQuestions';
import { useSavedPlaces } from '../../hooks/useSavedPlaces';
import { savedPlacesStore } from '../../store/savedPlaces';
import { useAuthUser } from '../../hooks/useAuthUser';
import { formatConversationDate } from '../../store/chatHistory';
import type { ChatMessage, ChatPlace, ChatRequest, PlanConditions } from '../../types/neareast';
import { readSessionState, writeSessionState } from '../../utils/sessionState';
import './AiPlannerView.css';

const CHAT_SCROLL_KEY = 'neareast.chatScroll.v1';
type ChatScrollState = { conversationId: string; top: number };
import type { PlanningConditions } from '../../api/planning';
import { authStore } from '../../store/auth';
import { getPlaces, type PlaceDto } from '../../api/catalog';
import PlanningSummary from '../planning/PlanningSummary';
import { getMissingPlanningFields, getUnsupportedPlanningConditions } from '../../utils/planningConditions';


// 첫 화면의 추천 질문 — 마지막 것이 여행 짜기 기능으로 들어가는 입구
const WELCOME_SUGGESTIONS = [
  { title: '역 주변 둘러보기', question: '묵호역 근처에 뭐 있어?' },
  { title: '풍경 좋은 곳', question: '바다 보이는 역 추천해줘' },
  { title: '가볼 만한 곳', question: '동해시에서 사진 찍기 좋은 곳 알려줘' },
  { title: '여행 일정 짜기', question: '여행 일정 짜줘' },
];

const SAVED_PLACES_PLANNING_QUESTION = '담아둔 장소로 여행 일정 짜줘';

// 저장된 대화를 다시 불러와도 id가 겹치지 않게, 페이지를 새로 열 때마다 0부터 세는 번호 대신 시각+난수를 쓴다
const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

function createMessage(sender: ChatMessage['sender'], text: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  return { id: createId('message'), sender, text, ...extra };
}

interface AiPlannerViewProps {
  initialConversationId?: string;
  onCreateItinerary: (conditions?: PlanningConditions, conversationId?: string) => void;
  onPlaceDetail?: (placeId: string, conversationId?: string) => void;
}

export default function AiPlannerView({
  initialConversationId,
  onCreateItinerary,
  onPlaceDetail,
}: AiPlannerViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conditions, setConditions] = useState<PlanConditions>({});
  // 담은 장소는 대화와 별개로 저장돼서, 새 대화를 시작하거나 여행 계획하기로 가도 남는다
  const savedPlaces = useSavedPlaces();
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [inputText, setInputText] = useState('');
  const sendBusy = useRef(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [failedSend, setFailedSend] = useState<{ text: string; requestId: string; conversationId: string | null } | null>(null);

  // 대화 목록 — 백엔드 연결 시 서버에, 데모 모드면 브라우저에 계정별로 저장된다 (api/conversations.ts)
  const user = useAuthUser();
  const userEmail = user?.email ?? null;
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  // 지금 화면의 대화 — 첫 메시지를 보내기 전(새 대화)에는 목록에 없어서 null
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<PlaceDto[]>([]);
  const [historyError, setHistoryError] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [conversationError, setConversationError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void getPlaces().then((places) => { if (!cancelled) setCatalog(places); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);
  const placeName = (identifier: string) => catalog.find((place) => place.id === identifier)?.name ?? '장소 확인 필요';
  const rememberConversation = (identifier?: string) => {
    window.history.replaceState(null, '', conversationRoute(identifier));
  };

  const refreshConversations = (email: string) => {
    setHistoryError(false);
    listConversations(email)
      .then((result) => { if (authStore.getSnapshot()?.email === email) setConversations(result); })
      .catch(() => { if (authStore.getSnapshot()?.email === email) setHistoryError(true); });
  };

  // 로그인한 계정의 목록을 불러오고, 계정이 바뀌면 새 대화로 시작한다
  useEffect(() => {
    conversationIdRef.current += 1;
    setMessages([]);
    setConditions({});
    setIsAiTyping(false);
    setInputText('');
    setSendError(null);
    setFailedSend(null);
    sendBusy.current = false;
    setActiveConversationId(null);
    setConversations([]);
    setConversationError(false);
    if (userEmail === null) {
      setConversations([]);
      return;
    }
    refreshConversations(userEmail);
  }, [userEmail]);

  // 데모 모드에서는 메시지가 오갈 때마다 지금 대화를 브라우저에 저장한다 (백엔드는 서버가 직접 저장)
  useEffect(() => {
    if (userEmail === null || activeConversationId === null) return;
    const next = saveLocalConversationSnapshot(userEmail, activeConversationId, messages, conditions);
    if (next !== null) setConversations(next);
  }, [messages, conditions, activeConversationId, userEmail]);

  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // '새 대화' 뒤에 늦게 도착한 이전 대화의 답변을 버리기 위한 번호
  const conversationIdRef = useRef(0);

  const filledConditionCount = PLANNER_QUESTIONS.filter((question) => conditions[question.key] !== undefined).length;
  const latestPlanMessage = [...messages].reverse().find((message) => message.planningConditions);
  const planningConditions = latestPlanMessage?.planningConditions;
  // 여행 짜기를 시작했거나 장소를 담았을 때만 입력창 위에 여행 계획 바를 보여준다
  const isPlanTrayVisible = !planningConditions && (filledConditionCount > 0 || savedPlaces.length > 0);
  const handleCreateItinerary = () => onCreateItinerary(planningConditions, activeConversationId ?? undefined);

  // 상세 보기 등으로 나갔다 돌아오면 보던 자리로: 대화를 열 때 저장해 둔 스크롤 위치를 한 번만 되살린다
  // (서버 캐시가 아니라 이 브라우저 탭의 sessionStorage에 대화별로 기억)
  const pendingScrollRestore = useRef(readSessionState<ChatScrollState | null>(CHAT_SCROLL_KEY, null));
  const handleMessageListScroll = () => {
    const messageList = messageListRef.current;
    if (messageList === null || activeConversationId === null || loadingConversation || pendingScrollRestore.current) return;
    writeSessionState(CHAT_SCROLL_KEY, { conversationId: activeConversationId, top: messageList.scrollTop });
  };

  // 페이지 전체가 아니라 대화 목록만 아래로 스크롤 (scrollIntoView는 페이지까지 움직임)
  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList === null || loadingConversation) return;
    const saved = pendingScrollRestore.current;
    if (saved && messages.length > 0) {
      pendingScrollRestore.current = null;
      if (saved.conversationId === activeConversationId) {
        messageList.scrollTop = saved.top;
        return;
      }
    }
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages, isAiTyping, loadingConversation, activeConversationId]);

  // 답한 질문의 빠른 답변은 잠가서, 지난 버튼을 눌러 대화 순서가 꼬이지 않게 한다
  const lockQuickReplies = (previous: ChatMessage[], answerText: string): ChatMessage[] =>
    previous.map((message) =>
      message.options !== undefined && message.selectedOption === undefined
        ? { ...message, selectedOption: message.options.includes(answerText) ? answerText : '' }
        : message
    );

  const handleSendMessage = async (rawText: string, retry = false) => {
    const userText = rawText.trim();
    if (userText === '' || sendBusy.current || loadingConversation || conversationError || userEmail === null) return;
    if (userText.length > 1000) { setSendError('메시지는 1,000자까지 보낼 수 있어요.'); return; }

    if (userText === CREATE_ITINERARY_OPTION) {
      handleCreateItinerary();
      return;
    }

    const userMessage = createMessage('user', userText);
    const request: ChatRequest = {
      messages: [...messages, userMessage].map((message) => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        text: message.text,
      })),
      conditions,
      savedPlaces: savedPlaces.map(({ savedFrom: _savedFrom, savedAt: _savedAt, ...place }) => place),
    };
    const conversationId = conversationIdRef.current;

    // 데모 모드에서 새 대화의 첫 메시지면 바로 목록 id를 정해, 답을 기다리는 동안에도 질문이 저장되게 한다.
    // 백엔드는 대화방을 서버가 만들고 id를 돌려준다
    let targetConversationId = retry ? failedSend?.conversationId ?? activeConversationId : activeConversationId;
    const requestId = retry && failedSend ? failedSend.requestId : createRequestId();
    if (targetConversationId === null && !IS_SERVER_CHAT) {
      targetConversationId = createId('chat');
      setActiveConversationId(targetConversationId);
    }

    setInputText('');
    if (!retry) setMessages((previous) => [...lockQuickReplies(previous, userText), userMessage]);
    sendBusy.current = true;
    setSendError(null);
    setIsAiTyping(true);

    try {
      const result = await sendConversationMessage({
        conversationId: targetConversationId,
        text: userText,
        request,
        requestId,
        onConversationCreated: (identifier) => {
          targetConversationId = identifier;
          if (conversationId === conversationIdRef.current) { setActiveConversationId(identifier); rememberConversation(identifier); }
        },
      });
      if (conversationId !== conversationIdRef.current) return;
      const { response } = result;
      setActiveConversationId(result.conversationId);
      rememberConversation(result.conversationId);
      setFailedSend(null);
      // 백엔드는 제목·최신순이 서버에서 바뀌므로 목록을 다시 받는다
      if (IS_SERVER_CHAT && userEmail !== null) refreshConversations(userEmail);

      if (response.conditionUpdates !== undefined) {
        setConditions((previous) => ({ ...previous, ...response.conditionUpdates }));
      }
      setMessages((previous) => [
        ...previous,
        createMessage('ai', response.reply, {
          options: response.quickReplies?.length ? response.quickReplies : undefined,
          places: response.places?.length ? response.places : undefined,
          planningConditions: response.planningConditions,
        }),
      ]);
    } catch (error) {
      if (conversationId !== conversationIdRef.current) return;
      const message = error instanceof Error ? error.message : '답변을 받지 못했어요. 잠시 후 다시 보내 주세요.';
      setSendError(message);
      setFailedSend({ text: userText, requestId, conversationId: targetConversationId });
    } finally {
      if (conversationId === conversationIdRef.current) {
        setIsAiTyping(false);
        sendBusy.current = false;
        inputRef.current?.focus();
      }
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSendMessage(inputText);
  };

  // Enter는 보내기, Shift+Enter는 줄바꿈 — 한글 조합 중 Enter는 무시해야 마지막 글자가 두 번 가지 않는다
  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSendMessage(inputText);
    }
  };

  const handleNewConversation = () => {
    conversationIdRef.current += 1;
    setActiveConversationId(null);
    rememberConversation();
    setConversationError(false);
    setLoadingConversation(false);
    setMessages([]);
    setConditions({});
    setIsAiTyping(false);
    setInputText('');
    setSendError(null);
    setFailedSend(null);
    sendBusy.current = false;
    inputRef.current?.focus();
  };

  // 지난 대화 열기 — 답변을 기다리는 중에는 목록 버튼이 막혀 있어서, 받던 답변이 다른 대화로 섞이지 않는다
  const handleOpenConversation = async (conversation: ConversationSummary) => {
    if (userEmail === null) return;
    conversationIdRef.current += 1;
    const openId = conversationIdRef.current;
    setActiveConversationId(conversation.id);
    rememberConversation(conversation.id);
    setLoadingConversation(true);
    setConversationError(false);
    setIsAiTyping(false);
    setInputText('');
    setMessages([]);
    setConditions({});
    setSendError(null);
    setFailedSend(null);
    try {
      const loaded = await loadConversation(userEmail, conversation.id);
      if (openId !== conversationIdRef.current) return; // 그 사이 다른 대화를 열었다
      setMessages(loaded.messages);
      setConditions(loaded.conditions);
    } catch {
      if (openId !== conversationIdRef.current) return;
      setConversationError(true);
    } finally {
      if (openId === conversationIdRef.current) setLoadingConversation(false);
    }
  };

  useEffect(() => {
    if (userEmail && initialConversationId) {
      void handleOpenConversation({ id: initialConversationId, title: '', updatedAt: '' });
    }
  }, [userEmail, initialConversationId]);

  const handleDeleteConversation = async (conversation: ConversationSummary) => {
    if (userEmail === null) return;
    if (!window.confirm(`‘${conversation.title}’ 대화를 삭제할까요?`)) return;
    try {
      await deleteConversation(userEmail, conversation.id);
    } catch {
      window.alert('대화를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setConversations((previous) => previous.filter((item) => item.id !== conversation.id));
    if (conversation.id === activeConversationId) handleNewConversation();
  };

  const handleTogglePlace = (place: ChatPlace) => {
    if (savedPlaces.some((saved) => saved.id === place.id)) {
      savedPlacesStore.remove(place.id);
    } else {
      savedPlacesStore.add(place, 'AI 여행 플래너');
    }
  };

  return (
    <div className="AiPlannerView">

      {/* 로그인해야 쓸 수 있다 — 헤더는 감싸지 않아서 다른 탭으로 이동은 된다 */}
      <LoginGate serviceName="AI 여행 플래너" returnTo={{ route: conversationRoute(initialConversationId ?? activeConversationId ?? undefined) }}>
        <section className="AiPlannerView-Chat" aria-label="AI 여행 플래너 대화">
          {/* 대화 목록 */}
          <aside className="AiPlannerView-History" aria-label="대화 목록">
            <button
              className="AiPlannerView-NewChatButton"
              onClick={handleNewConversation}
              disabled={isAiTyping}
            >
              + 새 대화
            </button>
            <p className="AiPlannerView-HistoryTitle">대화 목록</p>
            {historyError && <p role="status">대화 목록을 불러오지 못했어요. <button onClick={() => userEmail && refreshConversations(userEmail)}>목록 다시 불러오기</button></p>}
            {conversations.length === 0 ? (
              <p className="AiPlannerView-HistoryEmpty">아직 대화가 없어요. 질문을 보내면 여기에 쌓여요.</p>
            ) : (
              <ul className="AiPlannerView-HistoryList">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  return (
                    <li
                      key={conversation.id}
                      className={`AiPlannerView-HistoryItem${isActive ? ' AiPlannerView-HistoryItem--active' : ''}`}
                    >
                      <button
                        className="AiPlannerView-HistoryOpen"
                        onClick={() => handleOpenConversation(conversation)}
                        disabled={isAiTyping}
                        aria-current={isActive ? 'true' : undefined}
                      >
                        <span className="AiPlannerView-HistoryItemTitle">{conversation.title}</span>
                        <span className="AiPlannerView-HistoryItemDate">
                          {formatConversationDate(conversation.updatedAt)}
                        </span>
                      </button>
                      <button
                        className="AiPlannerView-HistoryDelete"
                        onClick={() => handleDeleteConversation(conversation)}
                        disabled={isAiTyping}
                        aria-label={`${conversation.title} 대화 삭제`}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          <div className="AiPlannerView-ChatMain">
            <div className="AiPlannerView-ChatBar">
              <h1 className="AiPlannerView-ChatTitle">
                <span className="AiPlannerView-ChatTitleAvatar" aria-hidden="true">AI</span>
                {conversations.find((conversation) => conversation.id === activeConversationId)?.title ??
                  'AI 여행 플래너'}
              </h1>
            </div>

            <div className="AiPlannerView-MessageList" ref={messageListRef} aria-live="polite" onScroll={handleMessageListScroll}>
              <div className="AiPlannerView-MessageColumn">
                {loadingConversation ? <p role="status">대화를 불러오고 있어요…</p> : conversationError ? <div role="alert">
                  <p>대화를 불러오지 못했어요. 삭제된 대화이거나 연결에 문제가 있을 수 있어요.</p>
                  <button onClick={() => activeConversationId && handleOpenConversation({ id: activeConversationId, title: '', updatedAt: '' })}>대화 다시 불러오기</button>
                </div> : messages.length === 0 ? (
                  <div className="AiPlannerView-Welcome motion-stagger">
                    <span className="AiPlannerView-WelcomeAvatar" aria-hidden="true">AI</span>
                    <h2 className="AiPlannerView-WelcomeTitle">동해선 여행, 무엇이든 물어보세요</h2>
                    <p className="AiPlannerView-WelcomeText">
                      동해시 철도와 관광을 이야기하고, 날짜와 가고 싶은 곳을 정해 여행 계획을 시작해 보세요.
                    </p>

                    {savedPlaces.length > 0 && (
                      <section className="AiPlannerView-WelcomeSaved" aria-label="담아둔 장소">
                        <div className="AiPlannerView-WelcomeSavedHeader">
                          <span className="AiPlannerView-WelcomeSavedTitle">담아둔 장소 {savedPlaces.length}곳</span>
                          <button
                            className="AiPlannerView-WelcomeSavedAction"
                            onClick={() => handleSendMessage(SAVED_PLACES_PLANNING_QUESTION)}
                          >
                            이 장소들로 일정 짜기 →
                          </button>
                        </div>
                        <ul className="AiPlannerView-WelcomeSavedList">
                          {savedPlaces.map((place) => (
                            <li key={place.id} className="AiPlannerView-WelcomeSavedItem">
                              <span className="AiPlannerView-WelcomeSavedName">📍 {place.name}</span>
                              <span className="AiPlannerView-WelcomeSavedFrom">{place.savedFrom}에서</span>
                              <button
                                className="AiPlannerView-WelcomeSavedRemove"
                                onClick={() => savedPlacesStore.remove(place.id)}
                                aria-label={`${place.name} 빼기`}
                              >
                                ×
                              </button>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    <div className="AiPlannerView-WelcomeGrid">
                      {WELCOME_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion.question}
                          className="AiPlannerView-WelcomeCard"
                          onClick={() => handleSendMessage(suggestion.question)}
                        >
                          <span className="AiPlannerView-WelcomeCardTitle">{suggestion.title}</span>
                          <span className="AiPlannerView-WelcomeCardQuestion">“{suggestion.question}”</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((message) =>
                    message.sender === 'ai' ? (
                      <div key={message.id} className="AiPlannerView-AiMessage">
                        <span className="AiPlannerView-AiAvatar" aria-hidden="true">AI</span>
                        <div className="AiPlannerView-AiContent">
                          <p className="AiPlannerView-AiText">{message.text}</p>

                          {message.places !== undefined && (
                            <div className="AiPlannerView-PlaceList">
                              {message.places.map((place) => {
                                const isSaved = savedPlaces.some((saved) => saved.id === place.id);
                                return (
                                  <article key={place.id} className="AiPlannerView-PlaceCard">
                                    <span className="AiPlannerView-PlaceCategory">{place.category}</span>
                                    <h3 className="AiPlannerView-PlaceName">{place.name}</h3>
                                    {place.stationName !== undefined && place.stationName !== place.name && (
                                      <p className="AiPlannerView-PlaceStation">가까운 역 · {place.stationName}</p>
                                    )}
                                    <p className="AiPlannerView-PlaceDescription">{place.description}</p>
                                    {onPlaceDetail && <button className="AiPlannerView-ChoiceButton" onClick={() => onPlaceDetail(place.id, activeConversationId ?? undefined)}>상세 보기 →</button>}
                                    {place.notice !== undefined && (
                                      <p className="AiPlannerView-PlaceNotice">{place.notice}</p>
                                    )}
                                    {place.source !== undefined && (
                                      <p className="AiPlannerView-PlaceSource">출처: {place.source}</p>
                                    )}
                                    <button
                                      className={`AiPlannerView-PlaceButton${isSaved ? ' AiPlannerView-PlaceButton--saved' : ''}`}
                                      onClick={() => handleTogglePlace(place)}
                                      aria-pressed={isSaved}
                                    >
                                      {isSaved ? '✓ 여행에 담음' : '여행에 담기'}
                                    </button>
                                  </article>
                                );
                              })}
                            </div>
                          )}

                          {message.options !== undefined && (
                            <div className="AiPlannerView-ChoiceRow">
                              {message.options.map((option) => (
                                <button
                                  key={option}
                                  className={`AiPlannerView-ChoiceButton${message.selectedOption === option ? ' AiPlannerView-ChoiceButton--selected' : ''}`}
                                  onClick={() => handleSendMessage(option)}
                                  disabled={message.selectedOption !== undefined || isAiTyping}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}
                          {message.planningConditions && <section className="ChatPlanCard" aria-label="대화에서 정리한 여행 조건">
                            <h2>대화에서 정리한 여행 조건</h2>
                            <PlanningSummary conditions={message.planningConditions} placeName={placeName} />
                            {!!getMissingPlanningFields(message.planningConditions).length && <p className="Integration-Note">더 필요한 정보: {getMissingPlanningFields(message.planningConditions).join(', ')}. 대화로 알려 주거나 다음 화면에서 입력할 수 있어요.</p>}
                            {!!getUnsupportedPlanningConditions(message.planningConditions).length && <p className="Integration-Note">현재 자동 생성에서 지원하지 않는 조건: {getUnsupportedPlanningConditions(message.planningConditions).join(', ')}. 다음 화면에서 변경 여부를 확인해요.</p>}
                            {message.id === latestPlanMessage?.id ? <>
                              <button className="AiPlannerView-PlanCreateButton" disabled={isAiTyping || !!failedSend}
                                onClick={() => onCreateItinerary(message.planningConditions, activeConversationId ?? undefined)}>
                                {getMissingPlanningFields(message.planningConditions).length ? '부족한 조건 입력하기 →' : '이 조건으로 일정 확인하기 →'}
                              </button>
                              <p className="Integration-Note">일정은 다음 화면에서 생성해요. 대화를 더 나눈 경우 위 조건에 반영됐는지 확인해 주세요.</p>
                            </> : <p className="Integration-Note">이후에 정리한 조건이 있어요. 가장 최근 조건으로 진행해 주세요.</p>}
                          </section>}
                        </div>
                      </div>
                    ) : (
                      <div key={message.id} className="AiPlannerView-UserMessage">
                        <p className="AiPlannerView-UserBubble">{message.text}</p>
                      </div>
                    )
                  )
                )}

                {isAiTyping && (
                  <div className="AiPlannerView-AiMessage">
                    <span className="AiPlannerView-AiAvatar" aria-hidden="true">AI</span>
                    <p className="AiPlannerView-Typing" aria-label="AI가 답변을 입력하는 중">
                      <span />
                      <span />
                      <span />
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="AiPlannerView-Footer">
              {/* 여행 계획 바 — 챗봇 안의 여행 짜기 기능 현황 */}
              {isPlanTrayVisible && (
                <div className="AiPlannerView-PlanTray" aria-label="여행 계획 현황">
                  <div className="AiPlannerView-PlanTrayInfo">
                    <span className="AiPlannerView-PlanTrayTitle">
                      관심 목록의 장소 · 아직 필수 방문지는 아니에요
                    </span>
                    <div className="AiPlannerView-PlanChips">
                      {!IS_SERVER_CHAT && PLANNER_QUESTIONS.map((question) => {
                        const value = conditions[question.key];
                        return (
                          <span
                            key={question.key}
                            className={`AiPlannerView-PlanChip${value !== undefined ? ' AiPlannerView-PlanChip--filled' : ''}`}
                            title={question.label}
                          >
                            {value ?? question.label}
                          </span>
                        );
                      })}
                      {savedPlaces.map((place) => (
                        <button
                          key={place.id}
                          className="AiPlannerView-PlanChip AiPlannerView-PlanChip--place"
                          onClick={() => handleTogglePlace(place)}
                          aria-label={`${place.name} 빼기`}
                        >
                          📍 {place.name} ×
                        </button>
                      ))}
                    </div>
                  </div>
                  <button className="AiPlannerView-PlanCreateButton" onClick={() => handleSendMessage(SAVED_PLACES_PLANNING_QUESTION)} disabled={isAiTyping || loadingConversation || conversationError}>
                    이 장소로 여행 의논하기
                  </button>
                </div>
              )}

              <form className="AiPlannerView-InputBar" onSubmit={handleSubmit}>
                <textarea
                  ref={inputRef}
                  className="AiPlannerView-Input"
                  rows={1}
                  maxLength={1000}
                  disabled={loadingConversation || conversationError}
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="역, 가볼 곳, 여행 일정을 자유롭게 물어보세요"
                  aria-label="메시지 입력"
                />
                <button
                  type="submit"
                  className="AiPlannerView-SendButton"
                  disabled={inputText.trim() === '' || isAiTyping || loadingConversation || conversationError}
                  aria-label="보내기"
                >
                  ↑
                </button>
              </form>
              {sendError && <p role="alert">{sendError} {failedSend && <button disabled={isAiTyping} onClick={() => { void handleSendMessage(failedSend.text, true); }}>같은 메시지 다시 보내기</button>}</p>}
              <p className="AiPlannerView-Disclaimer">AI 답변은 틀릴 수 있어요. 운행 시간과 장소 정보는 출발 전에 꼭 확인하세요.</p>
            </div>
          </div>
        </section>
      </LoginGate>
    </div>
  );
}
