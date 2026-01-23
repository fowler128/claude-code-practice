// Filing Status
export type FilingStatus = 'Draft' | 'Pending' | 'Accepted' | 'Rejected';

// Filing Form Types
export type FilingFormType =
  | 'Change in Ownership'
  | 'Deed Transfer'
  | 'Probate'
  | 'Eviction'
  | 'Civil Filing'
  | 'Family Law';

// Status History Entry (FLOW Witness - Audit Trail)
export interface StatusHistoryEntry {
  id: string;
  oldStatus: FilingStatus | null;
  newStatus: FilingStatus;
  changedAt: Date;
  note?: string;
}

// Filing Metadata
export interface FilingMetadata {
  formType: FilingFormType;
  recorderOffice?: string;
  additionalNotes?: string;
}

// Main Filing Item
export interface FilingItem {
  id: string;
  userId: string;
  title: string;
  county: string;
  caseNumber?: string;
  status: FilingStatus;
  submittedAt?: Date;
  lastCheckedAt: Date;
  metadata: FilingMetadata;
  statusHistory: StatusHistoryEntry[];
}

// User Profile
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  firmName?: string;
  subscriptionTier: SubscriptionTier;
  hasAcceptedTerms: boolean;
  createdAt: Date;
}

// Subscription Tiers
export type SubscriptionTier = 'Trial' | 'Solo' | 'Firm' | 'Enterprise';

export const SUBSCRIPTION_PRICES: Record<SubscriptionTier, number> = {
  Trial: 0,
  Solo: 29,
  Firm: 199,
  Enterprise: 499,
};

// Texas Counties
export const TEXAS_COUNTIES = [
  'Harris',
  'Dallas',
  'Tarrant',
  'Bexar',
  'Travis',
  'Collin',
  'Denton',
  'Hidalgo',
  'Fort Bend',
  'Montgomery',
  'Williamson',
  'Cameron',
  'Nueces',
  'Brazoria',
  'Other',
] as const;

export type TexasCounty = typeof TEXAS_COUNTIES[number];

// Form Types List
export const FILING_FORM_TYPES: FilingFormType[] = [
  'Change in Ownership',
  'Deed Transfer',
  'Probate',
  'Eviction',
  'Civil Filing',
  'Family Law',
];

// Status Colors
export const STATUS_COLORS: Record<FilingStatus, string> = {
  Draft: 'gray',
  Pending: 'orange',
  Accepted: 'green',
  Rejected: 'red',
};

// Helper Functions
export function isFilingOverdue(filing: FilingItem): boolean {
  if (filing.status !== 'Pending' || !filing.submittedAt) return false;
  const hoursSinceSubmission = (Date.now() - new Date(filing.submittedAt).getTime()) / (1000 * 60 * 60);
  return hoursSinceSubmission > 48;
}

export function getHoursPending(filing: FilingItem): number | null {
  if (filing.status !== 'Pending' || !filing.submittedAt) return null;
  return Math.floor((Date.now() - new Date(filing.submittedAt).getTime()) / (1000 * 60 * 60));
}

export function formatDate(date: Date | undefined): string {
  if (!date) return 'Not submitted';
  return new Date(date).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

// 2026 Texas Court Holidays
export function isTexasCourtHoliday(date: Date): boolean {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const year = d.getFullYear();

  if (year !== 2026) return false;

  const holidays: [number, number][] = [
    [1, 1],   // New Year's Day
    [1, 19],  // MLK Day
    [2, 16],  // Presidents Day
    [3, 2],   // Texas Independence Day
    [4, 3],   // Good Friday
    [4, 21],  // San Jacinto Day
    [5, 25],  // Memorial Day
    [6, 19],  // Juneteenth
    [7, 3],   // Independence Day (observed)
    [9, 7],   // Labor Day
    [11, 11], // Veterans Day
    [11, 26], // Thanksgiving
    [11, 27], // Day after Thanksgiving
    [12, 24], // Christmas Eve
    [12, 25], // Christmas Day
  ];

  return holidays.some(([m, d]) => m === month && d === day);
}
