/**
 * BizDeedz AI Readiness Email Automation
 *
 * Booking-first funnel powered by Google Sheets + Google Apps Script + Gmail + Google Calendar
 *
 * Trigger events:
 * 1. New Lead Submitted (HTML form writes a row to Google Sheets)
 * 2. Lead Booked (status changed to BOOKED)
 * 3. No Booking Yet (time-based follow-ups at 24h, 72h, 7d)
 * 4. Post-Call (status triggers delivery + proposal)
 *
 * Statuses:
 * - NEW_SUBMISSION
 * - BOOKING_INVITE_SENT
 * - BOOKED
 * - NO_SHOW
 * - QUALIFIED
 * - NOT_A_FIT
 * - SCORECARD_DELIVERED
 */

/***********************
  CONFIG - UPDATE THESE
************************/
const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Leads";
const FROM_NAME = "BizDeedz";
const BOOKING_LINK_DEFAULT = "PASTE_YOUR_GOOGLE_APPOINTMENT_SCHEDULE_LINK_HERE";

/***********************
  UTILITIES
************************/

/**
 * Gets the Leads sheet from the configured spreadsheet
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss.getSheetByName(SHEET_NAME);
}

/**
 * Creates a column index map from header names
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @returns {Object} Map of column names to 1-based indices
 */
function colIndexMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = {};
  headers.forEach((h, i) => map[String(h).trim()] = i + 1);
  return map;
}

/**
 * Gets a row as an object with column names as keys
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {Object} colMap Column index map
 * @param {number} rowNum Row number (1-based)
 * @returns {Object} Row data as object
 */
function getRowObj_(sheet, colMap, rowNum) {
  const row = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
  const obj = {};
  Object.keys(colMap).forEach(k => obj[k] = row[colMap[k] - 1]);
  return obj;
}

/**
 * Sets a cell value by column name
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 * @param {number} rowNum Row number (1-based)
 * @param {Object} colMap Column index map
 * @param {string} colName Column name
 * @param {*} value Value to set
 */
function setCell_(sheet, rowNum, colMap, colName, value) {
  sheet.getRange(rowNum, colMap[colName]).setValue(value);
}

/**
 * Generates a unique lead key
 * @returns {string} Unique identifier
 */
function generateLeadKey_() {
  return Utilities.getUuid().substring(0, 8).toUpperCase();
}

/***********************
  EMAIL TEMPLATES
************************/

/**
 * Email A: Booking Invite (sent immediately after form submission)
 * @param {Object} lead Lead data object
 * @returns {Object} {subject, body}
 */
function emailBookingInvite_(lead) {
  const subject = `AI Readiness Scorecard - Book Your Diagnostic (${lead.firmName || "Your Firm"})`;

  const bookingLink = lead.bookingLink || BOOKING_LINK_DEFAULT;

  const body = `Hi ${lead.name || "there"},

We received your AI Readiness Audit request for ${lead.firmName || "your firm"}.

Next step (booking-first): book your 20-30 minute diagnostic here:
${bookingLink}

What we'll cover on the call:
- Your current intake + workflow bottleneck
- Where governance risk exists (Shadow AI, confidentiality, audit trail)
- What to fix first before implementing AI or automation

Optional prep (only if easy):
- Your current intake steps (bullet list is fine)
- Your current tools (PMS, email, doc storage)
- Any SOP screenshots you already have

Operational guidance only (no legal advice).

- BizDeedz`;

  return { subject, body };
}

/**
 * Email B: Follow-up (24h / 72h / 7d)
 * @param {Object} lead Lead data object
 * @param {number} stage Follow-up stage (1, 2, or 3)
 * @returns {Object} {subject, body}
 */
