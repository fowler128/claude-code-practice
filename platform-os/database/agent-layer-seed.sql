-- ============================================================================
-- AGENT LAYER SEED DATA
-- ============================================================================

-- ============================================================================
-- GOVERNANCE RULES (Define first - referenced by agents)
-- ============================================================================

INSERT INTO governance_rules (rule_name, rule_type, description, applies_to_agent_types, applies_to_work_types, applies_to_output_types, rule_config, severity, on_violation, notify_roles) VALUES

-- Approval gates
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

-- Content filters
('PII Detection', 'content_filter', 'Block outputs containing unredacted PII (SSN, credit card, etc.)',
 ARRAY['*'], -- Applies to all agents
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

-- Compliance checks
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

-- Rate limits
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
 'medium', 'block', ARRAY['ops_lead']);

-- ============================================================================
-- AGENT DIRECTORY - Core Agents
-- ============================================================================

INSERT INTO agent_directory (agent_name, agent_type, description, capabilities, default_model, requires_human_approval, can_trigger_sub_agents, risk_tier) VALUES

-- Legal Matter Agents
('Legal Matter Analyst', 'analyst', 'Analyzes legal matters for health score drivers, risks, and next actions',
 '["matter_analysis", "risk_assessment", "health_scoring", "next_action_recommendation"]'::jsonb,
 'gpt-4', false, true, 'low'),

('Document QA Specialist', 'specialist', 'Quality checks legal documents for completeness, accuracy, and compliance',
 '["document_qa", "completeness_check", "accuracy_validation", "compliance_check"]'::jsonb,
 'gpt-4', false, true, 'medium'),

('Legal Research Assistant', 'specialist', 'Researches legal precedents, statutes, and case law',
 '["legal_research", "case_law_search", "statute_lookup", "precedent_analysis"]'::jsonb,
 'gpt-4', true, false, 'high'),

-- CRM & Lead Agents
('Lead Scoring Agent', 'analyst', 'Scores leads based on fit, behavior, and engagement signals',
 '["lead_scoring", "fit_analysis", "behavioral_analysis", "engagement_scoring"]'::jsonb,
 'gpt-4', false, true, 'low'),

('Next Best Action Recommender', 'specialist', 'Suggests optimal next steps for lead nurturing and conversion',
 '["action_recommendation", "sequencing", "personalization", "timing_optimization"]'::jsonb,
 'gpt-4', false, true, 'medium'),

('Proposal Generator', 'specialist', 'Generates customized proposals and engagement letters',
 '["proposal_generation", "pricing_calculation", "scope_definition", "terms_generation"]'::jsonb,
 'gpt-4', true, false, 'high'),

-- Content & Marketing Agents
('Content Generator', 'specialist', 'Generates blog posts, social media, emails, and marketing content',
 '["content_generation", "copywriting", "seo_optimization", "tone_matching"]'::jsonb,
 'gpt-4', true, true, 'high'),

('Brand QA Agent', 'reviewer', 'Reviews content for brand guideline compliance and tone consistency',
 '["brand_compliance", "tone_analysis", "style_checking", "guideline_validation"]'::jsonb,
 'gpt-4', false, false, 'medium'),

('SEO Optimizer', 'specialist', 'Optimizes content for search engines and readability',
 '["seo_analysis", "keyword_optimization", "meta_generation", "readability_scoring"]'::jsonb,
 'gpt-4', false, false, 'low'),

-- SOP & Automation Agents
('SOP Automation Analyzer', 'analyst', 'Identifies SOPs suitable for automation',
 '["automation_feasibility", "complexity_analysis", "roi_calculation", "blocker_identification"]'::jsonb,
 'gpt-4', false, true, 'low'),

('Workflow Orchestrator', 'orchestrator', 'Coordinates multi-step workflows across agents and systems',
 '["workflow_execution", "dependency_management", "error_handling", "state_management"]'::jsonb,
 'gpt-4', false, true, 'medium'),

