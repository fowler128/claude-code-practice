-- BizDeedz Ops Platform - SQL Views for Dashboards
-- Version: 1.0 MVP
-- Description: Views for KPIs, AR aging, metrics, and reporting

-- =============================================================================
-- KPI DASHBOARD VIEW
-- High-level metrics for the operator dashboard
-- =============================================================================

CREATE OR REPLACE VIEW v_kpi_dashboard AS
SELECT
    -- Financial KPIs
    (SELECT COUNT(*) FROM invoices WHERE status = 'overdue') as count_overdue_invoices,
    (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE status = 'overdue') as total_ar_outstanding,
    (SELECT COALESCE(SUM(amount * quantity), 0) FROM billables WHERE invoice_id IS NULL AND approved = true) as unbilled_wip,
    (SELECT COUNT(*) FROM firms WHERE active_capacity = true) as firms_with_paid_retainers,
    (SELECT COUNT(*) FROM firms WHERE active_capacity = false AND status = 'active') as firms_with_unpaid_retainers,

    -- Operational KPIs - Current Week
    (SELECT COUNT(*) FROM matters
     WHERE status_stage = 'delivered'
     AND delivered_at >= date_trunc('week', CURRENT_DATE)) as delivered_this_week,

    (SELECT COUNT(*) FROM matters
     WHERE status_stage IN ('delivered', 'complete')
     AND delivered_at >= date_trunc('month', CURRENT_DATE)) as delivered_this_month,

    -- Queue Counts
    (SELECT COUNT(*) FROM matters WHERE status_stage = 'assigned') as queue_assigned,
    (SELECT COUNT(*) FROM matters WHERE status_stage = 'waiting_inputs') as queue_waiting_inputs,
    (SELECT COUNT(*) FROM matters WHERE status_stage = 'conflicts_review') as queue_conflicts,
    (SELECT COUNT(*) FROM matters WHERE status_stage = 'in_progress') as queue_in_progress,
    (SELECT COUNT(*) FROM matters WHERE status_stage = 'qc') as queue_qc,
    (SELECT COUNT(*) FROM matters WHERE status_stage = 'revision') as queue_revision,
    (SELECT COUNT(*) FROM matters WHERE status_stage = 'paused_ar') as queue_paused_ar,

    -- Rush matters
    (SELECT COUNT(*) FROM matters WHERE rush = true AND status_stage NOT IN ('complete', 'delivered')) as active_rush_matters,

    -- Quality KPIs
    (SELECT ROUND(AVG(revision_rounds)::numeric, 2) FROM matters WHERE status_stage = 'complete') as avg_revision_rounds,

    -- Deficiency rate (matters with deficiencies / total delivered)
    (SELECT ROUND(
        CASE WHEN COUNT(*) > 0 THEN
            (COUNT(DISTINCT d.matter_id)::numeric / COUNT(DISTINCT m.id)) * 100
        ELSE 0 END, 1)
     FROM matters m
     LEFT JOIN deficiencies d ON d.matter_id = m.id AND d.status = 'open'
     WHERE m.status_stage = 'delivered') as deficiency_rate_percent,

    -- SLA Metrics (matters delivered before deadline / total delivered)
    (SELECT ROUND(
        CASE WHEN COUNT(*) > 0 THEN
            (COUNT(CASE WHEN delivered_at::date <= deadline THEN 1 END)::numeric / COUNT(*)) * 100
        ELSE 0 END, 1)
     FROM matters
     WHERE status_stage IN ('delivered', 'complete')
     AND delivered_at IS NOT NULL
     AND deadline IS NOT NULL
     AND delivered_at >= date_trunc('month', CURRENT_DATE)) as sla_hit_rate_percent,

    -- Timestamps
    NOW() as calculated_at;


-- =============================================================================
-- AR AGING VIEW
-- Buckets unpaid invoices for AR management and pause triggers
-- =============================================================================

