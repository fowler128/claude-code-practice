-- Seed data for Agent Layer
-- Default agents, sub-agents, prompt packs, and governance rules

-- Insert default agents into agent_directory
INSERT INTO agent_directory (agent_id, agent_name, agent_type, description, capabilities, risk_level, requires_approval, approval_roles, max_cost_per_run, daily_run_limit, metadata_json) VALUES
('lead_enrichment_agent', 'Lead Enrichment Agent', 'data_enrichment', 'Enriches lead data with firm details, contact info, and scoring', '["web_research", "data_extraction", "scoring", "validation"]'::jsonb, 'low', false, NULL, 2.00, 100, '{"auto_run": true}'::jsonb),

('content_generator_agent', 'Content Generator Agent', 'content_generator', 'Generates marketing content, email drafts, and social posts', '["copywriting", "email_drafting", "social_posts", "blog_outlines"]'::jsonb, 'high', true, ARRAY['attorney', 'ops_lead'], 5.00, 50, '{"requires_brand_qa": true}'::jsonb),

('matter_qa_agent', 'Matter QA Agent', 'qa_reviewer', 'Reviews matter documents for completeness and compliance', '["document_review", "checklist_validation", "compliance_check"]'::jsonb, 'medium', false, NULL, 3.00, 200, '{"auto_approve_low_risk": true}'::jsonb),

('task_automation_agent', 'Task Automation Agent', 'task_executor', 'Automates routine tasks like reminders, status updates, and notifications', '["task_creation", "status_tracking", "notifications", "scheduling"]'::jsonb, 'low', false, NULL, 1.00, 500, '{"trusted": true}'::jsonb),

('analytics_agent', 'Analytics & Reporting Agent', 'analyst', 'Generates operational reports, trend analysis, and insights', '["data_analysis", "report_generation", "trend_detection", "kpi_tracking"]'::jsonb, 'low', false, NULL, 2.50, 50, '{"scheduling": "daily"}'::jsonb),

('outreach_orchestrator', 'Outreach Orchestrator Agent', 'orchestrator', 'Coordinates multi-step outreach campaigns with approval gates', '["campaign_planning", "sequence_management", "approval_routing", "performance_tracking"]'::jsonb, 'high', true, ARRAY['attorney', 'admin'], 10.00, 20, '{"multi_step": true}'::jsonb);

-- Insert sub-agents into sub_agent_directory
INSERT INTO sub_agent_directory (sub_agent_id, parent_agent_id, sub_agent_name, sub_agent_type, description, specialization, prompt_template, model_preference, temperature, max_tokens) VALUES
-- Lead Enrichment sub-agents
('lead_scorer', 'lead_enrichment_agent', 'Lead Scoring Sub-Agent', 'scorer', 'Scores leads based on firm size, practice areas, and fit', 'lead_scoring', 'Analyze this law firm and provide a lead score (0-100) based on: firm size, practice areas matching our target, geography, and technology adoption. Return JSON with score and reasoning.', 'gpt-4', 0.3, 500),

('firm_profiler', 'lead_enrichment_agent', 'Firm Profile Builder', 'profiler', 'Builds comprehensive firm profiles from web data', 'firm_profiling', 'Extract key information about this law firm: name, size, practice areas, key attorneys, website, location, and recent news. Return structured JSON.', 'gpt-4', 0.2, 1000),

('next_action_recommender', 'lead_enrichment_agent', 'Next Best Action Recommender', 'recommender', 'Suggests next steps for lead engagement', 'next_best_action', 'Based on this lead data, recommend the next best action: immediate outreach, nurture sequence, research needed, or disqualify. Provide reasoning.', 'gpt-4', 0.4, 400),

-- Content Generation sub-agents
('email_drafter', 'content_generator_agent', 'Email Draft Generator', 'writer', 'Generates personalized outreach emails', 'email_drafting', 'Write a professional outreach email to this law firm. Tone: consultative, value-focused. Include: pain point hook, brief value prop, soft CTA. Max 150 words.', 'gpt-4', 0.7, 600),

