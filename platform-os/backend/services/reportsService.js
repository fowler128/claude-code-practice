/**
 * Reports Service
 * 4 operational reports optimized for <300ms performance on 100k tasks
 * NO vanity analytics — operational control only
 */

class ReportsService {
  constructor(db) {
    this.db = db;
  }

  /**
   * 1) Queue Pressure Report
   * Daily operations control panel
   */
  async getQueueReport() {
    const startTime = Date.now();

    try {
      // Tasks due today / overdue by role
      const tasksResult = await this.db.query(`
        SELECT
          assigned_role,
          COUNT(*) FILTER (WHERE status IN ('pending','in_progress') AND due_date < NOW()) AS overdue_tasks,
          COUNT(*) FILTER (WHERE status IN ('pending','in_progress') AND due_date::date = CURRENT_DATE) AS due_today,
          COUNT(*) FILTER (WHERE status IN ('pending','in_progress') AND due_date BETWEEN NOW() AND NOW() + INTERVAL '7 days') AS due_next_7_days
        FROM tasks
        WHERE status IN ('pending', 'in_progress')
        GROUP BY assigned_role
        ORDER BY overdue_tasks DESC
      `);

      // Matters by risk tier
      const mattersResult = await this.db.query(`
        SELECT
          health_risk_tier,
          COUNT(*) AS matter_count
        FROM matters
        WHERE is_archived = false
        GROUP BY health_risk_tier
        ORDER BY
          CASE health_risk_tier
            WHEN 'high' THEN 1
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 3
          END
      `);

      // SLA breaches
      const slaResult = await this.db.query(`
        SELECT COUNT(*) AS sla_breaches
        FROM matters
        WHERE sla_breach_at IS NOT NULL
        AND closed_at IS NULL
      `);

      const executionTime = Date.now() - startTime;

      return {
        tasksByRole: tasksResult.rows,
        mattersByRisk: mattersResult.rows,
        slaBreaches: parseInt(slaResult.rows[0]?.sla_breaches || 0),
        summary: {
          totalOverdue: tasksResult.rows.reduce((sum, r) => sum + parseInt(r.overdue_tasks || 0), 0),
          totalDueToday: tasksResult.rows.reduce((sum, r) => sum + parseInt(r.due_today || 0), 0),
          totalDueWeek: tasksResult.rows.reduce((sum, r) => sum + parseInt(r.due_next_7_days || 0), 0),
          highRiskMatters: mattersResult.rows.find(r => r.health_risk_tier === 'high')?.matter_count || 0
        },
        executionTimeMs: executionTime,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Reports] Queue report error:', error);
      throw error;
    }
  }

  /**
   * 2) Cycle Time Report
   * Proves workflows work, identifies bottlenecks
   */
  async getCycleTimeReport() {
    const startTime = Date.now();

    try {
      // Average time spent in each status (hours)
      const statusDurationResult = await this.db.query(`
        WITH ordered_events AS (
          SELECT
            matter_id,
            new_value->>'status' AS status,
            created_at,
            LEAD(created_at) OVER (PARTITION BY matter_id ORDER BY created_at) AS next_time
          FROM events
          WHERE event_type = 'status_change'
            AND new_value->>'status' IS NOT NULL
        )
        SELECT
          status,
          COUNT(*) as status_count,
          ROUND(AVG(EXTRACT(EPOCH FROM (next_time - created_at)) / 3600), 2) AS avg_hours_in_status,
          ROUND(MIN(EXTRACT(EPOCH FROM (next_time - created_at)) / 3600), 2) AS min_hours,
          ROUND(MAX(EXTRACT(EPOCH FROM (next_time - created_at)) / 3600), 2) AS max_hours
        FROM ordered_events
        WHERE next_time IS NOT NULL
        GROUP BY status
        ORDER BY avg_hours_in_status DESC
        LIMIT 20
      `);

      // Total matter duration (open to close) by practice area
      const matterDurationResult = await this.db.query(`
        SELECT
          pa.name as practice_area,
          mt.name as matter_type,
          COUNT(*) as closed_count,
          ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - opened_at)) / 3600), 2) AS avg_total_hours,
          ROUND(MIN(EXTRACT(EPOCH FROM (closed_at - opened_at)) / 3600), 2) AS min_hours,
          ROUND(MAX(EXTRACT(EPOCH FROM (closed_at - opened_at)) / 3600), 2) AS max_hours
        FROM matters m
        JOIN practice_areas pa ON m.practice_area_id = pa.id
        JOIN matter_types mt ON m.matter_type_id = mt.id
        WHERE m.closed_at IS NOT NULL
          AND m.closed_at > NOW() - INTERVAL '90 days'
        GROUP BY pa.name, mt.name
        ORDER BY avg_total_hours DESC
      `);

      // Overall velocity metrics
      const velocityResult = await this.db.query(`
        SELECT
          COUNT(*) FILTER (WHERE closed_at IS NOT NULL AND closed_at > NOW() - INTERVAL '30 days') as closed_last_30_days,
          COUNT(*) FILTER (WHERE opened_at > NOW() - INTERVAL '30 days') as opened_last_30_days,
          ROUND(AVG(EXTRACT(EPOCH FROM (closed_at - opened_at)) / 86400), 1) as avg_days_to_close
        FROM matters
        WHERE closed_at IS NOT NULL
          AND closed_at > NOW() - INTERVAL '90 days'
      `);

      const executionTime = Date.now() - startTime;

      return {
        statusDurations: statusDurationResult.rows,
        matterDurations: matterDurationResult.rows,
        velocity: velocityResult.rows[0],
        bottlenecks: statusDurationResult.rows.slice(0, 5).map(s => ({
          status: s.status,
          avgHours: parseFloat(s.avg_hours_in_status),
          impact: s.avg_hours_in_status > 48 ? 'high' : s.avg_hours_in_status > 24 ? 'medium' : 'low'
        })),
        executionTimeMs: executionTime,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Reports] Cycle time report error:', error);
      throw error;
    }
  }

