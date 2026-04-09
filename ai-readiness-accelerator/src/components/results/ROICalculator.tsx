/**
 * ROICalculator Component
 *
 * Interactive calculator for estimating ROI from AI implementation.
 * Displays conservative, moderate, and optimistic projections.
 */

import React, { memo, useCallback, useMemo } from 'react';
import { Calculator, TrendingUp, Clock, DollarSign, AlertCircle } from 'lucide-react';
import type { ROIInputs, ROIBreakdown, ROIProjection } from '../../types/roi.types';
import { ROI_INPUT_FIELDS } from '../../types/roi.types';
import { Card, Slider } from '../ui';

export interface ROICalculatorProps {
  /** Current input values */
  inputs: ROIInputs;
  /** Calculated ROI projections */
  projections: ROIBreakdown;
  /** Callback when an input value changes */
  onInputChange: (key: keyof ROIInputs, value: number) => void;
}

/**
 * Format currency for display
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

/**
 * Format number with commas
 */
const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

/**
 * Scenario card component for displaying projection results
 */
const ScenarioCard: React.FC<{
  title: string;
  projection: ROIProjection;
  variant: 'conservative' | 'moderate' | 'optimistic';
}> = memo(({ title, projection, variant }) => {
  const variantStyles = {
    conservative: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      accent: 'text-gray-700',
      badge: 'bg-gray-100 text-gray-700',
    },
    moderate: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      accent: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-700',
    },
    optimistic: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      accent: 'text-green-700',
      badge: 'bg-green-100 text-green-700',
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={`rounded-lg p-4 border ${styles.bg} ${styles.border}`}
      role="region"
      aria-label={`${title} scenario projections`}
    >
      <h4 className={`font-semibold mb-3 ${styles.accent}`}>{title}</h4>

      <div className="space-y-3">
        {/* Annual Hours Saved */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Clock className="w-4 h-4" aria-hidden="true" />
            Annual Hours Saved
          </span>
          <span className={`font-semibold ${styles.accent}`}>
            {formatNumber(projection.annualHoursSaved)} hrs
          </span>
        </div>

        {/* Labor Savings */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <DollarSign className="w-4 h-4" aria-hidden="true" />
            Labor Savings
          </span>
          <span className={`font-semibold ${styles.accent}`}>
            {formatCurrency(projection.annualLaborSavings)}
          </span>
        </div>

        {/* Capacity Value */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <TrendingUp className="w-4 h-4" aria-hidden="true" />
            Capacity Value
          </span>
          <span className={`font-semibold ${styles.accent}`}>
            {formatCurrency(projection.annualCapacityValue)}
          </span>
        </div>

        <hr className="border-gray-200" />

        {/* Total Annual Benefit */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Total Annual Benefit
          </span>
          <span className={`text-lg font-bold ${styles.accent}`}>
            {formatCurrency(projection.totalAnnualBenefit)}
          </span>
        </div>

        {/* Year 1 Net Value */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Year 1 Net Value</span>
          <span
            className={`font-semibold ${
              projection.year1NetValue >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatCurrency(projection.year1NetValue)}
          </span>
        </div>

        {/* Payback Period */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Payback Period</span>
          <span className={`font-semibold ${styles.accent}`}>
            {projection.paybackMonths < 999
              ? `${projection.paybackMonths} months`
              : 'N/A'}
          </span>
        </div>

        {/* 3-Year ROI */}
        <div
          className={`mt-3 py-2 px-3 rounded-md ${styles.badge} text-center`}
        >
          <span className="text-sm font-medium">3-Year ROI: </span>
          <span className="font-bold">{projection.threeYearROI}%</span>
        </div>
      </div>
    </div>
  );
});

ScenarioCard.displayName = 'ScenarioCard';

/**
 * Input slider component with proper formatting
 */
const ROIInputSlider: React.FC<{
  field: (typeof ROI_INPUT_FIELDS)[number];
  value: number;
  onChange: (value: number) => void;
}> = memo(({ field, value, onChange }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = Number(e.target.value);
      // Validate bounds
      if (newValue >= field.min && newValue <= field.max) {
        onChange(newValue);
      }
    },
    [field.min, field.max, onChange]
  );

  const formatValue = useCallback(
    (val: number): string => {
      if (field.unit.includes('$')) {
        return formatCurrency(val);
      }
      if (field.unit === '%') {
        return `${val}%`;
      }
      return `${formatNumber(val)} ${field.unit}`;
    },
    [field.unit]
  );

  return (
    <div className="mb-4">
      <Slider
        label={field.label}
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={handleChange}
        formatValue={formatValue}
        aria-describedby={`${field.key}-description`}
      />
      <p
        id={`${field.key}-description`}
        className="text-xs text-gray-500 mt-1"
      >
        {field.description}
      </p>
    </div>
  );
});

ROIInputSlider.displayName = 'ROIInputSlider';

/**
 * ROICalculator provides an interactive interface for estimating
 * return on investment from AI implementation. Features input sliders
 * with validation and displays three projection scenarios.
 */
export const ROICalculator: React.FC<ROICalculatorProps> = memo(({
  inputs,
  projections,
  onInputChange,
}) => {
  // Memoize field groups for rendering
  const volumeFields = useMemo(
    () =>
      ROI_INPUT_FIELDS.filter(f =>
        ['weeklyIntakeVolume', 'avgMinutesPerIntake', 'weeklyDraftingTasks', 'avgMinutesPerDraft'].includes(f.key)
      ),
    []
  );

  const rateFields = useMemo(
    () =>
      ROI_INPUT_FIELDS.filter(f =>
        ['staffHourlyRate', 'billableRate'].includes(f.key)
      ),
    []
  );

  const savingsFields = useMemo(
    () =>
      ROI_INPUT_FIELDS.filter(f =>
        ['projectedTimeSavingsPercent', 'projectedErrorReductionPercent'].includes(f.key)
      ),
    []
  );

  const costFields = useMemo(
    () =>
      ROI_INPUT_FIELDS.filter(f =>
        ['implementationCost', 'monthlyToolCost'].includes(f.key)
      ),
    []
  );

  const handleInputChange = useCallback(
    (key: keyof ROIInputs) => (value: number) => {
      onInputChange(key, value);
    },
    [onInputChange]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900">
            ROI Calculator
          </h3>
        </div>
        <p className="text-gray-600 text-sm">
          Adjust the sliders below to estimate your potential return on investment
          from AI implementation. Projections are based on your firm's current
          workload and costs.
        </p>
      </Card>

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Volume Inputs */}
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4">
            Current Workload
          </h4>
          {volumeFields.map(field => (
            <ROIInputSlider
              key={field.key}
              field={field}
              value={inputs[field.key]}
              onChange={handleInputChange(field.key)}
            />
          ))}
        </Card>

        {/* Rate Inputs */}
        <Card>
          <h4 className="font-semibold text-gray-900 mb-4">
            Rates & Costs
          </h4>
          {rateFields.map(field => (
            <ROIInputSlider
              key={field.key}
              field={field}
              value={inputs[field.key]}
              onChange={handleInputChange(field.key)}
            />
          ))}
          {costFields.map(field => (
            <ROIInputSlider
              key={field.key}
              field={field}
              value={inputs[field.key]}
              onChange={handleInputChange(field.key)}
            />
          ))}
        </Card>
      </div>

      {/* Savings Assumptions */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">
          Projected Savings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savingsFields.map(field => (
            <ROIInputSlider
              key={field.key}
              field={field}
              value={inputs[field.key]}
              onChange={handleInputChange(field.key)}
            />
          ))}
        </div>
      </Card>

      {/* Projections Section */}
      <Card>
        <h4 className="font-semibold text-gray-900 mb-4">
          Projected Returns
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScenarioCard
            title="Conservative"
            projection={projections.conservative}
            variant="conservative"
          />
          <ScenarioCard
            title="Moderate"
            projection={projections.moderate}
            variant="moderate"
          />
          <ScenarioCard
            title="Optimistic"
            projection={projections.optimistic}
            variant="optimistic"
          />
        </div>
      </Card>

      {/* Disclaimer */}
      <div
        className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200"
        role="note"
        aria-label="Important disclaimer about ROI projections"
      >
        <AlertCircle
          className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="text-sm text-amber-800">
          <p className="font-medium mb-1">Disclaimer</p>
          <p>
            These projections are estimates based on industry benchmarks and your
            provided inputs. Actual results may vary based on implementation
            quality, staff adoption, and specific use cases. Conservative
            estimates use 70% of projected savings, while optimistic estimates
            use 130%. Capacity value assumes 30% of saved time converts to
            additional billable work.
          </p>
        </div>
      </div>
    </div>
  );
});

ROICalculator.displayName = 'ROICalculator';

export default ROICalculator;