CREATE OR REPLACE VIEW v_ar_aging AS
SELECT
    f.id as firm_id,
    f.firm_name,
    i.id as invoice_id,
    i.invoice_number,
    i.total,
    i.invoice_date,
    i.sent_at,
    i.status,
    CURRENT_DATE - i.invoice_date as calendar_days_outstanding,
    -- Calculate business days (simplified: exclude weekends)
    (SELECT COUNT(*)::int
     FROM generate_series(i.invoice_date, CURRENT_DATE - 1, '1 day') d
     WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)) as business_days_outstanding,
    CASE
        WHEN (CURRENT_DATE - i.invoice_date) <= 3 THEN '0-3 Days'
        WHEN (CURRENT_DATE - i.invoice_date) BETWEEN 4 AND 7 THEN '4-7 Days'
        ELSE '8+ Days'
    END as aging_bucket,
    CASE
        WHEN (SELECT COUNT(*)
              FROM generate_series(i.invoice_date, CURRENT_DATE - 1, '1 day') d
              WHERE EXTRACT(DOW FROM d) NOT IN (0, 6)) > 3 THEN true
        ELSE false
    END as should_pause
FROM invoices i
JOIN firms f ON i.firm_id = f.id
WHERE i.status IN ('sent', 'overdue')
ORDER BY f.firm_name, i.invoice_date;


-- =============================================================================
-- AR AGING SUMMARY VIEW
-- Aggregated AR totals by bucket
-- =============================================================================

CREATE OR REPLACE VIEW v_ar_aging_summary AS
SELECT
    aging_bucket,
    COUNT(*) as invoice_count,
    SUM(total) as total_outstanding,
    COUNT(DISTINCT firm_id) as firms_affected
FROM v_ar_aging
GROUP BY aging_bucket
ORDER BY
    CASE aging_bucket
        WHEN '0-3 Days' THEN 1
        WHEN '4-7 Days' THEN 2
        ELSE 3
    END;


-- =============================================================================
-- FIRM PERFORMANCE VIEW
-- Aggregated metrics per firm
-- =============================================================================

CREATE OR REPLACE VIEW v_firm_performance AS
SELECT
    f.id as firm_id,
    f.firm_name,
    f.status as firm_status,
    f.active_capacity,

    -- Matter counts
    COUNT(DISTINCT m.id) as total_matters,
    COUNT(DISTINCT CASE WHEN m.status_stage NOT IN ('complete', 'paused_ar') THEN m.id END) as active_matters,
    COUNT(DISTINCT CASE WHEN m.status_stage = 'complete' THEN m.id END) as completed_matters,
    COUNT(DISTINCT CASE WHEN m.status_stage = 'paused_ar' THEN m.id END) as paused_matters,

    -- By case type
    COUNT(DISTINCT CASE WHEN m.case_type = 'ch7' THEN m.id END) as ch7_count,
    COUNT(DISTINCT CASE WHEN m.case_type = 'ch13' THEN m.id END) as ch13_count,
    COUNT(DISTINCT CASE WHEN m.case_type = 'amendment' THEN m.id END) as amendment_count,

    -- Quality metrics
    ROUND(AVG(m.revision_rounds)::numeric, 2) as avg_revisions,

    -- Cycle time (average days from assigned to delivered)
    ROUND(AVG(
        EXTRACT(EPOCH FROM (m.delivered_at - m.assigned_at)) / 86400
    )::numeric, 1) as avg_cycle_time_days,

    -- Financial
    COALESCE((SELECT SUM(amount * quantity) FROM billables b WHERE b.firm_id = f.id), 0) as total_billed,
    COALESCE((SELECT SUM(total) FROM invoices i WHERE i.firm_id = f.id AND i.status = 'paid'), 0) as total_collected,
    COALESCE((SELECT SUM(total) FROM invoices i WHERE i.firm_id = f.id AND i.status IN ('sent', 'overdue')), 0) as ar_outstanding

FROM firms f
LEFT JOIN matters m ON m.firm_id = f.id
GROUP BY f.id, f.firm_name, f.status, f.active_capacity;


-- =============================================================================
-- DELIVERY METRICS VIEW
-- Delivery statistics for reporting
-- =============================================================================

CREATE OR REPLACE VIEW v_delivery_metrics AS
SELECT
    date_trunc('week', d.delivered_at)::date as week_start,
    date_trunc('month', d.delivered_at)::date as month_start,
    d.delivery_type,
    COUNT(*) as delivery_count,
    COUNT(CASE WHEN m.rush = true THEN 1 END) as rush_count,

    -- Average cycle time for deliveries that week
    ROUND(AVG(
        EXTRACT(EPOCH FROM (d.delivered_at - m.assigned_at)) / 86400
    )::numeric, 1) as avg_cycle_time_days,

    -- Revenue (based on delivery type)
    SUM(CASE
        WHEN d.delivery_type = 'ch7' THEN 200
        WHEN d.delivery_type = 'ch13' THEN 350
        WHEN d.delivery_type = 'amendment' THEN 250
    END) as estimated_revenue