function emailFollowUp_(lead, stage) {
  const bookingLink = lead.bookingLink || BOOKING_LINK_DEFAULT;

  const subject = stage === 1
    ? "Quick nudge: book your AI Readiness diagnostic"
    : stage === 2
      ? "Still want the AI Readiness Scorecard?"
      : "Last call: AI Readiness diagnostic link";

  const body = `Hi ${lead.name || "there"},

Just checking in. If you still want the AI Readiness Scorecard, the next step is to book the diagnostic here:
${bookingLink}

If timing changed, reply with "pause" and we'll stop nudges.

- BizDeedz`;

  return { subject, body };
}

/**
 * Email C: Pre-Call Checklist (sent after booking)
 * @param {Object} lead Lead data object
 * @returns {Object} {subject, body}
 */
function emailPreCallChecklist_(lead) {
  const subject = `Your AI Readiness Diagnostic - Prep Checklist (${lead.firmName || "Your Firm"})`;

  const body = `Hi ${lead.name || "there"},

You're booked. To make the call decision-grade, please bring (or be ready to describe):

- Your current intake flow (who touches what, when)
- How after-hours leads are handled (if applicable)
- Tools: PMS, email, doc storage, e-sign, texting, call routing
- Where work gets stuck (handoff, approvals, rework, attorney review)
- Any SOPs or screenshots you already have (optional)

If you'd rather not send documents, no problem. We can work from discussion.

- BizDeedz`;

  return { subject, body };
}

/**
 * Email D: Scorecard Delivered (sent after call when qualified)
 * @param {Object} lead Lead data object
 * @returns {Object} {subject, body}
 */
function emailScorecardDelivered_(lead) {
  const subject = `Your AI Readiness Scorecard - ${lead.firmName || "Your Firm"}`;

  const body = `Hi ${lead.name || "there"},

Thank you for completing the AI Readiness Diagnostic.

Your scorecard is attached/linked below. It includes:
- Your current AI readiness score
- Top 3 priority areas for improvement
- Recommended next steps based on your firm's specific situation
- Governance considerations for your practice area

Next steps:
1. Review the scorecard findings
2. Reply with any questions
3. If you'd like to discuss implementation, let us know

We're here to help when you're ready to move forward.

- BizDeedz`;

  return { subject, body };
}

/***********************
  CORE AUTOMATIONS
************************/

/**
 * A) Process new submissions - sends booking invite
 * Run this every 5-10 minutes via time-based trigger
 */
function processNewSubmissions() {
  const sheet = getSheet_();
  const colMap = colIndexMap_(sheet);
  const lastRow = sheet.getLastRow();

  for (let r = 2; r <= lastRow; r++) {
    const lead = getRowObj_(sheet, colMap, r);
    const status = String(lead.status || "").trim();

    if (status === "NEW_SUBMISSION") {
      const tpl = emailBookingInvite_(lead);

      GmailApp.sendEmail(lead.email, tpl.subject, tpl.body, {
        name: FROM_NAME
      });

      setCell_(sheet, r, colMap, "status", "BOOKING_INVITE_SENT");
      setCell_(sheet, r, colMap, "lastEmailSent", new Date());
      setCell_(sheet, r, colMap, "followUpStage", 0);

      Logger.log(`Booking invite sent to ${lead.email}`);
    }
  }
}

/**
 * B) Send follow-ups for leads who haven't booked
 * Run this every 1-6 hours via time-based trigger
 */
