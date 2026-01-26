/**
 * BizDeedz Intake - Google Apps Script Web App
 *
 * This script receives form submissions via POST and writes them to a Google Sheet.
 *
 * SETUP:
 * 1. Create a Google Sheet and copy the Sheet ID from the URL
 * 2. Paste the Sheet ID below in SHEET_ID
 * 3. Deploy as Web App:
 *    - Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone (or "Anyone with the link")
 * 4. Copy the Web App URL and paste it into intake-form.html as WEBHOOK_URL
 */

const SHEET_ID = "PASTE_YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Leads";

/**
 * Handles POST requests from the intake form
 */
function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : "{}";
    const data = JSON.parse(raw);

    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Add headers if sheet is empty
    if (sh.getLastRow() === 0) {
      sh.appendRow([
        "timestamp",
        "leadKey",
        "name",
        "role",
        "email",
        "phone",
        "firmName",
        "website",
        "practiceArea",
        "teamSize",
        "monthlyLeads",
        "urgency",
        "bottleneck",
        "pms",
        "emailPlatform",
        "docManagement",
        "intakeTools",
        "primaryNeed",
        "decisionMaker",
        "budgetReadiness",
        "consent",
        "source"
      ]);
    }

    // Append the lead data
    sh.appendRow([
      data.timestamp || new Date().toISOString(),
      data.leadKey || "",
      data.name || "",
      data.role || "",
      data.email || "",
      data.phone || "",
      data.firmName || "",
      data.website || "",
      data.practiceArea || "",
      data.teamSize || "",
      data.monthlyLeads || "",
      data.urgency || "",
      data.bottleneck || "",
      data.pms || "",
      data.emailPlatform || "",
      data.docManagement || "",
      data.intakeTools || "",
      data.primaryNeed || "",
      data.decisionMaker || "",
      data.budgetReadiness || "",
      data.consent || "",
      data.source || "web-intake"
    ]);

    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Test function to verify sheet connection
 * Run this manually to test your SHEET_ID is correct
 */
function testSheetConnection() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    Logger.log("Connected to sheet: " + ss.getName());
    Logger.log("Sheet URL: " + ss.getUrl());
    return true;
  } catch (err) {
    Logger.log("Error connecting to sheet: " + err);
    return false;
  }
}

/**
 * Handles GET requests (optional - for testing)
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({
      status: "BizDeedz Intake API is running",
      method: "GET",
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}
