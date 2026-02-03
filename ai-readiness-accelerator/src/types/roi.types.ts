/**
 * Type definitions for ROI calculator functionality
 * @module roi.types
 */

/**
 * Input parameters for ROI calculation
 * All monetary values are in USD
 */
export interface ROIInputs {
  /**
   * Number of new client intakes processed per week
   * Used to calculate time savings from automated intake
   */
  weeklyIntakeVolume: number;

  /**
   * Average time spent per intake in minutes
   * Includes data entry, initial consultation scheduling, conflict checks
   */
  avgMinutesPerIntake: number;

  /**
   * Number of document drafting tasks per week
   * Includes contracts, pleadings, letters, and other standard documents
   */
  weeklyDraftingTasks: number;

  /**
   * Average time spent per drafting task in minutes
   * From initial template selection to final review
   */
  avgMinutesPerDraft: number;

  /**
   * Fully-loaded hourly cost for staff performing these tasks
   * Should include salary, benefits, overhead
   */
  staffHourlyRate: number;

  /**
   * Billable rate for attorney time in USD/hour
   * Used to calculate value of freed-up attorney capacity
   */
  billableRate: number;

  /**
   * Expected percentage of time savings from AI implementation
   * Typical range: 20-50%
   */
  projectedTimeSavingsPercent: number;

  /**
   * Expected percentage reduction in errors/rework
   * Typical range: 30-60%
   */
  projectedErrorReductionPercent: number;

  /**
   * One-time implementation cost (training, setup, consulting)
   * In USD
   */
  implementationCost: number;

  /**
   * Monthly subscription/licensing cost for AI tools
   * In USD per month
   */
  monthlyToolCost: number;
}

/**
 * Projected ROI values for a single scenario
 */
export interface ROIProjection {
  /**
   * Total hours saved annually from AI implementation
   */
  annualHoursSaved: number;

  /**
   * Annual savings from reduced labor costs
   * Calculated from hours saved * staff hourly rate
   */
  annualLaborSavings: number;

  /**
   * Annual value of increased capacity for billable work
   * Calculated from freed attorney hours * billable rate
   */
  annualCapacityValue: number;

  /**
   * Total annual benefit (labor savings + capacity value)
   */
  totalAnnualBenefit: number;

  /**
   * Net value in year 1 after subtracting implementation and tool costs
   */
  year1NetValue: number;

  /**
   * Number of months to recoup implementation investment
   */
  paybackMonths: number;

  /**
   * Three-year return on investment percentage
   * ((3-year benefit - 3-year cost) / 3-year cost) * 100
   */
  threeYearROI: number;
}

/**
 * Complete ROI breakdown with multiple scenarios
 */
export interface ROIBreakdown {
  /** Input parameters used for calculation */
  inputs: ROIInputs;

  /**
   * Conservative estimate (lower bound)
   * Uses 70% of projected savings percentages
   */
  conservative: ROIProjection;

  /**
   * Moderate estimate (expected case)
   * Uses 100% of projected savings percentages
   */
  moderate: ROIProjection;

  /**
   * Optimistic estimate (upper bound)
   * Uses 130% of projected savings percentages
   */
  optimistic: ROIProjection;
}

/**
 * Default ROI input values for small law firms
 */
export const DEFAULT_ROI_INPUTS: ROIInputs = {
  weeklyIntakeVolume: 10,
  avgMinutesPerIntake: 30,
  weeklyDraftingTasks: 15,
  avgMinutesPerDraft: 45,
  staffHourlyRate: 35,
  billableRate: 250,
  projectedTimeSavingsPercent: 35,
  projectedErrorReductionPercent: 40,
  implementationCost: 5000,
  monthlyToolCost: 500,
};

/**
 * ROI input field metadata for form generation
 */
export interface ROIInputField {
  key: keyof ROIInputs;
  label: string;
  description: string;
  unit: string;
  min: number;
  max: number;
  step: number;
}

/**
 * Field definitions for ROI calculator form
 */
