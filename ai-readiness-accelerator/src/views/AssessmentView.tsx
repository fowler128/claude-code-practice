import React, { useCallback } from 'react';
import { useAssessment } from '../hooks/useAssessment';
import { AssessmentContainer } from '../components/assessment/AssessmentContainer';
import type { AssessmentResponses, PillarId } from '../types/assessment.types';
import type { FirmProfile } from '../types/firm.types';
import type { QuestionResponse } from '../components/assessment/QuestionCard';

export interface AssessmentViewProps {
  /** Callback when assessment is completed */
  onComplete: (data: { responses: AssessmentResponses; firmProfile: FirmProfile }) => void;
  /** Callback when user navigates back */
  onBack: () => void;
}

/**
 * Assessment view that orchestrates the multi-step assessment flow.
 * Uses useAssessment hook for state management and renders AssessmentContainer.
 */
export const AssessmentView: React.FC<AssessmentViewProps> = ({ onComplete, onBack }) => {
  const { state, actions } = useAssessment();

  const { currentStep, responses, firmProfile } = state;
  const { setFirmProfile, setResponse, nextStep, prevStep, complete } = actions;

  // Total steps: 0 = firm profile, 1-6 = pillars
  const totalSteps = 7;

  /**
   * Adapt the response change handler to match AssessmentContainer's expected signature
   */
  const handleResponseChange = useCallback(
    (pillarId: PillarId, response: QuestionResponse) => {
      setResponse(pillarId, response.questionId, response.value);
    },
    [setResponse]
  );

  /**
   * Handle assessment submission when complete
   */
  const handleSubmit = () => {
    if (firmProfile) {
      complete();
      onComplete({
        responses,
        firmProfile,
      });
    }
  };

  /**
   * Handle back navigation - either go to previous step or exit assessment
   */
  const handleBack = () => {
    if (currentStep === 0) {
      onBack();
    } else {
      prevStep();
    }
  };

  return (
    <AssessmentContainer
      currentStep={currentStep}
      totalSteps={totalSteps}
      responses={responses}
      firmProfile={firmProfile}
      onFirmProfileChange={setFirmProfile}
      onResponseChange={handleResponseChange}
      onNext={nextStep}
      onPrev={handleBack}
      onSubmit={handleSubmit}
    />
  );
};

export default AssessmentView;
