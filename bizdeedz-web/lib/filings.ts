import { FilingItem, FilingStatus, StatusHistoryEntry, FilingFormType } from '@/types/filing';

// Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Sample data for demo (replace with Firebase in production)
let sampleFilings: FilingItem[] = [
  {
    id: generateId(),
    userId: 'demo_user',
    title: 'Change in Ownership - 123 Oak St',
    county: 'Harris',
    caseNumber: '2026-COO-001',
    status: 'Pending',
    submittedAt: new Date(Date.now() - 60 * 60 * 60 * 1000), // 60 hours ago (overdue)
    lastCheckedAt: new Date(),
    metadata: {
      formType: 'Change in Ownership',
      recorderOffice: "Harris County Clerk's Office",
    },
    statusHistory: [
      {
        id: generateId(),
        oldStatus: null,
        newStatus: 'Draft',
        changedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      },
      {
        id: generateId(),
        oldStatus: 'Draft',
        newStatus: 'Pending',
        changedAt: new Date(Date.now() - 60 * 60 * 60 * 1000),
        note: 'Submitted to Harris County',
      },
    ],
  },
  {
    id: generateId(),
    userId: 'demo_user',
    title: 'Deed Transfer - Smith Estate',
    county: 'Montgomery',
    caseNumber: '2026-DT-042',
    status: 'Accepted',
    submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastCheckedAt: new Date(),
    metadata: {
      formType: 'Deed Transfer',
      recorderOffice: "Montgomery County Clerk's Office",
    },
    statusHistory: [
      {
        id: generateId(),
        oldStatus: null,
        newStatus: 'Draft',
        changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        id: generateId(),
        oldStatus: 'Draft',
        newStatus: 'Pending',
        changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: generateId(),
        oldStatus: 'Pending',
        newStatus: 'Accepted',
        changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        note: 'Recorded as Document #2026-0001234',
      },
    ],
  },
  {
    id: generateId(),
    userId: 'demo_user',
    title: 'Probate Filing - Case 44921',
    county: 'Travis',
    caseNumber: '2026-PR-44921',
    status: 'Rejected',
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    lastCheckedAt: new Date(),
    metadata: {
      formType: 'Probate',
      recorderOffice: "Travis County Clerk's Office",
    },
    statusHistory: [
      {
        id: generateId(),
        oldStatus: null,
        newStatus: 'Draft',
        changedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: generateId(),
        oldStatus: 'Draft',
        newStatus: 'Pending',
        changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: generateId(),
        oldStatus: 'Pending',
        newStatus: 'Rejected',
        changedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        note: 'Missing notarized signature on page 3',
      },
    ],
  },
  {
    id: generateId(),
    userId: 'demo_user',
    title: 'Eviction Notice - 456 Main St',
    county: 'Dallas',
    status: 'Draft',
    lastCheckedAt: new Date(),
    metadata: {
      formType: 'Eviction',
      recorderOffice: "Dallas County Clerk's Office",
      additionalNotes: 'SB 38 Compliant',
    },
    statusHistory: [
      {
        id: generateId(),
        oldStatus: null,
        newStatus: 'Draft',
        changedAt: new Date(),
      },
    ],
  },
  {
    id: generateId(),
    userId: 'demo_user',
    title: 'Change in Ownership - Industrial Park',
    county: 'Fort Bend',
    caseNumber: '2026-COO-089',
    status: 'Pending',
    submittedAt: new Date(Date.now() - 20 * 60 * 60 * 1000), // 20 hours ago (not overdue)
    lastCheckedAt: new Date(),
    metadata: {
      formType: 'Change in Ownership',
      recorderOffice: "Fort Bend County Clerk's Office",
    },
    statusHistory: [
      {
        id: generateId(),
        oldStatus: null,
        newStatus: 'Draft',
        changedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: generateId(),
        oldStatus: 'Draft',
        newStatus: 'Pending',
        changedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
    ],
  },
];

// Fetch all filings
export async function getFilings(): Promise<FilingItem[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));
  return [...sampleFilings];
}

// Create a new filing
export async function createFiling(data: {
  title: string;
  county: string;
  formType: FilingFormType;
  caseNumber?: string;
  notes?: string;
  submitImmediately?: boolean;
}): Promise<FilingItem> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const now = new Date();
  const id = generateId();

  const filing: FilingItem = {
    id,
    userId: 'demo_user',
    title: data.title,
    county: data.county,
    caseNumber: data.caseNumber,
    status: data.submitImmediately ? 'Pending' : 'Draft',
    submittedAt: data.submitImmediately ? now : undefined,
    lastCheckedAt: now,
    metadata: {
      formType: data.formType,
      recorderOffice: `${data.county} County Clerk's Office`,
      additionalNotes: data.notes,
    },
    statusHistory: [
      {
        id: generateId(),
        oldStatus: null,
        newStatus: 'Draft',
        changedAt: now,
      },
    ],
  };

  if (data.submitImmediately) {
    filing.statusHistory.push({
      id: generateId(),
      oldStatus: 'Draft',
      newStatus: 'Pending',
      changedAt: now,
      note: `Submitted to ${data.county} County`,
    });
  }

  sampleFilings = [filing, ...sampleFilings];
  return filing;
}

// Update filing status
export async function updateFilingStatus(
  filingId: string,
  newStatus: FilingStatus,
  note?: string
): Promise<FilingItem | null> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const index = sampleFilings.findIndex((f) => f.id === filingId);
  if (index === -1) return null;

  const filing = sampleFilings[index];
  const oldStatus = filing.status;

  const updatedFiling: FilingItem = {
    ...filing,
    status: newStatus,
    lastCheckedAt: new Date(),
    submittedAt: newStatus === 'Pending' && !filing.submittedAt ? new Date() : filing.submittedAt,
    statusHistory: [
      ...filing.statusHistory,
      {
        id: generateId(),
        oldStatus,
        newStatus,
        changedAt: new Date(),
        note,
      },
    ],
  };

  sampleFilings[index] = updatedFiling;
  return updatedFiling;
}

// Delete filing
export async function deleteFiling(filingId: string): Promise<boolean> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const index = sampleFilings.findIndex((f) => f.id === filingId);
  if (index === -1) return false;
  sampleFilings.splice(index, 1);
  return true;
}

// Get filing by ID
export async function getFilingById(filingId: string): Promise<FilingItem | null> {
  await new Promise((resolve) => setTimeout(resolve, 100));
  return sampleFilings.find((f) => f.id === filingId) || null;
}
