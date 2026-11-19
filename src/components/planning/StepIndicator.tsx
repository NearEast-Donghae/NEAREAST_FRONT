import './StepIndicator.css';

export type PlanningStep = 1 | 2 | 2.1 | 3 | 4 | 5;

interface StepInfo {
  id: PlanningStep;
  label: string;
}

const STEPS: StepInfo[] = [
  { id: 1,   label: '1 기본 정보' },
  { id: 2,   label: '2 역·열차 선택' },
  { id: 3,   label: '3 일정 구성' },
  { id: 4,   label: '4 빈 시간 추천' },
  { id: 5,   label: '5 완료' },
];

// 2.1(방문할 열차)은 step 2에 속하므로 indicator 상 2로 취급
const resolveIndicatorStep = (currentStep: PlanningStep): number => {
  if (currentStep === 2.1) return 2;
  return currentStep as number;
};

interface StepIndicatorProps {
  currentStep: PlanningStep;
}

const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
  const activeIndex = resolveIndicatorStep(currentStep);

  return (
    <nav className="StepIndicator" aria-label="계획 단계">
      {STEPS.map((step) => {
        const stepNum = step.id as number;
        const isDone    = stepNum < activeIndex;
        const isActive  = stepNum === activeIndex;

        const modifier = isDone ? 'StepIndicator__item--done'
          : isActive ? 'StepIndicator__item--active'
          : 'StepIndicator__item--pending';

        const prefix = isDone ? '✓' : isActive ? '●' : '○';

        return (
          <span key={step.id} className={`StepIndicator__item ${modifier}`}>
            {prefix} {step.label}
          </span>
        );
      })}
    </nav>
  );
};

export default StepIndicator;
