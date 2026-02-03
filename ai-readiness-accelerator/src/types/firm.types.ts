/**
 * Type definitions for law firm profile and configuration
 * @module firm.types
 */

/**
 * Practice areas that a law firm may specialize in
 */
export type PracticeArea =
  | 'bankruptcy'
  | 'family-law'
  | 'estate-planning'
  | 'personal-injury'
  | 'civil-litigation'
  | 'criminal-defense'
  | 'immigration'
  | 'real-estate'
  | 'other';

/**
 * Practice management software tools commonly used by law firms
 */
export type PracticeManagementTool =
  | 'clio'
  | 'mycase'
  | 'practicepanther'
  | 'smokeball'
  | 'filevine'
  | 'cosmolex'
  | 'none'
  | 'other';

/**
 * Maturity levels for firm operations based on capability maturity model
 * - chaotic: No defined processes, ad-hoc operations
 * - informal: Some processes exist but are inconsistently followed
 * - defined: Documented processes that are generally followed
 * - consistent: Standardized processes with regular compliance
 * - optimized: Continuous improvement with metrics-driven optimization
 */
export type OperationsMaturity =
  | 'chaotic'
  | 'informal'
  | 'defined'
  | 'consistent'
  | 'optimized';

/**
 * Complete profile information for a law firm
 * Used to customize assessment questions and recommendations
 */
export interface FirmProfile {
  /** Legal name of the firm */
  firmName: string;

  /** Primary practice areas the firm handles */
  practiceAreas: PracticeArea[];

  /** Number of attorneys (partners and associates) */
  attorneyCount: number;

  /** Number of paralegals and legal assistants */
  paralegalCount: number;

  /** Number of intake and client services staff */
  intakeStaffCount: number;

  /** Number of administrative and support staff */
  adminCount: number;

  /** Current practice management software in use */
  practiceManagement: PracticeManagementTool;

  /** Document management system name (free text, e.g., "NetDocuments", "iManage", "None") */
  documentManagement: string;

  /** Self-assessed current operational maturity level */
  currentOperationsMaturity: OperationsMaturity;
}

/**
 * Display labels for practice areas
 */
export const PRACTICE_AREA_LABELS: Record<PracticeArea, string> = {
  'bankruptcy': 'Bankruptcy',
  'family-law': 'Family Law',
  'estate-planning': 'Estate Planning',
  'personal-injury': 'Personal Injury',
  'civil-litigation': 'Civil Litigation',
  'criminal-defense': 'Criminal Defense',
  'immigration': 'Immigration',
  'real-estate': 'Real Estate',
  'other': 'Other',
};

/**
 * Display labels for practice management tools
 */
export const PRACTICE_MANAGEMENT_LABELS: Record<PracticeManagementTool, string> = {
  'clio': 'Clio',
  'mycase': 'MyCase',
  'practicepanther': 'PracticePanther',
  'smokeball': 'Smokeball',
  'filevine': 'Filevine',
  'cosmolex': 'CosmoLex',
  'none': 'None',
  'other': 'Other',
};

/**
 * Display labels and descriptions for operations maturity levels
 */
export const OPERATIONS_MATURITY_INFO: Record<
  OperationsMaturity,
  { label: string; description: string }
> = {
  'chaotic': {
    label: 'Chaotic',
    description: 'No defined processes, ad-hoc operations',
  },
  'informal': {
    label: 'Informal',
    description: 'Some processes exist but are inconsistently followed',
  },
  'defined': {
    label: 'Defined',
    description: 'Documented processes that are generally followed',
  },
  'consistent': {
    label: 'Consistent',
    description: 'Standardized processes with regular compliance',
  },
  'optimized': {
    label: 'Optimized',
    description: 'Continuous improvement with metrics-driven optimization',
  },
};
