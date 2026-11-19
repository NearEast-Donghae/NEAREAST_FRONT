import React, { useEffect, useRef, useState } from 'react';
import { MainNavTab } from './MapView';
import MyTripsButton from '../layout/MyTripsButton';
import type { ChatMessage, PlanConditionKey } from '../../types/neareast';
import './AiPlannerView.css';

const NAV_TABS: MainNavTab[] = ['철도 지도', '열차 정보', 'AI 여행 플래너', '여행 계획하기'];

interface PlannerQuestion {
  key: PlanConditionKey;
  label: string;
  question: string;
  options: string[];
}

// 아직 AI 백엔드가 없어서 정해진 순서로 묻는다 — 백엔드가 생기면 handleSendAnswer에서 API 응답을 쓰면 된다
const PLANNER_QUESTIONS: PlannerQuestion[] = [
  {
    key: 'travelDate',
    label: '여행 날짜',
    question: '언제 떠나실 건가요?',
    options: ['이번 주 주말', '다음 주 주말', '직접 입력할게요'],
  },
  {
    key: 'travelDuration',
    label: '여행 시간',
    question: '여행 시간은 어느 정도로 생각하세요?',
    options: ['반나절 (약 4시간)', '하루 (약 8시간)', '1박 2일'],
  },
  {
    key: 'departureStation',
    label: '출발지',
    question: '어느 역에서 출발하세요?',
    options: ['동해역', '묵호역', '정동진역', '강릉역'],
  },
  {
    key: 'arrivalStation',
    label: '도착지',
    question: '여행은 어느 역에서 마칠까요?',
    options: ['출발역으로 돌아오기', '동해역', '삼척해변역', '강릉역'],
  },
  {
    key: 'requiredStop',
    label: '중간 방문역',
    question: '중간에 꼭 들르고 싶은 역이 있나요?',
    options: ['망상해변역', '추암역', '정동진역', '없어요'],
  },
];

const FREE_INPUT_OPTION = '직접 입력할게요';
const RETURN_TO_DEPARTURE_OPTION = '출발역으로 돌아오기';
const NO_STOP_OPTION = '없어요';
const CREATE_ITINERARY_OPTION = '일정 만들기 →';
const ACKNOWLEDGEMENTS = ['좋아요!', '알겠어요.', '확인했어요.', '좋은 선택이에요.'];
// 실제 AI처럼 바로 답하지 않고 잠깐 입력 중 표시를 보여준다
const AI_REPLY_DELAY_MS = 700;

type PlannerAnswers = Partial<Record<PlanConditionKey, string>>;

let messageSequence = 0;
function createMessage(sender: ChatMessage['sender'], text: string, options?: string[]): ChatMessage {
  messageSequence += 1;
  return { id: `message-${messageSequence}`, sender, text, options };
}