export const ROI_INPUT_FIELDS: ROIInputField[] = [
  {
    key: 'weeklyIntakeVolume',
    label: 'Weekly Intake Volume',
    description: 'Number of new client intakes per week',
    unit: 'intakes/week',
    min: 1,
    max: 200,
    step: 1,
  },
  {
    key: 'avgMinutesPerIntake',
    label: 'Time per Intake',
    description: 'Average minutes spent per intake',
    unit: 'minutes',
    min: 5,
    max: 120,
    step: 5,
  },
  {
    key: 'weeklyDraftingTasks',
    label: 'Weekly Drafting Tasks',
    description: 'Number of documents drafted per week',
    unit: 'documents/week',
    min: 1,
    max: 100,
    step: 1,
  },
  {
    key: 'avgMinutesPerDraft',
    label: 'Time per Draft',
    description: 'Average minutes per document draft',
    unit: 'minutes',
    min: 10,
    max: 240,
    step: 5,
  },
  {
    key: 'staffHourlyRate',
    label: 'Staff Hourly Rate',
    description: 'Fully-loaded cost per hour for staff',
    unit: '$/hour',
    min: 15,
    max: 150,
    step: 5,
  },
  {
    key: 'billableRate',
    label: 'Attorney Billable Rate',
    description: 'Billable rate for attorney time',
    unit: '$/hour',
    min: 100,
    max: 1000,
    step: 25,
  },
  {
    key: 'projectedTimeSavingsPercent',
    label: 'Time Savings',
    description: 'Expected percentage of time saved with AI',
    unit: '%',
    min: 10,
    max: 70,
    step: 5,
  },
  {
    key: 'projectedErrorReductionPercent',
    label: 'Error Reduction',
    description: 'Expected reduction in errors/rework',
    unit: '%',
    min: 10,
    max: 80,
    step: 5,
  },
  {
    key: 'implementationCost',
    label: 'Implementation Cost',
    description: 'One-time setup, training, and consulting',
    unit: '$',
    min: 0,
    max: 50000,
    step: 500,
  },
  {
    key: 'monthlyToolCost',
    label: 'Monthly Tool Cost',
    description: 'Monthly AI tool subscription cost',
    unit: '$/month',
    min: 0,
    max: 5000,
    step: 50,
  },
];

/**
 * Calculates ROI projection for given inputs and savings multiplier
 */
export function calculateROIProjection(
  inputs: ROIInputs,
  savingsMultiplier: number = 1.0
): ROIProjection {
  const adjustedTimeSavings =
    inputs.projectedTimeSavingsPercent * savingsMultiplier;

  // Calculate weekly time spent
  const weeklyIntakeMinutes =
    inputs.weeklyIntakeVolume * inputs.avgMinutesPerIntake;
  const weeklyDraftingMinutes =
    inputs.weeklyDraftingTasks * inputs.avgMinutesPerDraft;
  const totalWeeklyMinutes = weeklyIntakeMinutes + weeklyDraftingMinutes;

  // Calculate annual hours and savings
  const annualMinutes = totalWeeklyMinutes * 52;
  const annualHours = annualMinutes / 60;
  const annualHoursSaved = annualHours * (adjustedTimeSavings / 100);

  const annualLaborSavings = annualHoursSaved * inputs.staffHourlyRate;
  const annualCapacityValue = annualHoursSaved * 0.3 * inputs.billableRate; // 30% of saved time becomes billable

  const totalAnnualBenefit = annualLaborSavings + annualCapacityValue;

  // Calculate costs
  const annualToolCost = inputs.monthlyToolCost * 12;
  const year1TotalCost = inputs.implementationCost + annualToolCost;
  const year1NetValue = totalAnnualBenefit - year1TotalCost;

  // Calculate payback period
  const monthlyBenefit = totalAnnualBenefit / 12;
  const paybackMonths =
    monthlyBenefit > 0
      ? Math.ceil(inputs.implementationCost / monthlyBenefit)
      : 999;

  // Calculate 3-year ROI
  const threeYearBenefit = totalAnnualBenefit * 3;
  const threeYearCost = inputs.implementationCost + annualToolCost * 3;
  const threeYearROI =
    threeYearCost > 0
      ? ((threeYearBenefit - threeYearCost) / threeYearCost) * 100
      : 0;

  return {
    annualHoursSaved: Math.round(annualHoursSaved),
    annualLaborSavings: Math.round(annualLaborSavings),
    annualCapacityValue: Math.round(annualCapacityValue),
    totalAnnualBenefit: Math.round(totalAnnualBenefit),
    year1NetValue: Math.round(year1NetValue),
    paybackMonths,
    threeYearROI: Math.round(threeYearROI),
  };
}

/**
 * Calculates complete ROI breakdown with all three scenarios
 */
export function calculateROIBreakdown(inputs: ROIInputs): ROIBreakdown {
  return {
    inputs,
    conservative: calculateROIProjection(inputs, 0.7),
    moderate: calculateROIProjection(inputs, 1.0),
    optimistic: calculateROIProjection(inputs, 1.3),
  };
}
