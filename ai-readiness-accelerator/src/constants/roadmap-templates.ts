/**
 * Roadmap task templates for the AI Readiness Accelerator
 *
 * Tasks are organized into 30/60/90 day phases and are conditionally
 * included based on assessment scores. Lower scores in specific pillars
 * trigger relevant remediation tasks.
 */

/**
 * Pillar IDs for type safety
 */
export type PillarId = 'process' | 'data' | 'knowledge' | 'tooling' | 'risk' | 'change';

/**
 * Scores mapped by pillar ID
 */
export type PillarScores = Record<PillarId, number>;

/**
 * Task priority levels
 */
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Roadmap task definition
 */
export interface RoadmapTask {
  /** Unique task identifier */
  id: string;
  /** Task title */
  title: string;
  /** Detailed task description */
  description: string;
  /** Responsible party or role */
  owner: string;
  /** Task priority level */
  priority: TaskPriority;
  /** Function to determine if task applies based on scores */
  applicableWhen: (scores: PillarScores) => boolean;
  /** Related pillar IDs for grouping and filtering */
  relatedPillars: PillarId[];
}

// ============================================================================
// Phase 1: First 30 Days - Foundation & Quick Wins
// ============================================================================

/**
 * Tasks for the first 30 days of the AI readiness roadmap.
 * Focus: Critical gaps, governance basics, and quick wins.
 */
export const PHASE_30_TASKS: RoadmapTask[] = [
  // Risk & Governance Tasks
  {
    id: '30-risk-policy',
    title: 'Establish AI Usage Policy',
    description: 'Draft and implement a firm-wide policy governing the use of AI tools with client data, including approved tools, prohibited uses, and review requirements.',
    owner: 'Managing Partner / IT Director',
    priority: 'critical',
    applicableWhen: (scores) => scores.risk < 3,
    relatedPillars: ['risk'],
  },
  {
    id: '30-risk-access',
    title: 'Audit Data Access Controls',
    description: 'Review and document current access permissions across all systems. Identify and remediate inappropriate access to sensitive client data.',
    owner: 'IT Director',
    priority: 'critical',
    applicableWhen: (scores) => scores.risk < 2.5,
    relatedPillars: ['risk'],
  },
  {
    id: '30-risk-training',
    title: 'Schedule Confidentiality Refresher Training',
    description: 'Organize mandatory training sessions on data handling, confidentiality obligations, and the new AI usage policy for all staff.',
    owner: 'HR / Compliance',
    priority: 'high',
    applicableWhen: (scores) => scores.risk < 3.5,
    relatedPillars: ['risk', 'change'],
  },

  // Data Quality Tasks
  {
    id: '30-data-audit',
    title: 'Conduct Data Quality Assessment',
    description: 'Sample 50 recent matters to assess field completion rates, naming convention adherence, and data accuracy. Document baseline metrics.',
    owner: 'Operations Manager',
    priority: 'high',
    applicableWhen: (scores) => scores.data < 3,
    relatedPillars: ['data'],
  },
  {
    id: '30-data-duplicates',
    title: 'Identify and Merge Duplicate Records',
    description: 'Run duplicate detection reports on contacts and matters. Establish a process for merging duplicates and preventing future occurrences.',
    owner: 'Database Administrator',
    priority: 'high',
    applicableWhen: (scores) => scores.data < 2.5,
    relatedPillars: ['data'],
  },
  {
    id: '30-data-naming',
    title: 'Document Naming Convention Standards',
    description: 'Create and distribute a firm-wide naming convention guide for documents, matters, and folders. Include examples for each practice area.',
    owner: 'Knowledge Manager',
    priority: 'medium',
    applicableWhen: (scores) => scores.data < 3.5,
    relatedPillars: ['data', 'knowledge'],
  },

  // Process Tasks
  {
    id: '30-process-intake',
    title: 'Standardize Client Intake Form',
    description: 'Create a unified intake form capturing all required information across practice areas. Implement in practice management system.',
    owner: 'Practice Group Leaders',
    priority: 'high',
    applicableWhen: (scores) => scores.process < 3,
    relatedPillars: ['process'],
  },
  {
    id: '30-process-checklist',
    title: 'Create Matter Opening Checklist',
    description: 'Document required steps for matter setup including conflict checks, engagement letters, and system setup. Make accessible to all staff.',
    owner: 'Operations Manager',
    priority: 'medium',
    applicableWhen: (scores) => scores.process < 3.5,
    relatedPillars: ['process', 'knowledge'],
  },

  // Change Capacity Tasks
  {
    id: '30-change-champion',
    title: 'Identify AI Champions',
    description: 'Select 2-3 tech-savvy individuals from different practice areas to serve as AI adoption champions and early feedback providers.',
    owner: 'Managing Partner',
    priority: 'high',
    applicableWhen: (scores) => scores.change < 3.5,
    relatedPillars: ['change'],
  },
  {
    id: '30-change-sponsor',
    title: 'Secure Executive Sponsorship',
    description: 'Brief firm leadership on AI initiative and obtain formal commitment to champion adoption, allocate resources, and model desired behaviors.',
    owner: 'Project Lead',
    priority: 'critical',
    applicableWhen: (scores) => scores.change < 3,
    relatedPillars: ['change'],
  },
];