FROM deliveries d
JOIN matters m ON d.matter_id = m.id
WHERE d.delivered_at IS NOT NULL
GROUP BY date_trunc('week', d.delivered_at), date_trunc('month', d.delivered_at), d.delivery_type
ORDER BY week_start DESC, delivery_type;


-- =============================================================================
-- WEEKLY DELIVERY SUMMARY VIEW
-- Summary for Friday invoice preparation
-- =============================================================================

CREATE OR REPLACE VIEW v_weekly_delivery_summary AS
SELECT
    f.id as firm_id,
    f.firm_name,
    f.billing_email,
    COUNT(DISTINCT d.id) as deliveries_count,
    COUNT(DISTINCT CASE WHEN d.delivery_type = 'ch7' THEN d.id END) as ch7_count,
    COUNT(DISTINCT CASE WHEN d.delivery_type = 'ch13' THEN d.id END) as ch13_count,
    COUNT(DISTINCT CASE WHEN d.delivery_type = 'amendment' THEN d.id END) as amendment_count,
    COUNT(DISTINCT CASE WHEN m.rush = true THEN d.id END) as rush_count,

    -- Estimated totals
    SUM(CASE
        WHEN d.delivery_type = 'ch7' THEN 200
        WHEN d.delivery_type = 'ch13' THEN 350
        WHEN d.delivery_type = 'amendment' THEN 250
    END) + (COUNT(DISTINCT CASE WHEN m.rush = true THEN d.id END) * 150) as estimated_total

FROM firms f
JOIN matters m ON m.firm_id = f.id
JOIN deliveries d ON d.matter_id = m.id
WHERE d.delivered_at >= date_trunc('week', CURRENT_DATE - INTERVAL '1 week')
  AND d.delivered_at < date_trunc('week', CURRENT_DATE)
GROUP BY f.id, f.firm_name, f.billing_email
ORDER BY f.firm_name;


-- =============================================================================
-- MATTER QUEUE VIEW
-- Matters grouped by stage with key info for work boards
-- =============================================================================

CREATE OR REPLACE VIEW v_matter_queue AS
SELECT
    m.id as matter_id,
    m.matter_name,
    m.case_type,
    m.district,
    m.deadline,
    m.rush,
    m.status_stage,
    m.inputs_status,
    m.conflicts_status,
    m.assigned_to,
    m.revision_rounds,
    f.id as firm_id,
    f.firm_name,
    f.active_capacity as firm_active,

    -- Age calculations
    CURRENT_DATE - m.assigned_at::date as days_since_assigned,
    CASE
        WHEN m.deadline IS NOT NULL THEN m.deadline - CURRENT_DATE
        ELSE NULL
    END as days_until_deadline,

    -- Flags
    CASE WHEN m.deadline < CURRENT_DATE AND m.status_stage NOT IN ('complete', 'delivered') THEN true ELSE false END as is_overdue,
    CASE WHEN m.deadline <= CURRENT_DATE + 2 AND m.status_stage NOT IN ('complete', 'delivered') THEN true ELSE false END as deadline_soon,

    -- Open deficiencies count
    (SELECT COUNT(*) FROM deficiencies d WHERE d.matter_id = m.id AND d.status = 'open') as open_deficiencies,

    m.created_at,
    m.updated_at

FROM matters m
JOIN firms f ON m.firm_id = f.id
ORDER BY
    CASE WHEN m.rush = true THEN 0 ELSE 1 END,
    m.deadline NULLS LAST,
    m.created_at;


-- =============================================================================
-- CONFLICTS DASHBOARD VIEW
-- Overview of conflict check status across all matters
-- =============================================================================

CREATE OR REPLACE VIEW v_conflicts_dashboard AS
SELECT
    m.id as matter_id,
    m.matter_name,
    m.conflicts_status,
    f.firm_name,
    cc.run_at as last_check_at,
    cc.run_by as last_check_by,
    cc.result as last_check_result,
    cc.matches as matches_found,
    cc.decision,
    cc.decision_by,
    cc.decision_notes,
    cc.decision_at,

    -- Entity names for this matter
    (SELECT array_agg(e.full_name)
     FROM matter_entities me
     JOIN entities e ON e.id = me.entity_id
     WHERE me.matter_id = m.id) as entity_names

