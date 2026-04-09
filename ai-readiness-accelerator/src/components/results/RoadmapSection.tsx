/**
 * RoadmapSection Component
 *
 * Displays the implementation roadmap with 30/60/90 day phases,
 * tasks, blockers warning, and a call-to-action.
 */

import React, { memo, useMemo } from 'react';
import {
  Map,
  AlertTriangle,
  CheckCircle,
  Circle,
  Target,
} from 'lucide-react';
import type { Roadmap, RoadmapPhase, RoadmapTask } from '../../types/results.types';
import { Card } from '../ui';
import { BookCallCTA } from './BookCallCTA';

/**
 * Blocker item from assessment
 */
export interface Blocker {
  /** Pillar the blocker relates to */
  pillarName: string;
  /** Description of the blocker */
  description: string;
  /** Severity level */
  severity: 'high' | 'medium' | 'low';
}

export interface RoadmapSectionProps {
  /** Implementation roadmap with phases */
  roadmap: Roadmap | null;
  /** List of identified blockers that need addressing */
  blockers: Blocker[];
  /** Callback when booking a diagnostic call */
  onBookCall?: () => void;
}

/**
 * Priority badge colors
 */
const PRIORITY_COLORS: Record<RoadmapTask['priority'], string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
};

/**
 * Phase timeline labels
 */
const PHASE_LABELS: Record<number, string> = {
  1: 'Days 1-30',
  2: 'Days 31-60',
  3: 'Days 61-90',
};

/**
 * Blockers warning component
 */
