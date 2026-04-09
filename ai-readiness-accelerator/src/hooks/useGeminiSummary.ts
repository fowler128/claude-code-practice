/**
 * Hook for fetching and managing AI-generated executive summaries.
 *
 * Features:
 * - Lazy loading with enabled flag
 * - Loading, error, and success states
 * - Request cancellation on cleanup
 * - Manual regenerate functionality
 *
 * @module useGeminiSummary
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PillarScores, ExecutiveSummary } from '../types';
import type { FirmProfile } from '../types/firm.types';
import { generateExecutiveSummary } from '../services/gemini.service';

/**
 * Props for the useGeminiSummary hook
 */
export interface UseGeminiSummaryProps {
  /** Pillar scores from the assessment */
  scores: PillarScores;
  /** Firm profile for context */
  firmProfile: FirmProfile | null;
  /** Whether to enable fetching (useful for delaying until needed) */
  enabled?: boolean;
}

/**
 * Return type for the useGeminiSummary hook
 */
export interface UseGeminiSummaryReturn {
  /** The generated executive summary (null if not yet loaded) */
  summary: ExecutiveSummary | null;
  /** Whether a request is currently in progress */
  loading: boolean;
  /** Error message if the request failed */
  error: string | null;
  /** Function to regenerate the summary */
  regenerate: () => void;
}

/**
 * Converts FirmProfile from firm.types to the format expected by gemini.service
 */
function convertFirmProfile(profile: FirmProfile): {
  name: string;
  practiceAreas: string[];
  size: 'Solo' | 'Small' | 'Mid-size' | 'Large' | 'Enterprise';
  attorneyCount?: number;
  currentTools: string[];
  aiGoals?: string[];
} {
  // Determine size based on attorney count
  let size: 'Solo' | 'Small' | 'Mid-size' | 'Large' | 'Enterprise';
  if (profile.attorneyCount <= 1) {
    size = 'Solo';
  } else if (profile.attorneyCount <= 10) {
    size = 'Small';
  } else if (profile.attorneyCount <= 50) {
    size = 'Mid-size';
  } else if (profile.attorneyCount <= 200) {
    size = 'Large';
  } else {
    size = 'Enterprise';
  }

  // Convert practice areas to strings
  const practiceAreas = profile.practiceAreas.map((area) => {
    // Convert kebab-case to title case
    return area
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  });

  // Collect current tools
  const currentTools: string[] = [];
  if (profile.practiceManagement && profile.practiceManagement !== 'none') {
    currentTools.push(profile.practiceManagement);
  }
  if (profile.documentManagement) {
    currentTools.push(profile.documentManagement);
  }

  return {
    name: profile.firmName,
    practiceAreas,
    size,
    attorneyCount: profile.attorneyCount,
    currentTools,
  };
}

/**
 * Hook for fetching AI-generated executive summaries from the Gemini service.
 *
 * The hook implements a cancellation pattern to prevent state updates after
 * unmounting and to cancel in-flight requests when regenerating.
 *
 * @param props - Object containing scores, firmProfile, and enabled flag
 * @returns Object with summary, loading, error states and regenerate function
 *
 * @example
 * ```tsx
 * function SummarySection() {
 *   const { state } = useAssessment();
 *   const { pillarScores } = useResults({ responses: state.responses });
 *
 *   // Only fetch when user reaches results page
 *   const [showResults, setShowResults] = useState(false);
 *
 *   const {
 *     summary,
 *     loading,
 *     error,
 *     regenerate,
 *   } = useGeminiSummary({
 *     scores: pillarScores,
 *     firmProfile: state.firmProfile,
 *     enabled: showResults && pillarScores.overall > 0,
 *   });
 *
 *   if (loading) {
 *     return <LoadingSpinner />;
 *   }
 *
 *   if (error) {
 *     return (
 *       <div>
 *         <p>Error: {error}</p>
 *         <button onClick={regenerate}>Retry</button>
 *       </div>
 *     );
 *   }
 *
 *   if (!summary) {
 *     return null;
 *   }
 *
 *   return (
 *     <div>
 *       <h2>Executive Summary</h2>
 *       <p>{summary.overallAssessment}</p>
 *
 *       <h3>Key Findings</h3>
 *       <ul>
 *         {summary.keyFindings.map((finding, i) => (
 *           <li key={i}>{finding}</li>
 *         ))}
 *       </ul>
 *
 *       <button onClick={regenerate}>Regenerate Summary</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useGeminiSummary({
  scores,
  firmProfile,
  enabled = true,
}: UseGeminiSummaryProps): UseGeminiSummaryReturn {
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Track the current request for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Track if we've already fetched to avoid duplicate requests
  const hasFetchedRef = useRef<boolean>(false);

  /**
   * Fetch the executive summary from the Gemini service
   */
  const fetchSummary = useCallback(async () => {
    // Don't fetch if disabled or no firm profile
    if (!enabled || !firmProfile) {
      return;
    }

    // Don't fetch if scores are empty/invalid
    if (!scores || scores.overall === 0) {
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // Convert firm profile to the format expected by the service
      const convertedProfile = convertFirmProfile(firmProfile);

      // Note: The gemini.service doesn't support AbortController directly,
      // but we track mounted state to prevent state updates after unmount
      const result = await generateExecutiveSummary(scores, convertedProfile);

      // Only update state if still mounted and not cancelled
      if (isMountedRef.current && abortControllerRef.current) {
        setSummary(result);
        setLoading(false);
        hasFetchedRef.current = true;
      }
    } catch (err) {
      // Only update state if still mounted and not cancelled
      if (isMountedRef.current && abortControllerRef.current) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to generate summary';
        setError(errorMessage);
        setLoading(false);
      }
    }
  }, [enabled, firmProfile, scores]);

  /**
   * Regenerate the summary (used for manual refresh)
   */
  const regenerate = useCallback(() => {
    // Reset fetched flag to allow re-fetch
    hasFetchedRef.current = false;
    setSummary(null);
    fetchSummary();
  }, [fetchSummary]);

  /**
   * Effect to fetch summary when enabled and inputs are valid
   */
  useEffect(() => {
    // Set mounted flag
    isMountedRef.current = true;

    // Only auto-fetch once per mount when conditions are met
    if (enabled && firmProfile && scores.overall > 0 && !hasFetchedRef.current) {
      fetchSummary();
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false;

      // Cancel any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [enabled, firmProfile, scores.overall, fetchSummary]);

  /**
   * Reset state when disabled
   */
  useEffect(() => {
    if (!enabled) {
      setSummary(null);
      setLoading(false);
      setError(null);
      hasFetchedRef.current = false;
    }
  }, [enabled]);

  return {
    summary,
    loading,
    error,
    regenerate,
  };
}

export default useGeminiSummary;
