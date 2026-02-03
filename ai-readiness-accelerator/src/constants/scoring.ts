/**
 * Scoring configuration for the AI Readiness Accelerator
 *
 * Defines thresholds, levels, and visual styling for assessment scoring.
 * All scores use a 1-5 scale where 1 is lowest and 5 is highest.
 */

import type { PillarStatus, ReadinessLevel } from '../types';

/**
 * Score threshold definition for pillar status classification
 */
export interface ScoreThreshold {
  /** Status classification */
  status: PillarStatus;
  /** Minimum score (inclusive) */
  min: number;
  /** Maximum score (exclusive, except for last tier which is inclusive) */
  max: number;
  /** Human-readable label for this threshold */
  label: string;
}

/**
 * Score thresholds for classifying individual pillar performance.
 * Thresholds are evaluated in order; first matching range wins.
 */
export const SCORE_THRESHOLDS: ScoreThreshold[] = [
  {
    status: 'critical',
    min: 0,
    max: 1.5,
    label: 'Critical',
  },
  {
    status: 'needs-work',
    min: 1.5,
    max: 2.5,
    label: 'Needs Work',
  },
  {
    status: 'adequate',
    min: 2.5,
    max: 3.5,
    label: 'Adequate',
  },
  {
    status: 'strong',
    min: 3.5,
    max: 4.5,
    label: 'Strong',
  },
  {
    status: 'excellent',
    min: 4.5,
    max: 5,
    label: 'Excellent',
  },
];

/**
 * Extended readiness level definition with metadata
 */
export interface ReadinessLevelDefinition {
  /** Numeric level (1-5) */
  level: number;
  /** Internal identifier matching ReadinessLevel type */
  id: ReadinessLevel;
  /** Display label */
  label: string;
  /** Score range as [min, max] tuple (inclusive) */
  scoreRange: [number, number];
  /** Description of what this level means for the organization */
  description: string;
  /** Tailwind CSS color class for visual styling */
  color: string;
}

/**
 * Overall readiness level definitions.
 * These classify the firm's aggregate readiness for AI adoption.
 */
export const READINESS_LEVELS: ReadinessLevelDefinition[] = [
  {
    level: 1,
    id: 'not-ready',
    label: 'Not Ready',
    scoreRange: [1, 1.5],
    description: 'Significant foundational work needed before AI adoption. Focus on basic process documentation and data cleanup.',
    color: 'text-red-600 bg-red-50',
  },
  {
    level: 2,
    id: 'foundational',
    label: 'Foundational',
    scoreRange: [1.5, 2.5],
    description: 'Early stage readiness with gaps in multiple areas. Prioritize addressing critical weaknesses before piloting AI tools.',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    level: 3,
    id: 'developing',
    label: 'Developing',
    scoreRange: [2.5, 3.5],
    description: 'Moderate readiness with room for improvement. Good candidate for targeted AI pilots in stronger areas.',
    color: 'text-yellow-600 bg-yellow-50',
  },
  {
    level: 4,
    id: 'ready',
    label: 'Ready',
    scoreRange: [3.5, 4.5],
    description: 'Well-positioned for AI adoption. Solid foundations in place; focus on optimization and strategic deployment.',
    color: 'text-green-600 bg-green-50',
  },
  {
    level: 5,
    id: 'optimized',
    label: 'Optimized',
    scoreRange: [4.5, 5],
    description: 'Excellent readiness across all dimensions. Ideal candidate for advanced AI implementations and innovation.',
    color: 'text-blue-600 bg-blue-50',
  },
];

/**
 * Tailwind CSS color classes mapped to pillar status.
 * Use these for consistent status visualization across the application.
 */
export const STATUS_COLORS: Record<PillarStatus, { text: string; bg: string; border: string; badge: string }> = {
  critical: {
    text: 'text-red-700',
    bg: 'bg-red-100',
    border: 'border-red-300',
    badge: 'bg-red-600 text-white',
  },
  'needs-work': {
    text: 'text-orange-700',
    bg: 'bg-orange-100',
    border: 'border-orange-300',
    badge: 'bg-orange-500 text-white',
  },
  adequate: {
    text: 'text-yellow-700',
    bg: 'bg-yellow-100',
    border: 'border-yellow-300',
    badge: 'bg-yellow-500 text-white',
  },
  strong: {
    text: 'text-green-700',
    bg: 'bg-green-100',
    border: 'border-green-300',
    badge: 'bg-green-600 text-white',
  },
  excellent: {
    text: 'text-blue-700',
    bg: 'bg-blue-100',
    border: 'border-blue-300',
    badge: 'bg-blue-600 text-white',
  },
};

/**
 * Get the status for a given score
 * @param score - The numeric score to classify (1-5 scale)
 * @returns The PillarStatus corresponding to the score
 */
export function getStatusForScore(score: number): PillarStatus {
  for (const threshold of SCORE_THRESHOLDS) {
    if (score >= threshold.min && score < threshold.max) {
      return threshold.status;
    }
  }
  // Handle edge case of exactly 5
  if (score >= 4.5) {
    return 'excellent';
  }
  return 'critical';
}

/**
 * Get the readiness level for a given overall score
 * @param score - The overall assessment score (1-5 scale)
 * @returns The ReadinessLevelDefinition for the score
 */
export function getReadinessLevel(score: number): ReadinessLevelDefinition {
  for (const level of READINESS_LEVELS) {
    if (score >= level.scoreRange[0] && score <= level.scoreRange[1]) {
      return level;
    }
  }
  // Default to lowest level if somehow out of range
  return READINESS_LEVELS[0];
}

/**
 * Get display colors for a given status
 * @param status - The pillar status
 * @returns Object containing Tailwind color classes
 */
export function getStatusColors(status: PillarStatus): typeof STATUS_COLORS[PillarStatus] {
  return STATUS_COLORS[status];
}
