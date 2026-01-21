/**
 * BizDeedz AI Readiness Audit - Lead Scoring Engine
 * Google Apps Script Backend
 *
 * This script:
 * - Receives form submissions via webhook
 * - Calculates lead score (0-100) and assigns tier (HIGH/MEDIUM/LOW)
 * - Logs to Google Sheet
 * - Sends email notifications to info@bizdeedz.com and jessa@biz deedz.com
 * - Logs to Notion database
 * - Commits JSON to GitHub
 *
 * SETUP INSTRUCTIONS: See SETUP_GOOGLE_APPS_SCRIPT_DETAILED.md
 */

// ============================================================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================================================

const CONFIG = {
  // Email Configuration
  emailRecipients: ['info@bizdeedz.com', 'jessa@bizdeedz.com'],
  emailFromName: 'BizDeedz AI Audit System',

  // Google Sheet Configuration
  spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE', // Replace with your Google Sheet ID
  sheetNames: {
    all: 'All Leads',
    high: 'HIGH Priority',
    medium: 'MEDIUM Priority',
    low: 'LOW Priority'
  },

  // Notion Configuration
  notionApiKey: 'YOUR_NOTION_API_KEY_HERE', // Replace with your Notion integration token
  notionDatabaseId: 'YOUR_NOTION_DATABASE_ID_HERE', // Replace with database ID

  // GitHub Configuration
  githubToken: 'YOUR_GITHUB_TOKEN_HERE', // Replace with GitHub personal access token
  githubRepo: 'YOUR_USERNAME/YOUR_REPO', // Replace with your repo (e.g., 'bizdeedz/leads')
  githubBranch: 'main', // Branch to commit to

  // Scoring Thresholds
  thresholds: {
    high: 75,    // 75+ = HIGH tier
    medium: 50   // 50-74 = MEDIUM, <50 = LOW
  }
};

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

/**
 * Main entry point for POST requests from the form
 */
