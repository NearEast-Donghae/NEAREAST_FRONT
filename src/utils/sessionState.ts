export function readSessionState<T>(key: string, fallback: T): T {
  try { return JSON.parse(sessionStorage.getItem(key) ?? 'null') ?? fallback; }
  catch { return fallback; }
}

export function writeSessionState(key: string, value: unknown): void {
  try { sessionStorage.setItem(key, JSON.stringify(value)); }
  catch { /* 저장소를 사용할 수 없어도 화면 입력은 유지한다. */ }
}
