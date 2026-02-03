import React from 'react';

export interface ProgressBarProps {
  /** Progress value between 0 and 100 */
  value: number;
  /** Optional label text */
  label?: string;
  /** Whether to show the percentage value */
  showPercentage?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Color variant based on progress */
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const variantClasses: Record<NonNullable<ProgressBarProps['variant']>, string> = {
  default: 'bg-primary-600',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
};

/**
 * ProgressBar component displays progress with optional label and percentage.
 * Includes proper accessibility attributes for screen readers.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercentage = false,
  className = '',
  variant = 'default',
}) => {
  // Clamp value between 0 and 100
  const clampedValue = Math.min(100, Math.max(0, value));
  const roundedValue = Math.round(clampedValue);

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && (
            <span className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-gray-600">
              {roundedValue}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={roundedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `Progress: ${roundedValue}%`}
      >
        <div
          className={`
            h-full rounded-full
            transition-all duration-500 ease-out
            ${variantClasses[variant]}
          `.trim()}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