function doPost(e) {
  try {
    // Parse incoming data
    const data = JSON.parse(e.postData.contents);

    // Add metadata
    data.submitted_at = new Date().toISOString();
    data.form_version = '1.0';

    // Calculate lead score and tier
    const scoring = calculateLeadScore(data);
    data.lead_score = scoring.score;
    data.lead_tier = scoring.tier;
    data.score_breakdown = scoring.breakdown;

    // Log to Google Sheet
    logToGoogleSheet(data);

    // Send email notifications
    sendEmailNotifications(data);

    // Log to Notion (async, don't wait)
    try {
      logToNotion(data);
    } catch (notionError) {
      Logger.log('Notion logging failed: ' + notionError);
      // Continue anyway
    }

    // Commit to GitHub (async, don't wait)
    try {
      commitToGitHub(data);
    } catch (githubError) {
      Logger.log('GitHub commit failed: ' + githubError);
      // Continue anyway
    }

    // Return success
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        lead_score: data.lead_score,
        lead_tier: data.lead_tier,
        message: 'Lead processed successfully'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log('Error processing submission: ' + error);

    // Return error but don't expose details to client
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: 'Submission received but processing encountered an issue'
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// LEAD SCORING ALGORITHM
// ============================================================================

/**
 * Calculate lead score based on form responses
 * Returns: {score: number, tier: string, breakdown: object}
 */
function calculateLeadScore(data) {
  let score = 0;
  const breakdown = {};

  // 1. DATA QUALITY SCORE (0-20 points)
  let dataScore = 0;
  switch (data.data_quality) {
    case 'clean':
      dataScore = 20;
      break;
    case 'mixed':
      dataScore = 12;
      break;
    case 'chaotic':
      dataScore = 5;
      break;
    case 'unsure':
      dataScore = 8;
      break;
    default:
      dataScore = 0;
  }
  breakdown.data_quality = dataScore;
  score += dataScore;

  // 2. AI READINESS SCORE (0-20 points)
  let aiReadinessScore = 0;
  switch (data.ai_experience) {
    case 'advanced':
      aiReadinessScore = 20;
      break;
    case 'moderate':
      aiReadinessScore = 15;
      break;
    case 'basic':
      aiReadinessScore = 10;
      break;
    case 'none':
      aiReadinessScore = 5;
      break;
    default:
      aiReadinessScore = 0;
  }
  breakdown.ai_readiness = aiReadinessScore;
  score += aiReadinessScore;

  // 3. TIMELINE/URGENCY SCORE (0-20 points)
  let timelineScore = 0;
  switch (data.timeline) {
    case 'asap':
      timelineScore = 20;
      break;
    case '1-month':
      timelineScore = 15;
      break;
    case '1-3-months':
      timelineScore = 10;
      break;
    case 'exploring':
      timelineScore = 3;
      break;
    default:
      timelineScore = 0;
  }
  breakdown.timeline = timelineScore;
  score += timelineScore;

  // 4. BUDGET SCORE (0-25 points)
  let budgetScore = 0;
  switch (data.budget_range) {
    case '10000+':
      budgetScore = 25;
      break;
    case '5000-10000':
      budgetScore = 20;
      break;
    case '2500-5000':
      budgetScore = 15;
      break;
    case '1000-2500':
      budgetScore = 10;
      break;
    case 'under-1000':
      budgetScore = 5;
      break;
    default:
      budgetScore = 0;
  }

  // Budget allocation bonus (+5)
  if (data.budget_allocated === 'yes-approved') {
    budgetScore += 5;
  }

  budgetScore = Math.min(budgetScore, 25); // Cap at 25
  breakdown.budget = budgetScore;
  score += budgetScore;

  // 5. DECISION AUTHORITY SCORE (0-15 points)
  let authorityScore = 0;
  switch (data.decision_maker) {
    case 'yes':
      authorityScore = 15;
      break;
    case 'influence':
      authorityScore = 12;
      break;
    case 'team-decision':
      authorityScore = 8;
      break;
    case 'recommend':
      authorityScore = 4;
      break;
    default:
      authorityScore = 0;
  }
  breakdown.authority = authorityScore;
  score += authorityScore;

  // 6. BONUS POINTS (0-15 points)
  let bonusPoints = 0;

  // Process documentation bonus (+5)
  if (data.process_documentation === 'fully' || data.process_documentation === 'partially') {
    bonusPoints += 5;
  }

  // High pain level bonus (+5)
  if (data.hours_wasted === '40+' || data.hours_wasted === '20-40') {
    bonusPoints += 5;
  }

  // Company size bonus (+3 for large, +2 for medium)
  if (data.company_size === '201-500' || data.company_size === '500+') {
    bonusPoints += 3;
  } else if (data.company_size === '51-200') {
    bonusPoints += 2;
  }

  breakdown.bonus = bonusPoints;
  score += bonusPoints;

  // Determine tier
  let tier = 'LOW';

  // HIGH tier criteria
  if (score >= CONFIG.thresholds.high) {
    tier = 'HIGH';
  }
  // Composite criteria for HIGH even if score is lower
  else if (
    (data.data_quality === 'clean' || data.data_quality === 'mixed') &&
    (data.ai_experience === 'advanced' || data.ai_experience === 'moderate') &&
    (data.timeline === 'asap' || data.timeline === '1-month') &&
    (data.budget_range === '2500-5000' || data.budget_range === '5000-10000' || data.budget_range === '10000+')
  ) {
    tier = 'HIGH';
    score = Math.max(score, CONFIG.thresholds.high); // Bump score to minimum HIGH
  }
  // MEDIUM tier criteria
  else if (score >= CONFIG.thresholds.medium) {
    tier = 'MEDIUM';
  }
  // Composite criteria for MEDIUM
  else if (
    data.budget_range !== 'under-1000' &&
    data.timeline !== 'exploring' &&
    data.challenges && data.challenges.length >= 3
  ) {
    tier = 'MEDIUM';
    score = Math.max(score, CONFIG.thresholds.medium);
  }

  return {
    score: Math.round(score),
    tier: tier,
    breakdown: breakdown
  };
}

// ============================================================================
// GOOGLE SHEET INTEGRATION
// ============================================================================

/**
 * Log lead data to Google Sheet
 */
function logToGoogleSheet(data) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);

    // Prepare row data
    const rowData = [
      data.submitted_at,
      data.lead_score,
      data.lead_tier,
      data.full_name,
      data.email,
      data.company_name,
      data.job_title,
      data.company_size,
      data.industry,
      data.website_url || '',
      data.phone || '',
      data.preferred_contact,
      Array.isArray(data.challenges) ? data.challenges.join('; ') : '',
      data.tools_used,
      data.data_quality,
      data.process_documentation,
      data.hours_wasted,
      data.ai_experience,
      data.ai_tools_current || '',
      Array.isArray(data.automation_goals) ? data.automation_goals.join('; ') : '',
      data.biggest_bottleneck,
      Array.isArray(data.ai_concerns) ? data.ai_concerns.join('; ') : '',
      data.timeline,
      data.decision_maker,
      data.budget_allocated,
      data.budget_range,
      data.roi_timeframe,
      data.success_metric,
      data.hear_about || '',
      data.additional_context || '',
      data.utm_params ? data.utm_params.utm_source || '' : '',
      data.utm_params ? data.utm_params.utm_medium || '' : '',
      data.utm_params ? data.utm_params.utm_campaign || '' : '',
      data.utm_params ? data.utm_params.referrer || '' : ''
    ];

    // Add to "All Leads" sheet
    const allLeadsSheet = ss.getSheetByName(CONFIG.sheetNames.all);
    if (allLeadsSheet) {
      allLeadsSheet.appendRow(rowData);
    }

    // Add to tier-specific sheet
    let tierSheetName;
    switch (data.lead_tier) {
      case 'HIGH':
        tierSheetName = CONFIG.sheetNames.high;
        break;
      case 'MEDIUM':
        tierSheetName = CONFIG.sheetNames.medium;
        break;
      case 'LOW':
        tierSheetName = CONFIG.sheetNames.low;
        break;
    }

    if (tierSheetName) {
      const tierSheet = ss.getSheetByName(tierSheetName);
      if (tierSheet) {
        tierSheet.appendRow(rowData);
      }
    }

    Logger.log('Successfully logged to Google Sheet');

  } catch (error) {
    Logger.log('Error logging to Google Sheet: ' + error);
    throw error;
  }
}

