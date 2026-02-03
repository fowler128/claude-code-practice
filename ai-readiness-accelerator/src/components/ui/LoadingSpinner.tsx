import React from 'react';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
};

/**
 * LoadingSpinner component displays an animated spinner for loading states.
 * Includes proper accessibility attributes for screen readers.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`
        ${sizeClasses[size]}
        border-primary-200
        border-t-primary-600
        rounded-full
        animate-spin
        ${className}
      `.trim()}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