FROM matters m
JOIN firms f ON m.firm_id = f.id
LEFT JOIN LATERAL (
    SELECT * FROM conflict_checks
    WHERE matter_id = m.id
    ORDER BY run_at DESC
    LIMIT 1
) cc ON true
WHERE m.status_stage NOT IN ('complete')
ORDER BY
    CASE m.conflicts_status
        WHEN 'conflict' THEN 1
        WHEN 'potential' THEN 2
        WHEN 'not_run' THEN 3
        ELSE 4
    END,
    m.created_at DESC;


-- =============================================================================
-- RETAINER STATUS VIEW
-- Track retainer payments and firm capacity status
-- =============================================================================

CREATE OR REPLACE VIEW v_retainer_status AS
SELECT
    f.id as firm_id,
    f.firm_name,
    f.status as firm_status,
    f.retainer_amount,
    f.retainer_due_day,
    f.active_capacity,
    f.billing_email,

    -- Last retainer billable
    (SELECT MAX(billable_date)
     FROM billables b
     WHERE b.firm_id = f.id AND b.billable_type = 'retainer') as last_retainer_date,

    -- Last retainer invoice paid
    (SELECT MAX(i.paid_at)
     FROM invoices i
     JOIN billables b ON b.invoice_id = i.id
     WHERE b.firm_id = f.id AND b.billable_type = 'retainer' AND i.status = 'paid') as last_retainer_paid,

    -- Active matters count
    (SELECT COUNT(*) FROM matters m WHERE m.firm_id = f.id AND m.status_stage NOT IN ('complete', 'paused_ar')) as active_matters_count,

    -- Is retainer due this month
    CASE
        WHEN f.retainer_due_day <= EXTRACT(DAY FROM CURRENT_DATE)
             AND NOT EXISTS (
                 SELECT 1 FROM billables b
                 WHERE b.firm_id = f.id
                 AND b.billable_type = 'retainer'
                 AND b.billable_date >= date_trunc('month', CURRENT_DATE)
             )
        THEN true
        ELSE false
    END as retainer_due_now

FROM firms f
WHERE f.status = 'active'
ORDER BY f.active_capacity, f.firm_name;


-- =============================================================================
-- INVOICE LINE ITEMS VIEW
-- Detailed view for invoice generation with proper descriptions
-- =============================================================================

CREATE OR REPLACE VIEW v_invoice_line_items AS
SELECT
    b.id as billable_id,
    b.firm_id,
    f.firm_name,
    b.matter_id,
    m.matter_name,
    b.billable_type,
    b.amount,
    b.quantity,
    b.unit,
    b.approved,
    b.billable_date,
    b.invoice_id,

    -- Generate proper Stripe-friendly description
    CASE b.billable_type
        WHEN 'ch7' THEN 'Ch 7 Petition Prep – [Matter: ' || COALESCE(m.matter_name, 'N/A') || '] – Delivered ' || to_char(b.billable_date, 'YYYY-MM-DD')
        WHEN 'ch13' THEN 'Ch 13 Petition Prep – [Matter: ' || COALESCE(m.matter_name, 'N/A') || '] – Delivered ' || to_char(b.billable_date, 'YYYY-MM-DD')
        WHEN 'amendment' THEN 'Amendment/Modification – [Matter: ' || COALESCE(m.matter_name, 'N/A') || '] – Delivered ' || to_char(b.billable_date, 'YYYY-MM-DD')
        WHEN 'rush' THEN 'Rush Fee (24-48 hrs) – [Matter: ' || COALESCE(m.matter_name, 'N/A') || '] – Authorized'
        WHEN 'overage' THEN 'Overage (Out of Scope) – ' || b.quantity || ' hrs @ $' || b.amount || '/hr – [Matter: ' || COALESCE(m.matter_name, 'N/A') || '] – Approved'
        WHEN 'retainer' THEN 'Monthly Retainer – ' || to_char(b.billable_date, 'Month YYYY')
        ELSE b.description
    END as line_description,

    -- Line total
    (b.amount * b.quantity) as line_total

FROM billables b
JOIN firms f ON b.firm_id = f.id
LEFT JOIN matters m ON b.matter_id = m.id
WHERE b.approved = true
ORDER BY b.firm_id, b.billable_date, b.billable_type;


