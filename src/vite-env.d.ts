/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAKAO_MAP_KEY?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface Window {
  // 카카오맵 SDK는 공식 타입 정의가 없어서 any로 둔다
  kakao: any;
}