  /**
   * 3) Defect / Rework Report
   * Find training issues, bad templates, attorney bottlenecks
   */
  async getDefectsReport() {
    const startTime = Date.now();

    try {
      // Defects by reason
      const defectReasonsResult = await this.db.query(`
        SELECT
          dr.name,
          dr.severity,
          COUNT(*) AS occurrences
        FROM artifacts a
        JOIN defect_reasons dr ON a.defect_reason_id = dr.id
        WHERE a.defect_reason_id IS NOT NULL
          AND a.created_at > NOW() - INTERVAL '90 days'
        GROUP BY dr.name, dr.severity
        ORDER BY occurrences DESC
        LIMIT 20
      `);

      // Corrections per matter type
      const correctionsResult = await this.db.query(`
        SELECT
          pa.name as practice_area,
          mt.name as matter_type,
          COUNT(*) as matter_count,
          ROUND(AVG(m.defect_count), 2) AS avg_defects,
          COUNT(*) FILTER (WHERE m.defect_count >= 2) as matters_with_multiple_defects
        FROM matters m
        JOIN practice_areas pa ON m.practice_area_id = pa.id
        JOIN matter_types mt ON m.matter_type_id = mt.id
        WHERE m.created_at > NOW() - INTERVAL '90 days'
        GROUP BY pa.name, mt.name
        HAVING AVG(m.defect_count) > 0
        ORDER BY avg_defects DESC
      `);

      // Returned for corrections frequency
      const returnFrequencyResult = await this.db.query(`
        SELECT
          DATE_TRUNC('week', created_at) as week,
          COUNT(*) AS returned_cases
        FROM events
        WHERE event_type = 'status_change'
          AND new_value->>'status' = 'returned_for_corrections'
          AND created_at > NOW() - INTERVAL '90 days'
        GROUP BY week
        ORDER BY week DESC
      `);

      // Overall defect rate
      const defectRateResult = await this.db.query(`
        SELECT
          COUNT(*) as total_matters,
          COUNT(*) FILTER (WHERE defect_count > 0) as matters_with_defects,
          ROUND(
            COUNT(*) FILTER (WHERE defect_count > 0)::decimal /
            NULLIF(COUNT(*), 0) * 100, 2
          ) AS defect_rate_pct,
          SUM(defect_count) as total_defects,
          ROUND(AVG(defect_count), 2) as avg_defects_per_matter
        FROM matters
        WHERE created_at > NOW() - INTERVAL '90 days'
      `);

      const executionTime = Date.now() - startTime;

      return {
        defectsByReason: defectReasonsResult.rows,
        correctionsByType: correctionsResult.rows,
        returnTrend: returnFrequencyResult.rows,
        summary: defectRateResult.rows[0],
        topIssues: defectReasonsResult.rows.slice(0, 5).map(d => ({
          reason: d.name,
          severity: d.severity,
          count: parseInt(d.occurrences)
        })),
        executionTimeMs: executionTime,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Reports] Defects report error:', error);
      throw error;
    }
  }

