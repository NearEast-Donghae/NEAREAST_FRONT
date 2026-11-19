// 앱에서 쓰는 동해권 역 이름 — 검색할 때 실제 역인지 확인하는 데 쓴다.
// 백엔드 역 API(GET /stations)가 생기면 그 응답으로 바꾼다.
export const KNOWN_STATION_NAMES = [
  '동해역',
  '묵호역',
  '망상역',
  '망상해변역',
  '정동진역',
  '강릉역',
  '삼척역',
  '삼척해변역',
  '추암역',
  '도계역',
  '태백역',
];

// '묵호'처럼 '역'을 빼고 입력해도 찾는다
export function findStationByName(query: string): string | undefined {
  const trimmed = query.trim().replace(/\s+/g, '');
  if (trimmed === '') return undefined;
  return KNOWN_STATION_NAMES.find((name) => name === trimmed || name === `${trimmed}역`);
}
