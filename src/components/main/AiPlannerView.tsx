import React, { useEffect, useRef, useState } from 'react';
import { MainNavTab } from './MapView';
import HeaderActions from '../layout/HeaderActions';
import { sendChatMessage } from '../../api/chat';
import { CREATE_ITINERARY_OPTION, PLANNER_QUESTIONS } from '../../data/plannerQuestions';
import { useSavedPlaces } from '../../hooks/useSavedPlaces';
import { savedPlacesStore } from '../../store/savedPlaces';
import type { ChatMessage, ChatPlace, ChatRequest, PlanConditions } from '../../types/neareast';
import './AiPlannerView.css';

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기'];

// 첫 화면의 추천 질문 — 마지막 것이 여행 짜기 기능으로 들어가는 입구
const WELCOME_SUGGESTIONS = [
  { title: '역 주변 둘러보기', question: '묵호역 근처에 뭐 있어?' },
  { title: '풍경 좋은 곳', question: '바다 보이는 역 추천해줘' },
  { title: '가볼 만한 곳', question: '동해시에서 사진 찍기 좋은 곳 알려줘' },
  { title: '여행 일정 짜기', question: '여행 일정 짜줘' },
];

const SAVED_PLACES_PLANNING_QUESTION = '담아둔 장소로 여행 일정 짜줘';

let messageSequence = 0;
function createMessage(sender: ChatMessage['sender'], text: string, extra: Partial<ChatMessage> = {}): ChatMessage {
  messageSequence += 1;
  return { id: `message-${messageSequence}`, sender, text, ...extra };
}

interface AiPlannerViewProps {
  activeNav: MainNavTab;
  onNavigate: (tab: MainNavTab) => void;
  onCreateItinerary: () => void;
}

export default function AiPlannerView({
  activeNav,
  onNavigate,
  onCreateItinerary,
}: AiPlannerViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conditions, setConditions] = useState<PlanConditions>({});
  // 담은 장소는 대화와 별개로 저장돼서, 새 대화를 시작하거나 여행 계획하기로 가도 남는다
  const savedPlaces = useSavedPlaces();
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [inputText, setInputText] = useState('');

  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // '새 대화' 뒤에 늦게 도착한 이전 대화의 답변을 버리기 위한 번호
  const conversationIdRef = useRef(0);

  const filledConditionCount = PLANNER_QUESTIONS.filter((question) => conditions[question.key] !== undefined).length;
  const isPlanComplete = filledConditionCount === PLANNER_QUESTIONS.length;
  // 여행 짜기를 시작했거나 장소를 담았을 때만 입력창 위에 여행 계획 바를 보여준다
  const isPlanTrayVisible = filledConditionCount > 0 || savedPlaces.length > 0;

  // 페이지 전체가 아니라 대화 목록만 아래로 스크롤 (scrollIntoView는 페이지까지 움직임)
  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList !== null) messageList.scrollTop = messageList.scrollHeight;
  }, [messages, isAiTyping]);

  // 답한 질문의 빠른 답변은 잠가서, 지난 버튼을 눌러 대화 순서가 꼬이지 않게 한다
  const lockQuickReplies = (previous: ChatMessage[], answerText: string): ChatMessage[] =>
    previous.map((message) =>
      message.options !== undefined && message.selectedOption === undefined
        ? { ...message, selectedOption: message.options.includes(answerText) ? answerText : '' }
        : message
    );

  const handleSendMessage = async (rawText: string) => {
    const userText = rawText.trim();
    if (userText === '' || isAiTyping) return;

    if (userText === CREATE_ITINERARY_OPTION) {
      onCreateItinerary();
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

    setInputText('');
    setMessages((previous) => [...lockQuickReplies(previous, userText), userMessage]);
    setIsAiTyping(true);

    try {
      const response = await sendChatMessage(request);
      if (conversationId !== conversationIdRef.current) return;

      if (response.conditionUpdates !== undefined) {
        setConditions((previous) => ({ ...previous, ...response.conditionUpdates }));
      }
      setMessages((previous) => [
        ...previous,
        createMessage('ai', response.reply, {
          options: response.quickReplies?.length ? response.quickReplies : undefined,
          places: response.places?.length ? response.places : undefined,
        }),
      ]);
    } catch {
      if (conversationId !== conversationIdRef.current) return;
      setMessages((previous) => [...previous, createMessage('ai', '답변을 받지 못했어요. 잠시 후 다시 보내 주세요.')]);
    } finally {
      if (conversationId === conversationIdRef.current) {
        setIsAiTyping(false);
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
    setMessages([]);
    setConditions({});
    setIsAiTyping(false);
    setInputText('');
    inputRef.current?.focus();
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
      {/* 상단 메뉴 */}
      <header className="AiPlannerView-Header">
        <button className="AiPlannerView-Logo" onClick={() => onNavigate('철도 지도')}>NEAREAST</button>
        <nav className="AiPlannerView-Nav">
          {NAV_TABS.map((tab) => (
            <button
              key={tab}
              className={`AiPlannerView-NavItem${activeNav === tab ? ' AiPlannerView-NavItem--active' : ''}`}
              onClick={() => onNavigate(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        <HeaderActions />
      </header>

      <section className="AiPlannerView-Chat" aria-label="AI 여행 플래너 대화">
        <div className="AiPlannerView-ChatBar">
          <h1 className="AiPlannerView-ChatTitle">
            <span className="AiPlannerView-ChatTitleAvatar" aria-hidden="true">AI</span>
            AI 여행 플래너
          </h1>
          {messages.length > 0 && (
            <button className="AiPlannerView-NewChatButton" onClick={handleNewConversation}>
              + 새 대화
            </button>
          )}
        </div>

        <div className="AiPlannerView-MessageList" ref={messageListRef} aria-live="polite">
          <div className="AiPlannerView-MessageColumn">
            {messages.length === 0 ? (
              <div className="AiPlannerView-Welcome">
                <span className="AiPlannerView-WelcomeAvatar" aria-hidden="true">AI</span>
                <h2 className="AiPlannerView-WelcomeTitle">동해선 여행, 무엇이든 물어보세요</h2>
                <p className="AiPlannerView-WelcomeText">
                  역과 가볼 곳을 찾아 드리고, 원하면 열차 여행 일정까지 같이 짜 드려요.
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
                  여행 계획 {filledConditionCount}/{PLANNER_QUESTIONS.length}
                </span>
                <div className="AiPlannerView-PlanChips">
                  {PLANNER_QUESTIONS.map((question) => {
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
              <button className="AiPlannerView-PlanCreateButton" onClick={onCreateItinerary} disabled={!isPlanComplete}>
                일정 만들기 →
              </button>
            </div>
          )}

          <form className="AiPlannerView-InputBar" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className="AiPlannerView-Input"
              rows={1}
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="역, 가볼 곳, 여행 일정을 자유롭게 물어보세요"
              aria-label="메시지 입력"
            />
            <button
              type="submit"
              className="AiPlannerView-SendButton"
              disabled={inputText.trim() === '' || isAiTyping}
              aria-label="보내기"
            >
              ↑
            </button>
          </form>
          <p className="AiPlannerView-Disclaimer">AI 답변은 틀릴 수 있어요. 운행 시간과 장소 정보는 출발 전에 꼭 확인하세요.</p>
        </div>
      </section>
    </div>
  );
}
