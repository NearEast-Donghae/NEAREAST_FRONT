import React from 'react';

// 체크박스 모양 — <input type="checkbox" className="motion-checkbox-input"> 바로 뒤에 둔다.
// 진짜 input은 화면에서만 숨겨 두어 클릭·키보드·스크린리더 동작은 그대로이고, 체크되면 선이 그려진다 (styles/motion.css)
const CheckboxMark: React.FC = () => (
  <span className="motion-checkbox" aria-hidden="true">
    <svg viewBox="0 0 16 16">
      <path d="M3 8.5 L6.5 12 L13 4.5" />
    </svg>
  </span>
);

export default CheckboxMark;
