import React, { useCallback } from 'react';
import { useResults } from '../hooks/useResults';
import { useROICalculator } from '../hooks/useROICalculator';
import { useGeminiSummary } from '../hooks/useGeminiSummary';
import { ResultsDashboard } from '../components/results/ResultsDashboard';
import type { AssessmentResponses } from '../types/assessment.types';
import type { FirmProfile } from '../types/firm.types';

/** Calendly URL for booking consultation calls */
const CALENDLY_URL = 'https://calendly.com/bizdeedz/ai-readiness-consultation';

export interface AssessmentData {
  /** User's assessment responses */
  responses: AssessmentResponses;
  /** User's firm profile information */
  firmProfile: FirmProfile;
}

export interface ResultsViewProps {
  /** Assessment data including responses and firm profile */
  assessmentData: AssessmentData;
  /** Callback when user resets to start over */
  onReset: () => void;
}

/**
 * Results view that displays assessment results, ROI calculations, and AI-generated summary.
 * Uses multiple hooks to process and display comprehensive results.
 */
export const ResultsView: React.FC<ResultsViewProps> = ({ assessmentData, onReset }) => {
  const { responses, firmProfile } = assessmentData;

  // Calculate scores and results from assessment responses
  const {
    scores,
    overallScore,
    readinessLevel,
    strengths,
    gaps,
    blockers,
    pillarScores,
  } = useResults({ responses, firmProfile });

  // Calculate ROI projections
  const {
    inputs: roiInputs,
    projections,
    setInput,
    resetToDefaults,
    breakdown,
  } = useROICalculator();

  // Generate AI-powered executive summary
  const {
    summary,
    loading: summaryLoading,
    error: summaryError,
    regenerate: retrySummary,
  } = useGeminiSummary({
    scores: pillarScores,
    firmProfile,
    enabled: true,
  });

  /**
   * Opens Calendly in a new window for booking a consultation call
   */
  const handleBookCall = useCallback(() => {
    window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
  }, []);

  /**
   * Handle ROI input changes
   */
  const handleRoiInputChange = useCallback(
    (key: string, value: number) => {
      setInput(key as keyof typeof roiInputs, value);
    },
    [setInput]
  );

  return (
    <ResultsDashboard
      // Firm info
      firmProfile={firmProfile}
      // Scores and analysis
      scores={scores}
      overallScore={overallScore}
      readinessLevel={readinessLevel}
      strengths={strengths}
      gaps={gaps}
      blockers={blockers}
      // ROI data
      roiInputs={roiInputs}
      roiProjections={projections}
      roiBreakdown={breakdown}
      onRoiInputChange={handleRoiInputChange}
      onRoiReset={resetToDefaults}
      // AI summary
      summary={summary}
      summaryLoading={summaryLoading}
      summaryError={summaryError}
      onRetrySummary={retrySummary}
      // Actions
      onBookCall={handleBookCall}
      onReset={onReset}
    />
  );
};

export default ResultsView;
