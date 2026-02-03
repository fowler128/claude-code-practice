import React from 'react';
import { useAssessment } from '../hooks/useAssessment';
import { AssessmentContainer } from '../components/assessment/AssessmentContainer';
import type { AssessmentResponses } from '../types/assessment.types';
import type { FirmProfile } from '../types/firm.types';

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
  const {
    currentStep,
    totalSteps,
    responses,
    firmProfile,
    currentPillar,
    progress,
    isComplete,
    setFirmProfile,
    setResponse,
    nextStep,
    prevStep,
    goToStep,
  } = useAssessment();

  /**
   * Handle assessment submission when complete
   */
  const handleSubmit = () => {
    if (isComplete && firmProfile) {
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
      currentPillar={currentPillar}
      progress={progress}
      isComplete={isComplete}
      onFirmProfileChange={setFirmProfile}
      onResponseChange={setResponse}
      onNext={nextStep}
      onPrev={handleBack}
      onGoToStep={goToStep}
      onSubmit={handleSubmit}
    />
  );
};

export default AssessmentView;
