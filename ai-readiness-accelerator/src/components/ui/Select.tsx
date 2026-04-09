import React, { forwardRef, useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  /** Label text for the select */
  label?: string;
  /** Array of options to display */
  options: SelectOption[];
  /** Error message to display */
  error?: string;
  /** Help text displayed below the select */
  helpText?: string;
  /** Custom ID (auto-generated if not provided) */
  id?: string;
  /** Placeholder text shown when no option is selected */
  placeholder?: string;
}

/**
 * Select component with label, options, error, and help text support.
 * Supports both single and multiple selection modes.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      helpText,
      id: customId,
      className = '',
      required,
      placeholder,
      multiple,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = customId || generatedId;
    const errorId = `${selectId}-error`;
    const helpTextId = `${selectId}-help`;

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
            htmlFor={selectId}
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
          <select
            ref={ref}
            id={selectId}
            required={required}
            multiple={multiple}
            aria-invalid={hasError}
            aria-describedby={ariaDescribedBy}
            className={`
              block w-full
              px-3 py-2
              text-gray-900
              border rounded-lg
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${!multiple ? 'appearance-none pr-10' : ''}
              ${hasError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              }
              disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
              ${className}
            `.trim()}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {!multiple && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {hasError ? (
                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
              )}
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

Select.displayName = 'Select';

export default Select;
