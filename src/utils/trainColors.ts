// 열차 종류 색: 코레일 일반여객 색상표 기준 (표에 없는 종류는 기본색)
export const TRAIN_TYPE_COLORS: Record<string, string> = {
  'KTX-이음': '#204080', // KTX
  'ITX-마음': '#555559', // ITX
  'ITX-새마을': '#555559', // ITX
  새마을호: '#0080C0',
  무궁화호: '#E06040',
  누리로: '#004D9F',
  동해선: '#005BAC',
};

export const trainTypeColor = (type: string) => TRAIN_TYPE_COLORS[type] ?? '#55657C';
