import apiClient, { ApiError } from './client';
import { getMockChatResponse } from './mockChat';
import { createConversationTitle, loadConversations, saveConversations } from '../store/chatHistory';
import type {
  ChatConversation,
  ChatMessage,
  ChatPlace,
  ChatRequest,
  ChatResponse,
  PlanConditions,
} from '../types/neareast';

// AI 여행 플래너 대화 — 화면(AiPlannerView)은 이 파일의 함수만 쓴다.
//   VITE_USE_MOCK_CHAT=false : 백엔드(NEAREAST_BACK)의 /conversations 가 대화를 저장하고 답한다
//   그 외(기본값)            : 브라우저 localStorage에 대화를 저장하고 데모 응답(mockChat.ts)으로 답한다
export const IS_SERVER_CHAT = import.meta.env.VITE_USE_MOCK_CHAT === 'false';

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string; // ISO 8601
}

const createLocalId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

// 백엔드는 메시지마다 UUID requestId를 받아, 같은 요청을 다시 보내도 한 번만 처리한다
function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // https·localhost가 아니면 randomUUID가 없어서 같은 형식(UUID v4)으로 직접 만든다
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ── 백엔드 형식 ──

interface BackendConversation {
  id: string;
  title?: string | null;
  updatedAt: string;
}

interface BackendChatResponse {
  reply: string;
  chips?: string[];
  proposals?: { type: 'add' | 'remove'; target: string; reason: string }[];
  sources?: string[];
}

interface BackendMessage {
  id: string;
  role: string; // 'user' | 'assistant'
  content: string;
  status: string;
  response: BackendChatResponse | null;
}

interface BackendPlace {
  id: string;
  name: string;
  kind: 'station' | 'poi' | 'heritage' | 'spot';
}

const PLACE_KIND_LABELS: Record<BackendPlace['kind'], string> = {
  station: '역',
  poi: '가볼 곳',
  heritage: '문화유산',
  spot: '명소',
};

// 챗봇의 장소 제안은 장소 id만 주므로, 이름을 붙이려고 장소 목록(공개 API)을 한 번 받아 둔다
let placesPromise: Promise<Map<string, BackendPlace>> | null = null;
function getPlaceIndex(): Promise<Map<string, BackendPlace>> {
  placesPromise ??= apiClient
    .get<{ places: BackendPlace[] }>('/places')
    .then(({ places }) => new Map(places.map((place) => [place.id, place])))
    .catch(() => {
      placesPromise = null; // 다음에 다시 시도
      return new Map();
    });
  return placesPromise;
}

// 백엔드 답변 → 화면 답변. 'add' 제안은 장소 카드로 보여준다 (조건 추출은 백엔드에 아직 없어서 conditionUpdates는 없음)
async function toChatResponse(response: BackendChatResponse): Promise<ChatResponse> {
  const placeIndex = await getPlaceIndex();
  const places: ChatPlace[] = (response.proposals ?? [])
    .filter((proposal) => proposal.type === 'add')
    .map((proposal) => {
      const place = placeIndex.get(proposal.target);
      return {
        id: proposal.target,
        name: place?.name ?? proposal.target,
        category: place ? PLACE_KIND_LABELS[place.kind] : '장소',
        description: proposal.reason,
        source: response.sources?.length ? response.sources.join(', ') : undefined,
      };
    });
  return { reply: response.reply, quickReplies: response.chips, places };
}

function toFriendlyError(error: unknown): Error {
  if (error instanceof ApiError) {
    if (error.status === 401) return new Error('로그인이 만료됐어요. 다시 로그인해 주세요.');
    if (error.status === 429) return new Error('질문이 너무 많아요. 잠시 후 다시 보내 주세요.');
    if (error.status === 503) return new Error('AI가 잠시 답할 수 없어요. 잠시 후 다시 보내 주세요.');
  }
  return new Error('답변을 받지 못했어요. 잠시 후 다시 보내 주세요.');
}

// ── 화면에서 쓰는 함수 ──

export async function listConversations(email: string): Promise<ConversationSummary[]> {
  if (IS_SERVER_CHAT) {
    const conversations = await apiClient.get<BackendConversation[]>('/conversations?limit=50');
    return conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title ?? '새 대화',
      updatedAt: conversation.updatedAt,
    }));
  }
  return loadConversations(email).map(({ id, title, updatedAt }) => ({ id, title, updatedAt }));
}