const BlockersWarning: React.FC<{ blockers: Blocker[] }> = memo(({ blockers }) => {
  if (blockers.length === 0) return null;

  const highSeverityCount = blockers.filter(b => b.severity === 'high').length;

  return (
    <div
      className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div>
          <h4 className="font-semibold text-amber-800 mb-2">
            {highSeverityCount > 0
              ? `${highSeverityCount} Critical Blocker${highSeverityCount > 1 ? 's' : ''} Identified`
              : `${blockers.length} Blocker${blockers.length > 1 ? 's' : ''} Identified`}
          </h4>
          <p className="text-sm text-amber-700 mb-3">
            The following issues should be addressed before proceeding with AI implementation:
          </p>
          <ul className="space-y-2">
            {blockers.map((blocker, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-amber-800"
              >
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    blocker.severity === 'high'
                      ? 'bg-red-100 text-red-700'
                      : blocker.severity === 'medium'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {blocker.severity.toUpperCase()}
                </span>
                <span>
                  <strong>{blocker.pillarName}:</strong> {blocker.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
});

BlockersWarning.displayName = 'BlockersWarning';

/**
 * Task list item component
 */
const TaskItem: React.FC<{ task: RoadmapTask }> = memo(({ task }) => (
  <li className="flex items-start gap-3 py-2">
    <Circle
      className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0"
      aria-hidden="true"
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-gray-900">{task.title}</span>
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${
            PRIORITY_COLORS[task.priority]
          }`}
        >
          {task.priority}
        </span>
      </div>
      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
      <p className="text-xs text-gray-500 mt-1">
        <strong>Owner:</strong> {task.owner}
      </p>
    </div>
  </li>
));

TaskItem.displayName = 'TaskItem';

/**
 * Success criteria list component
 */
const SuccessCriteria: React.FC<{ criteria: string[] }> = memo(({ criteria }) => (
  <div className="mt-4 pt-4 border-t border-gray-200">
    <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
      <Target className="w-4 h-4" aria-hidden="true" />
      Success Criteria
    </h5>
    <ul className="space-y-1">
      {criteria.map((criterion, index) => (
        <li
          key={index}
          className="flex items-center gap-2 text-sm text-gray-600"
        >
          <CheckCircle
            className="w-3 h-3 text-green-500 flex-shrink-0"
            aria-hidden="true"
          />
          {criterion}
        </li>
      ))}
    </ul>
  </div>
));

SuccessCriteria.displayName = 'SuccessCriteria';

/**
 * Phase card component
 */
const PhaseCard: React.FC<{
  phase: RoadmapPhase;
  isFirst: boolean;
  isLast: boolean;
}> = memo(({ phase, isFirst, isLast }) => {
  const phaseLabel = PHASE_LABELS[phase.phase] || `Phase ${phase.phase}`;

  return (
    <div className="relative">
      {/* Timeline connector */}
      {!isFirst && (
        <div
          className="absolute left-6 -top-6 w-0.5 h-6 bg-indigo-200"
          aria-hidden="true"
        />
      )}

      <div className="flex items-start gap-4">
        {/* Timeline dot */}
        <div
          className="flex-shrink-0 w-12 h-12 rounded-full bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="text-indigo-700 font-bold text-sm">
            {phase.phase * 30}
          </span>
        </div>

        {/* Phase content */}
        <div className="flex-1 pb-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            {/* Phase header */}
            <div className="mb-4">
              <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium mb-1">
                {phaseLabel}
              </div>
              <h4 className="text-lg font-semibold text-gray-900">
                {phase.objective}
              </h4>
            </div>

            {/* Tasks */}
            {phase.tasks.length > 0 ? (
              <ul className="divide-y divide-gray-100" role="list">
                {phase.tasks.map((task, index) => (
                  <TaskItem key={index} task={task} />
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">
                No specific tasks for this phase based on your assessment.
              </p>
            )}

            {/* Success criteria */}
            {phase.successCriteria.length > 0 && (
              <SuccessCriteria criteria={phase.successCriteria} />
            )}
          </div>
        </div>
      </div>

      {/* Timeline connector to next */}
      {!isLast && (
        <div
          className="absolute left-6 bottom-0 w-0.5 h-6 bg-indigo-200"
          aria-hidden="true"
        />
      )}
    </div>
  );
});

PhaseCard.displayName = 'PhaseCard';

/**
 * Empty roadmap state
 */
const EmptyRoadmap: React.FC = memo(() => (
  <div className="text-center py-12">
    <Map
      className="w-12 h-12 text-gray-300 mx-auto mb-4"
      aria-hidden="true"
    />
    <p className="text-gray-600 font-medium">No roadmap available</p>
    <p className="text-sm text-gray-500 mt-1">
      Complete the assessment to generate your implementation roadmap.
    </p>
  </div>
));

EmptyRoadmap.displayName = 'EmptyRoadmap';

/**
 * RoadmapSection displays the 30/60/90 day implementation roadmap
 * with tasks organized by phase, blockers warning, and success criteria.
 * Includes a CTA for booking a diagnostic call.
 */
export const RoadmapSection: React.FC<RoadmapSectionProps> = memo(({
  roadmap,
  blockers,
  onBookCall,
}) => {
  // Sort phases by phase number
  const sortedPhases = useMemo(() => {
    if (!roadmap?.phases) return [];
    return [...roadmap.phases].sort((a, b) => a.phase - b.phase);
  }, [roadmap?.phases]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Map className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900">
            Implementation Roadmap
          </h3>
        </div>
        {roadmap?.generatedFor && (
          <p className="text-sm text-gray-500">
            Customized for {roadmap.generatedFor}
          </p>
        )}
      </Card>

      {/* Blockers warning */}
      <BlockersWarning blockers={blockers} />

      {/* Timeline */}
      <Card padding="lg">
        {sortedPhases.length > 0 ? (
          <div className="relative">
            {sortedPhases.map((phase, index) => (
              <PhaseCard
                key={phase.phase}
                phase={phase}
                isFirst={index === 0}
                isLast={index === sortedPhases.length - 1}
              />
            ))}
          </div>
        ) : (
          <EmptyRoadmap />
        )}
      </Card>

      {/* Book call CTA */}
      {onBookCall && <BookCallCTA onBookCall={onBookCall} />}
    </div>
  );
});

RoadmapSection.displayName = 'RoadmapSection';

export default RoadmapSection;
