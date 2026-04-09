/**
 * Type definitions for assessment results and dashboard
 * @module results.types
 */

import type { PillarId } from './assessment.types';

/**
 * Overall AI readiness level based on assessment scores
 * - not-ready: Significant gaps that must be addressed before AI adoption
 * - foundational: Basic capabilities in place, major improvements needed
 * - developing: Making progress, some areas need attention
 * - ready: Well-positioned for AI adoption with minor improvements
 * - optimized: Fully prepared for advanced AI implementations
 */
export type ReadinessLevel =
  | 'not-ready'
  | 'foundational'
  | 'developing'
  | 'ready'
  | 'optimized';

/**
 * Detailed information about a readiness level for display
 */
export interface ReadinessLevelInfo {
  /** The readiness level identifier */
  level: ReadinessLevel;

  /** Human-readable label */
  label: string;

  /** Score range that maps to this level [min, max] */
  scoreRange: [number, number];

  /** Detailed description of what this level means */
  description: string;

  /** CSS color class or hex code for visual representation */
  color: string;
}

/**
 * Status classification for individual pillar scores
 * - critical: Immediate attention required (0-20%)
 * - needs-work: Significant improvement needed (21-40%)
 * - adequate: Meets basic requirements (41-60%)
 * - strong: Good capabilities (61-80%)
 * - excellent: Best-in-class (81-100%)
 */
export type PillarStatus =
  | 'critical'
  | 'needs-work'
  | 'adequate'
  | 'strong'
  | 'excellent';

/**
 * Individual question score within a pillar
 */
export interface QuestionScore {
  /** Question identifier */
  questionId: string;

  /** Achieved score */
  score: number;

  /** Maximum possible score */
  maxScore: number;

  /** Category the question belongs to */
  category: string;
}

/**
 * Calculated score and status for a single pillar
 */
export interface PillarScore {
  /** Identifier of the pillar */
  pillarId: PillarId;

  /** Display name of the pillar */
  pillarName: string;

  /** Calculated score for this pillar */
  score: number;

  /** Maximum possible score for this pillar */
  maxScore: number;

  /** Status classification based on score percentage */
  status: PillarStatus;

  /** Individual question scores for detailed breakdown */
  questionScores: QuestionScore[];
}

/**
 * Complete scoring results across all pillars
 */
export interface PillarScores {
  /** Individual scores for each pillar */
  pillars: PillarScore[];

  /** Overall composite score (0-100) */
  overall: number;

  /** Determined readiness level based on overall score */
  readinessLevel: ReadinessLevel;
}

/**
 * Identified strength or gap from the assessment
 */
export interface StrengthGap {
  /** Pillar this strength/gap relates to */
  pillarId: PillarId;

  /** Display name of the pillar */
  pillarName: string;

  /** Score percentage (0-100) */
  score: number;

  /** Descriptive text explaining the strength or gap */
  description: string;
}

/**
 * Collection of identified strengths and gaps
 */
export interface StrengthsGaps {
  /** Top-performing areas */
  strengths: StrengthGap[];

  /** Areas needing improvement */
  gaps: StrengthGap[];
}

/**
 * Executive summary of assessment results
 */
export interface ExecutiveSummary {
  /** High-level assessment narrative (2-3 sentences) */
  overallAssessment: string;

  /** Key findings from the assessment (3-5 items) */
  keyFindings: string[];

  /** Recommended priority actions (3-5 items) */
  priorityActions: string[];

  /** Single recommended first step to begin AI journey */
  recommendedFirstMove: string;

  /** Risk factors to consider during AI adoption */
  riskConsiderations: string[];
}

/**
 * Individual task within a roadmap phase
 */
export interface RoadmapTask {
  /** Brief title of the task */
  title: string;

  /** Detailed description of what needs to be done */
  description: string;

  /** Responsible party or role (e.g., "IT Lead", "Managing Partner") */
  owner: string;

  /** Priority level for sequencing */
  priority: 'critical' | 'high' | 'medium' | 'low';

  /** Related pillar if applicable */
  pillarId?: PillarId;
}

/**
 * Phase within the implementation roadmap
 */
export interface RoadmapPhase {
  /** Phase number (1-based) */
  phase: number;

  /** High-level objective for this phase */
  objective: string;

  /** Tasks to complete in this phase */
  tasks: RoadmapTask[];

  /** Measurable criteria for phase completion */
  successCriteria: string[];
}

/**
 * Complete implementation roadmap
 */
export interface Roadmap {
  /** Ordered phases of implementation */
  phases: RoadmapPhase[];

  /** Firm name this roadmap was generated for */
  generatedFor: string;
}

/**
 * Readiness level configuration data
 */
export const READINESS_LEVELS: ReadinessLevelInfo[] = [
  {
    level: 'not-ready',
    label: 'Not Ready',
    scoreRange: [0, 20],
    description:
      'Significant foundational gaps exist that must be addressed before AI adoption. Focus on establishing basic processes and data practices.',
    color: '#dc2626', // red-600
  },
  {
    level: 'foundational',
    label: 'Foundational',
    scoreRange: [21, 40],
    description:
      'Basic capabilities are in place but major improvements are needed. Prioritize process documentation and data organization.',
    color: '#ea580c', // orange-600
  },
  {
    level: 'developing',
    label: 'Developing',
    scoreRange: [41, 60],
    description:
      'Making solid progress toward AI readiness. Some areas need focused attention before implementing advanced AI tools.',
    color: '#ca8a04', // yellow-600
  },
  {
    level: 'ready',
    label: 'Ready',
    scoreRange: [61, 80],
    description:
      'Well-positioned for AI adoption. Minor improvements will enhance success. Consider starting with targeted AI implementations.',
    color: '#16a34a', // green-600
  },
  {
    level: 'optimized',
    label: 'Optimized',
    scoreRange: [81, 100],
    description:
      'Fully prepared for advanced AI implementations. Strong foundation across all pillars enables sophisticated AI adoption.',
    color: '#0891b2', // cyan-600
  },
];

/**
 * Pillar status configuration data
 */
export const PILLAR_STATUS_INFO: Record<
  PillarStatus,
  { label: string; color: string; description: string }
> = {
  critical: {
    label: 'Critical',
    color: '#dc2626',
    description: 'Immediate attention required',
  },
  'needs-work': {
    label: 'Needs Work',
    color: '#ea580c',
    description: 'Significant improvement needed',
  },
  adequate: {
    label: 'Adequate',
    color: '#ca8a04',
    description: 'Meets basic requirements',
  },
  strong: {
    label: 'Strong',
    color: '#16a34a',
    description: 'Good capabilities in place',
  },
  excellent: {
    label: 'Excellent',
    color: '#0891b2',
    description: 'Best-in-class capabilities',
  },
};

/**
 * Determines pillar status based on score percentage
 */
export function getPillarStatus(scorePercent: number): PillarStatus {
  if (scorePercent <= 20) return 'critical';
  if (scorePercent <= 40) return 'needs-work';
  if (scorePercent <= 60) return 'adequate';
  if (scorePercent <= 80) return 'strong';
  return 'excellent';
}

/**
 * Determines readiness level based on overall score
 */
export function getReadinessLevel(overallScore: number): ReadinessLevel {
  if (overallScore <= 20) return 'not-ready';
  if (overallScore <= 40) return 'foundational';
  if (overallScore <= 60) return 'developing';
  if (overallScore <= 80) return 'ready';
  return 'optimized';
}
