/**
 * Custom React hooks for the AI Readiness Accelerator application.
 *
 * These hooks provide state management, persistence, and data computation
 * functionality for the assessment workflow.
 *
 * @module hooks
 */

// useLocalStorage - Generic localStorage persistence hook
export { useLocalStorage } from './useLocalStorage';
export type { } from './useLocalStorage'; // No additional types exported

// useAssessment - Assessment workflow state management
export { useAssessment } from './useAssessment';
export type {
  FullAssessmentState,
  AssessmentActions,
  AssessmentComputed,
  UseAssessmentReturn,
} from './useAssessment';

// useResults - Assessment results computation
export { useResults } from './useResults';
export type {
  UseResultsProps,
  UseResultsReturn,
} from './useResults';

// useROICalculator - ROI calculator state and projections
export { useROICalculator } from './useROICalculator';
export type { UseROICalculatorReturn } from './useROICalculator';

// useGeminiSummary - AI-generated executive summaries
export { useGeminiSummary } from './useGeminiSummary';
export type {
  UseGeminiSummaryProps,
  UseGeminiSummaryReturn,
} from './useGeminiSummary';
