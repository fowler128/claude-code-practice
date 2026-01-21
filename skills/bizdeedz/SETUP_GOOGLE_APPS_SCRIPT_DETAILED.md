# Google Apps Script Setup - Detailed Guide

## Overview

This guide walks you through setting up the Google Apps Script backend that powers the AI Readiness Audit system. This script acts as a webhook that receives form submissions and distributes data to Google Sheets, Notion, GitHub, and email.

**Time Required**: 10-15 minutes
**Difficulty**: Beginner-friendly
**Prerequisites**: Google account with BizDeedz workspace access

---

## What You'll Accomplish

By the end of this guide, you'll have:

✅ A Google Apps Script project with the lead scoring backend
✅ A deployed web app with a webhook URL
✅ Proper authorization for Gmail, Sheets, and external APIs
✅ Verified connectivity to all integrated systems
✅ A tested, production-ready backend

---

## Part 1: Creating the Apps Script Project

### Step 1.1: Access Google Apps Script

**Option A: From Google Drive (Recommended)**

1. Go to [drive.google.com](https://drive.google.com)
2. Make sure you're logged into your **BizDeedz Google account**
3. Click the "**+ New**" button (top left)
4. Hover over "**More**"
5. Click "**Google Apps Script**"

![Screenshot placeholder: Google Drive "New" menu with "Google Apps Script" option highlighted]

**Option B: Direct Access**

1. Go directly to [script.google.com](https://script.google.com)
2. Make sure you're logged into your **BizDeedz Google account**
3. Click "**+ New project**" button (top left)

![Screenshot placeholder: Apps Script home page with "+ New project" button highlighted]

### Step 1.2: Name Your Project

1. Click "**Untitled project**" at the top
2. Rename it to: `AI Readiness Audit Backend`
3. The name will auto-save

![Screenshot placeholder: Project name field at top of editor with "AI Readiness Audit Backend" entered]

**Why This Matters**: A clear name helps you find this script later in your Apps Script dashboard.

---

## Part 2: Adding the Backend Code

### Step 2.1: Clear Default Code

When you create a new project, you'll see default code that looks like:

```javascript
function myFunction() {

}
```

1. **Select all the default code** (Ctrl+A or Cmd+A)
2. **Delete it** (press Delete or Backspace)

Your editor should now be completely blank.

### Step 2.2: Copy the Lead Scoring Engine Code

1. Open the file `lead_scoring_engine.gs` from this repository
2. **Select all code** (Ctrl+A or Cmd+A)
3. **Copy it** (Ctrl+C or Cmd+C)

### Step 2.3: Paste Into Apps Script Editor

1. Return to your Google Apps Script browser tab
2. Click in the editor area
3. **Paste the code** (Ctrl+V or Cmd+V)

You should now see approximately 715 lines of code starting with:

```javascript
/**
 * AI Readiness Audit - Lead Scoring & Distribution Engine
 * BizDeedz - Production Version
 * ...
 */
```

![Screenshot placeholder: Apps Script editor filled with code, showing line numbers 1-715]

### Step 2.4: Save the Project

1. Click the **disk/save icon** (or press Ctrl+S / Cmd+S)
2. Wait for "**All changes saved**" message to appear

![Screenshot placeholder: Save icon highlighted and "All changes saved" message showing]

---

## Part 3: Configuring the Settings

### Step 3.1: Locate the CONFIG Object

Scroll to the **top of the code** (line 10-25 approximately).

You'll see a configuration block that looks like this:

```javascript
const CONFIG = {
  emailRecipients: ['info@bizdeedz.com', 'jessa@bizdeedz.com'],
  spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE',
  notionApiKey: 'YOUR_NOTION_API_KEY_HERE',
  notionDatabaseId: 'YOUR_NOTION_DATABASE_ID_HERE',
  githubToken: 'YOUR_GITHUB_TOKEN_HERE',
  githubRepo: 'YOUR_USERNAME/YOUR_REPO',
  thresholds: {
    high: 75,
    medium: 50
  }
};
```

### Step 3.2: Update Email Recipients (Optional)

The email addresses are already set to:
- `info@bizdeedz.com`
- `jessa@bizdeedz.com`

**If you need to change these:**

1. Find the line: `emailRecipients: ['info@bizdeedz.com', 'jessa@bizdeedz.com'],`
2. Replace with your desired email addresses
3. Keep the format: `['email1@domain.com', 'email2@domain.com']`
4. Make sure emails are in quotes and separated by commas

**Example with 3 recipients:**
```javascript
emailRecipients: ['info@bizdeedz.com', 'jessa@bizdeedz.com', 'sales@bizdeedz.com'],
```

### Step 3.3: Add Your Google Sheet ID

**What is the Sheet ID?**

Your Google Sheet URL looks like this:
```
https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P/edit#gid=0
                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                        This is your Sheet ID
```

**Steps:**

1. Open your "AI Readiness Audit Leads" Google Sheet (see [SETUP_GOOGLE_SHEET_DETAILED.md](SETUP_GOOGLE_SHEET_DETAILED.md) if you haven't created it yet)
2. Look at the URL in your browser's address bar
3. Copy the long string between `/d/` and `/edit`
4. Return to Apps Script editor
5. Find: `spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE',`
6. Replace `YOUR_SPREADSHEET_ID_HERE` with your copied ID
7. Keep the quotes around it

**Example:**
```javascript
spreadsheetId: '1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P',
```

![Screenshot placeholder: Google Sheet URL with Sheet ID highlighted]

### Step 3.4: Add Your Notion API Key

**Where to get this:**

See [SETUP_NOTION_DETAILED.md](SETUP_NOTION_DETAILED.md) for complete instructions on creating a Notion integration and getting your API key.

**Your Notion API key looks like:**
```
secret_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0
```

**Steps:**

1. Get your Notion API key from the Notion integrations page
2. In Apps Script, find: `notionApiKey: 'YOUR_NOTION_API_KEY_HERE',`
3. Replace `YOUR_NOTION_API_KEY_HERE` with your API key
4. Keep the quotes around it

**Example:**
```javascript
notionApiKey: 'secret_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
```

⚠️ **Security Note**: This API key gives access to your Notion workspace. Keep it confidential.

### Step 3.5: Add Your Notion Database ID

**Where to get this:**

See [SETUP_NOTION_DETAILED.md](SETUP_NOTION_DETAILED.md) for instructions on finding your database ID.

**Your Notion database ID looks like:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**How to find it:**

1. Open your "AI Readiness Leads" Notion database as a full page
2. Look at the URL: `https://www.notion.so/a1b2c3d4e5f6?v=...`
3. Copy the string between `.so/` and `?v=` (or before the end if no `?v=`)
4. In Apps Script, find: `notionDatabaseId: 'YOUR_NOTION_DATABASE_ID_HERE',`
5. Replace with your database ID
6. Keep the quotes

**Example:**
```javascript
notionDatabaseId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
```

### Step 3.6: Add Your GitHub Token

**Where to get this:**

See [SETUP_GITHUB_DETAILED.md](SETUP_GITHUB_DETAILED.md) for instructions on creating a Personal Access Token.

**Your GitHub token looks like:**
```
ghp_1234567890abcdefghijklmnopqrstuvwxyz
```

**Steps:**

1. Generate a GitHub Personal Access Token with `repo` scope
2. In Apps Script, find: `githubToken: 'YOUR_GITHUB_TOKEN_HERE',`
3. Replace with your token
4. Keep the quotes

**Example:**
```javascript
githubToken: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
```

⚠️ **Security Note**: This token gives write access to your repository. Keep it confidential.

### Step 3.7: Add Your GitHub Repository

**Format:** `username/repository-name`

**Steps:**

1. Go to your GitHub repository
2. Look at the URL: `https://github.com/yourusername/your-repo-name`
3. Copy the `yourusername/your-repo-name` part
4. In Apps Script, find: `githubRepo: 'YOUR_USERNAME/YOUR_REPO',`
5. Replace with your repository path
6. Keep the quotes

**Example:**
```javascript
githubRepo: 'bizdeedz/lead-capture-system',
```

### Step 3.8: Adjust Scoring Thresholds (Optional)

The default thresholds are:
- **HIGH tier**: 75+ points
- **MEDIUM tier**: 50-74 points
- **LOW tier**: Below 50 points

**If you want to change these:**

```javascript
thresholds: {
  high: 75,    // Change this number
  medium: 50   // Change this number
}
```

**Examples:**

**More selective (fewer HIGH leads):**
```javascript
thresholds: {
  high: 85,
  medium: 60
}
```

**More inclusive (more HIGH leads):**
```javascript
thresholds: {
  high: 65,
  medium: 40
}
```

**Why adjust?** After running the system for a few weeks, you might find you want to:
- Raise thresholds if too many leads are scoring HIGH
- Lower thresholds if too few leads are scoring HIGH

### Step 3.9: Save Your Configuration

1. Review all CONFIG values to ensure they're correct
2. Click the **Save icon** (or press Ctrl+S / Cmd+S)
3. Wait for "**All changes saved**" confirmation

**Your CONFIG should now look like:**

```javascript
const CONFIG = {
  emailRecipients: ['info@bizdeedz.com', 'jessa@bizdeedz.com'],
  spreadsheetId: '1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P',
  notionApiKey: 'secret_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  notionDatabaseId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  githubToken: 'ghp_1234567890abcdefghijklmnopqrstuvwxyz',
  githubRepo: 'bizdeedz/lead-capture-system',
  thresholds: {
    high: 75,
    medium: 50
  }
};
```

---

## Part 4: Deploying as a Web App

### Step 4.1: Start Deployment

1. Click the "**Deploy**" button (top right, blue button)
2. Select "**New deployment**" from the dropdown

![Screenshot placeholder: Deploy button with dropdown menu showing "New deployment" option]

### Step 4.2: Configure Deployment Settings

You'll see a deployment configuration panel.

**1. Select Type**
- Click the gear icon next to "Select type"
- Choose "**Web app**"

![Screenshot placeholder: Deployment configuration with "Web app" selected]

**2. Add Description**
- In the "Description" field, enter: `Production deployment v1`
- This helps you track different versions

**3. Execute As**
- Select: "**Me**" (your email address)
- This means the script runs with your permissions

**4. Who Has Access**
- Select: "**Anyone**"
- This allows the form to POST data without authentication

⚠️ **Important**: "Anyone" means anyone with the URL can access it. The form includes honeypot spam protection, so this is safe for public forms.

![Screenshot placeholder: Deployment settings showing "Execute as: Me" and "Who has access: Anyone"]

### Step 4.3: Deploy

1. Click the "**Deploy**" button (bottom right of the panel)
2. You'll see a authorization screen

### Step 4.4: Authorize the Script

**First-time authorization steps:**

1. Click "**Review Permissions**"
2. Select your **BizDeedz Google account**
3. You'll see a warning: "Google hasn't verified this app"
4. Click "**Advanced**"
5. Click "**Go to AI Readiness Audit Backend (unsafe)**"
   - This is safe - it's YOUR script, Google just hasn't formally reviewed it
6. Review the permissions requested:
   - Send emails on your behalf (GmailApp)
   - Manage your spreadsheets (SpreadsheetApp)
   - Connect to external services (UrlFetchApp)
7. Click "**Allow**"

![Screenshot placeholder: Google authorization screen showing permissions]

**Why these permissions?**
- **Send email**: To notify team when HIGH/MEDIUM leads submit
- **Spreadsheets**: To log data to your Google Sheet
- **External service**: To connect to Notion and GitHub APIs

### Step 4.5: Copy Your Webhook URL

After authorization, you'll see a success screen with your deployment details.

**Your webhook URL will look like:**
```
https://script.google.com/macros/s/AKfycbzABC123XYZ789.../exec
```

1. **Copy this entire URL**
2. **Save it somewhere safe** - you'll need it for the form setup
3. Click "**Done**"

![Screenshot placeholder: Deployment success screen with webhook URL highlighted]

📝 **Save This URL**: You'll paste it into your `ai_readiness_audit_form.html` file.

---

## Part 5: Testing the Backend

### Step 5.1: Run Configuration Test

The code includes a built-in test function.

1. In the Apps Script editor, find the **function dropdown** (near the top, next to the bug icon)
2. Click the dropdown and select: `testConfiguration`
3. Click the "**Run**" button (play icon)

![Screenshot placeholder: Function dropdown with "testConfiguration" selected]

**What this tests:**
- ✅ Google Sheet ID is valid and accessible
- ✅ Notion API key is valid
- ✅ Notion database exists and is accessible
- ✅ GitHub token is valid
- ✅ GitHub repository exists

**Expected output:**

Check the "**Execution log**" at the bottom:

```
✅ Configuration test passed!
- Google Sheet: Connected (ID: 1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P)
- Notion API: Connected (Database: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6)
- GitHub API: Connected (Repo: bizdeedz/lead-capture-system)
```

![Screenshot placeholder: Execution log showing successful configuration test]

### Step 5.2: Run Sample Data Test

Now test with actual sample lead data.

1. Change function dropdown to: `testWithSampleData`
2. Click the "**Run**" button

**What this does:**
- Creates a sample HIGH-tier lead
- Scores it (should be 85+ points)
- Logs to Google Sheet
- Sends email notification
- Logs to Notion
- Commits JSON to GitHub

**Expected output:**

```
🧪 Testing with sample HIGH-tier lead...

Lead Score: 88
Lead Tier: HIGH

✅ Logged to Google Sheet (Row added to "All Leads" and "HIGH" tabs)
✅ Email sent to info@bizdeedz.com, jessa@bizdeedz.com
✅ Logged to Notion (Entry created in "AI Readiness Leads")
✅ Committed to GitHub (/leads/test_YYYYMMDD_HHMMSS.json)

✅ Test completed successfully!
```

### Step 5.3: Verify Test Results

**1. Check Google Sheet**
- Open your "AI Readiness Audit Leads" Sheet
- Go to "All Leads" tab
- You should see a test entry with company name "Test Company Inc"
- Go to "HIGH" tab - the entry should also appear here

**2. Check Notion**
- Open your "AI Readiness Leads" Notion database
- You should see a new entry for "Test Company Inc"
- Score should be 88, Tier should be HIGH

**3. Check GitHub**
- Go to your repository
- Navigate to the `/leads` folder
- You should see a JSON file like `test_20260121_143022.json`

**4. Check Email**
- Check inbox for info@bizdeedz.com and jessa@bizdeedz.com
- You should see email with subject: "🔥 HIGH Priority Lead: Test Company Inc"

If all 4 checks pass, your backend is working perfectly! ✅

---

## Part 6: Connecting to Your Form

### Step 6.1: Update Form Webhook URL

1. Open `ai_readiness_audit_form.html` in a text editor
2. Find the line (around line 420):
```javascript
const WEBHOOK_URL = 'YOUR_WEBHOOK_URL_HERE';
```
3. Replace `YOUR_WEBHOOK_URL_HERE` with your actual webhook URL from Step 4.5
4. Keep the quotes around it

**Example:**
```javascript
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzABC123XYZ789.../exec';
```

5. Save the file

### Step 6.2: Test Form Submission

1. Host your form (see [SETUP_FORM_HOSTING_DETAILED.md](SETUP_FORM_HOSTING_DETAILED.md))
2. Open the form in a browser
3. Fill out all 5 sections with test data
4. Submit the form
5. You should see a success message
6. Check all 4 destinations (Sheet, Notion, GitHub, Email) to verify data appeared

---

## Part 7: Monitoring & Maintenance

### Viewing Execution Logs

**To see recent executions:**

1. In Apps Script editor, click "**Executions**" (left sidebar, clock icon)
2. You'll see a list of recent runs with:
   - Timestamp
   - Status (Success or Failed)
   - Duration
   - Trigger (typically "Web app")

![Screenshot placeholder: Executions panel showing list of recent runs]

**To see details of a specific execution:**

1. Click on any execution row
2. You'll see the full execution log with all `Logger.log()` outputs
3. If there were errors, they'll appear here

### Common Log Messages

**Successful submission:**
```
Lead received: John Doe (john@example.com)
Lead score: 78 | Tier: HIGH
✅ Logged to Google Sheet
✅ Email notifications sent
✅ Logged to Notion
✅ Committed to GitHub
```

**Partial failure example:**
```
Lead received: Jane Smith (jane@example.com)
Lead score: 65 | Tier: MEDIUM
✅ Logged to Google Sheet
✅ Email notifications sent
❌ Notion API error: 401 Unauthorized
✅ Committed to GitHub
```

This helps you quickly identify which integration is failing.

### Setting Up Email Alerts for Script Failures

1. In Apps Script, go to: ⚙️ (Project Settings) in left sidebar
2. Scroll to "**Notifications**"
3. Check: "**Daily** - Email me daily with a summary of script failures"
4. Or check: "**Immediately** - Email me when a script failure occurs"

This way you'll be notified if the script encounters errors.

---

## Troubleshooting

### Error: "Exception: Service invoked too many times for one day: email"

**Cause**: Google limits Gmail sends to ~100/day for free accounts

**Solutions:**
1. Upgrade to Google Workspace (higher limits)
2. Send emails only for HIGH tier leads
3. Use a third-party email service (SendGrid, etc.)

**Quick fix** - Modify the `sendEmailNotifications()` function to only email for HIGH leads:

```javascript
function sendEmailNotifications(lead) {
  // Only send for HIGH tier leads
  if (lead.lead_tier !== 'HIGH') {
    Logger.log('⏭️ Skipping email for ' + lead.lead_tier + ' tier lead');
    return;
  }

  // ... rest of function
}
```

### Error: "SpreadsheetApp: Spreadsheet not found"

**Cause**: Sheet ID is incorrect or Sheet doesn't exist

**Fix:**
1. Double-check the Sheet ID in CONFIG
2. Make sure the Sheet hasn't been deleted
3. Ensure the Sheet is in the same Google account running the script

### Error: "UrlFetchApp: Request failed for https://api.notion.com... (401)"

**Cause**: Notion API key is incorrect or database isn't shared with integration

**Fix:**
1. Verify API key in CONFIG
2. Open Notion database → "..." → "Add connections" → select your integration
3. Regenerate API key if needed

### Error: "UrlFetchApp: Request failed for https://api.github.com... (404)"

**Cause**: Repository doesn't exist or token doesn't have access

**Fix:**
1. Verify `githubRepo` format is `username/repo` (no extra slashes)
2. Check repository exists and isn't private (or token has private repo access)
3. Verify GitHub token has `repo` scope

### Error: "Authorization required" when clicking webhook URL

**Cause**: You're accessing the URL directly in a browser

**Fix**: This is normal! The webhook is designed to receive POST requests from the form, not GET requests from browsers. It will work when the form submits data.

### Script runs but no data appears anywhere

**Debugging steps:**

1. Check "Executions" panel for errors
2. Run `testWithSampleData()` function manually
3. Add more `Logger.log()` statements to see where it's failing
4. Check that all service integrations (Sheet, Notion, GitHub) are properly authorized

---

## Advanced Customization

### Adding Custom Scoring Logic

To modify how leads are scored, edit the `calculateLeadScore()` function (around line 100):

```javascript
function calculateLeadScore(data) {
  let score = 0;
  const breakdown = {};

  // Modify these sections to change scoring:

  // Data Quality (0-20 points)
  if (data.company_name && data.company_name.trim() !== '') score += 5;
  if (data.email && data.email.includes('@') && data.email.includes('.')) score += 5;
  // ... add your own criteria

  return {score, tier, breakdown};
}
```

### Customizing Email Templates

To change the email content, edit the `sendEmailNotifications()` function (around line 300):

```javascript
const subject = `🔥 ${lead.lead_tier} Priority Lead: ${lead.company_name}`;

const body = `
  New AI Readiness Audit submission:

  Company: ${lead.company_name}
  // ... customize this template
`;
```

### Adding Additional Integrations

To send data to additional platforms (Slack, HubSpot, etc.):

1. Add a new function like `logToSlack(lead)`
2. Use `UrlFetchApp.fetch()` to POST to their API
3. Call your function from `doPost()` alongside the other integrations

---

## Security Best Practices

### Protecting Your API Keys

✅ **Do:**
- Store API keys only in the Apps Script CONFIG
- Use Apps Script's Properties Service for extra security (optional):
  ```javascript
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('NOTION_API_KEY', 'secret_...');
  ```

❌ **Don't:**
- Commit API keys to GitHub
- Share your Apps Script project publicly
- Email API keys in plain text

### Webhook Security

The form includes honeypot spam protection, but for additional security:

**Option 1: Add timestamp validation**
```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);

  // Reject submissions older than 1 hour
  const submissionTime = new Date(data.timestamp);
  const now = new Date();
  if ((now - submissionTime) > 3600000) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Expired'}));
  }

  // ... rest of function
}
```

**Option 2: Add IP rate limiting**
```javascript
const cache = CacheService.getScriptCache();
const ipAddress = e.parameter.userIp;
const cacheKey = 'ip_' + ipAddress;

if (cache.get(cacheKey)) {
  return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Rate limited'}));
}

cache.put(cacheKey, 'submitted', 300); // 5-minute cooldown
```

---

## Deployment Checklist

Before going live, verify:

- ✅ All CONFIG values are correct (no "YOUR_..." placeholders)
- ✅ `testConfiguration()` passes
- ✅ `testWithSampleData()` works and data appears in all destinations
- ✅ Email notifications are received
- ✅ Webhook URL is copied and saved
- ✅ Form is updated with correct webhook URL
- ✅ Script is deployed as "Web app" with "Anyone" access
- ✅ You've tested a real form submission end-to-end

---

## Next Steps

1. **Update your form**: Add the webhook URL to `ai_readiness_audit_form.html`
2. **Host the form**: See [SETUP_FORM_HOSTING_DETAILED.md](SETUP_FORM_HOSTING_DETAILED.md)
3. **Monitor executions**: Check the "Executions" panel daily for the first week
4. **Refine scoring**: Adjust thresholds based on actual lead quality
5. **Customize emails**: Tailor notification templates to your team's needs

---

## Support & Resources

### Apps Script Documentation
- [Official Apps Script Guides](https://developers.google.com/apps-script/guides/web)
- [Apps Script Reference](https://developers.google.com/apps-script/reference)
- [Best Practices](https://developers.google.com/apps-script/guides/support/best-practices)

### Related Setup Guides
- [Google Sheets Setup](SETUP_GOOGLE_SHEET_DETAILED.md)
- [Notion Integration](SETUP_NOTION_DETAILED.md)
- [GitHub Integration](SETUP_GITHUB_DETAILED.md)
- [Form Hosting](SETUP_FORM_HOSTING_DETAILED.md)

### Community Resources
- [Apps Script Stack Overflow](https://stackoverflow.com/questions/tagged/google-apps-script)
- [Apps Script Subreddit](https://reddit.com/r/GoogleAppsScript)

---

**Congratulations!** You've successfully set up the Google Apps Script backend for your AI Readiness Audit system. The hardest part is done! 🎉

---

**Last Updated**: January 21, 2026
**Version**: 1.0
**Estimated Setup Time**: 10-15 minutes