('social_post_creator', 'content_generator_agent', 'Social Media Post Creator', 'writer', 'Creates LinkedIn and Twitter posts', 'social_media', 'Create a LinkedIn post about [topic]. Tone: professional but engaging. Include hook, key insight, and call-to-action. Max 200 words.', 'gpt-4', 0.8, 400),

('brand_qa_checker', 'content_generator_agent', 'Brand QA Checker', 'qa_reviewer', 'Reviews content for brand compliance and quality', 'brand_qa', 'Review this content for: brand voice consistency, factual accuracy, legal compliance, and professionalism. Flag any issues. Return JSON with status and notes.', 'gpt-4', 0.2, 800),

-- Matter QA sub-agents
('document_completeness_checker', 'matter_qa_agent', 'Document Completeness Checker', 'checker', 'Validates document completeness against checklists', 'document_qa', 'Check this matter against the required artifacts checklist. Identify missing items, incomplete fields, and compliance gaps. Return structured report.', 'gpt-4', 0.1, 1000),

('defect_classifier', 'matter_qa_agent', 'Defect Classifier', 'classifier', 'Classifies and categorizes matter defects', 'defect_classification', 'Classify this matter defect: category (missing_data, incorrect_format, compliance_issue, etc.), severity (low/medium/high), and recommended fix.', 'gpt-4', 0.3, 500),

-- Task Automation sub-agents
('reminder_generator', 'task_automation_agent', 'Reminder Generator', 'automator', 'Creates automated reminders and follow-ups', 'reminders', 'Generate a professional reminder message for this overdue task. Include: what is due, deadline, and action needed. Keep it brief and actionable.', 'gpt-3.5-turbo', 0.5, 200),

('status_updater', 'task_automation_agent', 'Status Update Generator', 'automator', 'Generates status update summaries', 'status_updates', 'Summarize the current status of this matter/task based on recent activity. Highlight: progress, blockers, next steps. Max 100 words.', 'gpt-3.5-turbo', 0.4, 300),

-- Analytics sub-agents
('trend_analyzer', 'analytics_agent', 'Trend Analysis Sub-Agent', 'analyzer', 'Identifies trends and patterns in operational data', 'trend_analysis', 'Analyze this operational data and identify: key trends, anomalies, performance changes, and actionable insights. Return structured report.', 'gpt-4', 0.3, 1200),

('kpi_reporter', 'analytics_agent', 'KPI Reporter', 'reporter', 'Generates KPI summaries and dashboards', 'kpi_reporting', 'Create a concise KPI report for this period: key metrics, variance from targets, notable changes, and recommendations. Return JSON.', 'gpt-4', 0.2, 800);

-- Insert default prompt packs
INSERT INTO prompt_packs (prompt_pack_id, pack_name, pack_version, category, system_prompt, user_prompt_template, recommended_model, recommended_temperature, recommended_max_tokens, tags) VALUES
('lead_scoring_v1', 'Lead Scoring Pack', '1.0', 'lead_enrichment',
  'You are an expert at evaluating law firm leads. Score leads based on firm size, practice area alignment, technology adoption, and strategic fit.',
  'Analyze this law firm and provide a lead score (0-100):\n\nFirm Data:\n{{firm_data}}\n\nTarget Criteria:\n{{target_criteria}}\n\nReturn JSON: {"score": <0-100>, "reasoning": "<explanation>", "next_action": "<recommended action>"}',
  'gpt-4', 0.3, 500, ARRAY['leads', 'scoring', 'sales']),

('email_outreach_v1', 'Email Outreach Pack', '1.0', 'content_generation',
  'You are a professional business development writer. Create personalized, consultative emails that focus on value and build relationships.',
  'Write a personalized outreach email:\n\nRecipient: {{recipient_name}}, {{recipient_title}} at {{firm_name}}\nContext: {{context}}\nValue Prop: {{value_prop}}\n\nTone: Professional, consultative, non-salesy\nLength: 150 words max\nInclude: Hook, value, soft CTA',
  'gpt-4', 0.7, 600, ARRAY['content', 'outreach', 'email']),

