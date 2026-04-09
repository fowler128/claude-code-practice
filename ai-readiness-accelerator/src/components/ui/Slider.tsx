import React, { forwardRef, useId } from 'react';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  /** Label text for the slider */
  label?: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Current value */
  value?: number;
  /** Whether to show the current value */
  showValue?: boolean;
  /** Custom function to format the displayed value */
  formatValue?: (value: number) => string;
  /** Custom ID (auto-generated if not provided) */
  id?: string;
}

/**
 * Slider component with label and value display.
 * Includes proper accessibility attributes for screen readers.
 */
export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      label,
      min = 0,
      max = 100,
      step = 1,
      value = 0,
      showValue = true,
      formatValue,
      id: customId,
      className = '',
      onChange,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const sliderId = customId || generatedId;

    const displayValue = formatValue ? formatValue(value) : String(value);

    // Calculate percentage for custom styling
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div className="w-full">
        {(label || showValue) && (
          <div className="flex items-center justify-between mb-2">
            {label && (
              <label
                htmlFor={sliderId}
                className="text-sm font-medium text-gray-700"
              >
                {label}
              </label>
            )}
            {showValue && (
              <span
                className="text-sm font-semibold text-primary-600"
                aria-hidden="true"
              >
                {displayValue}
              </span>
            )}
          </div>
        )}
        <input
          ref={ref}
          type="range"
          id={sliderId}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={displayValue}
          className={`
            w-full h-2
            appearance-none
            bg-gray-200
            rounded-full
            cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-primary-600
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-primary-600
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer
            [&::-moz-range-thumb]:transition-transform
            [&::-moz-range-thumb]:hover:scale-110
            ${className}
          `.trim()}
          style={{
            background: `linear-gradient(to right, rgb(79 70 229) 0%, rgb(79 70 229) ${percentage}%, rgb(229 231 235) ${percentage}%, rgb(229 231 235) 100%)`,
          }}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export default Slider;
