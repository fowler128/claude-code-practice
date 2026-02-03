import React from 'react';
import { ChevronLeft, ChevronRight, Send, Save } from 'lucide-react';
import { Button } from '../ui';

export interface AssessmentNavigationProps {
  /** Whether the Previous button should be enabled */
  canGoPrev: boolean;
  /** Whether the Next button should be enabled */
  canGoNext: boolean;
  /** Whether this is the last step (shows Submit instead of Next) */
  isLastStep: boolean;
  /** Callback for Previous button */
  onPrev: () => void;
  /** Callback for Next button */
  onNext: () => void;
  /** Callback for Submit button (only used on last step) */
  onSubmit: () => void;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
}

/**
 * AssessmentNavigation provides navigation controls for the assessment flow.
 * Shows Previous/Next buttons with Submit on the final step.
 * Includes an auto-save indicator.
 */
export const AssessmentNavigation: React.FC<AssessmentNavigationProps> = ({
  canGoPrev,
  canGoNext,
  isLastStep,
  onPrev,
  onNext,
  onSubmit,
  isSubmitting = false,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-gray-200">
      {/* Auto-save indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-500 order-2 sm:order-1">
        <Save className="w-4 h-4" aria-hidden="true" />
        <span>Progress auto-saved</span>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center gap-3 order-1 sm:order-2">
        {/* Previous button */}
        <Button
          variant="secondary"
          onClick={onPrev}
          disabled={!canGoPrev}
          aria-label="Go to previous step"
        >
          <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
          Previous
        </Button>

        {/* Next or Submit button */}
        {isLastStep ? (
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={!canGoNext || isSubmitting}
            loading={isSubmitting}
            aria-label="Submit assessment"
          >
            Submit Assessment
            <Send className="w-4 h-4 ml-2" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onNext}
            disabled={!canGoNext}
            aria-label="Go to next step"
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default AssessmentNavigation;
