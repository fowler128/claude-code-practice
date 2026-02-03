import React from 'react';
import {
  Workflow,
  Database,
  BookOpen,
  Settings,
  Shield,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import type { Question } from '../../types/assessment.types';
import type { ExtendedPillarDefinition } from '../../constants/pillars';
import { QuestionCard, type QuestionResponse } from './QuestionCard';
import { ProgressBar } from '../ui';

/**
 * Map of pillar icon names to Lucide components
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Workflow,
  Database,
  BookOpen,
  Settings,
  Shield,
  TrendingUp,
};

export interface PillarSectionProps {
  /** Pillar definition with questions */
  pillar: PillarDefinition;
  /** Array of responses for this pillar's questions */
  responses: QuestionResponse[];
  /** Callback when a response changes */
  onResponseChange: (response: QuestionResponse) => void;
}

/**
 * PillarSection displays all questions for a single assessment pillar.
 * Includes pillar header with icon, description, and progress indicator.
 */
export const PillarSection: React.FC<PillarSectionProps> = ({
  pillar,
  responses,
  onResponseChange,
}) => {
  const questions = pillar.questions || [];
  const answeredCount = responses.filter((r) => r.value !== undefined).length;
  const totalCount = questions.length;
  const progressPercent = totalCount > 0 ? (answeredCount / totalCount) * 100 : 0;

  // Get the icon component
  const iconName = (pillar as { icon?: string }).icon || 'Settings';
  const IconComponent = ICON_MAP[iconName] || Settings;

  // Find response for a specific question
  const getResponseForQuestion = (questionId: string): QuestionResponse | undefined => {
    return responses.find((r) => r.questionId === questionId);
  };

  return (
    <div className="space-y-6">
      {/* Pillar header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
            <IconComponent className="w-6 h-6 text-primary-600" aria-hidden="true" />
          </div>

          {/* Title and description */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-gray-900">{pillar.name}</h2>
            {pillar.description && (
              <p className="mt-1 text-sm text-gray-600">{pillar.description}</p>
            )}
          </div>
        </div>

        {/* Progress indicator */}
        <div className="mt-4">
            <ProgressBar
            value={progressPercent}
            showPercentage
            label={`${answeredCount} of ${totalCount} questions answered`}
          />
        </div>
      </div>

      {/* Questions list */}
      <div className="space-y-4" role="list" aria-label={`Questions for ${pillar.name}`}>
        {questions.map((question: Question, index: number) => (
          <div key={question.id} role="listitem">
            <QuestionCard
              question={question}
              response={getResponseForQuestion(question.id)}
              onChange={onResponseChange}
              questionNumber={index + 1}
            />
          </div>
        ))}
      </div>

      {/* Empty state */}
      {questions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No questions available for this pillar.</p>
        </div>
      )}
    </div>
  );
};

export default PillarSection;