-- =============================================================================
-- UNINVOICED BILLABLES VIEW
-- Billables ready for Friday invoice run
-- =============================================================================

CREATE OR REPLACE VIEW v_uninvoiced_billables AS
SELECT
    b.firm_id,
    f.firm_name,
    f.billing_email,
    COUNT(*) as line_item_count,
    SUM(b.amount * b.quantity) as total_amount,
    MIN(b.billable_date) as earliest_date,
    MAX(b.billable_date) as latest_date,
    array_agg(DISTINCT b.billable_type) as billable_types

FROM billables b
JOIN firms f ON b.firm_id = f.id
WHERE b.invoice_id IS NULL
  AND b.approved = true
GROUP BY b.firm_id, f.firm_name, f.billing_email
HAVING SUM(b.amount * b.quantity) > 0
ORDER BY f.firm_name;


-- =============================================================================
-- EFFECTIVE HOURLY RATE VIEW
-- Calculate effective hourly rate by matter (requires time logging)
-- =============================================================================

CREATE OR REPLACE VIEW v_effective_hourly_rate AS
SELECT
    m.id as matter_id,
    m.matter_name,
    m.case_type,
    f.firm_name,

    -- Total time logged
    COALESCE(SUM(tl.minutes), 0) as total_minutes,
    ROUND(COALESCE(SUM(tl.minutes), 0) / 60.0, 2) as total_hours,

    -- Total billed
    COALESCE((SELECT SUM(amount * quantity) FROM billables b WHERE b.matter_id = m.id AND b.approved = true), 0) as total_billed,

    -- Effective hourly rate
    CASE
        WHEN COALESCE(SUM(tl.minutes), 0) > 0 THEN
            ROUND(
                (SELECT SUM(amount * quantity) FROM billables b WHERE b.matter_id = m.id AND b.approved = true)::numeric
                / (SUM(tl.minutes)::numeric / 60),
            2)
        ELSE NULL
    END as effective_hourly_rate

FROM matters m
JOIN firms f ON m.firm_id = f.id
LEFT JOIN time_logs tl ON tl.matter_id = m.id
WHERE m.status_stage = 'complete'
GROUP BY m.id, m.matter_name, m.case_type, f.firm_name
ORDER BY effective_hourly_rate DESC NULLS LAST;


-- =============================================================================
-- DASHBOARD QUEUE COUNTS VIEW
-- Simple counts for dashboard tiles
-- =============================================================================

CREATE OR REPLACE VIEW v_dashboard_queue_counts AS
SELECT
    status_stage,
    COUNT(*) as count,
    COUNT(CASE WHEN rush = true THEN 1 END) as rush_count,
    COUNT(CASE WHEN deadline < CURRENT_DATE THEN 1 END) as overdue_count
FROM matters
WHERE status_stage NOT IN ('complete')
GROUP BY status_stage
ORDER BY
    CASE status_stage
        WHEN 'assigned' THEN 1
        WHEN 'waiting_inputs' THEN 2
        WHEN 'conflicts_review' THEN 3
        WHEN 'in_progress' THEN 4
        WHEN 'qc' THEN 5
        WHEN 'delivered' THEN 6
        WHEN 'revision' THEN 7
        WHEN 'paused_ar' THEN 8
        ELSE 9
    END;


-- =============================================================================
-- MONTHLY FINANCIAL SUMMARY VIEW
-- Financial metrics by month
-- =============================================================================

CREATE OR REPLACE VIEW v_monthly_financial_summary AS
SELECT
    date_trunc('month', i.invoice_date)::date as month,
    COUNT(DISTINCT i.id) as invoices_sent,
    COUNT(DISTINCT CASE WHEN i.status = 'paid' THEN i.id END) as invoices_paid,
    SUM(i.total) as total_invoiced,
    SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) as total_collected,
    SUM(CASE WHEN i.status IN ('sent', 'overdue') THEN i.total ELSE 0 END) as total_outstanding,

    -- Collection rate
    ROUND(
        CASE WHEN SUM(i.total) > 0 THEN
            (SUM(CASE WHEN i.status = 'paid' THEN i.total ELSE 0 END) / SUM(i.total)) * 100
        ELSE 0 END,
    1) as collection_rate_percent

FROM invoices i
WHERE i.invoice_date >= date_trunc('year', CURRENT_DATE)
GROUP BY date_trunc('month', i.invoice_date)
ORDER BY month DESC;
