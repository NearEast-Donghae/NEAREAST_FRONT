import { CREATE_ITINERARY_OPTION, PLANNER_QUESTIONS } from '../data/plannerQuestions';
import type { ChatPlace, ChatRequest, ChatResponse, PlanConditions } from '../types/neareast';

// 백엔드 /chat이 생기기 전까지 쓰는 데모 응답.
// 진짜 AI가 아니라서 자유 질문에는 장소를 지어내지 않고, 연결 전이라고 솔직하게 답한다.
// 여행 짜기는 사용자가 원할 때('일정 짜줘' 등)만 시작한다.

const MOCK_REPLY_DELAY_MS = 700;
const FREE_INPUT_OPTION = '직접 입력할게요';
const FREE_INPUT_HINT = '좋아요. 아래 입력창에 날짜를 적어 주세요. (예: 11월 28일 토요일)';
const RETURN_TO_DEPARTURE_OPTION = '출발역으로 돌아오기';
const START_PLANNING_OPTION = '여행 일정 짜줘';
const ACKNOWLEDGEMENTS = ['좋아요!', '알겠어요.', '확인했어요.', '좋은 선택이에요.'];
const KNOWN_STATIONS = ['동해역', '묵호역', '정동진역', '강릉역', '삼척역', '삼척해변역', '망상해변역', '추암역'];
const STATION_KEYS = new Set(['departureStation', 'arrivalStation', 'requiredStop']);

const PLANNING_PATTERN = /일정|코스|계획|플랜|여행.*짜|짜\s*줘/;
// '추천해줘', '알려줘'처럼 부탁하는 말도 질문으로 본다
const QUESTION_PATTERN = /[?？]|어디|알려|추천|뭐|무엇|있어|있나|어때|어떻게|궁금|줘|주세요/;
const DURATION_KEYWORDS: [RegExp, string][] = [
  [/반나절/, '반나절 (약 4시간)'],
  [/1박|일박/, '1박 2일'],
  [/하루|당일/, '하루 (약 8시간)'],
];

const wait = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

// '역'을 뺀 짧은 이름으로 찾으면 '동해시'가 동해역으로, '삼척해변'이 삼척역으로 잡혀서 전체 이름으로만 찾는다
const findStation = (text: string) =>
  [...KNOWN_STATIONS].sort((a, b) => b.length - a.length).find((station) => text.includes(station));

const findNextQuestion = (conditions: PlanConditions) =>
  PLANNER_QUESTIONS.find((question) => conditions[question.key] === undefined);

function createStationCard(stationName: string): ChatPlace {
  return {
    id: `station-${stationName}`,
    name: stationName,
    category: '역',
    stationName,
    description: '데모 카드예요. 백엔드가 연결되면 이 역의 실제 정보와 주변 장소가 표시돼요.',
    source: '데모 응답',
  };
}

// 여행 짜기 중이면 다음 조건 질문을 이어 붙인다
function continuePlanning(reply: string, conditions: PlanConditions, extra: Partial<ChatResponse> = {}): ChatResponse {
  const nextQuestion = findNextQuestion(conditions);
  if (nextQuestion === undefined) {
    return {
      reply: `${reply} 여행 조건을 모두 정리했어요. 아래 ‘일정 만들기’를 누르면 추천 일정을 비교해 볼 수 있어요.`,
      quickReplies: [CREATE_ITINERARY_OPTION],
      ...extra,
    };
  }
  return { reply: `${reply} ${nextQuestion.question}`, quickReplies: nextQuestion.options, ...extra };
}