// ============================================================================
// EMAIL NOTIFICATIONS
// ============================================================================

/**
 * Send email notifications to team
 */
function sendEmailNotifications(data) {
  try {
    // Only send email for HIGH and MEDIUM tier leads
    if (data.lead_tier === 'LOW') {
      Logger.log('Skipping email for LOW tier lead');
      return;
    }

    const subject = `${data.lead_tier === 'HIGH' ? '🔥' : '⚡'} ${data.lead_tier} Priority Lead: ${data.full_name} from ${data.company_name}`;

    const body = formatEmailBody(data);

    // Send to all recipients
    CONFIG.emailRecipients.forEach(recipient => {
      GmailApp.sendEmail(recipient, subject, body);
    });

    Logger.log('Successfully sent email notifications');

  } catch (error) {
    Logger.log('Error sending email: ' + error);
    throw error;
  }
}

/**
 * Format email body
 */
function formatEmailBody(data) {
  const urgencyMarker = data.lead_tier === 'HIGH' ? '🔥 URGENT 🔥' : '⚡ ACTION NEEDED ⚡';

  return `
${urgencyMarker}

New ${data.lead_tier} priority lead from AI Readiness Audit

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEAD SCORE: ${data.lead_score}/100
TIER: ${data.lead_tier}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CONTACT INFORMATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${data.full_name}
Email: ${data.email}
Company: ${data.company_name} (${data.company_size})
Title: ${data.job_title}
Industry: ${data.industry}
Phone: ${data.phone || 'Not provided'}
Preferred Contact: ${data.preferred_contact}
Website: ${data.website_url || 'Not provided'}

KEY DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Timeline: ${data.timeline}
Budget: ${data.budget_range} (${data.budget_allocated})
Decision Authority: ${data.decision_maker}
Data Quality: ${data.data_quality}
AI Experience: ${data.ai_experience}
Hours Wasted/Week: ${data.hours_wasted}

PAIN POINTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Biggest Bottleneck:
${data.biggest_bottleneck}

Operational Challenges:
${Array.isArray(data.challenges) ? data.challenges.join('\n• ') : 'Not specified'}

Automation Goals:
${Array.isArray(data.automation_goals) ? data.automation_goals.join('\n• ') : 'Not specified'}

TOOLS & SYSTEMS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Current Tools: ${data.tools_used}
Current AI Tools: ${data.ai_tools_current || 'None'}
Process Documentation: ${data.process_documentation}

SUCCESS METRICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.success_metric}
ROI Timeframe: ${data.roi_timeframe}

ADDITIONAL CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.additional_context || 'None provided'}

Heard About Us: ${data.hear_about || 'Not specified'}

UTM PARAMETERS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.utm_params && Object.keys(data.utm_params).length > 0 ?
  Object.entries(data.utm_params).map(([key, value]) => `${key}: ${value}`).join('\n') :
  'None'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.lead_tier === 'HIGH' ?
  `1. Contact within 4 hours
2. Schedule discovery call
3. Prepare customized demo
4. Follow up timeline: ${data.timeline}` :
  `1. Review lead details
2. Add to appropriate nurture sequence
3. Schedule follow-up for next 48 hours
4. Personalize outreach based on pain points`}

View full submission in Google Sheets:
https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetId}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Submitted: ${data.submitted_at}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`.trim();
}

// ============================================================================
// NOTION INTEGRATION
// ============================================================================

/**
 * Log lead to Notion database
 */
