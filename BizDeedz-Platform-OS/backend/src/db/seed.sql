-- BizDeedz Platform OS Seed Data
-- Controlled lists and initial data

-- Practice Areas
INSERT INTO practice_areas (practice_area_id, name, description) VALUES
('bankruptcy', 'Bankruptcy', 'Consumer and business bankruptcy cases'),
('family_law', 'Family Law', 'Divorce, custody, child support, and family matters'),
('immigration', 'Immigration', 'Visa petitions, adjustments, naturalization, and immigration matters'),
('probate_estate', 'Probate / Estate Planning', 'Estate planning, wills, trusts, probate administration');

-- Matter Types
INSERT INTO matter_types (matter_type_id, practice_area_id, name, description) VALUES
-- Bankruptcy
('bk_consumer', 'bankruptcy', 'Consumer Bankruptcy (General)', 'Chapter 7 or Chapter 13 consumer bankruptcy'),
-- Family Law
('fl_divorce', 'family_law', 'Divorce', 'Dissolution of marriage'),
('fl_custody', 'family_law', 'Custody/Modification', 'Child custody and support modifications'),
-- Immigration
('im_petition', 'immigration', 'Petition/Application (General)', 'General immigration petitions and applications'),
('im_rfe', 'immigration', 'RFE Response', 'Request for Evidence responses'),
-- Probate/Estate
('pe_planning', 'probate_estate', 'Estate Planning Package', 'Wills, trusts, powers of attorney'),
('pe_probate', 'probate_estate', 'Probate Administration', 'Probate of estate');

-- Defect Reasons (cross-practice)
INSERT INTO defect_reasons (defect_reason_id, name, description, category) VALUES
('missing_artifact', 'Missing Required Artifact', 'Required document or artifact not provided', 'documentation'),
('incorrect_names', 'Incorrect Party Names / Spelling', 'Names spelled incorrectly or wrong parties listed', 'accuracy'),
('incorrect_jurisdiction', 'Incorrect Jurisdiction / Venue', 'Wrong court, jurisdiction, or venue specified', 'accuracy'),
('missing_signature', 'Signature Missing / Invalid', 'Required signature missing or not properly executed', 'execution'),
('incomplete_fields', 'Incomplete Form Fields', 'Critical form fields left blank or incomplete', 'accuracy'),
('wrong_template', 'Wrong Template Used', 'Incorrect form or template used for this matter type', 'process'),
('inconsistent_facts', 'Inconsistent Facts Across Docs', 'Facts or data inconsistent across documents', 'accuracy'),
('deadline_risk', 'Deadline Miss Risk / Late', 'Work product late or at risk of missing deadline', 'timing'),
('payment_issue', 'Payment / Retainer Issue', 'Payment not received or retainer issues', 'billing'),
('other', 'Other (Requires Note)', 'Other issue requiring explanation', 'other');

-- Artifact Types (cross-practice starter)
INSERT INTO artifact_types (artifact_type_id, name, description, category) VALUES
('intake_form', 'Intake Questionnaire', 'Client intake form or questionnaire', 'intake'),
('engagement_unsigned', 'Engagement Letter (Unsigned)', 'Draft engagement letter awaiting signature', 'engagement'),
('engagement_signed', 'Engagement Letter (Signed)', 'Executed engagement letter', 'engagement'),
('payment_confirm', 'Payment Confirmation', 'Payment or retainer confirmation receipt', 'billing'),
('identity_doc', 'Identity Documentation', 'ID, passport, SSN verification, etc.', 'client_docs'),
('financial_doc', 'Financial Documentation', 'Bank statements, tax returns, pay stubs, financial records', 'client_docs'),
('evidence_packet', 'Supporting Evidence Packet', 'Supporting documentation and evidence', 'client_docs'),
('draft_filing', 'Draft Filing/Submission Packet', 'Draft documents for review before submission', 'work_product'),
('final_filing', 'Final Filed/Submitted Packet', 'Final filed or submitted documents', 'work_product'),
('court_notice', 'Court/Agency Notices', 'Notices received from court or government agency', 'external'),
('final_orders', 'Final Orders / Executed Docs', 'Final orders, judgments, or executed documents', 'work_product');

-- Create default admin user (password: admin123 - CHANGE IN PRODUCTION)
-- Password hash for 'admin123' using bcrypt with 10 rounds
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES
('admin@bizdeedz.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhwy', 'System', 'Admin', 'admin', true);

-- Additional seed users for testing
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active) VALUES
('attorney@bizdeedz.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhwy', 'Jane', 'Attorney', 'attorney', true),
('paralegal@bizdeedz.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhwy', 'John', 'Paralegal', 'paralegal', true),
('intake@bizdeedz.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhwy', 'Sarah', 'Intake', 'intake_specialist', true);
