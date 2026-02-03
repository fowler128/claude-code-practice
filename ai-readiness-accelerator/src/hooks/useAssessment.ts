/**
 * Hook for managing assessment state including navigation, responses, and persistence.
 *
 * Features:
 * - Tracks current step, responses, firm profile, and completion status
 * - Auto-saves to localStorage with debouncing
 * - Restores state from localStorage on mount
 * - Provides computed values for progress and navigation
 *
 * @module useAssessment
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import type {
  AssessmentState,
  AssessmentResponses,
  LikertValue,
  PillarId,
} from '../types';
import {
  createInitialAssessmentState,
  createEmptyAssessmentResponses,
  PILLAR_ORDER,
} from '../types';
import type { FirmProfile } from '../types/firm.types';
import { useLocalStorage } from './useLocalStorage';
import { PILLAR_DEFINITIONS } from '../constants/pillars';

/** LocalStorage key for assessment state */
const ASSESSMENT_STORAGE_KEY = 'ai-readiness-assessment';

/** LocalStorage key for firm profile */
const FIRM_PROFILE_STORAGE_KEY = 'ai-readiness-firm-profile';

/** Debounce delay for auto-save in milliseconds */
const AUTO_SAVE_DEBOUNCE_MS = 500;

/** Total number of steps: 0 = firm profile, 1-6 = pillars, 7 = review */
const TOTAL_STEPS = 8;

/**
 * Assessment state that combines both assessment responses and firm profile
 */
export interface FullAssessmentState extends AssessmentState {
  firmProfile: FirmProfile | null;
}

/**
 * Actions available for managing assessment state
 */
export interface AssessmentActions {
  /** Set or update the firm profile */
  setFirmProfile: (profile: FirmProfile) => void;
  /** Set a response for a specific question */
  setResponse: (pillarId: PillarId, questionId: string, value: LikertValue) => void;
  /** Navigate to the next step */
  nextStep: () => void;
  /** Navigate to the previous step */
  prevStep: () => void;
  /** Navigate to a specific step */
  goToStep: (step: number) => void;
  /** Mark the assessment as complete */
  complete: () => void;
  /** Reset the entire assessment to initial state */
  reset: () => void;
}

/**
 * Computed values derived from assessment state
 */
export interface AssessmentComputed {
  /** Overall progress as a percentage (0-100) */
  progress: number;
  /** Whether navigation to the next step is allowed */
  canGoNext: boolean;
  /** Whether navigation to the previous step is allowed */
  canGoPrev: boolean;
  /** Total number of questions answered */
  totalAnswered: number;
  /** Total number of questions in the assessment */
  totalQuestions: number;
  /** Whether the current step has all required responses */
  currentStepComplete: boolean;
}

/**
 * Return type for the useAssessment hook
 */
export interface UseAssessmentReturn {
  /** Current assessment state including firm profile */
  state: FullAssessmentState;
  /** Actions for manipulating assessment state */
  actions: AssessmentActions;
  /** Computed values derived from state */
  computed: AssessmentComputed;
}

/**
 * Creates a default empty firm profile
 */
function createEmptyFirmProfile(): FirmProfile {
  return {
    firmName: '',
    practiceAreas: [],
    attorneyCount: 0,
    paralegalCount: 0,
    intakeStaffCount: 0,
    adminCount: 0,
    practiceManagement: 'none',
    documentManagement: '',
    currentOperationsMaturity: 'informal',
  };
}

/**
 * Validates that a firm profile has the minimum required fields
 */
function isFirmProfileValid(profile: FirmProfile | null): boolean {
  if (!profile) return false;
  return (
    profile.firmName.trim().length > 0 &&
    profile.practiceAreas.length > 0 &&
    profile.attorneyCount >= 0
  );
}

/**
 * Gets the pillar ID for a given step number
 */
function getPillarForStep(step: number): PillarId | null {
  if (step >= 1 && step <= 6) {
    return PILLAR_ORDER[step - 1];
  }
  return null;
}

/**
 * Counts the number of questions answered for a specific pillar
 */
