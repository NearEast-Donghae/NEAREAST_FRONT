import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// 백엔드(NEAREAST_BACK) 주소 — Docker로 띄우면 8012 포트
const BACKEND_URL = process.env.NEAREAST_BACKEND_URL ?? 'http://127.0.0.1:8012';

export default defineConfig({
  plugins: [react()],
  server: {
    // 브라우저는 localhost:5173/api/... 로만 요청하고 Vite가 백엔드로 넘긴다.
    // 출처가 하나라서 백엔드의 로그인 쿠키(SameSite=Lax)가 그대로 동작하고 CORS 설정도 필요 없다.
    proxy: {
      '/api': { target: BACKEND_URL, changeOrigin: true },
    },
  },
  build: {
    rollupOptions: {
      input: { app: resolve(__dirname, 'app.html') },
    },
  },
});