  /**
   * 4) Lead Funnel Report
   * Sales visibility without complex CRM analytics
   */
  async getLeadsReport() {
    const startTime = Date.now();

    try {
      // Leads by status
      const statusResult = await this.db.query(`
        SELECT
          status,
          COUNT(*) AS leads,
          ROUND(AVG(lead_score), 1) as avg_lead_score
        FROM leads
        WHERE created_at > NOW() - INTERVAL '90 days'
        GROUP BY status
        ORDER BY
          CASE status
            WHEN 'new' THEN 1
            WHEN 'contacted' THEN 2
            WHEN 'qualified' THEN 3
            WHEN 'proposal' THEN 4
            WHEN 'negotiation' THEN 5
            WHEN 'won' THEN 6
            WHEN 'lost' THEN 7
            WHEN 'nurture' THEN 8
          END
      `);

      // Conversion to matters
      const conversionResult = await this.db.query(`
        SELECT
          COUNT(*) FILTER (WHERE converted_to_matter_id IS NOT NULL) AS converted,
          COUNT(*) AS total,
          ROUND(
            COUNT(*) FILTER (WHERE converted_to_matter_id IS NOT NULL)::decimal /
            NULLIF(COUNT(*),0) * 100, 2
          ) AS conversion_rate_pct,
          ROUND(AVG(estimated_value), 2) as avg_estimated_value,
          ROUND(SUM(actual_value), 2) as total_revenue
        FROM leads
        WHERE created_at > NOW() - INTERVAL '90 days'
      `);

      // Lead source performance
      const sourceResult = await this.db.query(`
        SELECT
          source,
          COUNT(*) as lead_count,
          COUNT(*) FILTER (WHERE status = 'won') as won_count,
          ROUND(
            COUNT(*) FILTER (WHERE status = 'won')::decimal /
            NULLIF(COUNT(*), 0) * 100, 2
          ) as win_rate_pct,
          ROUND(AVG(lead_score), 1) as avg_lead_score
        FROM leads
        WHERE created_at > NOW() - INTERVAL '90 days'
          AND source IS NOT NULL
        GROUP BY source
        ORDER BY lead_count DESC
        LIMIT 10
      `);

      // Lead velocity
      const velocityResult = await this.db.query(`
        SELECT
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_last_7_days,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_last_30_days,
          COUNT(*) FILTER (WHERE status = 'won' AND updated_at > NOW() - INTERVAL '30 days') as won_last_30_days,
          ROUND(
            AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)
            FILTER (WHERE status = 'won'), 1
          ) as avg_days_to_win
        FROM leads
        WHERE created_at > NOW() - INTERVAL '90 days'
      `);

      const executionTime = Date.now() - startTime;

      return {
        leadsByStatus: statusResult.rows,
        conversion: conversionResult.rows[0],
        leadSources: sourceResult.rows,
        velocity: velocityResult.rows[0],
        funnel: {
          stages: statusResult.rows.map(s => ({
            stage: s.status,
            count: parseInt(s.leads),
            avgScore: parseFloat(s.avg_lead_score)
          })),
          conversionRate: parseFloat(conversionResult.rows[0]?.conversion_rate_pct || 0)
        },
        executionTimeMs: executionTime,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Reports] Leads report error:', error);
      throw error;
    }
  }

  /**
   * Get all reports at once (for dashboard)
   */
  async getAllReports() {
    const startTime = Date.now();

    try {
      const [queue, cycleTime, defects, leads] = await Promise.all([
        this.getQueueReport(),
        this.getCycleTimeReport(),
        this.getDefectsReport(),
        this.getLeadsReport()
      ]);

      const executionTime = Date.now() - startTime;

      return {
        queue,
        cycleTime,
        defects,
        leads,
        totalExecutionTimeMs: executionTime,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('[Reports] All reports error:', error);
      throw error;
    }
  }

  /**
   * Performance check - ensure queries run < 300ms
   */
  async checkPerformance() {
    const results = {
      queue: { target: 300, actual: 0, pass: false },
      cycleTime: { target: 300, actual: 0, pass: false },
      defects: { target: 300, actual: 0, pass: false },
      leads: { target: 300, actual: 0, pass: false }
    };

    // Test each report
    const queueStart = Date.now();
    await this.getQueueReport();
    results.queue.actual = Date.now() - queueStart;
    results.queue.pass = results.queue.actual < results.queue.target;

    const cycleTimeStart = Date.now();
    await this.getCycleTimeReport();
    results.cycleTime.actual = Date.now() - cycleTimeStart;
    results.cycleTime.pass = results.cycleTime.actual < results.cycleTime.target;

    const defectsStart = Date.now();
    await this.getDefectsReport();
    results.defects.actual = Date.now() - defectsStart;
    results.defects.pass = results.defects.actual < results.defects.target;

    const leadsStart = Date.now();
    await this.getLeadsReport();
    results.leads.actual = Date.now() - leadsStart;
    results.leads.pass = results.leads.actual < results.leads.target;

    const allPass = Object.values(results).every(r => r.pass);

    return {
      results,
      allPass,
      summary: `${Object.values(results).filter(r => r.pass).length}/4 reports under 300ms`,
      checkedAt: new Date().toISOString()
    };
  }
}

module.exports = { ReportsService };
