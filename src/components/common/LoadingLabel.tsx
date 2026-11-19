import React from 'react';

interface LoadingLabelProps {
  isLoading: boolean;
  loadingText: string;
  children: React.ReactNode;
}

// 버튼 글자 — 처리 중이면 회전하는 로딩 표시와 '…중' 문구를 보여준다 (styles/motion.css)
const LoadingLabel: React.FC<LoadingLabelProps> = ({ isLoading, loadingText, children }) =>
  isLoading ? (
    <span className="motion-loading-label">
      <span className="motion-spinner" aria-hidden="true" />
      {loadingText}
    </span>
  ) : (
    <>{children}</>
  );

export default LoadingLabel;