function sendFollowUps() {
  const sheet = getSheet_();
  const colMap = colIndexMap_(sheet);
  const lastRow = sheet.getLastRow();
  const now = new Date();

  for (let r = 2; r <= lastRow; r++) {
    const lead = getRowObj_(sheet, colMap, r);
    const status = String(lead.status || "").trim();

    if (status !== "BOOKING_INVITE_SENT") continue;

    const lastEmail = lead.lastEmailSent ? new Date(lead.lastEmailSent) : null;
    const stage = Number(lead.followUpStage || 0);

    if (!lastEmail) continue;

    const hoursSince = (now - lastEmail) / (1000 * 60 * 60);

    // Stage 1: 24h after initial email
    if (stage === 0 && hoursSince >= 24) {
      const tpl = emailFollowUp_(lead, 1);
      GmailApp.sendEmail(lead.email, tpl.subject, tpl.body, { name: FROM_NAME });
      setCell_(sheet, r, colMap, "lastEmailSent", new Date());
      setCell_(sheet, r, colMap, "followUpStage", 1);
      Logger.log(`Follow-up 1 sent to ${lead.email}`);
    }

    // Stage 2: 72h after last email
    if (stage === 1 && hoursSince >= 72) {
      const tpl = emailFollowUp_(lead, 2);
      GmailApp.sendEmail(lead.email, tpl.subject, tpl.body, { name: FROM_NAME });
      setCell_(sheet, r, colMap, "lastEmailSent", new Date());
      setCell_(sheet, r, colMap, "followUpStage", 2);
      Logger.log(`Follow-up 2 sent to ${lead.email}`);
    }

    // Stage 3: 7d (168h) after last email
    if (stage === 2 && hoursSince >= 168) {
      const tpl = emailFollowUp_(lead, 3);
      GmailApp.sendEmail(lead.email, tpl.subject, tpl.body, { name: FROM_NAME });
      setCell_(sheet, r, colMap, "lastEmailSent", new Date());
      setCell_(sheet, r, colMap, "followUpStage", 3);
      Logger.log(`Follow-up 3 (final) sent to ${lead.email}`);
    }
  }
}

/**
 * C) Process booked leads - sends pre-call checklist
 * Run this every 5-10 minutes via time-based trigger
 *
 * Usage: When a lead books, manually change their status to "BOOKED" in the sheet.
 * This function will then send the pre-call checklist email.
 */
function processBooked() {
  const sheet = getSheet_();
  const colMap = colIndexMap_(sheet);
  const lastRow = sheet.getLastRow();

  for (let r = 2; r <= lastRow; r++) {
    const lead = getRowObj_(sheet, colMap, r);
    const status = String(lead.status || "").trim();
    const lastEmailType = String(lead.notes || "").trim();

    // Only process BOOKED status if we haven't already sent the checklist
    if (status === "BOOKED" && !lastEmailType.includes("CHECKLIST_SENT")) {
      const tpl = emailPreCallChecklist_(lead);

      GmailApp.sendEmail(lead.email, tpl.subject, tpl.body, {
        name: FROM_NAME
      });

      setCell_(sheet, r, colMap, "lastEmailSent", new Date());
      // Append to notes to track that checklist was sent
      const existingNotes = lead.notes || "";
      setCell_(sheet, r, colMap, "notes", existingNotes + " CHECKLIST_SENT");

      Logger.log(`Pre-call checklist sent to ${lead.email}`);
    }
  }
}

/**
 * D) Process qualified leads - sends scorecard delivered email
 * Run this every 5-10 minutes via time-based trigger
 *
 * Usage: After a successful call, change status to "QUALIFIED".
 * This function will then send the scorecard delivery email.
 */
function processQualified() {
  const sheet = getSheet_();
  const colMap = colIndexMap_(sheet);
  const lastRow = sheet.getLastRow();

  for (let r = 2; r <= lastRow; r++) {
    const lead = getRowObj_(sheet, colMap, r);
    const status = String(lead.status || "").trim();
    const notes = String(lead.notes || "").trim();

    // Only process QUALIFIED status if we haven't already sent the scorecard
    if (status === "QUALIFIED" && !notes.includes("SCORECARD_EMAIL_SENT")) {
      const tpl = emailScorecardDelivered_(lead);

      GmailApp.sendEmail(lead.email, tpl.subject, tpl.body, {
        name: FROM_NAME
      });

      setCell_(sheet, r, colMap, "lastEmailSent", new Date());
      setCell_(sheet, r, colMap, "status", "SCORECARD_DELIVERED");
      const existingNotes = lead.notes || "";
      setCell_(sheet, r, colMap, "notes", existingNotes + " SCORECARD_EMAIL_SENT");

      Logger.log(`Scorecard delivered email sent to ${lead.email}`);
    }
  }
}

