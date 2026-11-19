import { ReactNode } from 'react';
import StepIndicator, { PlanningStep } from './StepIndicator';
import './PlanningLayout.css';

interface PlanningLayoutProps {
  currentStep: PlanningStep;
  pageTitle: string;
  pageSubtitle: string;
  children: ReactNode;
  navigationSlot: ReactNode;
}

// 계획하기 페이지의 공통 레이아웃: 상단 단계 표시 + 제목 + 콘텐츠 + 하단 버튼
const PlanningLayout = ({
  currentStep,
  pageTitle,
  pageSubtitle,
  children,
  navigationSlot,
}: PlanningLayoutProps) => {
  return (
    <div className="PlanningLayout">
      <StepIndicator currentStep={currentStep} />

      <header className="PlanningLayout__header motion-stagger">
        <h1 className="PlanningLayout__title">{pageTitle}</h1>
        <p className="PlanningLayout__subtitle">{pageSubtitle}</p>
      </header>

      <main className="PlanningLayout__content">{children}</main>

      <footer className="PlanningLayout__navigation">{navigationSlot}</footer>
    </div>
  );
};

export default PlanningLayout;
