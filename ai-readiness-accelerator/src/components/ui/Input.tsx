import React, { forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  /** Label text for the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Help text displayed below the input */
  helpText?: string;
  /** Custom ID (auto-generated if not provided) */
  id?: string;
}

/**
 * Input component with label, error, and help text support.
 * Properly associates labels with inputs for accessibility.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helpText,
      id: customId,
      className = '',
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const helpTextId = `${inputId}-help`;

    const hasError = Boolean(error);
    const hasHelpText = Boolean(helpText);

    // Build aria-describedby based on what's present
    const describedByIds: string[] = [];
    if (hasError) describedByIds.push(errorId);
    if (hasHelpText) describedByIds.push(helpTextId);
    const ariaDescribedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && (
              <span className="text-red-500 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={hasError}
            aria-describedby={ariaDescribedBy}
            className={`
              block w-full
              px-3 py-2
              text-gray-900 placeholder-gray-400
              border rounded-lg
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              }
              disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
              ${className}
            `.trim()}
            {...props}
          />
          {hasError && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            </div>
          )}
        </div>
        {hasError && (
          <p
            id={errorId}
            className="mt-1 text-sm text-red-600 flex items-center gap-1"
            role="alert"
          >
            {error}
          </p>
        )}
        {hasHelpText && !hasError && (
          <p
            id={helpTextId}
            className="mt-1 text-sm text-gray-500"
          >
            {helpText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
