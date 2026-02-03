/**
 * Constants for the AI Readiness Accelerator application
 */

import type { PillarStatus, ReadinessLevel } from '../types';

/**
 * Score thresholds for pillar status determination
 * Boundary values are inclusive of the lower bound
 */
export const PILLAR_STATUS_THRESHOLDS: Record<PillarStatus, { min: number; max: number }> = {
  'critical': { min: 0, max: 1.5 },
  'needs-work': { min: 1.5, max: 2.5 },
  'adequate': { min: 2.5, max: 3.5 },
  'strong': { min: 3.5, max: 4.5 },
  'excellent': { min: 4.5, max: 5 },
};

/**
 * Score thresholds for overall readiness level determination
 */
export const READINESS_LEVEL_THRESHOLDS: Record<ReadinessLevel, { min: number; max: number }> = {
  'not-ready': { min: 0, max: 1.0 },
  'foundational': { min: 1.1, max: 2.0 },
  'developing': { min: 2.1, max: 3.0 },
  'ready': { min: 3.1, max: 4.0 },
  'optimized': { min: 4.1, max: 5.0 },
};

/**
 * Critical pillar IDs that are blockers for AI deployment
 */
export const CRITICAL_PILLAR_IDS = ['risk', 'data'] as const;

/**
 * Minimum score threshold to not be considered a blocker
 */
export const BLOCKER_SCORE_THRESHOLD = 3;

/**
 * Number of top/bottom pillars to identify as strengths/gaps
 */
export const STRENGTHS_GAPS_COUNT = 3;

/**
 * Human-readable labels for pillar statuses
 */
export const PILLAR_STATUS_LABELS: Record<PillarStatus, string> = {
  'critical': 'Critical',
  'needs-work': 'Needs Work',
  'adequate': 'Adequate',
  'strong': 'Strong',
  'excellent': 'Excellent',
};

/**
 * Human-readable labels for readiness levels
 */
export const READINESS_LEVEL_LABELS: Record<ReadinessLevel, string> = {
  'not-ready': 'Not Ready',
  'foundational': 'Foundational',
  'developing': 'Developing',
  'ready': 'Ready',
  'optimized': 'Optimized',
};

/**
 * Descriptions for each pillar status level
 */
export const PILLAR_STATUS_DESCRIPTIONS: Record<PillarStatus, string> = {
  'critical': 'requires immediate attention and significant improvement',
  'needs-work': 'needs focused development and enhancement',
  'adequate': 'meets basic requirements but has room for improvement',
  'strong': 'demonstrates solid capabilities with minor refinements needed',
  'excellent': 'is a key competitive advantage and industry-leading',
};
