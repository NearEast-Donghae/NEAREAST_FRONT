import type { ChatConversation } from '../types/neareast';

// AI 여행 플래너 대화 목록 — 계정(이메일)별로 따로 보관한다.
// 백엔드 연결 전까지는 브라우저 localStorage에 둔다. 백엔드가 생기면 GET/PUT/DELETE /chats 로 바꾼다.

// 브라우저 저장 공간이 넉넉하지 않아서 오래된 대화부터 버린다
const MAX_CONVERSATIONS = 50;

const storageKeyOf = (email: string) => `neareast.chatHistory.${email}`;

export function loadConversations(email: string): ChatConversation[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKeyOf(email)) ?? '[]');
    return Array.isArray(parsed) ? (parsed as ChatConversation[]) : [];
  } catch {
    return [];
  }
}

export function saveConversations(email: string, conversations: ChatConversation[]): void {
  try {
    localStorage.setItem(storageKeyOf(email), JSON.stringify(conversations.slice(0, MAX_CONVERSATIONS)));
  } catch {
    // 저장이 막혀도 이번 방문 동안은 화면에 목록이 남는다
  }
}

// 대화 목록 제목 — 첫 질문을 짧게 자른다
const TITLE_MAX_LENGTH = 24;
export function createConversationTitle(firstQuestion: string): string {
  const title = firstQuestion.trim().replace(/\s+/g, ' ');
  return title.length > TITLE_MAX_LENGTH ? `${title.slice(0, TITLE_MAX_LENGTH)}…` : title;
}

// 목록에 보여줄 날짜 — 오늘이면 시각, 어제면 '어제', 그 전이면 월.일
export function formatConversationDate(isoDate: string, now = new Date()): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (date.getTime() >= startOfToday) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  if (date.getTime() >= startOfToday - dayMs) return '어제';
  return `${date.getMonth() + 1}.${date.getDate()}`;
}