function countPillarResponses(
  responses: AssessmentResponses,
  pillarId: PillarId
): number {
  return responses[pillarId]?.length || 0;
}

/**
 * Gets the total number of questions for a specific pillar
 */
function getPillarQuestionCount(pillarId: PillarId): number {
  const pillar = PILLAR_DEFINITIONS.find((p) => p.id === pillarId);
  return pillar?.questions?.length || 0;
}

/**
 * Hook for managing the entire assessment workflow.
 *
 * @returns Object containing state, actions, and computed values
 *
 * @example
 * ```tsx
 * function AssessmentPage() {
 *   const { state, actions, computed } = useAssessment();
 *
 *   if (state.currentStep === 0) {
 *     return (
 *       <FirmProfileForm
 *         profile={state.firmProfile}
 *         onSubmit={actions.setFirmProfile}
 *         onNext={actions.nextStep}
 *       />
 *     );
 *   }
 *
 *   return (
 *     <QuestionForm
 *       progress={computed.progress}
 *       canGoNext={computed.canGoNext}
 *       onNext={actions.nextStep}
 *       onPrev={actions.prevStep}
 *     />
 *   );
 * }
 * ```
 */
export function useAssessment(): UseAssessmentReturn {
  // Load persisted state from localStorage
  const [persistedState, setPersistedState, removePersistedState] =
    useLocalStorage<AssessmentState>(
      ASSESSMENT_STORAGE_KEY,
      createInitialAssessmentState()
    );

  const [persistedProfile, setPersistedProfile, removePersistedProfile] =
    useLocalStorage<FirmProfile | null>(FIRM_PROFILE_STORAGE_KEY, null);

  // Internal state that mirrors persisted state but allows immediate updates
  const [assessmentState, setAssessmentState] =
    useState<AssessmentState>(persistedState);
  const [firmProfile, setFirmProfileState] = useState<FirmProfile | null>(
    persistedProfile
  );

  // Ref to track pending auto-save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync persisted state changes to internal state on mount
  useEffect(() => {
    setAssessmentState(persistedState);
  }, [persistedState]);

  useEffect(() => {
    setFirmProfileState(persistedProfile);
  }, [persistedProfile]);

  /**
   * Debounced auto-save function
   */
  const scheduleAutoSave = useCallback(
    (newState: AssessmentState, newProfile: FirmProfile | null) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        setPersistedState(newState);
        setPersistedProfile(newProfile);
        saveTimeoutRef.current = null;
      }, AUTO_SAVE_DEBOUNCE_MS);
    },
    [setPersistedState, setPersistedProfile]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Set or update the firm profile
   */
  const setFirmProfile = useCallback(
    (profile: FirmProfile) => {
      setFirmProfileState(profile);
      scheduleAutoSave(assessmentState, profile);
    },
    [assessmentState, scheduleAutoSave]
  );

  /**
   * Set a response for a specific question
   */
  const setResponse = useCallback(
    (pillarId: PillarId, questionId: string, value: LikertValue) => {
      setAssessmentState((prev) => {
        const pillarResponses = [...(prev.responses[pillarId] || [])];
        const existingIndex = pillarResponses.findIndex(
          (r) => r.questionId === questionId
        );

        if (existingIndex >= 0) {
          pillarResponses[existingIndex] = { questionId, value };
        } else {
          pillarResponses.push({ questionId, value });
        }

        const newResponses: AssessmentResponses = {
          ...prev.responses,
          [pillarId]: pillarResponses,
        };

        const newState: AssessmentState = {
          ...prev,
          responses: newResponses,
        };

        scheduleAutoSave(newState, firmProfile);
        return newState;
      });
    },
    [firmProfile, scheduleAutoSave]
  );

  /**
   * Navigate to the next step
   */
  const nextStep = useCallback(() => {
    setAssessmentState((prev) => {
      if (prev.currentStep >= TOTAL_STEPS - 1) {
        return prev;
      }

      const newState: AssessmentState = {
        ...prev,
        currentStep: prev.currentStep + 1,
      };

      scheduleAutoSave(newState, firmProfile);
      return newState;
    });
  }, [firmProfile, scheduleAutoSave]);

  /**
   * Navigate to the previous step
   */
  const prevStep = useCallback(() => {
    setAssessmentState((prev) => {
      if (prev.currentStep <= 0) {
        return prev;
      }

      const newState: AssessmentState = {
        ...prev,
        currentStep: prev.currentStep - 1,
      };

      scheduleAutoSave(newState, firmProfile);
      return newState;
    });
  }, [firmProfile, scheduleAutoSave]);

  /**
   * Navigate to a specific step
   */
  const goToStep = useCallback(
    (step: number) => {
      if (step < 0 || step >= TOTAL_STEPS) {
        return;
      }

      setAssessmentState((prev) => {
        const newState: AssessmentState = {
          ...prev,
          currentStep: step,
        };

        scheduleAutoSave(newState, firmProfile);
        return newState;
      });
    },
    [firmProfile, scheduleAutoSave]
  );

  /**
   * Mark the assessment as complete
   */
  const complete = useCallback(() => {
    setAssessmentState((prev) => {
      const newState: AssessmentState = {
        ...prev,
        isComplete: true,
        completedAt: new Date().toISOString(),
      };

      // Immediately persist completion
      setPersistedState(newState);
      return newState;
    });
  }, [setPersistedState]);

  /**
   * Reset the entire assessment to initial state
   */
  const reset = useCallback(() => {
    const newState = createInitialAssessmentState();
    setAssessmentState(newState);
    setFirmProfileState(null);
    removePersistedState();
    removePersistedProfile();
  }, [removePersistedState, removePersistedProfile]);

  /**
   * Computed values
   */
  const computed = useMemo<AssessmentComputed>(() => {
    // Calculate total questions and answered
    let totalQuestions = 0;
    let totalAnswered = 0;

    for (const pillarId of PILLAR_ORDER) {
      const questionCount = getPillarQuestionCount(pillarId);
      const answeredCount = countPillarResponses(assessmentState.responses, pillarId);
      totalQuestions += questionCount;
      totalAnswered += answeredCount;
    }

    // Calculate progress (firm profile counts as one "pillar" worth)
    const firmProfileComplete = isFirmProfileValid(firmProfile);
    const firmProfileWeight = firmProfileComplete ? 1 : 0;
    const totalWeight = 7; // 1 for firm profile + 6 pillars
    const pillarCompletionWeight =
      totalQuestions > 0 ? (totalAnswered / totalQuestions) * 6 : 0;
    const progress = Math.round(
      ((firmProfileWeight + pillarCompletionWeight) / totalWeight) * 100
    );

    // Check if current step is complete
    let currentStepComplete = false;
    if (assessmentState.currentStep === 0) {
      currentStepComplete = firmProfileComplete;
    } else if (assessmentState.currentStep === 7) {
      // Review step is always "complete"
      currentStepComplete = true;
    } else {
      const pillarId = getPillarForStep(assessmentState.currentStep);
      if (pillarId) {
        const required = getPillarQuestionCount(pillarId);
        const answered = countPillarResponses(assessmentState.responses, pillarId);
        currentStepComplete = answered >= required;
      }
    }

    // Navigation checks
    const canGoPrev = assessmentState.currentStep > 0;
    const canGoNext =
      assessmentState.currentStep < TOTAL_STEPS - 1 && currentStepComplete;

    return {
      progress,
      canGoNext,
      canGoPrev,
      totalAnswered,
      totalQuestions,
      currentStepComplete,
    };
  }, [assessmentState, firmProfile]);

  // Assemble full state
  const state: FullAssessmentState = useMemo(
    () => ({
      ...assessmentState,
      firmProfile,
    }),
    [assessmentState, firmProfile]
  );

  // Assemble actions
  const actions: AssessmentActions = useMemo(
    () => ({
      setFirmProfile,
      setResponse,
      nextStep,
      prevStep,
      goToStep,
      complete,
      reset,
    }),
    [setFirmProfile, setResponse, nextStep, prevStep, goToStep, complete, reset]
  );

  return { state, actions, computed };
}

export default useAssessment;
