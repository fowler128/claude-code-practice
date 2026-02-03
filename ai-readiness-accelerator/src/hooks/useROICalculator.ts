/**
 * Hook for managing ROI calculator inputs and computing projections.
 *
 * Features:
 * - Manages ROI input state with sensible defaults
 * - Validates inputs with min/max bounds
 * - Computes conservative, moderate, and optimistic projections
 * - Provides reset functionality
 *
 * @module useROICalculator
 */

import { useState, useCallback, useMemo } from 'react';
import type { ROIInputs, ROIBreakdown, ROIProjection } from '../types/roi.types';
import {
  DEFAULT_ROI_INPUTS,
  ROI_INPUT_FIELDS,
  calculateROIBreakdown,
} from '../types/roi.types';

/**
 * Input validation constraints
 */
interface InputConstraints {
  min: number;
  max: number;
}

/**
 * Map of input field constraints from ROI_INPUT_FIELDS
 */
const INPUT_CONSTRAINTS: Record<keyof ROIInputs, InputConstraints> = ROI_INPUT_FIELDS.reduce(
  (acc, field) => {
    acc[field.key] = { min: field.min, max: field.max };
    return acc;
  },
  {} as Record<keyof ROIInputs, InputConstraints>
);

/**
 * Return type for the useROICalculator hook
 */
export interface UseROICalculatorReturn {
  /** Current input values */
  inputs: ROIInputs;
  /** Computed projections for all three scenarios */
  projections: {
    conservative: ROIProjection;
    moderate: ROIProjection;
    optimistic: ROIProjection;
  };
  /** Set a specific input value */
  setInput: <K extends keyof ROIInputs>(key: K, value: ROIInputs[K]) => void;
  /** Reset all inputs to default values */
  resetToDefaults: () => void;
  /** Full ROI breakdown including inputs */
  breakdown: ROIBreakdown;
  /** Validation errors by field */
  errors: Partial<Record<keyof ROIInputs, string>>;
  /** Whether all inputs are valid */
  isValid: boolean;
}

/**
 * Validates a single input value against its constraints
 */
function validateInput(
  key: keyof ROIInputs,
  value: number
): string | null {
  const constraints = INPUT_CONSTRAINTS[key];
  if (!constraints) {
    return null;
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return 'Value must be a number';
  }

  if (value < 0) {
    return 'Value cannot be negative';
  }

  if (value < constraints.min) {
    return `Value must be at least ${constraints.min}`;
  }

  if (value > constraints.max) {
    return `Value cannot exceed ${constraints.max}`;
  }

  return null;
}

/**
 * Clamps a value within the specified min/max bounds
 */
function clampValue(key: keyof ROIInputs, value: number): number {
  const constraints = INPUT_CONSTRAINTS[key];
  if (!constraints) {
    return value;
  }

  // Ensure non-negative
  const nonNegative = Math.max(0, value);

  // Clamp to bounds
  return Math.min(constraints.max, Math.max(constraints.min, nonNegative));
}

/**
 * Hook for managing ROI calculator state and computations.
 *
 * @param initialInputs - Optional initial input values (defaults to DEFAULT_ROI_INPUTS)
 * @returns Object containing inputs, projections, and actions
 *
 * @example
 * ```tsx
 * function ROICalculator() {
 *   const {
 *     inputs,
 *     projections,
 *     setInput,
 *     resetToDefaults,
 *     errors,
 *     isValid,
 *   } = useROICalculator();
 *
 *   return (
 *     <div>
 *       <h2>ROI Calculator</h2>
 *
 *       <label>
 *         Weekly Intake Volume
 *         <input
 *           type="number"
 *           value={inputs.weeklyIntakeVolume}
 *           onChange={(e) => setInput('weeklyIntakeVolume', Number(e.target.value))}
 *         />
 *         {errors.weeklyIntakeVolume && (
 *           <span className="error">{errors.weeklyIntakeVolume}</span>
 *         )}
 *       </label>
 *
 *       <h3>Projected Annual Savings</h3>
 *       <table>
 *         <tr>
 *           <td>Conservative</td>
 *           <td>${projections.conservative.totalAnnualBenefit.toLocaleString()}</td>
 *         </tr>
 *         <tr>
 *           <td>Moderate</td>
 *           <td>${projections.moderate.totalAnnualBenefit.toLocaleString()}</td>
 *         </tr>
 *         <tr>
 *           <td>Optimistic</td>
 *           <td>${projections.optimistic.totalAnnualBenefit.toLocaleString()}</td>
 *         </tr>
 *       </table>
 *
 *       <button onClick={resetToDefaults}>Reset to Defaults</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useROICalculator(
  initialInputs: Partial<ROIInputs> = {}
): UseROICalculatorReturn {
  // Merge initial inputs with defaults
  const [inputs, setInputs] = useState<ROIInputs>(() => ({
    ...DEFAULT_ROI_INPUTS,
    ...initialInputs,
  }));

  /**
   * Set a specific input value with validation and clamping
   */
  const setInput = useCallback(
    <K extends keyof ROIInputs>(key: K, value: ROIInputs[K]) => {
      setInputs((prev) => {
        // Ensure the value is a number
        const numValue = typeof value === 'number' ? value : Number(value);

        // If not a valid number, don't update
        if (isNaN(numValue)) {
          return prev;
        }

        // Clamp the value to valid bounds
        const clampedValue = clampValue(key, numValue) as ROIInputs[K];

        return {
          ...prev,
          [key]: clampedValue,
        };
      });
    },
    []
  );

  /**
   * Reset all inputs to default values
   */
  const resetToDefaults = useCallback(() => {
    setInputs(DEFAULT_ROI_INPUTS);
  }, []);

  /**
   * Validate all inputs and collect errors
   */
  const errors = useMemo<Partial<Record<keyof ROIInputs, string>>>(() => {
    const validationErrors: Partial<Record<keyof ROIInputs, string>> = {};

    for (const key of Object.keys(inputs) as Array<keyof ROIInputs>) {
      const error = validateInput(key, inputs[key]);
      if (error) {
        validationErrors[key] = error;
      }
    }

    return validationErrors;
  }, [inputs]);

  /**
   * Check if all inputs are valid
   */
  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  /**
   * Compute the full ROI breakdown with all three scenarios
   */
  const breakdown = useMemo<ROIBreakdown>(() => {
    return calculateROIBreakdown(inputs);
  }, [inputs]);

  /**
   * Extract projections from breakdown for convenience
   */
  const projections = useMemo(
    () => ({
      conservative: breakdown.conservative,
      moderate: breakdown.moderate,
      optimistic: breakdown.optimistic,
    }),
    [breakdown]
  );

  return {
    inputs,
    projections,
    setInput,
    resetToDefaults,
    breakdown,
    errors,
    isValid,
  };
}

export default useROICalculator;
