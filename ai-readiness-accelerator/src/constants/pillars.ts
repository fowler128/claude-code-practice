/**
 * Pillar definitions and assessment questions for the AI Readiness Accelerator
 *
 * These pillars form the core assessment framework for evaluating law firm
 * readiness for AI adoption and automation initiatives.
 */

import type { PillarDefinition } from '../types';

/**
 * Lucide icon name type for pillar visualization
 */
export type PillarIcon = 'Workflow' | 'Database' | 'BookOpen' | 'Settings' | 'Shield' | 'TrendingUp';

/**
 * Extended pillar definition including icon information
 */
export interface ExtendedPillarDefinition extends PillarDefinition {
  /** Lucide icon name for visual representation */
  icon: PillarIcon;
}

/**
 * Array of all assessment pillar definitions with their questions.
 * Each pillar represents a critical dimension of AI readiness for law firms.
 */
export const PILLAR_DEFINITIONS: ExtendedPillarDefinition[] = [
  {
    id: 'process',
    name: 'Process Maturity',
    description: 'Evaluates the consistency and documentation of core legal workflows, from client intake through case resolution.',
    icon: 'Workflow',
    questions: [
      {
        id: 'process-1',
        text: 'How standardized is your client intake process across all practice areas?',
        category: 'intake',
      },
      {
        id: 'process-2',
        text: 'Do you have documented, repeatable procedures for case setup and matter opening?',
        category: 'case-setup',
      },
      {
        id: 'process-3',
        text: 'How consistently do attorneys follow established drafting workflows for common document types?',
        category: 'drafting',
      },
      {
        id: 'process-4',
        text: 'Are your court filing and service procedures standardized with clear checklists?',
        category: 'filing',
      },
      {
        id: 'process-5',
        text: 'Do you have systematic follow-up procedures after filings, hearings, and case milestones?',
        category: 'follow-up',
      },
    ],
  },
  {
    id: 'data',
    name: 'Data Quality',
    description: 'Assesses the cleanliness, consistency, and completeness of data across practice management and document systems.',
    icon: 'Database',
    questions: [
      {
        id: 'data-1',
        text: 'How consistent are required fields populated across your matter database (client name, matter type, responsible attorney)?',
        category: 'field-consistency',
      },
      {
        id: 'data-2',
        text: 'What is your estimated rate of duplicate contacts, matters, or documents in your systems?',
        category: 'duplicates',
      },
      {
        id: 'data-3',
        text: 'Do you enforce standardized naming conventions for documents, folders, and matter descriptions?',
        category: 'naming-conventions',
      },
      {
        id: 'data-4',
        text: 'How complete is critical case information (key dates, opposing counsel, judge assignments) in your matters?',
        category: 'completeness',
      },
      {
        id: 'data-5',
        text: 'Do you use standardized practice area codes, matter types, and document taxonomies firm-wide?',
        category: 'taxonomy',
      },
    ],
  },
  {
    id: 'knowledge',
    name: 'Knowledge System',
    description: 'Measures the organization, accessibility, and currency of institutional knowledge including templates, SOPs, and training materials.',
    icon: 'BookOpen',
    questions: [
      {
        id: 'knowledge-1',
        text: 'Can staff easily locate the correct, approved template for any standard document type?',
        category: 'templates',
      },
      {
        id: 'knowledge-2',
        text: 'Are standard operating procedures documented and accessible for key firm processes?',
        category: 'sops',
      },
      {
        id: 'knowledge-3',
        text: 'How current are your practice area playbooks and procedural guides?',
        category: 'playbooks',
      },
      {
        id: 'knowledge-4',
        text: 'Do staff have easy access to FAQs and quick-reference guides for common questions?',
        category: 'faqs',
      },
      {
        id: 'knowledge-5',
        text: 'Is there a structured onboarding curriculum with documented training materials for new hires?',
        category: 'training',
      },
    ],
  },
  {
    id: 'tooling',
    name: 'Tooling & Integrations',
    description: 'Evaluates the adoption, integration, and effective use of legal technology across the firm.',
    icon: 'Settings',
    questions: [
      {
        id: 'tooling-1',
        text: 'What percentage of firm workflows actively utilize your practice management system?',
        category: 'practice-management',
      },
      {
        id: 'tooling-2',
        text: 'Is your document management system consistently used for all client-related documents?',
        category: 'document-management',
      },
      {
        id: 'tooling-3',
        text: 'Are emails automatically or routinely captured and linked to relevant matters?',
        category: 'email-integration',
      },
      {
        id: 'tooling-4',
        text: 'How integrated is your billing system with time tracking and matter management?',
        category: 'billing',
      },
      {
        id: 'tooling-5',
        text: 'Do you currently use any automation tools (document assembly, workflow automation, e-signatures)?',
        category: 'automation',
      },
    ],
  },
  {
    id: 'risk',
    name: 'Risk & Governance',
    description: 'Examines security controls, compliance frameworks, and governance structures essential for responsible AI deployment.',
    icon: 'Shield',
    questions: [
      {
        id: 'risk-1',
        text: 'Do you have role-based access controls limiting who can view sensitive client data?',
        category: 'access-controls',
      },
      {
        id: 'risk-2',
        text: 'Has your firm established a formal policy governing the use of AI tools with client data?',
        category: 'ai-policy',
      },
      {
        id: 'risk-3',
        text: 'Can you produce audit trails showing who accessed or modified matter information?',
        category: 'audit-trails',
      },
      {
        id: 'risk-4',
        text: 'Are data retention and destruction policies documented and consistently enforced?',
        category: 'retention',
      },
      {
        id: 'risk-5',
        text: 'Do all staff receive regular training on confidentiality obligations and data handling?',
        category: 'confidentiality-training',
      },
    ],
  },
  {
    id: 'change',
    name: 'Change Capacity',
    description: 'Assesses organizational readiness for change, including training infrastructure, leadership support, and staff adaptability.',
    icon: 'TrendingUp',
    questions: [
      {
        id: 'change-1',
        text: 'Does your firm have dedicated resources or infrastructure for delivering technology training?',
        category: 'training-infrastructure',
      },
      {
        id: 'change-2',
        text: 'How would you rate your firm\'s track record of successfully adopting new technology in the past 3 years?',
        category: 'adoption-track-record',
      },
      {
        id: 'change-3',
        text: 'Is there clear ownership and accountability for technology initiatives at your firm?',
        category: 'role-clarity',
      },
      {
        id: 'change-4',
        text: 'Do firm leadership actively champion and participate in technology adoption efforts?',
        category: 'executive-sponsorship',
      },
      {
        id: 'change-5',
        text: 'How receptive is your staff generally to learning and using new tools and processes?',
        category: 'staff-appetite',
      },
    ],
  },
];

/**
 * Mapping of pillar IDs to their icon names for easy lookup
 */
export const PILLAR_ICONS: Record<string, PillarIcon> = {
  process: 'Workflow',
  data: 'Database',
  knowledge: 'BookOpen',
  tooling: 'Settings',
  risk: 'Shield',
  change: 'TrendingUp',
};

/**
 * Total number of questions across all pillars
 */
export const TOTAL_QUESTIONS = PILLAR_DEFINITIONS.reduce(
  (sum, pillar) => sum + (pillar.questions?.length || 0),
  0
);

/**
 * Helper to get a pillar definition by ID
 * @param id - The pillar ID to look up
 * @returns The pillar definition or undefined if not found
 */
export function getPillarById(id: string): ExtendedPillarDefinition | undefined {
  return PILLAR_DEFINITIONS.find(pillar => pillar.id === id);
}
