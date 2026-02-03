/**
 * Scoring Service for the AI Readiness Accelerator
 *
 * This service provides pure functions for calculating assessment scores,
 * determining readiness levels, and identifying strengths and gaps.
 */

import type {
  QuestionResponse,
  AssessmentResponses,
  PillarDefinition,
  PillarScores,
  PillarScore,
  PillarStatus,
  ReadinessLevel,
  StrengthsGaps,
  StrengthGapItem,
} from '../types';

import {
  CRITICAL_PILLAR_IDS,
  BLOCKER_SCORE_THRESHOLD,
  STRENGTHS_GAPS_COUNT,
  PILLAR_STATUS_DESCRIPTIONS,
} from '../constants';

/**
 * Calculates the score for a single pillar based on question responses.
 *
 * @param responses - Array of question responses for the pillar
 * @returns The average score rounded to 1 decimal place, or 0 if no responses
 *
 * @example
 * ```ts
 * const responses = [
 *   { questionId: 'q1', value: 4 },
 *   { questionId: 'q2', value: 3 },
 *   { questionId: 'q3', value: 5 },
 * ];
 * const score = calculatePillarScore(responses); // 4.0
 * ```
 */
export function calculatePillarScore(responses: QuestionResponse[]): number {
  if (!responses || responses.length === 0) {
    return 0;
  }

  const sum = responses.reduce((acc, response) => acc + response.value, 0);
  const average = sum / responses.length;

  // Round to 1 decimal place
  return Math.round(average * 10) / 10;
}

/**
 * Determines the status level for a pillar based on its score.
 *
 * @param score - The pillar's score (0-5 scale)
 * @returns The status level: 'critical', 'needs-work', 'adequate', 'strong', or 'excellent'
 *
 * @example
 * ```ts
 * getPillarStatus(1.2);  // 'critical'
 * getPillarStatus(2.0);  // 'needs-work'
 * getPillarStatus(3.0);  // 'adequate'
 * getPillarStatus(4.0);  // 'strong'
 * getPillarStatus(4.8);  // 'excellent'
 * ```
 */
export function getPillarStatus(score: number): PillarStatus {
  if (score < 1.5) {
    return 'critical';
  }
  if (score < 2.5) {
    return 'needs-work';
  }
  if (score < 3.5) {
    return 'adequate';
  }
  if (score < 4.5) {
    return 'strong';
  }
  return 'excellent';
}

/**
 * Determines the overall readiness level based on the average score.
 *
 * @param overallScore - The overall average score (0-5 scale)
 * @returns The readiness level: 'not-ready', 'foundational', 'developing', 'ready', or 'optimized'
 *
 * @example
 * ```ts
 * getReadinessLevel(0.5);  // 'not-ready'
 * getReadinessLevel(1.5);  // 'foundational'
 * getReadinessLevel(2.5);  // 'developing'
 * getReadinessLevel(3.5);  // 'ready'
 * getReadinessLevel(4.5);  // 'optimized'
 * ```
 */
export function getReadinessLevel(overallScore: number): ReadinessLevel {
  if (overallScore <= 1.0) {
    return 'not-ready';
  }
  if (overallScore <= 2.0) {
    return 'foundational';
  }
  if (overallScore <= 3.0) {
    return 'developing';
  }
  if (overallScore <= 4.0) {
    return 'ready';
  }
  return 'optimized';
}

/**
 * Calculates scores for all pillars and determines overall readiness.
 *
 * @param responses - Map of pillar IDs to their question responses
 * @param pillarDefinitions - Array of pillar definitions with id and name
 * @returns Complete scoring results including pillar scores, overall score, and readiness level
 *
 * @example
 * ```ts
 * const responses = {
 *   'data': [{ questionId: 'q1', value: 4 }, { questionId: 'q2', value: 3 }],
 *   'risk': [{ questionId: 'q1', value: 2 }, { questionId: 'q2', value: 3 }],
 * };
 * const pillars = [
 *   { id: 'data', name: 'Data Foundation' },
 *   { id: 'risk', name: 'Risk Management' },
 * ];
 * const scores = calculateAllScores(responses, pillars);
 * // {
 * //   pillars: [
 * //     { id: 'data', name: 'Data Foundation', score: 3.5, status: 'strong' },
 * //     { id: 'risk', name: 'Risk Management', score: 2.5, status: 'adequate' },
 * //   ],
 * //   overall: 3.0,
 * //   readinessLevel: 'developing'
 * // }
 * ```
 */