// ============================================================================
// Phase 2: Days 31-60 - Building Infrastructure
// ============================================================================

/**
 * Tasks for days 31-60 of the AI readiness roadmap.
 * Focus: Systems integration, knowledge organization, and process documentation.
 */
export const PHASE_60_TASKS: RoadmapTask[] = [
  // Tooling Tasks
  {
    id: '60-tooling-audit',
    title: 'Complete Technology Stack Audit',
    description: 'Document all current tools, their usage rates, integration points, and gaps. Identify redundancies and consolidation opportunities.',
    owner: 'IT Director',
    priority: 'high',
    applicableWhen: (scores) => scores.tooling < 3.5,
    relatedPillars: ['tooling'],
  },
  {
    id: '60-tooling-email',
    title: 'Implement Email-to-Matter Linking',
    description: 'Configure automatic or one-click email capture to relevant matters. Train staff on proper email filing procedures.',
    owner: 'IT Director',
    priority: 'high',
    applicableWhen: (scores) => scores.tooling < 3,
    relatedPillars: ['tooling', 'data'],
  },
  {
    id: '60-tooling-dms',
    title: 'Enforce Document Management Compliance',
    description: 'Establish policy requiring all client documents be saved to DMS. Configure desktop save locations and provide refresher training.',
    owner: 'Knowledge Manager',
    priority: 'medium',
    applicableWhen: (scores) => scores.tooling < 3,
    relatedPillars: ['tooling', 'data'],
  },

  // Knowledge System Tasks
  {
    id: '60-knowledge-templates',
    title: 'Organize and Update Template Library',
    description: 'Audit all document templates for currency and accuracy. Organize into logical structure with clear naming. Remove outdated versions.',
    owner: 'Practice Group Leaders',
    priority: 'high',
    applicableWhen: (scores) => scores.knowledge < 3.5,
    relatedPillars: ['knowledge'],
  },
  {
    id: '60-knowledge-sops',
    title: 'Document Critical Process SOPs',
    description: 'Write standard operating procedures for top 10 most common firm processes. Format consistently and store in accessible location.',
    owner: 'Operations Manager',
    priority: 'high',
    applicableWhen: (scores) => scores.knowledge < 3,
    relatedPillars: ['knowledge', 'process'],
  },
  {
    id: '60-knowledge-faq',
    title: 'Create Staff FAQ Resource',
    description: 'Compile answers to frequently asked questions about firm procedures, systems, and policies. Make searchable and easily accessible.',
    owner: 'Knowledge Manager',
    priority: 'medium',
    applicableWhen: (scores) => scores.knowledge < 3,
    relatedPillars: ['knowledge'],
  },

  // Process Tasks
  {
    id: '60-process-workflow',
    title: 'Map Key Legal Workflows',
    description: 'Document step-by-step workflows for common matter types including decision points, templates used, and handoffs between team members.',
    owner: 'Practice Group Leaders',
    priority: 'high',
    applicableWhen: (scores) => scores.process < 3,
    relatedPillars: ['process', 'knowledge'],
  },
  {
    id: '60-process-filing',
    title: 'Standardize Filing Procedures',
    description: 'Create checklists and procedures for court filings including deadline tracking, service requirements, and confirmation processes.',
    owner: 'Paralegal Supervisor',
    priority: 'medium',
    applicableWhen: (scores) => scores.process < 3.5,
    relatedPillars: ['process'],
  },

  // Data Tasks
  {
    id: '60-data-cleanup',
    title: 'Execute Data Cleanup Sprint',
    description: 'Dedicate resources to clean up historical data based on audit findings. Focus on active matters and high-value closed matters.',
    owner: 'Database Administrator',
    priority: 'medium',
    applicableWhen: (scores) => scores.data < 2.5,
    relatedPillars: ['data'],
  },
  {
    id: '60-data-validation',
    title: 'Implement Data Validation Rules',
    description: 'Configure practice management system to require critical fields and enforce formatting standards on new matter creation.',
    owner: 'IT Director',
    priority: 'high',
    applicableWhen: (scores) => scores.data < 3,
    relatedPillars: ['data', 'tooling'],
  },

  // Risk Tasks
  {
    id: '60-risk-audit-trail',
    title: 'Enable Comprehensive Audit Logging',
    description: 'Configure systems to log all access and modifications to client data. Establish review procedures and retention policies.',
    owner: 'IT Director',
    priority: 'high',
    applicableWhen: (scores) => scores.risk < 3,
    relatedPillars: ['risk', 'tooling'],
  },
];

