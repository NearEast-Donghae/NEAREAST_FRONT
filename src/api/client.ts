// 모든 REST 호출이 이 파일을 거치게 해서 베이스 URL·헤더·에러 처리를 한 곳에서 관리한다
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new ApiError(response.status, `${method} ${path} 실패 (${response.status})`);
  }

  // 204 No Content 는 본문이 없어서 json() 이 실패하므로 따로 처리
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export { ApiError };
export default apiClient;
