export { default as StepIndicator } from './StepIndicator';
export type { PlanningStep } from './StepIndicator';

export { default as PlanningLayout } from './PlanningLayout';

export { default as Step1BasicInfo } from './Step1BasicInfo';
export type { TravelBasicInfo } from './Step1BasicInfo';

export { default as Step2Stations } from './Step2Stations';

export { default as Step2_1Trains } from './Step2_1Trains';

export { default as Step2A_TrainDetail } from './Step2A_TrainDetail';
export type { TrainDetailInfo, RouteStop } from './Step2A_TrainDetail';

export { default as Step3Schedule } from './Step3Schedule';
export type { ScheduleItem, ScheduleItemType } from './Step3Schedule';

export { default as Step4FreeTime } from './Step4FreeTime';
export type { FreeTimeSlot, ActivitySuggestion, ActivityCategory } from './Step4FreeTime';

export { default as Step5Confirm } from './Step5Confirm';
export type { FinalScheduleItem, TravelSummary } from './Step5Confirm';
