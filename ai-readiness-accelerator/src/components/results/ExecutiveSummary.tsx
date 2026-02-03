/**
 * ExecutiveSummary Component
 *
 * Displays the AI-generated executive summary with loading, error,
 * and success states. Includes a regenerate option.
 */

import React, { memo } from 'react';
import {
  BrainCircuit,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type { ExecutiveSummary as ExecutiveSummaryType } from '../../types/results.types';
import { Card, Button, LoadingSpinner } from '../ui';

export interface ExecutiveSummaryProps {
  /** The executive summary data (null if not yet loaded) */
  summary: ExecutiveSummaryType | null;
  /** Whether the summary is currently being generated */
  loading: boolean;
  /** Error message if generation failed */
  error: string | null;
  /** Callback to regenerate the summary */
  onRegenerate: () => void;
}

/**
 * Section header component for consistent styling
 */
const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
  iconColor?: string;
}> = memo(({ icon, title, iconColor = 'text-indigo-600' }) => (
  <div className="flex items-center gap-2 mb-3">
    <span className={iconColor} aria-hidden="true">{icon}</span>
    <h4 className="font-semibold text-gray-900">{title}</h4>
  </div>
));

SectionHeader.displayName = 'SectionHeader';

/**
 * Loading state component
 */
const LoadingState: React.FC = memo(() => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <LoadingSpinner size="lg" className="mb-4" />
    <p className="text-gray-600 font-medium">Generating executive summary...</p>
    <p className="text-sm text-gray-500 mt-1">
      Our AI is analyzing your assessment results
    </p>
  </div>
));

LoadingState.displayName = 'LoadingState';

/**
 * Error state component
 */
const ErrorState: React.FC<{ error: string; onRetry: () => void }> = memo(({ error, onRetry }) => (
  <div
    className="flex flex-col items-center justify-center py-12 text-center"
    role="alert"
    aria-live="assertive"
  >
    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
      <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
    </div>
    <p className="text-gray-900 font-medium mb-2">Failed to generate summary</p>
    <p className="text-sm text-red-600 mb-4 max-w-md">{error}</p>
    <Button
      variant="secondary"
      onClick={onRetry}
      aria-label="Try generating summary again"
    >
      <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
      Try Again
    </Button>
  </div>
));

ErrorState.displayName = 'ErrorState';

/**
 * Empty state when no summary is available
 */
const EmptyState: React.FC<{ onGenerate: () => void }> = memo(({ onGenerate }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
      <BrainCircuit className="w-6 h-6 text-gray-400" aria-hidden="true" />
    </div>
    <p className="text-gray-900 font-medium mb-2">No summary available</p>
    <p className="text-sm text-gray-500 mb-4">
      Generate an AI-powered executive summary of your assessment
    </p>
    <Button onClick={onGenerate}>
      Generate Summary
    </Button>
  </div>
));

EmptyState.displayName = 'EmptyState';

/**
 * ExecutiveSummary displays the AI-generated analysis with proper loading,
 * error, and success states. Features structured sections for key findings,
 * priority actions, risk considerations, and recommended first move.
 */
export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = memo(({
  summary,
  loading,
  error,
  onRegenerate,
}) => {
  // Loading state
  if (loading) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900">
            Executive Summary
          </h3>
        </div>
        <LoadingState />
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900">
            Executive Summary
          </h3>
        </div>
        <ErrorState error={error} onRetry={onRegenerate} />
      </Card>
    );
  }

  // Empty state
  if (!summary) {
    return (
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <BrainCircuit className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900">
            Executive Summary
          </h3>
        </div>
        <EmptyState onGenerate={onRegenerate} />
      </Card>
    );
  }

  // Success state with summary content
  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-indigo-600" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900">
            Executive Summary
          </h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRegenerate}
          aria-label="Regenerate executive summary"
        >
          <RefreshCw className="w-4 h-4 mr-1" aria-hidden="true" />
          Regenerate
        </Button>
      </div>

      {/* Overall Assessment */}
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed">
          {summary.overallAssessment}
        </p>
      </div>

      <div className="space-y-6">
        {/* Key Findings */}
        <section>
          <SectionHeader
            icon={<Lightbulb className="w-5 h-5" />}
            title="Key Findings"
          />
          <ul className="space-y-2" role="list">
            {summary.keyFindings.map((finding, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-gray-700"
              >
                <CheckCircle
                  className="w-4 h-4 text-green-500 mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Priority Actions */}
        <section>
          <SectionHeader
            icon={<ArrowRight className="w-5 h-5" />}
            title="Priority Actions"
          />
          <ol className="space-y-2" role="list">
            {summary.priorityActions.map((action, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-gray-700"
              >
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-semibold"
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Recommended First Move - Highlighted */}
        <section className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
          <SectionHeader
            icon={<ArrowRight className="w-5 h-5" />}
            title="Recommended First Move"
            iconColor="text-indigo-700"
          />
          <p className="text-indigo-900 font-medium">
            {summary.recommendedFirstMove}
          </p>
        </section>

        {/* Risk Considerations */}
        <section>
          <SectionHeader
            icon={<AlertTriangle className="w-5 h-5" />}
            title="Risk Considerations"
            iconColor="text-amber-600"
          />
          <ul className="space-y-2" role="list">
            {summary.riskConsiderations.map((risk, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-gray-700"
              >
                <AlertTriangle
                  className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0"
                  aria-hidden="true"
                />
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Card>
  );
});

ExecutiveSummary.displayName = 'ExecutiveSummary';

export default ExecutiveSummary;
