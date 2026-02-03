/**
 * ScoreSummaryCard Component
 *
 * Displays the overall assessment score with a circular progress indicator,
 * readiness level badge, and firm name.
 */

import React, { memo, useMemo } from 'react';
import type { ReadinessLevel } from '../../types/results.types';
import { READINESS_LEVELS } from '../../types/results.types';
import { Card, Badge } from '../ui';

export interface ScoreSummaryCardProps {
  /** Overall assessment score (0-100) */
  overallScore: number;
  /** Calculated readiness level */
  readinessLevel: ReadinessLevel;
  /** Name of the firm being assessed */
  firmName: string;
}

/**
 * Maps readiness levels to badge variants for color-coding
 */
const READINESS_BADGE_VARIANTS: Record<ReadinessLevel, 'error' | 'warning' | 'info' | 'success'> = {
  'not-ready': 'error',
  'foundational': 'warning',
  'developing': 'warning',
  'ready': 'success',
  'optimized': 'info',
};

/**
 * Circular progress indicator component
 */
const CircularProgress: React.FC<{ score: number; color: string }> = memo(({ score, color }) => {
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <svg
      width={radius * 2}
      height={radius * 2}
      viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      className="transform -rotate-90"
      role="img"
      aria-label={`Score: ${score} out of 100`}
    >
      {/* Background circle */}
      <circle
        stroke="#e5e7eb"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      {/* Progress circle */}
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        style={{
          transition: 'stroke-dashoffset 0.5s ease-in-out',
        }}
      />
    </svg>
  );
});

CircularProgress.displayName = 'CircularProgress';

/**
 * ScoreSummaryCard displays the overall assessment score with visual indicators.
 * Features a large circular progress indicator, color-coded readiness badge,
 * and firm name for context.
 */
export const ScoreSummaryCard: React.FC<ScoreSummaryCardProps> = memo(({
  overallScore,
  readinessLevel,
  firmName,
}) => {
  // Get readiness level info with memoization
  const readinessInfo = useMemo(() => {
    return READINESS_LEVELS.find(level => level.level === readinessLevel) || READINESS_LEVELS[0];
  }, [readinessLevel]);

  const badgeVariant = READINESS_BADGE_VARIANTS[readinessLevel];

  // Ensure score is within bounds
  const clampedScore = Math.max(0, Math.min(100, Math.round(overallScore)));

  return (
    <Card className="text-center">
      <h2 className="text-lg font-semibold text-gray-700 mb-2">
        AI Readiness Score
      </h2>

      {/* Firm name */}
      <p className="text-sm text-gray-500 mb-4">{firmName}</p>

      {/* Circular progress indicator with score */}
      <div className="relative inline-flex items-center justify-center mb-4">
        <CircularProgress score={clampedScore} color={readinessInfo.color} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-bold"
            style={{ color: readinessInfo.color }}
            aria-hidden="true"
          >
            {clampedScore}
          </span>
          <span className="text-sm text-gray-500">out of 100</span>
        </div>
      </div>

      {/* Readiness level badge */}
      <div className="mb-3">
        <Badge variant={badgeVariant} size="lg">
          {readinessInfo.label}
        </Badge>
      </div>

      {/* Readiness level description */}
      <p className="text-sm text-gray-600 max-w-md mx-auto">
        {readinessInfo.description}
      </p>
    </Card>
  );
});

ScoreSummaryCard.displayName = 'ScoreSummaryCard';

export default ScoreSummaryCard;