// ============================================================================
// Phase 3: Days 61-90 - Optimization & Pilot Readiness
// ============================================================================

/**
 * Tasks for days 61-90 of the AI readiness roadmap.
 * Focus: Optimization, training infrastructure, and pilot preparation.
 */
export const PHASE_90_TASKS: RoadmapTask[] = [
  // Change Capacity Tasks
  {
    id: '90-change-training',
    title: 'Establish Training Program Infrastructure',
    description: 'Set up learning management system or structured training program. Create schedule for ongoing technology training sessions.',
    owner: 'HR / IT Director',
    priority: 'high',
    applicableWhen: (scores) => scores.change < 3.5,
    relatedPillars: ['change'],
  },
  {
    id: '90-change-metrics',
    title: 'Define Adoption Success Metrics',
    description: 'Establish KPIs for measuring technology adoption success including usage rates, efficiency gains, and user satisfaction.',
    owner: 'Operations Manager',
    priority: 'medium',
    applicableWhen: (scores) => scores.change < 4,
    relatedPillars: ['change'],
  },
  {
    id: '90-change-feedback',
    title: 'Implement Feedback Collection Process',
    description: 'Create channels for staff to provide ongoing feedback on tools and processes. Establish regular review cadence.',
    owner: 'Project Lead',
    priority: 'medium',
    applicableWhen: (scores) => scores.change < 3.5,
    relatedPillars: ['change'],
  },

  // Tooling Tasks
  {
    id: '90-tooling-automation',
    title: 'Identify Automation Opportunities',
    description: 'Based on documented workflows, identify 3-5 processes suitable for automation. Prioritize by impact and implementation complexity.',
    owner: 'Operations Manager',
    priority: 'high',
    applicableWhen: (scores) => scores.tooling < 4 && scores.process >= 2.5,
    relatedPillars: ['tooling', 'process'],
  },
  {
    id: '90-tooling-pilot',
    title: 'Select AI Pilot Use Case',
    description: 'Choose initial AI tool pilot based on readiness assessment. Select use case with clear success criteria and limited risk.',
    owner: 'Project Lead',
    priority: 'high',
    applicableWhen: (scores) => scores.risk >= 2.5 && scores.data >= 2.5,
    relatedPillars: ['tooling', 'risk'],
  },
  {
    id: '90-tooling-integration',
    title: 'Plan System Integration Requirements',
    description: 'Document integration requirements for potential AI tools including data flows, authentication, and API capabilities.',
    owner: 'IT Director',
    priority: 'medium',
    applicableWhen: (scores) => scores.tooling < 3.5,
    relatedPillars: ['tooling'],
  },

  // Knowledge Tasks
  {
    id: '90-knowledge-playbooks',
    title: 'Develop Practice Area Playbooks',
    description: 'Create comprehensive guides for each major practice area including workflows, templates, deadlines, and best practices.',
    owner: 'Practice Group Leaders',
    priority: 'medium',
    applicableWhen: (scores) => scores.knowledge < 3.5 && scores.process >= 2.5,
    relatedPillars: ['knowledge', 'process'],
  },
  {
    id: '90-knowledge-onboarding',
    title: 'Revamp New Hire Onboarding',
    description: 'Create structured onboarding program incorporating documented SOPs, system training, and mentorship assignments.',
    owner: 'HR',
    priority: 'medium',
    applicableWhen: (scores) => scores.knowledge < 3 || scores.change < 3,
    relatedPillars: ['knowledge', 'change'],
  },

  // Process Tasks
  {
    id: '90-process-metrics',
    title: 'Establish Process Efficiency Baselines',
    description: 'Measure current time and effort for key processes to establish baselines for measuring future AI-driven improvements.',
    owner: 'Operations Manager',
    priority: 'medium',
    applicableWhen: (scores) => scores.process >= 2.5,
    relatedPillars: ['process'],
  },
  {
    id: '90-process-governance',
    title: 'Create Process Governance Committee',
    description: 'Establish cross-functional team responsible for process standardization, documentation maintenance, and continuous improvement.',
    owner: 'Managing Partner',
    priority: 'medium',
    applicableWhen: (scores) => scores.process < 3.5,
    relatedPillars: ['process', 'change'],
  },

  // Risk Tasks
  {
    id: '90-risk-retention',
    title: 'Formalize Data Retention Policy',
    description: 'Document and implement data retention and destruction policies aligned with ethical obligations and business needs.',
    owner: 'Compliance Officer',
    priority: 'high',
    applicableWhen: (scores) => scores.risk < 3.5,
    relatedPillars: ['risk'],
  },
  {
    id: '90-risk-vendor',
    title: 'Develop AI Vendor Evaluation Criteria',
    description: 'Create checklist for evaluating AI vendors including security certifications, data handling practices, and compliance capabilities.',
    owner: 'IT Director / Compliance',
    priority: 'medium',
    applicableWhen: (scores) => scores.risk >= 2.5 && scores.tooling >= 2.5,
    relatedPillars: ['risk', 'tooling'],
  },

  // Data Tasks
  {
    id: '90-data-governance',
    title: 'Establish Data Governance Framework',
    description: 'Define data ownership, quality standards, and stewardship responsibilities. Create ongoing data quality monitoring process.',
    owner: 'Operations Manager',
    priority: 'high',
    applicableWhen: (scores) => scores.data < 3.5,
    relatedPillars: ['data'],
  },
  {
    id: '90-data-taxonomy',
    title: 'Standardize Firm-Wide Taxonomy',
    description: 'Implement consistent practice area codes, matter types, and document categories across all systems.',
    owner: 'Knowledge Manager',
    priority: 'medium',
    applicableWhen: (scores) => scores.data < 3,
    relatedPillars: ['data', 'knowledge'],
  },
];

