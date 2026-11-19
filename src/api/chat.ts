import apiClient from './client';
import { getMockChatResponse } from './mockChat';
import type { ChatRequest, ChatResponse } from '../types/neareast';

// 백엔드 POST /chat이 준비되면 .env에 VITE_USE_MOCK_CHAT=false 를 넣는다.
// 그 전(값이 없을 때)에는 같은 형식으로 답하는 데모 응답을 쓴다. 형식: docs/chat-api.md
const USE_MOCK_CHAT = import.meta.env.VITE_USE_MOCK_CHAT !== 'false';

export const sendChatMessage = (request: ChatRequest): Promise<ChatResponse> =>
  USE_MOCK_CHAT ? getMockChatResponse(request) : apiClient.post<ChatResponse>('/chat', request);
