-- ============================================================================
-- BizDeedz Platform OS - Seed Data
-- Run after complete-migration.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- PRACTICE AREAS
-- ============================================================================

INSERT INTO practice_areas (code, name, description) VALUES
('BK', 'Bankruptcy', 'Consumer and business bankruptcy matters'),
('FL', 'Family Law', 'Divorce, custody, and family legal matters'),
('IM', 'Immigration', 'Immigration petitions and applications'),
('PE', 'Probate / Estate Planning', 'Estate planning and probate administration')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- MATTER TYPES
-- ============================================================================

INSERT INTO matter_types (practice_area_id, code, name) VALUES
((SELECT id FROM practice_areas WHERE code = 'BK'), 'BK-CONSUMER', 'Bankruptcy: Consumer (General)'),
((SELECT id FROM practice_areas WHERE code = 'FL'), 'FL-DIVORCE', 'Family Law: Divorce'),
((SELECT id FROM practice_areas WHERE code = 'FL'), 'FL-CUSTODY', 'Family Law: Custody/Modification'),
((SELECT id FROM practice_areas WHERE code = 'IM'), 'IM-PETITION', 'Immigration: Petition/Application (General)'),
((SELECT id FROM practice_areas WHERE code = 'IM'), 'IM-RFE', 'Immigration: RFE Response'),
((SELECT id FROM practice_areas WHERE code = 'PE'), 'PE-ESTATE', 'Probate/Estate: Estate Planning Package'),
((SELECT id FROM practice_areas WHERE code = 'PE'), 'PE-PROBATE', 'Probate/Estate: Probate Administration')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- DEFECT REASONS
-- ============================================================================

INSERT INTO defect_reasons (code, name, requires_note, severity) VALUES
('MISSING_ARTIFACT', 'Missing Required Artifact', false, 'high'),
('INCORRECT_NAMES', 'Incorrect Party Names / Spelling', false, 'medium'),
('INCORRECT_JURISDICTION', 'Incorrect Jurisdiction / Venue', false, 'high'),
('MISSING_SIGNATURE', 'Signature Missing / Invalid', false, 'high'),
('INCOMPLETE_FIELDS', 'Incomplete Form Fields', false, 'medium'),
('WRONG_TEMPLATE', 'Wrong Template Used', false, 'high'),
('INCONSISTENT_FACTS', 'Inconsistent Facts Across Docs', false, 'medium'),
('DEADLINE_RISK', 'Deadline Miss Risk / Late', false, 'high'),
('PAYMENT_ISSUE', 'Payment / Retainer Issue', false, 'medium'),
('OTHER', 'Other (Requires Note)', true, 'low')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- ARTIFACT TYPES
-- ============================================================================

INSERT INTO artifact_types (code, name, category) VALUES
('INTAKE_QUESTIONNAIRE', 'Intake Questionnaire', 'intake'),
('ENGAGEMENT_UNSIGNED', 'Engagement Letter (Unsigned)', 'engagement'),
('ENGAGEMENT_SIGNED', 'Engagement Letter (Signed)', 'engagement'),
('PAYMENT_CONFIRMATION', 'Payment Confirmation', 'engagement'),
('IDENTITY_DOCS', 'Identity Documentation', 'evidence'),
('FINANCIAL_DOCS', 'Financial Documentation', 'evidence'),
('EVIDENCE_PACKET', 'Supporting Evidence Packet', 'evidence'),
('DRAFT_FILING', 'Draft Filing/Submission Packet', 'filing'),
('FINAL_FILING', 'Final Filed/Submitted Packet', 'filing'),
('COURT_NOTICES', 'Court/Agency Notices', 'output'),
('FINAL_ORDERS', 'Final Orders / Executed Docs', 'output')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- GOVERNANCE RULES
-- ============================================================================