export async function getMockChatResponse(request: ChatRequest): Promise<ChatResponse> {
  await wait(MOCK_REPLY_DELAY_MS);

  const { conditions } = request;
  const userText = request.messages[request.messages.length - 1]?.text.trim() ?? '';
  const previousAiText = request.messages[request.messages.length - 2]?.text ?? '';
  const nextQuestion = findNextQuestion(conditions);

  // 바로 앞에서 여행 조건을 물었으면, 이번 메시지는 그 답일 가능성이 높다
  const isAwaitingAnswer =
    previousAiText === FREE_INPUT_HINT ||
    (nextQuestion !== undefined && previousAiText.endsWith(nextQuestion.question));
  const isPlanning = Object.keys(conditions).length > 0 || isAwaitingAnswer;

  if (userText === FREE_INPUT_OPTION) {
    return { reply: FREE_INPUT_HINT };
  }

  // 1. 여행 짜기 요청 — 문장 속 여행 시간은 바로 채운다 ('반나절 코스로 짜줘')
  if (PLANNING_PATTERN.test(userText)) {
    const durationMatch = DURATION_KEYWORDS.find(([pattern]) => pattern.test(userText));
    const conditionUpdates: PlanConditions = durationMatch ? { travelDuration: durationMatch[1] } : {};
    const savedPlaceNames = (request.savedPlaces ?? []).map((place) => place.name);
    const savedPlacesNote =
      savedPlaceNames.length > 0 ? ` 담아두신 ${savedPlaceNames.join(', ')}도 일정에 넣을게요.` : '';
    const opening = `${isPlanning ? '네, 이어서 일정을 짜 볼게요.' : '좋아요, 같이 여행 일정을 짜 볼게요.'}${savedPlacesNote}`;
    return continuePlanning(opening, { ...conditions, ...conditionUpdates }, {
      conditionUpdates: durationMatch ? conditionUpdates : undefined,
    });
  }

  // 2. 자유 질문
  const isQuestion = QUESTION_PATTERN.test(userText) && previousAiText !== FREE_INPUT_HINT;
  if (isQuestion) {
    const mentionedStation = findStation(userText);
    const answer = mentionedStation
      ? `${mentionedStation}에 대해 물어보셨군요. 지금은 데모 응답이라 역 카드만 보여드릴 수 있어요. 백엔드 AI가 연결되면 주변 볼거리와 실제 정보를 알려 드려요.`
      : `‘${userText}’\n\n이 질문에는 AI가 연결되면 동해시 장소 데이터를 찾아 답해 드릴 수 있어요. 지금은 데모 응답이라 실제 정보를 드리지 못해요.`;
    const places = mentionedStation ? [createStationCard(mentionedStation)] : undefined;

    if (isPlanning) {
      return continuePlanning(`${answer}\n\n그럼 일정 짜기를 이어서 할게요.`, conditions, { places });
    }
    return { reply: `${answer}\n\n이 여행으로 일정도 짜 드릴까요?`, places, quickReplies: [START_PLANNING_OPTION] };
  }

  // 3. 여행 조건에 대한 답
  if (isAwaitingAnswer && nextQuestion !== undefined) {
    let answer = STATION_KEYS.has(nextQuestion.key) ? findStation(userText) ?? userText : userText;
    if (nextQuestion.key === 'arrivalStation' && userText === RETURN_TO_DEPARTURE_OPTION) {
      answer = conditions.departureStation ?? userText;
    }
    const conditionUpdates: PlanConditions = { [nextQuestion.key]: answer };
    const acknowledgement = ACKNOWLEDGEMENTS[Object.keys(conditions).length % ACKNOWLEDGEMENTS.length];
    return continuePlanning(acknowledgement, { ...conditions, ...conditionUpdates }, { conditionUpdates });
  }

  // 4. 그 밖의 말
  if (nextQuestion === undefined) {
    return {
      reply: '여행 조건은 모두 받았어요. 바꾸고 싶은 조건이 있으면 ‘새 대화’로 다시 시작해 주세요.',
      quickReplies: [CREATE_ITINERARY_OPTION],
    };
  }
  return {
    reply: '지금은 데모 응답이라 자세한 대화는 어려워요. 동해선 역이나 가볼 곳을 물어보시거나, 여행 일정을 같이 짜 볼까요?',
    quickReplies: [START_PLANNING_OPTION, '묵호역 근처에 뭐 있어?'],
  };
}
