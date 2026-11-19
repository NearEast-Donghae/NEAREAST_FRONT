const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// '2026-11-21' → '2026.11.21 (토)'. 형식이 다르면 받은 값을 그대로 돌려준다
export function formatTravelDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (match === null) return isoDate;

  const [, year, month, day] = match;
  // new Date('2026-11-21')은 UTC 기준이라 시간대에 따라 요일이 하루 밀릴 수 있어 연·월·일로 만든다
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return `${year}.${month}.${day} (${WEEKDAY_LABELS[date.getDay()]})`;
}

// '묵호역 · 정동진역' → ['묵호역', '정동진역']
export function splitDotList(text: string): string[] {
  return text
    .split('·')
    .map((item) => item.trim())
    .filter((item) => item !== '');
}