export function calculateAllScores(
  responses: AssessmentResponses,
  pillarDefinitions: PillarDefinition[]
): PillarScores {
  const pillarScores: PillarScore[] = pillarDefinitions.map((pillar) => {
    const pillarResponses = responses[pillar.id] || [];
    const score = calculatePillarScore(pillarResponses);
    const status = getPillarStatus(score);

    return {
      id: pillar.id,
      name: pillar.name,
      score,
      status,
    };
  });

  // Calculate overall score as average of all pillar scores
  const overall =
    pillarScores.length > 0
      ? Math.round(
          (pillarScores.reduce((acc, p) => acc + p.score, 0) / pillarScores.length) * 10
        ) / 10
      : 0;

  const readinessLevel = getReadinessLevel(overall);

  return {
    pillars: pillarScores,
    overall,
    readinessLevel,
  };
}

/**
 * Generates a description for a pillar based on its score level.
 *
 * @param pillarName - The name of the pillar
 * @param status - The pillar's status level
 * @returns A description string for the pillar
 */
function generatePillarDescription(pillarName: string, status: PillarStatus): string {
  return `${pillarName} ${PILLAR_STATUS_DESCRIPTIONS[status]}`;
}

/**
 * Identifies the top strengths and gaps from pillar scores.
 *
 * @param pillarScores - Array of pillar scores to analyze
 * @returns Object containing top 3 strengths and bottom 3 gaps with descriptions
 *
 * @example
 * ```ts
 * const pillarScores = [
 *   { id: 'data', name: 'Data Foundation', score: 4.5, status: 'excellent' },
 *   { id: 'risk', name: 'Risk Management', score: 2.0, status: 'needs-work' },
 *   { id: 'talent', name: 'Talent', score: 3.5, status: 'strong' },
 * ];
 * const { strengths, gaps } = identifyStrengthsGaps(pillarScores);
 * // strengths: [{ pillarId: 'data', pillarName: 'Data Foundation', score: 4.5, description: '...' }, ...]
 * // gaps: [{ pillarId: 'risk', pillarName: 'Risk Management', score: 2.0, description: '...' }, ...]
 * ```
 */
export function identifyStrengthsGaps(pillarScores: PillarScore[]): StrengthsGaps {
  if (!pillarScores || pillarScores.length === 0) {
    return { strengths: [], gaps: [] };
  }

  // Sort by score descending for strengths
  const sortedByScoreDesc = [...pillarScores].sort((a, b) => b.score - a.score);

  // Sort by score ascending for gaps
  const sortedByScoreAsc = [...pillarScores].sort((a, b) => a.score - b.score);

  // Take top N as strengths
  const strengths: StrengthGapItem[] = sortedByScoreDesc
    .slice(0, STRENGTHS_GAPS_COUNT)
    .map((pillar) => ({
      pillarId: pillar.id,
      pillarName: pillar.name,
      score: pillar.score,
      description: generatePillarDescription(pillar.name, pillar.status),
    }));

  // Take bottom N as gaps
  const gaps: StrengthGapItem[] = sortedByScoreAsc
    .slice(0, STRENGTHS_GAPS_COUNT)
    .map((pillar) => ({
      pillarId: pillar.id,
      pillarName: pillar.name,
      score: pillar.score,
      description: generatePillarDescription(pillar.name, pillar.status),
    }));

  return { strengths, gaps };
}

/**
 * Identifies blocking issues for AI deployment based on pillar scores.
 *
 * @param pillarScores - Array of pillar scores to analyze
 * @returns Array of blocker messages for any pillar with score below threshold,
 *          with special emphasis on critical pillars (risk and data)
 *
 * @example
 * ```ts
 * const pillarScores = [
 *   { id: 'data', name: 'Data Foundation', score: 2.0, status: 'needs-work' },
 *   { id: 'risk', name: 'Risk Management', score: 2.5, status: 'adequate' },
 *   { id: 'talent', name: 'Talent', score: 2.8, status: 'adequate' },
 * ];
 * const blockers = getBlockers(pillarScores);
 * // [
 * //   'CRITICAL: Data Foundation score (2.0) is below minimum threshold. This is a critical blocker for AI deployment.',
 * //   'CRITICAL: Risk Management score (2.5) is below minimum threshold. This is a critical blocker for AI deployment.',
 * //   'Talent score (2.8) is below the recommended threshold of 3.0'
 * // ]
 * ```
 */
export function getBlockers(pillarScores: PillarScore[]): string[] {
  if (!pillarScores || pillarScores.length === 0) {
    return [];
  }

  const blockers: string[] = [];

  for (const pillar of pillarScores) {
    if (pillar.score < BLOCKER_SCORE_THRESHOLD) {
      const isCriticalPillar = CRITICAL_PILLAR_IDS.includes(
        pillar.id as (typeof CRITICAL_PILLAR_IDS)[number]
      );

      if (isCriticalPillar) {
        blockers.push(
          `CRITICAL: ${pillar.name} score (${pillar.score}) is below minimum threshold. ` +
            `This is a critical blocker for AI deployment.`
        );
      } else {
        blockers.push(
          `${pillar.name} score (${pillar.score}) is below the recommended threshold of ${BLOCKER_SCORE_THRESHOLD}`
        );
      }
    }
  }

  return blockers;
}
