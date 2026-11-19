/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_KEY?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_MOCK_CHAT?: string; // 'false'면 백엔드 POST /chat 호출, 그 외에는 데모 응답
  readonly VITE_USE_MOCK_AUTH?: string; // 'false'면 백엔드 /auth API 호출, 그 외에는 데모 인증
}

interface Window {
  // 카카오맵 SDK는 공식 타입 정의가 없어서 any로 둔다
  kakao: any;
}