INSERT INTO governance_rules (rule_name, rule_type, description, applies_to_agent_types, applies_to_work_types, applies_to_output_types, rule_config, severity, on_violation, notify_roles) VALUES
('Client-Facing Content Approval', 'approval_gate', 'All client-facing content must be approved by human before sending',
 ARRAY['content_generator', 'email_composer', 'proposal_writer'],
 ARRAY['content_generation', 'email_draft', 'proposal_generation'],
 ARRAY['client_facing', 'external'],
 '{"requires_roles": ["attorney", "partner"], "timeout_hours": 24}'::jsonb,
 'high', 'block', ARRAY['ops_lead', 'partner']),

('Public Content Brand QA', 'approval_gate', 'Public content must pass brand guidelines before publication',
 ARRAY['content_generator', 'social_media_composer'],
 ARRAY['content_generation', 'social_post'],
 ARRAY['public'],
 '{"min_brand_score": 80, "check_tone": true, "check_messaging": true}'::jsonb,
 'high', 'require_approval', ARRAY['marketing_lead']),

('High-Value Lead Approval', 'approval_gate', 'Proposals for leads >$50k must be approved',
 ARRAY['proposal_writer', 'lead_scorer'],
 ARRAY['proposal_generation', 'lead_scoring'],
 ARRAY['client_facing'],
 '{"value_threshold": 50000, "requires_roles": ["partner"]}'::jsonb,
 'high', 'require_approval', ARRAY['partner']),

('PII Detection', 'content_filter', 'Block outputs containing unredacted PII (SSN, credit card, etc.)',
 ARRAY['*'],
 ARRAY['*'],
 ARRAY['external', 'public', 'client_facing'],
 '{"patterns": ["ssn", "credit_card", "bank_account"], "action": "redact_or_block"}'::jsonb,
 'critical', 'block', ARRAY['compliance_lead', 'ops_lead']),

('Profanity Filter', 'content_filter', 'Block outputs containing profanity or inappropriate language',
 ARRAY['content_generator', 'email_composer', 'social_media_composer'],
 ARRAY['content_generation', 'email_draft', 'social_post'],
 ARRAY['external', 'public', 'client_facing'],
 '{"strict_mode": true, "custom_blocklist": []}'::jsonb,
 'medium', 'flag', ARRAY['ops_lead']),

('Legal Accuracy Review', 'compliance_check', 'Legal content must not contain unsupported claims or advice',
 ARRAY['legal_content_generator', 'legal_advisor'],
 ARRAY['legal_content', 'legal_advice'],
 ARRAY['client_facing', 'public'],
 '{"requires_citation": true, "disclaimer_required": true}'::jsonb,
 'critical', 'require_approval', ARRAY['attorney', 'compliance_lead']),

('Financial Accuracy', 'compliance_check', 'Financial projections must include disclaimers',
 ARRAY['financial_analyzer', 'proposal_writer'],
 ARRAY['financial_analysis', 'proposal_generation'],
 ARRAY['client_facing'],
 '{"disclaimer_required": true, "max_certainty_language": "may", "require_assumptions": true}'::jsonb,
 'high', 'require_approval', ARRAY['partner']),

('Agent Execution Rate Limit', 'rate_limit', 'Prevent runaway agent executions',
 ARRAY['*'],
 ARRAY['*'],
 ARRAY['*'],
 '{"max_per_hour": 100, "max_per_day": 500, "cooldown_seconds": 5}'::jsonb,
 'medium', 'block', ARRAY['ops_lead']),

('External API Rate Limit', 'rate_limit', 'Limit external API calls to prevent quota exhaustion',
 ARRAY['web_researcher', 'data_enricher'],
 ARRAY['research', 'data_enrichment'],
 ARRAY['*'],
 '{"max_per_minute": 20, "max_per_hour": 200}'::jsonb,
 'medium', 'block', ARRAY['ops_lead'])
ON CONFLICT (rule_name) DO NOTHING;

COMMIT;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
\echo 'Seed data loaded successfully!'
\echo 'Next step: Load playbook templates with npm run load-templates'