function logToNotion(data) {
  if (!CONFIG.notionApiKey || CONFIG.notionApiKey === 'YOUR_NOTION_API_KEY_HERE') {
    Logger.log('Notion not configured, skipping');
    return;
  }

  try {
    const url = 'https://api.notion.com/v1/pages';

    const payload = {
      parent: { database_id: CONFIG.notionDatabaseId },
      properties: {
        'Name': {
          title: [{ text: { content: data.full_name } }]
        },
        'Email': {
          email: data.email
        },
        'Company': {
          rich_text: [{ text: { content: data.company_name } }]
        },
        'Score': {
          number: data.lead_score
        },
        'Tier': {
          select: { name: data.lead_tier }
        },
        'Timeline': {
          select: { name: data.timeline }
        },
        'Budget': {
          select: { name: data.budget_range }
        },
        'Phone': {
          phone_number: data.phone || null
        },
        'Date Submitted': {
          date: { start: data.submitted_at }
        },
        'Biggest Bottleneck': {
          rich_text: [{ text: { content: data.biggest_bottleneck.substring(0, 2000) } }]
        }
      }
    };

    const options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + CONFIG.notionApiKey,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      Logger.log('Successfully logged to Notion');
    } else {
      Logger.log('Notion API error: ' + response.getContentText());
    }

  } catch (error) {
    Logger.log('Error logging to Notion: ' + error);
    // Don't throw - this is not critical
  }
}

// ============================================================================
// GITHUB INTEGRATION
// ============================================================================

/**
 * Commit lead data as JSON to GitHub
 */
function commitToGitHub(data) {
  if (!CONFIG.githubToken || CONFIG.githubToken === 'YOUR_GITHUB_TOKEN_HERE') {
    Logger.log('GitHub not configured, skipping');
    return;
  }

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `lead-${timestamp}-${data.lead_tier}.json`;
    const filePath = `leads/${filename}`;

    // Prepare JSON content (base64 encoded)
    const jsonContent = JSON.stringify(data, null, 2);
    const base64Content = Utilities.base64Encode(jsonContent);

    // GitHub API endpoint
    const url = `https://api.github.com/repos/${CONFIG.githubRepo}/contents/${filePath}`;

    const payload = {
      message: `Add ${data.lead_tier} tier lead: ${data.full_name} from ${data.company_name}`,
      content: base64Content,
      branch: CONFIG.githubBranch
    };

    const options = {
      method: 'put',
      headers: {
        'Authorization': 'token ' + CONFIG.githubToken,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 201) {
      Logger.log('Successfully committed to GitHub');
    } else {
      Logger.log('GitHub API error: ' + response.getContentText());
    }

  } catch (error) {
    Logger.log('Error committing to GitHub: ' + error);
    // Don't throw - this is not critical
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Test function to verify configuration
 */
function testConfiguration() {
  Logger.log('=== Testing Configuration ===');
  Logger.log('Spreadsheet ID: ' + (CONFIG.spreadsheetId !== 'YOUR_SPREADSHEET_ID_HERE' ? '✓ Configured' : '✗ Not configured'));
  Logger.log('Notion API: ' + (CONFIG.notionApiKey !== 'YOUR_NOTION_API_KEY_HERE' ? '✓ Configured' : '✗ Not configured'));
  Logger.log('GitHub Token: ' + (CONFIG.githubToken !== 'YOUR_GITHUB_TOKEN_HERE' ? '✓ Configured' : '✗ Not configured'));
  Logger.log('Email Recipients: ' + CONFIG.emailRecipients.join(', '));
}

/**
 * Test function with sample data
 */
function testWithSampleData() {
  const sampleData = {
    full_name: 'Jane Smith',
    email: 'jane@techcorp.com',
    company_name: 'TechCorp Inc',
    job_title: 'VP Marketing',
    company_size: '51-200',
    industry: 'saas',
    website_url: 'https://techcorp.com',
    phone: '+1-555-123-4567',
    preferred_contact: 'email',
    challenges: ['manual-processes', 'data-chaos', 'lead-follow-up'],
    tools_used: 'Salesforce, HubSpot, Slack',
    data_quality: 'mixed',
    process_documentation: 'partially',
    hours_wasted: '20-40',
    ai_experience: 'moderate',
    ai_tools_current: 'ChatGPT, Zapier',
    automation_goals: ['lead-management', 'reporting'],
    biggest_bottleneck: 'Manual lead routing taking 20+ hours per week',
    ai_concerns: ['cost', 'team-adoption'],
    timeline: '1-month',
    decision_maker: 'influence',
    budget_allocated: 'yes-approved',
    budget_range: '5000-10000',
    roi_timeframe: 'short-term',
    success_metric: '50% reduction in manual work, 30% faster lead response',
    hear_about: 'linkedin',
    additional_context: 'Looking to scale operations without hiring',
    utm_params: {
      utm_source: 'linkedin',
      utm_medium: 'social',
      utm_campaign: 'q1-2026'
    }
  };

  try {
    const mockEvent = {
      postData: {
        contents: JSON.stringify(sampleData)
      }
    };

    const result = doPost(mockEvent);
    Logger.log('Test Result: ' + result.getContent());

  } catch (error) {
    Logger.log('Test Error: ' + error);
  }
}