-- General Purpose Agents
('Data Enricher', 'specialist', 'Enriches records with additional data from external sources',
 '["data_enrichment", "company_lookup", "contact_validation", "social_profile_matching"]'::jsonb,
 'gpt-4', false, false, 'low'),

('Summarization Agent', 'specialist', 'Summarizes long documents, emails, and meeting notes',
 '["text_summarization", "key_point_extraction", "action_item_identification"]'::jsonb,
 'gpt-4', false, false, 'low'),

('Sentiment Analyzer', 'analyst', 'Analyzes sentiment and tone of text communications',
 '["sentiment_analysis", "emotion_detection", "urgency_detection", "tone_classification"]'::jsonb,
 'gpt-4', false, false, 'low');

-- ============================================================================
-- SUB-AGENT DIRECTORY
-- ============================================================================

-- Sub-agents for Legal Matter Analyst
INSERT INTO sub_agent_directory (parent_agent_id, sub_agent_name, description, task_type, specialized_domain, prompt_template, execution_order) VALUES
((SELECT id FROM agent_directory WHERE agent_name = 'Legal Matter Analyst'),
 'Health Score Calculator', 'Calculates matter health score based on status, artifacts, and SLAs',
 'analysis', 'legal',
 'Analyze this matter and calculate health score: {{matter_data}}. Consider: missing artifacts, SLA status, defect count, engagement status.',
 1),

((SELECT id FROM agent_directory WHERE agent_name = 'Legal Matter Analyst'),
 'Risk Identifier', 'Identifies risks and red flags in matter progression',
 'analysis', 'legal',
 'Identify risks in this matter: {{matter_data}}. Flag: SLA breaches, missing docs, high defect counts, stalled statuses.',
 2),

((SELECT id FROM agent_directory WHERE agent_name = 'Legal Matter Analyst'),
 'Next Action Recommender', 'Suggests next best actions to improve matter health',
 'generation', 'legal',
 'Based on this matter analysis: {{matter_data}}, recommend top 3 actions to improve health score and advance the matter.',
 3);

-- Sub-agents for Document QA Specialist
INSERT INTO sub_agent_directory (parent_agent_id, sub_agent_name, description, task_type, specialized_domain, prompt_template, execution_order) VALUES
((SELECT id FROM agent_directory WHERE agent_name = 'Document QA Specialist'),
 'Completeness Checker', 'Checks if all required sections and fields are present',
 'validation', 'legal',
 'Review this document for completeness: {{document}}. Required sections: {{required_sections}}. Flag any missing elements.',
 1),

((SELECT id FROM agent_directory WHERE agent_name = 'Document QA Specialist'),
 'Accuracy Validator', 'Validates accuracy of names, dates, jurisdiction, and facts',
 'validation', 'legal',
 'Validate accuracy in this document: {{document}}. Check: party names, dates, jurisdiction, fact consistency.',
 2),

((SELECT id FROM agent_directory WHERE agent_name = 'Document QA Specialist'),
 'Signature Checker', 'Verifies all required signatures are present',
 'validation', 'legal',
 'Check for required signatures in: {{document}}. Required: {{required_signatures}}. Report missing signatures.',
 3);

-- Sub-agents for Lead Scoring Agent
INSERT INTO sub_agent_directory (parent_agent_id, sub_agent_name, description, task_type, specialized_domain, prompt_template, execution_order, is_parallel) VALUES
((SELECT id FROM agent_directory WHERE agent_name = 'Lead Scoring Agent'),
 'Fit Score Calculator', 'Calculates fit score based on industry, size, budget',
 'analysis', 'crm',
 'Calculate fit score for lead: {{lead_data}}. Consider: industry match, company size, budget alignment, service needs.',
 1, true),

((SELECT id FROM agent_directory WHERE agent_name = 'Lead Scoring Agent'),
 'Engagement Score Calculator', 'Calculates engagement score based on interactions',
 'analysis', 'crm',
 'Calculate engagement score for lead: {{lead_data}}. Consider: website visits, email opens, content downloads, meeting attendance.',
 1, true),

