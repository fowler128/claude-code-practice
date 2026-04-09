-- Content Ops Autopilot Migration
-- Implements Version 2.1 Content Operations System

-- ============================================================================
-- 1. CONTENT_SKILL_FILES (Brand Knowledge Base)
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_skill_files (
    skill_file_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    brand_lane VARCHAR(50) NOT NULL CHECK (brand_lane IN ('bizdeedz', 'turea', 'both')),
    markdown_text TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_skill_files_brand_lane ON content_skill_files(brand_lane);
CREATE INDEX idx_content_skill_files_is_active ON content_skill_files(is_active);

COMMENT ON TABLE content_skill_files IS 'Brand knowledge base files (voice, principles, mechanisms)';
COMMENT ON COLUMN content_skill_files.brand_lane IS 'Which brand this skill file applies to';

-- ============================================================================
-- 2. CONTENT_VOICE_MEMOS (Voice Note Captures)
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_voice_memos (
    memo_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source VARCHAR(100) NOT NULL, -- e.g., 'mobile_app', 'web', 'email'
    file_url TEXT, -- URL to audio file if stored
    transcript_text TEXT,
    duration_seconds INTEGER,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    tags TEXT[] -- Array of tags for categorization
);

CREATE INDEX idx_content_voice_memos_created_by ON content_voice_memos(created_by);
CREATE INDEX idx_content_voice_memos_created_at ON content_voice_memos(created_at);

COMMENT ON TABLE content_voice_memos IS 'Voice note captures for content ideation';

-- ============================================================================
-- 3. CONTENT_IDEAS (Idea Bank)
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_ideas (
    idea_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lane VARCHAR(50) NOT NULL CHECK (lane IN ('bizdeedz', 'turea', 'both')),
    sku VARCHAR(255), -- Product/service this content promotes
    hook_1 TEXT NOT NULL, -- Primary hook/angle
    hook_2 TEXT, -- Secondary hook/angle
    mechanism TEXT, -- How it works explanation
    principle TEXT, -- Core principle/framework
    status VARCHAR(50) NOT NULL DEFAULT 'captured' CHECK (
        status IN ('captured', 'approved', 'drafted', 'scheduled', 'published', 'archived')
    ),
    tags TEXT[], -- Array of tags
    source_memo_id UUID REFERENCES content_voice_memos(memo_id),
    approved_by UUID REFERENCES users(user_id),
    approved_at TIMESTAMP,
    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata_json JSONB -- Additional metadata
);

CREATE INDEX idx_content_ideas_lane ON content_ideas(lane);
CREATE INDEX idx_content_ideas_status ON content_ideas(status);
CREATE INDEX idx_content_ideas_created_by ON content_ideas(created_by);
CREATE INDEX idx_content_ideas_tags ON content_ideas USING GIN(tags);

COMMENT ON TABLE content_ideas IS 'Content idea bank with hooks, mechanisms, and principles';
COMMENT ON COLUMN content_ideas.sku IS 'Product/service SKU this content promotes';

-- ============================================================================
-- 4. CONTENT_DRAFTS (Drafted Content)
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_drafts (
    draft_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idea_id UUID NOT NULL REFERENCES content_ideas(idea_id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('linkedin', 'tiktok', 'twitter', 'instagram', 'youtube')),
    draft_text TEXT NOT NULL,

    -- QA Checkboxes (4-gate quality control)
    qa_principle BOOLEAN DEFAULT false, -- Does it teach a principle/framework?
    qa_mechanism BOOLEAN DEFAULT false, -- Does it explain HOW it works?
    qa_cta BOOLEAN DEFAULT false, -- Is there a clear CTA?
    qa_audience BOOLEAN DEFAULT false, -- Is it targeted to the right audience?

    qa_passed BOOLEAN GENERATED ALWAYS AS (
        qa_principle AND qa_mechanism AND qa_cta AND qa_audience
    ) STORED,

    reviewed_by UUID REFERENCES users(user_id),
    reviewed_at TIMESTAMP,
    review_notes TEXT,

    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,

    created_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_drafts_idea_id ON content_drafts(idea_id);
CREATE INDEX idx_content_drafts_platform ON content_drafts(platform);
CREATE INDEX idx_content_drafts_qa_passed ON content_drafts(qa_passed);
CREATE INDEX idx_content_drafts_is_active ON content_drafts(is_active);

COMMENT ON TABLE content_drafts IS 'Content drafts with 4-gate QA system';
COMMENT ON COLUMN content_drafts.qa_principle IS 'QA Gate 1: Teaches a principle/framework?';
COMMENT ON COLUMN content_drafts.qa_mechanism IS 'QA Gate 2: Explains HOW it works?';
COMMENT ON COLUMN content_drafts.qa_cta IS 'QA Gate 3: Has clear call-to-action?';
COMMENT ON COLUMN content_drafts.qa_audience IS 'QA Gate 4: Targeted to right audience?';

-- ============================================================================
-- 5. CONTENT_CALENDAR (Scheduling)
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_calendar (
    calendar_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID NOT NULL REFERENCES content_drafts(draft_id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP NOT NULL,
    publish_status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (
        publish_status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')
    ),
    published_at TIMESTAMP,
    publish_url TEXT, -- URL to published content
    publish_error TEXT,

    scheduled_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_calendar_draft_id ON content_calendar(draft_id);
CREATE INDEX idx_content_calendar_scheduled_for ON content_calendar(scheduled_for);
CREATE INDEX idx_content_calendar_publish_status ON content_calendar(publish_status);

COMMENT ON TABLE content_calendar IS 'Content scheduling and publishing tracker';

-- ============================================================================
-- 6. CONTENT_PERFORMANCE (Analytics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS content_performance (
    performance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    draft_id UUID NOT NULL REFERENCES content_drafts(draft_id) ON DELETE CASCADE,

    -- Engagement Metrics
    impressions INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,

    -- Business Metrics
    dms INTEGER DEFAULT 0, -- Direct messages received
    calls INTEGER DEFAULT 0, -- Calls booked
    conversions INTEGER DEFAULT 0, -- Sales/signups

    -- Qualitative Data
    notes TEXT, -- Manual observations
    top_comment TEXT, -- Most valuable comment

    -- Tracking
    measured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    measured_by UUID REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_content_performance_draft_id ON content_performance(draft_id);
CREATE INDEX idx_content_performance_measured_at ON content_performance(measured_at);

COMMENT ON TABLE content_performance IS 'Content performance tracking and analytics';

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to get QA gate pass rate for an idea
CREATE OR REPLACE FUNCTION get_idea_qa_stats(p_idea_id UUID)
RETURNS TABLE(
    total_drafts BIGINT,
    passed_drafts BIGINT,
    pass_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*) as total_drafts,
        COUNT(*) FILTER (WHERE qa_passed = true) as passed_drafts,
        CASE
            WHEN COUNT(*) > 0 THEN
                ROUND(100.0 * COUNT(*) FILTER (WHERE qa_passed = true) / COUNT(*), 2)
            ELSE 0
        END as pass_rate
    FROM content_drafts
    WHERE idea_id = p_idea_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate content performance score
CREATE OR REPLACE FUNCTION calculate_content_score(p_draft_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    v_score NUMERIC;
BEGIN
    SELECT
        COALESCE(
            (impressions * 0.1) +
            (saves * 5) +
            (comments * 3) +
            (likes * 1) +
            (shares * 10) +
            (dms * 20) +
            (calls * 100) +
            (conversions * 500),
            0
        )
    INTO v_score
    FROM content_performance
    WHERE draft_id = p_draft_id
    ORDER BY measured_at DESC
    LIMIT 1;

    RETURN COALESCE(v_score, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. VIEWS FOR REPORTING
-- ============================================================================

-- View: Content Ideas Pipeline
CREATE OR REPLACE VIEW v_content_ideas_pipeline AS
SELECT
    lane,
    status,
    COUNT(*) as idea_count,
    COUNT(DISTINCT sku) as unique_skus,
    MIN(created_at) as oldest_idea,
    MAX(created_at) as newest_idea
FROM content_ideas
GROUP BY lane, status
ORDER BY lane, status;

COMMENT ON VIEW v_content_ideas_pipeline IS 'Content ideas grouped by lane and status';

-- View: Content Review Queue
CREATE OR REPLACE VIEW v_content_review_queue AS
SELECT
    cd.draft_id,
    ci.idea_id,
    ci.lane,
    ci.sku,
    cd.platform,
    cd.draft_text,
    cd.qa_principle,
    cd.qa_mechanism,
    cd.qa_cta,
    cd.qa_audience,
    cd.qa_passed,
    cd.created_at as drafted_at,
    cd.created_by as drafted_by_id,
    u_drafted.first_name || ' ' || u_drafted.last_name as drafted_by_name,
    cd.reviewed_at,
    cd.reviewed_by as reviewed_by_id,
    u_reviewed.first_name || ' ' || u_reviewed.last_name as reviewed_by_name
FROM content_drafts cd
JOIN content_ideas ci ON cd.idea_id = ci.idea_id
LEFT JOIN users u_drafted ON cd.created_by = u_drafted.user_id
LEFT JOIN users u_reviewed ON cd.reviewed_by = u_reviewed.user_id
WHERE cd.is_active = true
ORDER BY cd.qa_passed ASC, cd.created_at ASC;

COMMENT ON VIEW v_content_review_queue IS 'Drafts pending QA review (failed gates first)';

-- View: Content Calendar Overview
CREATE OR REPLACE VIEW v_content_calendar_overview AS
SELECT
    cc.calendar_id,
    cc.scheduled_for,
    cc.publish_status,
    cc.published_at,
    cc.publish_url,
    cd.platform,
    cd.draft_text,
    ci.lane,
    ci.sku,
    ci.hook_1,
    u_scheduled.first_name || ' ' || u_scheduled.last_name as scheduled_by_name
FROM content_calendar cc
JOIN content_drafts cd ON cc.draft_id = cd.draft_id
JOIN content_ideas ci ON cd.idea_id = ci.idea_id
LEFT JOIN users u_scheduled ON cc.scheduled_by = u_scheduled.user_id
ORDER BY cc.scheduled_for ASC;

COMMENT ON VIEW v_content_calendar_overview IS 'Scheduled content with metadata';

-- View: Content Performance Dashboard
CREATE OR REPLACE VIEW v_content_performance_dashboard AS
SELECT
    cp.performance_id,
    cp.draft_id,
    cd.platform,
    ci.lane,
    ci.sku,
    cp.impressions,
    cp.saves,
    cp.comments,
    cp.likes,
    cp.shares,
    cp.dms,
    cp.calls,
    cp.conversions,
    calculate_content_score(cp.draft_id) as performance_score,
    cp.measured_at,
    cc.scheduled_for,
    cc.published_at,
    EXTRACT(EPOCH FROM (cp.measured_at - cc.published_at)) / 3600 as hours_since_publish
FROM content_performance cp
JOIN content_drafts cd ON cp.draft_id = cd.draft_id
JOIN content_ideas ci ON cd.idea_id = ci.idea_id
LEFT JOIN content_calendar cc ON cd.draft_id = cc.draft_id
ORDER BY cp.measured_at DESC;

COMMENT ON VIEW v_content_performance_dashboard IS 'Performance metrics with calculated scores';

-- View: Top Performing Content
CREATE OR REPLACE VIEW v_top_performing_content AS
SELECT
    cd.draft_id,
    cd.platform,
    ci.lane,
    ci.sku,
    ci.hook_1,
    cd.draft_text,
    cp.impressions,
    cp.saves,
    cp.calls,
    cp.conversions,
    calculate_content_score(cd.draft_id) as performance_score,
    cc.published_at
FROM content_drafts cd
JOIN content_ideas ci ON cd.idea_id = ci.idea_id
LEFT JOIN content_performance cp ON cd.draft_id = cp.draft_id
LEFT JOIN content_calendar cc ON cd.draft_id = cc.draft_id
WHERE cc.publish_status = 'published'
ORDER BY calculate_content_score(cd.draft_id) DESC
LIMIT 20;

COMMENT ON VIEW v_top_performing_content IS 'Top 20 performing content pieces by score';

-- ============================================================================
-- 9. TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_content_ideas_updated_at
    BEFORE UPDATE ON content_ideas
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER trigger_content_drafts_updated_at
    BEFORE UPDATE ON content_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER trigger_content_calendar_updated_at
    BEFORE UPDATE ON content_calendar
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

CREATE TRIGGER trigger_content_skill_files_updated_at
    BEFORE UPDATE ON content_skill_files
    FOR EACH ROW
    EXECUTE FUNCTION update_content_updated_at();

-- ============================================================================
-- 10. SEED DATA
-- ============================================================================

-- Seed default skill files
INSERT INTO content_skill_files (name, brand_lane, markdown_text, version) VALUES
('BizDeedz Voice & Tone', 'bizdeedz', '# BizDeedz Voice
- Professional but approachable
- Focus on law firm operations excellence
- Data-driven insights
- Practical, actionable advice', 1),
('Turea Voice & Tone', 'turea', '# Turea Voice
- Authentic and conversational
- Focus on personal growth and momentum
- Story-driven content
- Relatable and human', 1),
('Content Principles', 'both', '# Core Content Principles
1. Lead with value, not promotion
2. Teach frameworks and mechanisms
3. Use concrete examples
4. Always include a clear CTA
5. Optimize for saves and shares', 1)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION LOG
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '==============================================================';
    RAISE NOTICE 'Content Ops Autopilot Migration completed successfully';
    RAISE NOTICE '==============================================================';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - content_skill_files: Brand knowledge base';
    RAISE NOTICE '  - content_voice_memos: Voice note captures';
    RAISE NOTICE '  - content_ideas: Idea bank (6 statuses)';
    RAISE NOTICE '  - content_drafts: Drafts with 4-gate QA system';
    RAISE NOTICE '  - content_calendar: Scheduling tracker';
    RAISE NOTICE '  - content_performance: Analytics and metrics';
    RAISE NOTICE '';
    RAISE NOTICE 'Functions created:';
    RAISE NOTICE '  - get_idea_qa_stats(idea_id)';
    RAISE NOTICE '  - calculate_content_score(draft_id)';
    RAISE NOTICE '';
    RAISE NOTICE 'Views created:';
    RAISE NOTICE '  - v_content_ideas_pipeline';
    RAISE NOTICE '  - v_content_review_queue';
    RAISE NOTICE '  - v_content_calendar_overview';
    RAISE NOTICE '  - v_content_performance_dashboard';
    RAISE NOTICE '  - v_top_performing_content';
    RAISE NOTICE '==============================================================';
END $$;
