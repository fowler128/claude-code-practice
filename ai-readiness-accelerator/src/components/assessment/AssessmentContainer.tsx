import React from 'react';
import { Card } from '../ui';
import { PILLAR_DEFINITIONS } from '../../constants/pillars';
import { ProgressIndicator } from './ProgressIndicator';
import { FirmProfileForm, type FirmProfileFormData } from './FirmProfileForm';
import { PillarSection } from './PillarSection';
import { AssessmentNavigation } from './AssessmentNavigation';
import type { QuestionResponse } from './QuestionCard';
import type { PillarId } from '../../types/assessment.types';

/**
 * Map of pillar IDs to responses organized by pillar
 */
export type AssessmentResponses = Record<PillarId, QuestionResponse[]>;

export interface AssessmentContainerProps {
  /** Current step index (0 = profile, 1-6 = pillars) */
  currentStep: number;
  /** Total number of steps (7: profile + 6 pillars) */
  totalSteps: number;
  /** Firm profile data */
  firmProfile: FirmProfileFormData | null;
  /** All assessment responses organized by pillar */
  responses: AssessmentResponses;
  /** Callback when firm profile changes */
  onFirmProfileChange: (profile: FirmProfileFormData) => void;
  /** Callback when a question response changes */
  onResponseChange: (pillarId: PillarId, response: QuestionResponse) => void;
  /** Callback to go to next step */
  onNext: () => void;
  /** Callback to go to previous step */
  onPrev: () => void;
  /** Callback to submit the assessment */
  onSubmit: () => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

/**
 * AssessmentContainer is the main wrapper component for the assessment flow.
 * It renders the progress indicator, form content (profile or pillar section),
 * and navigation controls.
 */
export const AssessmentContainer: React.FC<AssessmentContainerProps> = ({
  currentStep,
  totalSteps,
  firmProfile,
  responses,
  onFirmProfileChange,
  onResponseChange,
  onNext,
  onPrev,
  onSubmit,
  isSubmitting = false,
}) => {
  // Get pillar names for progress indicator
  const pillarNames = PILLAR_DEFINITIONS.map((p) => p.name);

  // Determine which pillar to show (if not on profile step)
  const currentPillarIndex = currentStep - 1; // Step 1 = pillar index 0
  const currentPillar =
    currentStep > 0 && currentStep <= PILLAR_DEFINITIONS.length
      ? PILLAR_DEFINITIONS[currentPillarIndex]
      : null;

  // Get responses for current pillar
  const currentPillarResponses =
    currentPillar && currentPillar.id
      ? responses[currentPillar.id as PillarId] || []
      : [];

  // Determine navigation state
  const canGoPrev = currentStep > 0;

  // For profile step: require name and at least one practice area
  const isProfileValid =
    firmProfile !== null &&
    firmProfile.firmName.trim() !== '' &&
    firmProfile.practiceAreas.length > 0;

  // For pillar steps: allow navigation even if not all questions answered
  // (they can always go back and answer more)
  const isPillarStep = currentStep > 0 && currentStep <= PILLAR_DEFINITIONS.length;
  const canGoNext = currentStep === 0 ? isProfileValid : true;

  const isLastStep = currentStep === totalSteps - 1;

  // Handle response change for current pillar
  const handleResponseChange = (response: QuestionResponse) => {
    if (currentPillar && currentPillar.id) {
      onResponseChange(currentPillar.id as PillarId, response);
    }
  };

  return (
    <Card padding="lg" className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <ProgressIndicator
          currentStep={currentStep}
          totalSteps={totalSteps}
          pillarNames={pillarNames}
        />
      </div>

      {/* Main content area */}
      <div className="min-h-[400px]">
        {currentStep === 0 ? (
          <FirmProfileForm profile={firmProfile} onChange={onFirmProfileChange} />
        ) : currentPillar ? (
          <PillarSection
            pillar={currentPillar}
            responses={currentPillarResponses}
            onResponseChange={handleResponseChange}
          />
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Invalid step</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-8">
        <AssessmentNavigation
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          isLastStep={isLastStep}
          onPrev={onPrev}
          onNext={onNext}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </Card>
  );
};

export default AssessmentContainer;
