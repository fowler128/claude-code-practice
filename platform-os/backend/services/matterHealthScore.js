/**
 * Matter Health Score Calculator
 * Rules-based scoring system with explainable drivers
 *
 * Score range: 0-100
 * Risk tiers:
 *  - 80-100: Low
 *  - 60-79: Medium
 *  - 0-59: High/Critical
 */

class MatterHealthScoreCalculator {
  constructor(matter, tasks, artifacts, playbook) {
    this.matter = matter;
    this.tasks = tasks;
    this.artifacts = artifacts;
    this.playbook = playbook;
    this.drivers = [];
    this.score = 100; // Start with perfect score
  }

  /**
   * Calculate health score and return top 3 drivers
   */
  calculate() {
    this.score = 100;
    this.drivers = [];

    // Apply all scoring rules
    this.checkConflicts();
    this.checkEngagement();
    this.checkPayment();
    this.checkMissingArtifacts();
    this.checkSLAStatus();
    this.checkDefectCount();
    this.checkIssueStatuses();

    // Sort drivers by impact (descending) and take top 3
    const topDrivers = this.drivers
      .sort((a, b) => b.impact - a.impact)
      .slice(0, 3)
      .map(d => ({
        description: d.description,
        impact: d.impact,
        recommendation: d.recommendation
      }));

    // Determine risk tier
    const riskTier = this.getRiskTier(this.score);

    return {
      score: Math.max(0, this.score),
      riskTier,
      drivers: topDrivers,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Check if conflicts cleared after intake complete
   */
  checkConflicts() {
    const intakeStatuses = ['intake_complete', 'conflicts_pending'];
    const conflictsClearStatuses = ['conflicts_clear', 'engagement_sent', 'engagement_signed'];

    if (intakeStatuses.includes(this.matter.current_status)) {
      // Matter is in intake but conflicts not cleared
      const hasConflictsTask = this.tasks.find(t =>
        t.title?.toLowerCase().includes('conflicts') &&
        t.status !== 'completed'
      );

      if (hasConflictsTask) {
        this.applyPenalty(
          20,
          'Conflicts check not completed after intake',
          'Complete conflicts check immediately to proceed with engagement'
        );
      }
    }
  }

  /**
   * Check if engagement letter signed
   */
  checkEngagement() {
    const requiresEngagement = !['new', 'intake_complete', 'conflicts_pending', 'conflicts_clear'].includes(this.matter.current_status);

    if (requiresEngagement) {
      const hasSignedEngagement = this.artifacts.find(a =>
        a.artifact_type_code === 'ENGAGEMENT_SIGNED' &&
        a.status === 'validated'
      );

      if (!hasSignedEngagement) {
        this.applyPenalty(
          15,
          'Engagement letter not signed',
          'Obtain signed engagement letter before proceeding with work'
        );
      }
    }
  }

  /**
   * Check if payment/retainer received
   */
  checkPayment() {
    const requiresPayment = !['new', 'intake_complete', 'conflicts_pending', 'conflicts_clear', 'engagement_sent'].includes(this.matter.current_status);

    if (requiresPayment) {
      const hasPayment = this.artifacts.find(a =>
        a.artifact_type_code === 'PAYMENT_CONFIRMATION' &&
        a.status === 'validated'
      );

      if (!hasPayment) {
        this.applyPenalty(
          15,
          'Payment/retainer not received',
          'Collect retainer payment before starting substantive work'
        );
      }
    }
  }

  /**
   * Check for missing required artifacts
   */
  checkMissingArtifacts() {
    if (!this.playbook || !this.playbook.required_artifacts) {
      return;
    }

    // Get required artifacts for current status
    const requiredForCurrentStatus = this.playbook.required_artifacts.filter(ra =>
      ra.required_at_status.includes(this.matter.current_status)
    );

    const missingArtifacts = requiredForCurrentStatus.filter(required => {
      const hasArtifact = this.artifacts.find(a =>
        a.artifact_type_code === required.artifact_type &&
        ['received', 'validated'].includes(a.status)
      );
      return !hasArtifact;
    });

    if (missingArtifacts.length > 0) {
      const penalty = Math.min(10 * missingArtifacts.length, 40); // Cap at -40
      const artifactNames = missingArtifacts.map(a => a.artifact_type).join(', ');

      this.applyPenalty(
        penalty,
        `Missing ${missingArtifacts.length} required artifact(s): ${artifactNames}`,
        'Upload required documents to proceed without delays'
      );
    }
  }

  /**
   * Check if current status aging exceeds SLA
   */
  checkSLAStatus() {
    if (!this.playbook || !this.playbook.statuses) {
      return;
    }

    const currentStatusDef = this.playbook.statuses.find(s =>
      s.id === this.matter.current_status
    );

    if (!currentStatusDef || !currentStatusDef.sla_hours) {
      return;
    }

    const statusChangedAt = new Date(this.matter.status_changed_at);
    const now = new Date();
    const hoursInStatus = (now - statusChangedAt) / (1000 * 60 * 60);

    if (hoursInStatus > currentStatusDef.sla_hours) {
      const daysOverdue = Math.round((hoursInStatus - currentStatusDef.sla_hours) / 24);

      this.applyPenalty(
        10,
        `Status aging exceeds SLA by ${daysOverdue} day(s)`,
        `Take action to advance matter from "${currentStatusDef.name}" status`
      );
    }
  }

  /**
   * Check defect count
   */
  checkDefectCount() {
    if (this.matter.defect_count >= 2) {
      this.applyPenalty(
        15,
        `High defect count: ${this.matter.defect_count} corrections required`,
        'Implement additional QC checks to reduce rework'
      );
    }
  }

  /**
   * Check for issue/rejected/returned statuses
   */
  checkIssueStatuses() {
    const issueKeywords = ['issue', 'rejected', 'returned', 'denied'];
    const hasIssue = issueKeywords.some(keyword =>
      this.matter.current_status.toLowerCase().includes(keyword)
    );

    if (hasIssue) {
      this.applyPenalty(
        25,
        'Matter in issue/rejection status requiring immediate attention',
        'Review rejection/issue details and develop resolution plan'
      );
    }
  }

  /**
   * Apply a penalty and record the driver
   */
  applyPenalty(points, description, recommendation) {
    this.score -= points;
    this.drivers.push({
      impact: points,
      description,
      recommendation,
      type: 'negative'
    });
  }

  /**
   * Determine risk tier based on score
   */
  getRiskTier(score) {
    if (score >= 80) return 'low';
    if (score >= 60) return 'medium';
    return 'high';
  }
}

/**
 * Calculate matter health score
 *
 * @param {Object} matter - Matter record with status and counts
 * @param {Array} tasks - All tasks for the matter
 * @param {Array} artifacts - All artifacts for the matter
 * @param {Object} playbook - Playbook template configuration
 * @returns {Object} Score, risk tier, and top 3 drivers
 */
function calculateMatterHealthScore(matter, tasks, artifacts, playbook) {
  const calculator = new MatterHealthScoreCalculator(matter, tasks, artifacts, playbook);
  return calculator.calculate();
}

module.exports = {
  MatterHealthScoreCalculator,
  calculateMatterHealthScore
};