/**
 * Get all tasks for a specific phase
 * @param phase - Phase number (30, 60, or 90)
 * @returns Array of tasks for that phase
 */
export function getTasksByPhase(phase: 30 | 60 | 90): RoadmapTask[] {
  switch (phase) {
    case 30:
      return PHASE_30_TASKS;
    case 60:
      return PHASE_60_TASKS;
    case 90:
      return PHASE_90_TASKS;
    default:
      return [];
  }
}

/**
 * Get all applicable tasks for given scores across all phases
 * @param scores - The pillar scores from assessment
 * @returns Object with tasks grouped by phase
 */
export function getApplicableTasks(scores: PillarScores): {
  phase30: RoadmapTask[];
  phase60: RoadmapTask[];
  phase90: RoadmapTask[];
} {
  return {
    phase30: PHASE_30_TASKS.filter(task => task.applicableWhen(scores)),
    phase60: PHASE_60_TASKS.filter(task => task.applicableWhen(scores)),
    phase90: PHASE_90_TASKS.filter(task => task.applicableWhen(scores)),
  };
}

/**
 * Get tasks filtered by pillar
 * @param pillarId - The pillar to filter by
 * @param scores - Optional scores to filter by applicability
 * @returns Tasks related to the specified pillar
 */
export function getTasksByPillar(
  pillarId: PillarId,
  scores?: PillarScores
): RoadmapTask[] {
  const allTasks = [...PHASE_30_TASKS, ...PHASE_60_TASKS, ...PHASE_90_TASKS];
  const pillarTasks = allTasks.filter(task =>
    task.relatedPillars.includes(pillarId)
  );

  if (scores) {
    return pillarTasks.filter(task => task.applicableWhen(scores));
  }

  return pillarTasks;
}
