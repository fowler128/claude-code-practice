import React, { useId } from 'react';

/**
 * Likert scale labels for the maturity assessment
 * 0 = Non-existent, 5 = Optimized
 */
export const MATURITY_LABELS: Record<number, string> = {
  0: 'Non-existent',
  1: 'Ad-hoc',
  2: 'Defined',
  3: 'Followed',
  4: 'Consistent',
  5: 'Optimized',
};

export interface LikertScaleProps {
  /** Current selected value (0-5 or undefined if not answered) */
  value: 0 | 1 | 2 | 3 | 4 | 5 | undefined;
  /** Callback when value changes */
  onChange: (value: 0 | 1 | 2 | 3 | 4 | 5) => void;
  /** Optional custom labels (defaults to MATURITY_LABELS) */
  labels?: Record<number, string>;
  /** Unique name for the radio group */
  name?: string;
  /** Whether the scale is disabled */
  disabled?: boolean;
}

/**
 * LikertScale component renders a 6-point scale (0-5) as radio buttons.
 * Used for assessment questions to rate maturity levels.
 * Fully accessible with proper radio group semantics.
 */
export const LikertScale: React.FC<LikertScaleProps> = ({
  value,
  onChange,
  labels = MATURITY_LABELS,
  name,
  disabled = false,
}) => {
  const generatedId = useId();
  const groupName = name || `likert-${generatedId}`;
  const groupLabelId = `${groupName}-label`;

  const scaleValues = [0, 1, 2, 3, 4, 5] as const;

  return (
    <div
      role="radiogroup"
      aria-labelledby={groupLabelId}
      className="w-full"
    >
      {/* Screen reader only label */}
      <span id={groupLabelId} className="sr-only">
        Rate on a scale from 0 (Non-existent) to 5 (Optimized)
      </span>

      {/* Desktop layout - horizontal */}
      <div className="hidden sm:flex sm:items-center sm:justify-between sm:gap-2">
        {scaleValues.map((scaleValue) => {
          const isSelected = value === scaleValue;
          const labelText = labels[scaleValue] || String(scaleValue);
          const inputId = `${groupName}-${scaleValue}`;

          return (
            <label
              key={scaleValue}
              htmlFor={inputId}
              className={`
                flex flex-col items-center gap-1.5 cursor-pointer
                px-2 py-2 rounded-lg flex-1 text-center
                transition-all duration-200
                ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}
                ${isSelected ? 'bg-primary-50 ring-2 ring-primary-500' : ''}
              `.trim()}
            >
              <input
                type="radio"
                id={inputId}
                name={groupName}
                value={scaleValue}
                checked={isSelected}
                onChange={() => onChange(scaleValue)}
                disabled={disabled}
                className="sr-only"
                aria-describedby={`${inputId}-label`}
              />
              <span
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center
                  border-2 font-medium text-sm
                  transition-colors duration-200
                  ${isSelected
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600'}
                `.trim()}
              >
                {scaleValue}
              </span>
              <span
                id={`${inputId}-label`}
                className={`
                  text-xs font-medium leading-tight
                  ${isSelected ? 'text-primary-700' : 'text-gray-600'}
                `.trim()}
              >
                {labelText}
              </span>
            </label>
          );
        })}
      </div>

      {/* Mobile layout - stacked */}
      <div className="flex flex-col gap-2 sm:hidden">
        {scaleValues.map((scaleValue) => {
          const isSelected = value === scaleValue;
          const labelText = labels[scaleValue] || String(scaleValue);
          const inputId = `${groupName}-mobile-${scaleValue}`;

          return (
            <label
              key={scaleValue}
              htmlFor={inputId}
              className={`
                flex items-center gap-3 cursor-pointer
                px-3 py-2 rounded-lg
                transition-all duration-200
                ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}
                ${isSelected ? 'bg-primary-50 ring-2 ring-primary-500' : 'border border-gray-200'}
              `.trim()}
            >
              <input
                type="radio"
                id={inputId}
                name={`${groupName}-mobile`}
                value={scaleValue}
                checked={isSelected}
                onChange={() => onChange(scaleValue)}
                disabled={disabled}
                className="sr-only"
              />
              <span
                className={`
                  w-7 h-7 rounded-full flex items-center justify-center
                  border-2 font-medium text-sm flex-shrink-0
                  transition-colors duration-200
                  ${isSelected
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-gray-300 text-gray-600'}
                `.trim()}
              >
                {scaleValue}
              </span>
              <span
                className={`
                  text-sm font-medium
                  ${isSelected ? 'text-primary-700' : 'text-gray-700'}
                `.trim()}
              >
                {labelText}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default LikertScale;
