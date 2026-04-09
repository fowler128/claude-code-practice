import React from 'react';
import { Check, Building2 } from 'lucide-react';

export interface ProgressIndicatorProps {
  /** Current step index (0 = profile, 1-6 = pillars) */
  currentStep: number;
  /** Total number of steps (typically 7: profile + 6 pillars) */
  totalSteps: number;
  /** Names of the pillars for steps 1-6 */
  pillarNames: string[];
}

/**
 * ProgressIndicator displays a visual step indicator for the assessment flow.
 * Shows circles connected by lines, with completed steps having checkmarks.
 * Responsive: labels hidden on mobile, shown on desktop.
 */
export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  pillarNames,
}) => {
  // Generate step labels (Profile + pillar names)
  const stepLabels = ['Profile', ...pillarNames];

  // Determine step states
  const getStepState = (stepIndex: number): 'completed' | 'current' | 'upcoming' => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full" role="navigation" aria-label="Assessment progress">
      {/* Current step name - mobile and desktop */}
      <div className="mb-4 text-center sm:hidden">
        <span className="text-sm text-gray-500">
          Step {currentStep + 1} of {totalSteps}
        </span>
        <h3 className="text-lg font-medium text-gray-900">
          {stepLabels[currentStep] || `Step ${currentStep + 1}`}
        </h3>
      </div>

      {/* Progress bar - mobile */}
      <div className="sm:hidden mb-4">
        <div className="relative">
          <div className="overflow-hidden h-2 bg-gray-200 rounded-full">
            <div
              className="h-full bg-primary-600 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
              role="progressbar"
              aria-valuenow={currentStep + 1}
              aria-valuemin={1}
              aria-valuemax={totalSteps}
              aria-label={`Progress: ${currentStep + 1} of ${totalSteps} steps`}
            />
          </div>
        </div>
      </div>

      {/* Step circles with connecting lines - desktop */}
      <div className="hidden sm:block">
        <nav aria-label="Progress steps">
          <ol className="flex items-center justify-between">
            {Array.from({ length: totalSteps }).map((_, index) => {
              const state = getStepState(index);
              const label = stepLabels[index] || `Step ${index + 1}`;
              const isLast = index === totalSteps - 1;

              return (
                <li key={index} className="flex-1 flex items-center">
                  {/* Step circle and label container */}
                  <div className="flex flex-col items-center">
                    {/* Circle */}
                    <div
                      className={`
                        relative flex items-center justify-center
                        w-10 h-10 rounded-full border-2
                        transition-all duration-200
                        ${
                          state === 'completed'
                            ? 'bg-primary-600 border-primary-600'
                            : state === 'current'
                            ? 'bg-white border-primary-600'
                            : 'bg-white border-gray-300'
                        }
                      `.trim()}
                      aria-current={state === 'current' ? 'step' : undefined}
                    >
                      {state === 'completed' ? (
                        <Check
                          className="w-5 h-5 text-white"
                          aria-hidden="true"
                        />
                      ) : index === 0 ? (
                        <Building2
                          className={`w-5 h-5 ${
                            state === 'current' ? 'text-primary-600' : 'text-gray-400'
                          }`}
                          aria-hidden="true"
                        />
                      ) : (
                        <span
                          className={`text-sm font-medium ${
                            state === 'current' ? 'text-primary-600' : 'text-gray-500'
                          }`}
                        >
                          {index}
                        </span>
                      )}
                    </div>

                    {/* Label - hidden on smaller screens, shown on larger */}
                    <span
                      className={`
                        mt-2 text-xs font-medium text-center
                        hidden lg:block
                        max-w-[80px] truncate
                        ${
                          state === 'completed'
                            ? 'text-primary-600'
                            : state === 'current'
                            ? 'text-primary-700'
                            : 'text-gray-500'
                        }
                      `.trim()}
                    >
                      {label}
                    </span>
                  </div>

                  {/* Connecting line */}
                  {!isLast && (
                    <div className="flex-1 mx-2 lg:mx-1">
                      <div
                        className={`
                          h-0.5 w-full
                          transition-colors duration-200
                          ${state === 'completed' ? 'bg-primary-600' : 'bg-gray-300'}
                        `.trim()}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Current step name - medium screens where labels are hidden */}
        <div className="mt-4 text-center lg:hidden">
          <h3 className="text-lg font-medium text-gray-900">
            {stepLabels[currentStep] || `Step ${currentStep + 1}`}
          </h3>
        </div>
      </div>

      {/* Screen reader summary */}
      <div className="sr-only" aria-live="polite">
        Step {currentStep + 1} of {totalSteps}: {stepLabels[currentStep]}
      </div>
    </div>
  );
};

export default ProgressIndicator;