/***********************
  WEB APP ENDPOINT
  (for receiving form submissions)
************************/

/**
 * Handles POST requests from the lead capture form
 * Deploy as Web App with "Anyone" access
 * @param {Object} e Event object with postData
 * @returns {ContentService.TextOutput} JSON response
 */
function doPost(e) {
  try {
    const sheet = getSheet_();
    const colMap = colIndexMap_(sheet);

    // Parse form data
    const data = JSON.parse(e.postData.contents);

    // Generate unique lead key
    const leadKey = generateLeadKey_();

    // Append new row
    sheet.appendRow([
      new Date(),                    // timestamp
      leadKey,                       // leadKey
      data.name || "",               // name
      data.email || "",              // email
      data.phone || "",              // phone
      data.firmName || "",           // firmName
      data.practiceArea || "",       // practiceArea
      data.monthlyLeads || "",       // monthlyLeads
      data.primaryNeed || "",        // primaryNeed
      "NEW_SUBMISSION",              // status
      BOOKING_LINK_DEFAULT,          // bookingLink
      "",                            // lastEmailSent
      0,                             // followUpStage
      ""                             // notes
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        leadKey: leadKey,
        message: "Lead submitted successfully"
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    Logger.log("Error in doPost: " + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handles GET requests (for testing)
 * @returns {ContentService.TextOutput} HTML response
 */
function doGet() {
  return ContentService
    .createTextOutput("BizDeedz AI Readiness Automation is running. Use POST to submit leads.")
    .setMimeType(ContentService.MimeType.TEXT);
}

/***********************
  SETUP & TESTING
************************/

/**
 * Creates the required sheet structure if it doesn't exist
 * Run this once to set up your sheet
 */
function setupSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Set headers
  const headers = [
    "timestamp",
    "leadKey",
    "name",
    "email",
    "phone",
    "firmName",
    "practiceArea",
    "monthlyLeads",
    "primaryNeed",
    "status",
    "bookingLink",
    "lastEmailSent",
    "followUpStage",
    "notes"
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");

  // Set column widths
  sheet.setColumnWidth(1, 150);  // timestamp
  sheet.setColumnWidth(2, 100);  // leadKey
  sheet.setColumnWidth(3, 150);  // name
  sheet.setColumnWidth(4, 200);  // email
  sheet.setColumnWidth(14, 300); // notes

  Logger.log("Sheet setup complete!");
}

/**
 * Test function to add a sample lead
 * Use this to test your automation
 */
function testAddLead() {
  const sheet = getSheet_();

  sheet.appendRow([
    new Date(),
    generateLeadKey_(),
    "Test User",
    "test@example.com",
    "555-123-4567",
    "Test Law Firm",
    "Personal Injury",
    "10-20",
    "Intake automation",
    "NEW_SUBMISSION",
    BOOKING_LINK_DEFAULT,
    "",
    0,
    "Test lead"
  ]);

  Logger.log("Test lead added!");
}

/**
 * Manually process a specific lead by email
 * @param {string} email The lead's email address
 * @param {string} newStatus The new status to set
 */
function updateLeadStatus(email, newStatus) {
  const sheet = getSheet_();
  const colMap = colIndexMap_(sheet);
  const lastRow = sheet.getLastRow();

  for (let r = 2; r <= lastRow; r++) {
    const lead = getRowObj_(sheet, colMap, r);
    if (lead.email === email) {
      setCell_(sheet, r, colMap, "status", newStatus);
      Logger.log(`Updated ${email} to status: ${newStatus}`);
      return;
    }
  }

  Logger.log(`Lead with email ${email} not found`);
}
