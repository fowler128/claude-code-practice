/**
 * Type definitions for the 6-pillar AI readiness assessment
 * @module assessment.types
 */

/**
 * Identifiers for each of the six assessment pillars
 * - process: Business process documentation and standardization
 * - data: Data quality, organization, and accessibility
 * - knowledge: Institutional knowledge capture and management
 * - tooling: Technology infrastructure and integration capabilities
 * - risk: Risk management and compliance considerations
 * - change: Change management and organizational readiness
 */
export type PillarId =
  | 'process'
  | 'data'
  | 'knowledge'
  | 'tooling'
  | 'risk'
  | 'change';

/**
 * Likert scale value for assessment questions
 * 0 = Not applicable / Don't know
 * 1 = Strongly disagree / Never
 * 2 = Disagree / Rarely
 * 3 = Neutral / Sometimes
 * 4 = Agree / Often
 * 5 = Strongly agree / Always
 */
export type LikertValue = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * Individual assessment question within a pillar
 */
export interface Question {
  /** Unique identifier for the question (e.g., "process-1", "data-3") */
  id: string;

  /** The question text presented to the user */
  text: string;

  /** Optional contextual help explaining what the question is asking */
  helpText?: string;

  /** Sub-category within the pillar for grouping related questions */
  category: string;
}

/**
 * Definition of an assessment pillar including its questions
 */
export interface PillarDefinition {
  /** Unique identifier for the pillar */
  id: PillarId;

  /** Full display name of the pillar */
  name: string;

  /** Abbreviated name for compact displays */
  shortName: string;

  /** Detailed description of what this pillar assesses */
  description: string;

  /** Icon identifier (e.g., "workflow", "database", "brain") */
  icon: string;

  /** Array of questions for this pillar */
  questions: Question[];
}

/**
 * User's response to a single assessment question
 */
export interface QuestionResponse {
  /** ID of the question being answered */
  questionId: string;

  /** Selected Likert scale value */
  value: LikertValue;

  /** Optional notes or comments from the user */
  notes?: string;
}

/**
 * Collection of all assessment responses organized by pillar
 * Maps each pillar ID to an array of question responses
 */
export type AssessmentResponses = Record<PillarId, QuestionResponse[]>;

/**
 * Current state of the assessment workflow
 */
export interface AssessmentState {
  /**
   * Current step in the assessment process
   * 0 = Firm profile
   * 1-6 = Pillar assessments (process, data, knowledge, tooling, risk, change)
   * 7 = Review/complete
   */
  currentStep: number;

  /** All collected responses organized by pillar */
  responses: AssessmentResponses;

  /** Whether all required questions have been answered */
  isComplete: boolean;

  /** ISO timestamp when the assessment was started */
  startedAt: string;

  /** ISO timestamp when the assessment was completed (if finished) */
  completedAt?: string;
}

/**
 * Likert scale labels for display
 */
export const LIKERT_LABELS: Record<LikertValue, string> = {
  0: 'N/A',
  1: 'Strongly Disagree',
  2: 'Disagree',
  3: 'Neutral',
  4: 'Agree',
  5: 'Strongly Agree',
};

/**
 * Short Likert scale labels for compact display
 */
export const LIKERT_SHORT_LABELS: Record<LikertValue, string> = {
  0: 'N/A',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
};

/**
 * All pillar IDs in assessment order
 */
export const PILLAR_ORDER: PillarId[] = [
  'process',
  'data',
  'knowledge',
  'tooling',
  'risk',
  'change',
];

/**
 * Creates an empty assessment responses object
 */
export function createEmptyAssessmentResponses(): AssessmentResponses {
  return {
    process: [],
    data: [],
    knowledge: [],
    tooling: [],
    risk: [],
    change: [],
  };
}

/**
 * Creates an initial assessment state
 */
export function createInitialAssessmentState(): AssessmentState {
  return {
    currentStep: 0,
    responses: createEmptyAssessmentResponses(),
    isComplete: false,
    startedAt: new Date().toISOString(),
  };
}