('document_qa_v1', 'Document QA Pack', '1.0', 'qa_review',
  'You are a meticulous QA reviewer for legal matter documents. Check for completeness, accuracy, and compliance.',
  'Review this matter document against the checklist:\n\nDocument: {{document_summary}}\nChecklist: {{checklist_items}}\nCompliance Rules: {{compliance_rules}}\n\nReturn JSON: {"status": "pass|fail|warning", "missing_items": [], "issues": [], "recommendations": []}',
  'gpt-4', 0.1, 1000, ARRAY['qa', 'compliance', 'matters']),

('ops_brief_v1', 'Daily Ops Brief Pack', '1.0', 'analysis',
  'You are an operations analyst who creates clear, actionable daily briefs for leadership.',
  'Create a daily operations brief:\n\nMetrics: {{daily_metrics}}\nIncidents: {{incidents}}\nBottlenecks: {{bottlenecks}}\n\nFormat: Executive summary, key metrics, issues requiring attention, recommendations. Max 300 words.',
  'gpt-4', 0.3, 1000, ARRAY['analytics', 'reporting', 'operations']);

-- Insert default governance rules
INSERT INTO governance_rules (rule_name, rule_type, applies_to_agent_id, rule_config, violation_action, notify_roles, priority) VALUES
-- Approval gates for outbound content
('Outbound Content Approval Gate', 'approval_gate', 'content_generator_agent',
  '{"content_types": ["outbound_email", "social_post", "blog_post"], "requires_roles": ["attorney", "ops_lead"], "reason": "All outbound content requires human review before publication"}'::jsonb,
  'block', ARRAY['attorney', 'ops_lead'], 10),

-- Cost limits
('Agent Cost Limit - Per Run', 'cost_limit', NULL,
  '{"max_per_run": 10.00, "action": "block_and_notify"}'::jsonb,
  'block', ARRAY['admin', 'ops_lead'], 20),

('Agent Cost Limit - Daily', 'cost_limit', NULL,
  '{"max_daily_total": 100.00, "warning_threshold": 80.00}'::jsonb,
  'notify', ARRAY['admin', 'ops_lead'], 20),

-- Rate limits
('Lead Enrichment Rate Limit', 'rate_limit', 'lead_enrichment_agent',
  '{"max_runs_per_hour": 20, "max_runs_per_day": 150}'::jsonb,
  'block', ARRAY['ops_lead'], 30),

-- Content filters
('Outbound Content Safety Filter', 'content_filter', 'content_generator_agent',
  '{"blocked_keywords": ["guarantee", "lawsuit", "legal advice", "urgent action required"], "check_for_pii": true, "check_for_legal_claims": true}'::jsonb,
  'block', ARRAY['attorney', 'ops_lead'], 15),

-- Access control
('High-Risk Agent Approval', 'approval_gate', NULL,
  '{"applies_to_risk_levels": ["high", "critical"], "requires_roles": ["attorney", "admin"], "reason": "High-risk agents require attorney approval"}'::jsonb,
  'require_approval', ARRAY['attorney', 'admin'], 5);

-- Update matters table to include agent-related fields
-- (These would be added via migration in production)
-- ALTER TABLE matters ADD COLUMN IF NOT EXISTS lead_score INTEGER CHECK (lead_score BETWEEN 0 AND 100);
-- ALTER TABLE matters ADD COLUMN IF NOT EXISTS next_best_action VARCHAR(100);
-- ALTER TABLE matters ADD COLUMN IF NOT EXISTS automation_candidate BOOLEAN DEFAULT false;
-- ALTER TABLE matters ADD COLUMN IF NOT EXISTS last_ai_action_at TIMESTAMP;

-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false;
-- ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_confidence_score DECIMAL(3, 2);
