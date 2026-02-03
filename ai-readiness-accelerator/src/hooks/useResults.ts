/**
 * Hook for computing assessment results including scores, readiness level,
 * strengths, gaps, and blockers.
 *
 * Features:
 * - Memoized expensive calculations for performance
 * - Uses scoring.service.ts for all score computations
 * - Derives strengths/gaps and blockers from pillar scores
 *
 * @module useResults
 */

import { useMemo } from 'react';
import type {
  AssessmentResponses,
  PillarScores,
  PillarScore,
  ReadinessLevel,
  StrengthsGaps,
  StrengthGapItem,
} from '../types';
import type { FirmProfile } from '../types/firm.types';
import {
  calculateAllScores,
  identifyStrengthsGaps,
  getBlockers,
} from '../services/scoring.service';
import { PILLAR_DEFINITIONS } from '../constants/pillars';

/**
 * Props for the useResults hook
 */
export interface UseResultsProps {
  /** Assessment responses organized by pillar */
  responses: AssessmentResponses;
  /** Optional firm profile for context */
  firmProfile?: FirmProfile | null;
}

/**
 * Return type for the useResults hook
 */
export interface UseResultsReturn {
  /** Individual scores for each pillar */
  scores: PillarScore[];
  /** Overall composite score (0-5 scale) */
  overallScore: number;
  /** Determined readiness level based on overall score */
  readinessLevel: ReadinessLevel;
  /** Top performing pillars */
  strengths: StrengthGapItem[];
  /** Pillars needing improvement */
  gaps: StrengthGapItem[];
  /** Critical blockers that should be addressed before AI adoption */
  blockers: string[];
  /** Whether any responses exist */
  hasResponses: boolean;
  /** Complete pillar scores object for compatibility */
  pillarScores: PillarScores;
}

/**
 * Checks if the responses object contains any actual responses
 */
function hasAnyResponses(responses: AssessmentResponses): boolean {
  if (!responses) return false;

  return Object.values(responses).some(
    (pillarResponses) => pillarResponses && pillarResponses.length > 0
  );
}

/**
 * Hook for computing assessment results from responses.
 *
 * All calculations are memoized to prevent unnecessary re-computation.
 * Uses the scoring service for consistent calculation logic.
 *
 * @param props - Object containing responses and optional firm profile
 * @returns Computed results including scores, strengths, gaps, and blockers
 *
 * @example
 * ```tsx
 * function ResultsPage() {
 *   const { state } = useAssessment();
 *   const {
 *     scores,
 *     overallScore,
 *     readinessLevel,
 *     strengths,
 *     gaps,
 *     blockers,
 *   } = useResults({
 *     responses: state.responses,
 *     firmProfile: state.firmProfile,
 *   });
 *
 *   return (
 *     <div>
 *       <h1>Overall Score: {overallScore.toFixed(1)}/5</h1>
 *       <p>Readiness Level: {readinessLevel}</p>
 *
 *       <h2>Strengths</h2>
 *       <ul>
 *         {strengths.map(s => (
 *           <li key={s.pillarId}>{s.pillarName}: {s.score}</li>
 *         ))}
 *       </ul>
 *
 *       {blockers.length > 0 && (
 *         <div className="warning">
 *           <h2>Blockers</h2>
 *           <ul>
 *             {blockers.map((b, i) => <li key={i}>{b}</li>)}
 *           </ul>
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useResults({ responses, firmProfile: _firmProfile }: UseResultsProps): UseResultsReturn {
  // Note: firmProfile is available for future use in customizing results
  // Currently unused but kept for API consistency
  /**
   * Check if we have any responses to compute results from
   */
  const hasResponses = useMemo(() => hasAnyResponses(responses), [responses]);

  /**
   * Compute all pillar scores using the scoring service.
   * This is the main expensive calculation that needs memoization.
   */
  const pillarScores = useMemo<PillarScores>(() => {
    if (!hasResponses) {
      return {
        pillars: PILLAR_DEFINITIONS.map((pillar) => ({
          id: pillar.id,
          name: pillar.name,
          score: 0,
          status: 'critical' as const,
        })),
        overall: 0,
        readinessLevel: 'not-ready' as ReadinessLevel,
      };
    }

    return calculateAllScores(responses, PILLAR_DEFINITIONS);
  }, [responses, hasResponses]);

  /**
   * Extract individual pillar scores array
   */
  const scores = useMemo<PillarScore[]>(() => pillarScores.pillars, [pillarScores]);

  /**
   * Extract overall score
   */
  const overallScore = useMemo<number>(() => pillarScores.overall, [pillarScores]);

  /**
   * Extract readiness level
   */
  const readinessLevel = useMemo<ReadinessLevel>(
    () => pillarScores.readinessLevel,
    [pillarScores]
  );

  /**
   * Compute strengths and gaps from pillar scores
   */
  const strengthsGaps = useMemo<StrengthsGaps>(() => {
    if (!hasResponses) {
      return { strengths: [], gaps: [] };
    }

    return identifyStrengthsGaps(pillarScores.pillars);
  }, [pillarScores.pillars, hasResponses]);

  /**
   * Extract strengths array
   */
  const strengths = useMemo<StrengthGapItem[]>(
    () => strengthsGaps.strengths,
    [strengthsGaps]
  );

  /**
   * Extract gaps array
   */
  const gaps = useMemo<StrengthGapItem[]>(() => strengthsGaps.gaps, [strengthsGaps]);

  /**
   * Compute blockers from pillar scores
   */
  const blockers = useMemo<string[]>(() => {
    if (!hasResponses) {
      return [];
    }

    return getBlockers(pillarScores.pillars);
  }, [pillarScores.pillars, hasResponses]);

  return {
    scores,
    overallScore,
    readinessLevel,
    strengths,
    gaps,
    blockers,
    hasResponses,
    pillarScores,
  };
}

export default useResults;
