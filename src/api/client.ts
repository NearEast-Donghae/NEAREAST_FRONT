// 모든 REST 호출이 이 파일을 거치게 해서 베이스 URL·헤더·에러 처리를 한 곳에서 관리한다.
// 기본값 '/api/v1'은 Vite 프록시(vite.config.ts)를 거쳐 백엔드로 간다.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

class ApiError extends Error {
  constructor(public status: number, message: string, public detail?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

// 백엔드는 HttpOnly 쿠키로 로그인을 유지하고, 상태를 바꾸는 요청(POST/PUT/PATCH/DELETE)에는
// 로그인·/users/me 응답의 csrfToken을 X-CSRF-Token 헤더로 다시 보내야 한다.
// 토큰은 새로고침하면 사라지는 메모리에만 두고, 시작할 때 /users/me로 다시 받는다.
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  csrfToken = token;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && csrfToken !== null) headers['X-CSRF-Token'] = csrfToken;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include', // 로그인 쿠키를 같이 보낸다
    signal: AbortSignal.timeout(path === '/users/me' ? 8000 : /messages|generations/.test(path) ? 180000 : 20000),
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    if (response.status === 401 && !path.startsWith('/auth/')) {
      setCsrfToken(null);
      window.dispatchEvent(new Event('neareast:session-expired'));
    }
    throw new ApiError(response.status, `${method} ${path} 실패 (${response.status})`, payload?.detail);
  }

  // 204 No Content 는 본문이 없어서 json() 이 실패하므로 따로 처리
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export { ApiError };
export default apiClient;