// 지난 대화 열기 — 마지막 답변의 빠른 답변만 누를 수 있게, 그 전 답변들의 버튼은 잠가서 돌려준다
export async function loadConversation(
  email: string,
  conversationId: string
): Promise<{ messages: ChatMessage[]; conditions: PlanConditions }> {
  if (!IS_SERVER_CHAT) {
    const stored = loadConversations(email).find((conversation) => conversation.id === conversationId);
    return { messages: stored?.messages ?? [], conditions: stored?.conditions ?? {} };
  }

  const backendMessages = await apiClient.get<BackendMessage[]>(
    `/conversations/${encodeURIComponent(conversationId)}/messages?limit=200`
  );
  const messages = await Promise.all(
    backendMessages.map(async (message): Promise<ChatMessage> => {
      if (message.role === 'user') return { id: message.id, sender: 'user', text: message.content };
      const response = message.response ? await toChatResponse(message.response) : null;
      return {
        id: message.id,
        sender: 'ai',
        text: response?.reply ?? message.content,
        options: response?.quickReplies?.length ? response.quickReplies : undefined,
        places: response?.places?.length ? response.places : undefined,
      };
    })
  );
  const lastAiIndex = messages.map((message) => message.sender).lastIndexOf('ai');
  return {
    messages: messages.map((message, index) =>
      message.options !== undefined && index !== lastAiIndex ? { ...message, selectedOption: '' } : message
    ),
    conditions: {}, // 백엔드는 대화별 여행 조건을 저장하지 않는다
  };
}

// 메시지 보내기 — 새 대화(conversationId: null)면 대화방을 먼저 만들고, 그 id를 같이 돌려준다
export async function sendConversationMessage(params: {
  conversationId: string | null;
  text: string;
  request: ChatRequest;
}): Promise<{ conversationId: string; response: ChatResponse }> {
  if (!IS_SERVER_CHAT) {
    return {
      conversationId: params.conversationId ?? createLocalId('chat'),
      response: await getMockChatResponse(params.request),
    };
  }

  try {
    const conversationId =
      params.conversationId ??
      (await apiClient.post<BackendConversation>('/conversations', { title: createConversationTitle(params.text) })).id;
    const message = await apiClient.post<BackendMessage>(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
      { requestId: createRequestId(), message: params.text.slice(0, 1000) }
    );
    const response = message.response
      ? await toChatResponse(message.response)
      : { reply: message.content };
    return { conversationId, response };
  } catch (error) {
    throw toFriendlyError(error);
  }
}

export async function deleteConversation(email: string, conversationId: string): Promise<void> {
  if (IS_SERVER_CHAT) {
    await apiClient.delete<void>(`/conversations/${encodeURIComponent(conversationId)}`);
    return;
  }
  saveConversations(
    email,
    loadConversations(email).filter((conversation) => conversation.id !== conversationId)
  );
}

// 데모 모드에서만 — 서버가 없으니 대화가 바뀔 때마다 브라우저에 통째로 저장한다.
// 저장했으면 새 목록을, 열어 보기만 해서 내용이 그대로면 null을 돌려준다 (최신순이 흔들리지 않게)
export function saveLocalConversationSnapshot(
  email: string,
  conversationId: string,
  messages: ChatMessage[],
  conditions: PlanConditions
): ConversationSummary[] | null {
  if (IS_SERVER_CHAT || messages.length === 0) return null;
  const stored = loadConversations(email);
  const existing = stored.find((conversation) => conversation.id === conversationId);
  const isUnchanged =
    existing !== undefined &&
    existing.messages.length === messages.length &&
    existing.messages[existing.messages.length - 1]?.id === messages[messages.length - 1]?.id &&
    JSON.stringify(existing.conditions) === JSON.stringify(conditions);
  if (isUnchanged) return null;

  const now = new Date().toISOString();
  const firstQuestion = messages.find((message) => message.sender === 'user')?.text ?? '새 대화';
  const updated: ChatConversation = {
    id: conversationId,
    title: existing?.title ?? createConversationTitle(firstQuestion),
    messages,
    conditions,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  const next = [updated, ...stored.filter((conversation) => conversation.id !== conversationId)];
  saveConversations(email, next);
  return next.map(({ id, title, updatedAt }) => ({ id, title, updatedAt }));
}
