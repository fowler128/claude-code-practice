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
    pillarScores,
    overallScore,
    readinessLevel,
    strengthsGaps,
    roadmap,
    isLoading: resultsLoading,
  } = useResults(responses, firmProfile);

  // Calculate ROI projections
  const {
    roiBreakdown,
    updateInputs,
    resetInputs,
    isLoading: roiLoading,
  } = useROICalculator(firmProfile);

  // Generate AI-powered executive summary
  const {
    summary,
    isLoading: summaryLoading,
    error: summaryError,
    retry: retrySummary,
  } = useGeminiSummary({
    pillarScores,
    overallScore,
    readinessLevel,
    firmProfile,
    strengthsGaps,
  });

  /**
   * Opens Calendly in a new window for booking a consultation call
   */
  const handleBookCall = useCallback(() => {
    window.open(CALENDLY_URL, '_blank', 'noopener,noreferrer');
  }, []);

  // Combined loading state
  const isLoading = resultsLoading || roiLoading;

  return (
    <ResultsDashboard
      // Firm info
      firmProfile={firmProfile}
      // Scores and analysis
      pillarScores={pillarScores}
      overallScore={overallScore}
      readinessLevel={readinessLevel}
      strengthsGaps={strengthsGaps}
      roadmap={roadmap}
      // ROI data
      roiBreakdown={roiBreakdown}
      onROIInputsChange={updateInputs}
      onROIReset={resetInputs}
      // AI summary
      summary={summary}
      summaryLoading={summaryLoading}
      summaryError={summaryError}
      onRetrySummary={retrySummary}
      // Loading and actions
      isLoading={isLoading}
      onBookCall={handleBookCall}
      onReset={onReset}
    />
  );
};

export default ResultsView;