((SELECT id FROM agent_directory WHERE agent_name = 'Lead Scoring Agent'),
 'Intent Score Calculator', 'Calculates intent score based on behaviors and signals',
 'analysis', 'crm',
 'Calculate intent score for lead: {{lead_data}}. Consider: pricing page visits, demo requests, competitor research, timeline urgency.',
 1, true),

((SELECT id FROM agent_directory WHERE agent_name = 'Lead Scoring Agent'),
 'Score Aggregator', 'Combines sub-scores into final lead score',
 'generation', 'crm',
 'Aggregate lead scores: Fit={{fit_score}}, Engagement={{engagement_score}}, Intent={{intent_score}}. Calculate weighted final score and provide breakdown.',
 2, false);

-- Sub-agents for Content Generator
INSERT INTO sub_agent_directory (parent_agent_id, sub_agent_name, description, task_type, specialized_domain, prompt_template, execution_order) VALUES
((SELECT id FROM agent_directory WHERE agent_name = 'Content Generator'),
 'Content Outliner', 'Creates content outline and structure',
 'generation', 'content',
 'Create an outline for: {{content_brief}}. Include: intro, main points, conclusion, CTA. Target audience: {{audience}}.',
 1),

((SELECT id FROM agent_directory WHERE agent_name = 'Content Generator'),
 'Content Writer', 'Writes full content based on outline',
 'generation', 'content',
 'Write content based on this outline: {{outline}}. Tone: {{tone}}. Length: {{target_length}}. Include keywords: {{keywords}}.',
 2),

((SELECT id FROM agent_directory WHERE agent_name = 'Content Generator'),
 'Content Polisher', 'Polishes and refines the content',
 'generation', 'content',
 'Polish this content: {{draft_content}}. Improve: clarity, flow, engagement. Ensure brand voice consistency.',
 3);

-- Sub-agents for SOP Automation Analyzer
INSERT INTO sub_agent_directory (parent_agent_id, sub_agent_name, description, task_type, specialized_domain, prompt_template, execution_order) VALUES
((SELECT id FROM agent_directory WHERE agent_name = 'SOP Automation Analyzer'),
 'Complexity Assessor', 'Assesses technical complexity of SOP',
 'analysis', 'ops',
 'Assess automation complexity for SOP: {{sop_steps}}. Rate: low/medium/high. Consider: decision points, data availability, tool integrations.',
 1),

((SELECT id FROM agent_directory WHERE agent_name = 'SOP Automation Analyzer'),
 'ROI Calculator', 'Calculates ROI of automating the SOP',
 'analysis', 'ops',
 'Calculate automation ROI for SOP: {{sop_data}}. Consider: frequency={{frequency}}, time_per_execution={{time}}, error_rate={{errors}}.',
 2),

((SELECT id FROM agent_directory WHERE agent_name = 'SOP Automation Analyzer'),
 'Blocker Identifier', 'Identifies blockers preventing automation',
 'analysis', 'ops',
 'Identify automation blockers for SOP: {{sop_steps}}. Check for: human judgment requirements, missing APIs, data gaps, compliance issues.',
 3);

-- ============================================================================
-- PROMPT PACKS
-- ============================================================================

INSERT INTO prompt_packs (pack_name, version, description, category, system_prompt, user_prompt_template, prompt_variables, recommended_model) VALUES