function createInitialMessages(): ChatMessage[] {
  return [
    createMessage('ai', '안녕하세요! 동해선 철도 여행 일정을 같이 만들어 볼게요. 다섯 가지만 여쭤볼게요.'),
    createMessage('ai', PLANNER_QUESTIONS[0].question, PLANNER_QUESTIONS[0].options),
  ];
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
  const [messages, setMessages] = useState<ChatMessage[]>(createInitialMessages);
  const [answers, setAnswers] = useState<PlannerAnswers>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [inputText, setInputText] = useState('');

  const messageListRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const replyTimerRef = useRef<number | null>(null);

  const isComplete = currentStepIndex >= PLANNER_QUESTIONS.length;

  // 페이지 전체가 아니라 대화 목록만 아래로 스크롤 (scrollIntoView는 페이지까지 움직임)
  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList !== null) messageList.scrollTop = messageList.scrollHeight;
  }, [messages, isAiTyping]);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current);
    };
  }, []);

  const replyAsAi = (message: ChatMessage) => {
    setIsAiTyping(true);
    replyTimerRef.current = window.setTimeout(() => {
      setMessages((previous) => [...previous, message]);
      setIsAiTyping(false);
      replyTimerRef.current = null;
    }, AI_REPLY_DELAY_MS);
  };

  // 답한 질문의 선택지는 잠가서, 지난 질문의 버튼을 눌러 순서가 꼬이지 않게 한다
  const lockLastQuestion = (previous: ChatMessage[], answerText: string): ChatMessage[] => {
    const lastQuestionIndex = previous.map((message) => message.options !== undefined).lastIndexOf(true);
    if (lastQuestionIndex === -1) return previous;
    return previous.map((message, index) =>
      index === lastQuestionIndex && message.selectedOption === undefined
        ? { ...message, selectedOption: answerText }
        : message
    );
  };

  const handleSendAnswer = (rawText: string) => {
    const answerText = rawText.trim();
    if (answerText === '' || isAiTyping) return;

    if (answerText === CREATE_ITINERARY_OPTION) {
      onCreateItinerary();
      return;
    }

    setInputText('');
    setMessages((previous) => [...lockLastQuestion(previous, answerText), createMessage('user', answerText)]);

    if (isComplete) {
      replyAsAi(
        createMessage(
          'ai',
          '지금은 여행 조건을 모으는 것까지 도와드릴 수 있어요. 조건을 바꾸려면 ‘다시 시작’을 눌러 주세요.',
          [CREATE_ITINERARY_OPTION]
        )
      );
      return;
    }

    const currentQuestion = PLANNER_QUESTIONS[currentStepIndex];

    if (answerText === FREE_INPUT_OPTION) {
      replyAsAi(createMessage('ai', '좋아요. 아래 입력창에 날짜를 적어 주세요. (예: 11월 28일 토요일)'));
      inputRef.current?.focus();
      return;
    }

    const savedValue =
      currentQuestion.key === 'arrivalStation' && answerText === RETURN_TO_DEPARTURE_OPTION
        ? answers.departureStation ?? answerText
        : answerText;
    setAnswers((previous) => ({ ...previous, [currentQuestion.key]: savedValue }));

    const nextStepIndex = currentStepIndex + 1;
    setCurrentStepIndex(nextStepIndex);

    const acknowledgement = ACKNOWLEDGEMENTS[currentStepIndex % ACKNOWLEDGEMENTS.length];
    const nextQuestion = PLANNER_QUESTIONS[nextStepIndex];
    replyAsAi(
      nextQuestion === undefined
        ? createMessage(
            'ai',
            `${acknowledgement} 여행 조건을 모두 정리했어요. 오른쪽 ‘여행 조건 입력 현황’을 확인하고 일정을 만들어 보세요.`,
            [CREATE_ITINERARY_OPTION]
          )
        : createMessage('ai', `${acknowledgement} ${nextQuestion.question}`, nextQuestion.options)
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    handleSendAnswer(inputText);
  };

  const handleRestart = () => {
    if (replyTimerRef.current !== null) window.clearTimeout(replyTimerRef.current);
    replyTimerRef.current = null;
    setMessages(createInitialMessages());
    setAnswers({});
    setCurrentStepIndex(0);
    setIsAiTyping(false);
    setInputText('');
  };

  // 사이드바의 '선택한 역'은 대화에서 고른 역으로 채운다
  const selectedStations = [answers.departureStation, answers.requiredStop, answers.arrivalStation].filter(
    (station, index, all): station is string =>
      station !== undefined && station !== NO_STOP_OPTION && all.indexOf(station) === index
  );
  // 열차는 아직 대화로 묻지 않아서 피그마 예시 값을 둔다
  const selectedTrains = ['무궁화호'];

  const inputPlaceholder = isComplete
    ? '조건 입력이 끝났어요. 궁금한 점을 적어 보세요.'
    : `${PLANNER_QUESTIONS[currentStepIndex].label} — 위 버튼을 고르거나 직접 입력하세요`;

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
        <MyTripsButton />
      </header>

      {/* 페이지 제목 */}
      <h1 className="AiPlannerView-PageTitle">AI 여행 플래너</h1>

      {/* 대화창 */}
      <section className="AiPlannerView-Chat" aria-label="AI 여행 플래너 대화">
        <div className="AiPlannerView-ChatTop">
          <ol className="AiPlannerView-StepTabs" aria-label="입력 단계">
            {PLANNER_QUESTIONS.map((question, index) => {
              const stepState =
                index < currentStepIndex ? 'done' : index === currentStepIndex ? 'active' : 'pending';
              return (
                <li
                  key={question.key}
                  className={`AiPlannerView-StepTab AiPlannerView-StepTab--${stepState}`}
                  aria-current={stepState === 'active' ? 'step' : undefined}
                >
                  <span className="AiPlannerView-StepNumber">{stepState === 'done' ? '✓' : index + 1}</span>
                  <span className="AiPlannerView-StepLabel">{question.label}</span>
                </li>
              );
            })}
          </ol>
          <button className="AiPlannerView-RestartButton" onClick={handleRestart}>
            다시 시작
          </button>
        </div>

        <div className="AiPlannerView-MessageList" ref={messageListRef} aria-live="polite">
          {messages.map((message) =>
            message.sender === 'ai' ? (
              <div key={message.id} className="AiPlannerView-AiMessage">
                <span className="AiPlannerView-AiAvatar" aria-hidden="true">AI</span>
                <div className="AiPlannerView-AiContent">
                  <p className="AiPlannerView-AiBubble">{message.text}</p>
                  {message.options !== undefined && (
                    <div className="AiPlannerView-ChoiceRow">
                      {message.options.map((option) => {
                        const isLocked = message.selectedOption !== undefined;
                        return (
                          <button
                            key={option}
                            className={`AiPlannerView-ChoiceButton${message.selectedOption === option ? ' AiPlannerView-ChoiceButton--selected' : ''}`}
                            onClick={() => handleSendAnswer(option)}
                            disabled={isLocked || isAiTyping}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div key={message.id} className="AiPlannerView-UserMessage">
                <p className="AiPlannerView-UserBubble">{message.text}</p>
              </div>
            )
          )}

          {isAiTyping && (
            <div className="AiPlannerView-AiMessage">
              <span className="AiPlannerView-AiAvatar" aria-hidden="true">AI</span>
              <p className="AiPlannerView-AiBubble AiPlannerView-Typing" aria-label="AI가 답변을 입력하는 중">
                <span />
                <span />
                <span />
              </p>
            </div>
          )}
        </div>

        <form className="AiPlannerView-InputBar" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="AiPlannerView-Input"
            type="text"
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            placeholder={inputPlaceholder}
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
      </section>

      {/* 우측 사이드바 — 선택한 역과 열차 */}
      <aside className="AiPlannerView-Sidebar">
        <div className="AiPlannerView-SidebarSection">
          <div className="AiPlannerView-SidebarHeader">
            <span className="AiPlannerView-SidebarTitle">선택한 역과 열차</span>
            <button className="AiPlannerView-EditButton">편집</button>
          </div>
          <div className="AiPlannerView-SidebarStations">
            <span className="AiPlannerView-SidebarLabel">역 ({selectedStations.length})</span>
            <div className="AiPlannerView-TagRow">
              {selectedStations.length === 0 ? (
                <span className="AiPlannerView-TagPlaceholder">대화에서 역을 고르면 여기에 담겨요</span>
              ) : (
                selectedStations.map((station) => (
                  <span key={station} className="AiPlannerView-Tag">
                    {station}
                  </span>
                ))
              )}
            </div>
          </div>
          <div className="AiPlannerView-SidebarTrains">
            <span className="AiPlannerView-SidebarLabel">열차 ({selectedTrains.length})</span>
            <div className="AiPlannerView-TagRow">
              {selectedTrains.map((train) => (
                <span key={train} className="AiPlannerView-Tag">
                  {train}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 여행 조건 입력 현황 — 대화가 진행되면 바로 채워진다 */}
        <div className="AiPlannerView-ConditionBox">
          <span className="AiPlannerView-ConditionTitle">여행 조건 입력 현황</span>
          <ul className="AiPlannerView-ConditionList">
            {PLANNER_QUESTIONS.map((question, index) => {
              const answer = answers[question.key];
              const value = answer ?? (index === currentStepIndex ? '입력 중...' : '-');
              return (
                <li key={question.key} className="AiPlannerView-ConditionItem">
                  <span
                    className={`AiPlannerView-ConditionIcon${answer !== undefined ? ' AiPlannerView-ConditionIcon--filled' : ''}`}
                  />
                  <span className="AiPlannerView-ConditionKey">{question.label}</span>
                  <span className="AiPlannerView-ConditionValue">{value}</span>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 일정 만들기 버튼 */}
        <button className="AiPlannerView-CreateButton" onClick={onCreateItinerary} disabled={!isComplete}>
          {isComplete ? '일정 만들기 →' : `조건 ${currentStepIndex}/${PLANNER_QUESTIONS.length} 입력됨`}
        </button>
      </aside>
    </div>
  );
}