('Legal Matter Health Analysis', '1.0.0', 'Analyzes legal matter health and provides actionable recommendations',
 'legal',
 'You are a legal operations analyst specializing in matter health assessment. Analyze matters objectively based on data, identify risks, and provide actionable recommendations.',
 'Analyze this legal matter:\n\nMatter Number: {{matter_number}}\nClient: {{client_name}}\nPractice Area: {{practice_area}}\nCurrent Status: {{current_status}}\nDays in Status: {{days_in_status}}\nSLA Hours: {{sla_hours}}\nMissing Artifacts: {{missing_artifacts}}\nDefect Count: {{defect_count}}\nLast Activity: {{last_activity}}\n\nProvide:\n1. Health Score (0-100) with breakdown\n2. Top 3 risk factors\n3. Top 3 recommended actions\n4. Urgency level',
 '{"matter_number": "string", "client_name": "string", "practice_area": "string", "current_status": "string", "days_in_status": "number", "sla_hours": "number", "missing_artifacts": "array", "defect_count": "number", "last_activity": "string"}'::jsonb,
 'gpt-4'),

('Lead Scoring & Qualification', '1.0.0', 'Scores leads and recommends next actions',
 'crm',
 'You are a sales operations analyst specializing in lead qualification. Evaluate leads objectively, calculate scores, and recommend optimal next steps.',
 'Score this lead:\n\nCompany: {{company_name}}\nContact: {{contact_name}}\nIndustry: {{industry}}\nCompany Size: {{company_size}}\nBudget: {{budget_range}}\nTimeline: {{timeline}}\nSource: {{source}}\nEngagement History: {{engagement_history}}\nPain Points: {{pain_points}}\n\nProvide:\n1. Overall Lead Score (0-100)\n2. Score breakdown (Fit, Engagement, Intent)\n3. Qualification status (qualified/nurture/disqualified)\n4. Next best action\n5. Confidence level',
 '{"company_name": "string", "contact_name": "string", "industry": "string", "company_size": "string", "budget_range": "string", "timeline": "string", "source": "string", "engagement_history": "array", "pain_points": "array"}'::jsonb,
 'gpt-4'),

('Content Brand QA', '1.0.0', 'Reviews content for brand guideline compliance',
 'marketing',
 'You are a brand compliance specialist. Review content against brand guidelines for tone, messaging, style, and compliance. Be thorough and objective.',
 'Review this content for brand compliance:\n\nContent Type: {{content_type}}\nContent:\n{{content_body}}\n\nBrand Guidelines:\n{{brand_guidelines}}\n\nProvide:\n1. Brand QA Score (0-100)\n2. Tone assessment (matches brand voice?)\n3. Messaging assessment (on-brand?)\n4. Style violations (if any)\n5. Required changes\n6. Overall status (pass/needs_review/fail)',
 '{"content_type": "string", "content_body": "string", "brand_guidelines": "object"}'::jsonb,
 'gpt-4'),

('SOP Automation Assessment', '1.0.0', 'Assesses SOP automation potential and ROI',
 'ops',
 'You are an automation specialist. Evaluate SOPs for automation potential, calculate ROI, and identify implementation blockers.',
 'Assess automation potential for this SOP:\n\nTitle: {{sop_title}}\nCategory: {{category}}\nSteps:\n{{procedure_steps}}\n\nCurrent Metrics:\n- Frequency: {{execution_frequency}}\n- Avg Time: {{avg_time_minutes}} minutes\n- Error Rate: {{error_rate}}%\n- Volume: {{monthly_volume}} executions/month\n\nProvide:\n1. Automation Score (0-100)\n2. Complexity Level (low/medium/high)\n3. Estimated ROI (hours saved/month)\n4. Implementation effort estimate\n5. Blockers (if any)\n6. Recommendation (automate/defer/manual)',
 '{"sop_title": "string", "category": "string", "procedure_steps": "array", "execution_frequency": "string", "avg_time_minutes": "number", "error_rate": "number", "monthly_volume": "number"}'::jsonb,
 'gpt-4');

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE agent_directory IS 'Seeded with 14 core agents across legal, CRM, content, and ops domains';
COMMENT ON TABLE sub_agent_directory IS 'Seeded with specialized sub-agents for decomposed tasks';
COMMENT ON TABLE governance_rules IS 'Seeded with 9 governance rules for approval gates, content filters, compliance, and rate limits';
COMMENT ON TABLE prompt_packs IS 'Seeded with 4 prompt packs for common agent workflows';
