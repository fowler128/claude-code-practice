# AI Readiness Audit - 30-Minute Deployment Quick Start

## Overview

This guide will help you deploy the complete AI Readiness Audit system in approximately 30 minutes. Follow these steps in order, and you'll have a fully functional lead capture and scoring system.

**Total Estimated Time**: 30-35 minutes

---

## Prerequisites Checklist

Before you begin, ensure you have:

- ✅ Google account with access to BizDeedz Google Workspace
- ✅ Notion account with access to BizDeedz Operations workspace
- ✅ GitHub account with repository access
- ✅ Access to bizdeedz.com DNS settings (if using custom domain)
- ✅ The following files from this repository:
  - `ai_readiness_audit_form.html`
  - `lead_scoring_logic.js`
  - `lead_scoring_engine.gs`

---

## Phase 1: Google Apps Script Setup (10 minutes)

### What You're Doing
Setting up the backend webhook that receives form submissions and distributes data.

### Steps
1. Open [Google Apps Script](https://script.google.com)
2. Create new project named "AI Readiness Audit Backend"
3. Copy/paste the `lead_scoring_engine.gs` code
4. Configure the CONFIG section with your IDs
5. Deploy as web app
6. Copy the webhook URL

### Time Estimate: 10 minutes

### Success Indicator
✅ You have a webhook URL that looks like: `https://script.google.com/macros/s/ABC123.../exec`

### Visual Checkpoint
![Screenshot placeholder: Apps Script editor with code pasted, CONFIG section highlighted]

*You should see your code in the editor with no syntax errors.*

### Troubleshooting
- **Can't find Apps Script**: Go to drive.google.com, click "New" → "More" → "Google Apps Script"
- **Syntax errors**: Make sure you copied the entire file with no truncation
- **Can't deploy**: Check that you're logged into the correct Google account

**Detailed Guide**: See [SETUP_GOOGLE_APPS_SCRIPT_DETAILED.md](SETUP_GOOGLE_APPS_SCRIPT_DETAILED.md)

---

## Phase 2: Google Sheets Setup (5 minutes)

### What You're Doing
Creating the spreadsheet where all leads will be logged and organized by tier.

### Steps
1. Create new Google Sheet named "AI Readiness Audit Leads"
2. Create 4 tabs: "All Leads", "HIGH", "MEDIUM", "LOW"
3. Add column headers to each tab
4. Apply conditional formatting for visual tier indicators
5. Share with team (jessa@bizdeedz.com, info@bizdeedz.com)
6. Copy the Sheet ID from the URL

### Time Estimate: 5 minutes

### Success Indicator
✅ You have a spreadsheet with 4 tabs and a Sheet ID

### Visual Checkpoint
![Screenshot placeholder: Google Sheet with 4 tabs visible at bottom, columns A-Z labeled with headers]

*You should see tabs for All Leads, HIGH, MEDIUM, and LOW with colored formatting.*

### Where to Find Sheet ID
Your Sheet URL looks like: `https://docs.google.com/spreadsheets/d/`**`1A2B3C4D5E6F7G8H`**`/edit`

The bolded part is your Sheet ID - copy it!

### Troubleshooting
- **Can't create tabs**: Right-click the bottom tab and select "Insert sheet"
- **Conditional formatting not working**: Make sure you selected the entire data range (A2:Z1000)
- **Team can't access**: Check sharing settings - set to "Editor" access

**Detailed Guide**: See [SETUP_GOOGLE_SHEET_DETAILED.md](SETUP_GOOGLE_SHEET_DETAILED.md)

---

## Phase 3: Notion Integration (7 minutes)

### What You're Doing
Setting up the Notion database for lead tracking and team collaboration.

### Steps
1. Open BizDeedz Operations workspace in Notion
2. Create new database named "AI Readiness Leads"
3. Set up database properties (Name, Email, Company, Score, Tier, etc.)
4. Generate Notion API integration
5. Share database with integration
6. Copy Database ID and API key

### Time Estimate: 7 minutes

### Success Indicator
✅ You have a Notion database with proper fields and an API key

### Visual Checkpoint
![Screenshot placeholder: Notion database with properties panel open showing field types]

*You should see a table view with columns for all lead data fields.*

### Where to Find Database ID
Open the database as a full page. The URL looks like:
`https://www.notion.so/`**`a1b2c3d4e5f6`**`?v=...`

The bolded part (before the `?`) is your Database ID - copy it!

### Troubleshooting
- **Can't find BizDeedz Operations**: Check left sidebar under "Workspaces"
- **No option to create integration**: Go to Settings & Members → Integrations → "Develop your own integration"
- **Integration can't access database**: Click "..." on database → "Add connections" → select your integration

**Detailed Guide**: See [SETUP_NOTION_DETAILED.md](SETUP_NOTION_DETAILED.md)

---

## Phase 4: GitHub Integration (5 minutes)

### What You're Doing
Setting up automatic JSON commit logging for lead submissions.

### Steps
1. Create `/leads` folder in your repository
2. Generate GitHub Personal Access Token
3. Add token to Google Apps Script CONFIG
4. Test the integration with sample data

### Time Estimate: 5 minutes

### Success Indicator
✅ Test submission creates a JSON file in `/leads` folder

### Visual Checkpoint
![Screenshot placeholder: GitHub repository showing /leads folder with sample JSON file]

*You should see JSON files appearing in the /leads folder after test submissions.*

### GitHub Token Scopes Needed
When creating your token, enable:
- ✅ `repo` (Full control of private repositories)
- ✅ `workflow` (Update GitHub Action workflows)

### Troubleshooting
- **403 Forbidden error**: Your token doesn't have `repo` scope
- **404 Not Found**: Check that repository name in CONFIG matches exactly
- **JSON not appearing**: Check Apps Script logs for errors (View → Logs)

**Detailed Guide**: See [SETUP_GITHUB_DETAILED.md](SETUP_GITHUB_DETAILED.md)

---

## Phase 5: Form Hosting (3 minutes)

### What You're Doing
Making the form publicly accessible on the web.

### Steps
1. Update webhook URL in `ai_readiness_audit_form.html`
2. Choose hosting method (GitHub Pages recommended)
3. Upload form files
4. Test the live form with sample data
5. Verify data appears in all 3 destinations

### Time Estimate: 3 minutes

### Success Indicator
✅ Form loads at public URL and submissions appear in Sheet, Notion, and GitHub

### Visual Checkpoint
![Screenshot placeholder: Browser showing live form with BizDeedz branding]

*You should see a professional form with Step 1/5 progress indicator.*

### Quick GitHub Pages Setup
1. Go to repository Settings → Pages
2. Source: Deploy from branch `main`
3. Folder: `/ (root)` or `/docs`
4. Save
5. Your form will be at: `https://username.github.io/repository-name/ai_readiness_audit_form.html`

### Troubleshooting
- **Form not loading**: Wait 2-3 minutes for GitHub Pages to build
- **Form loads but submissions fail**: Check webhook URL is correct (no spaces)
- **Data not appearing**: Check Apps Script execution logs for errors

**Detailed Guide**: See [SETUP_FORM_HOSTING_DETAILED.md](SETUP_FORM_HOSTING_DETAILED.md)

---

## Phase 6: Testing & Verification (5 minutes)

### What You're Doing
Ensuring all systems work together correctly.

### Test Checklist

#### Test 1: High-Score Lead
Submit a test form with these characteristics:
- Company size: 50-200 employees
- Industry: Technology/SaaS
- Timeline: Within 3 months
- Budget: $10k-25k/month
- Current AI: Basic usage
- Authority: Decision maker

**Expected Results**:
- ✅ Score: 75-95
- ✅ Tier: HIGH
- ✅ Email sent to info@bizdeedz.com and jessa@bizdeedz.com
- ✅ Appears in "HIGH" Sheet tab
- ✅ Appears in Notion with HIGH status
- ✅ JSON file created in GitHub /leads folder

#### Test 2: Medium-Score Lead
Submit a test form with:
- Company size: 10-50 employees
- Timeline: 6-12 months
- Budget: $5k-10k/month
- Authority: Influencer

**Expected Results**:
- ✅ Score: 50-74
- ✅ Tier: MEDIUM
- ✅ Email sent
- ✅ Appears in "MEDIUM" Sheet tab
- ✅ Appears in Notion with MEDIUM status
- ✅ JSON file created

#### Test 3: Low-Score Lead
Submit a test form with:
- Company size: 1-10 employees
- Timeline: Just exploring
- Budget: Under $5k/month
- Authority: Individual contributor

**Expected Results**:
- ✅ Score: Below 50
- ✅ Tier: LOW
- ✅ No email sent (only HIGH/MEDIUM trigger emails)
- ✅ Appears in "LOW" Sheet tab
- ✅ Appears in Notion with LOW status
- ✅ JSON file created

### Verification Steps

1. **Check Google Sheet**: All 3 test submissions should appear in "All Leads" tab, and each in their respective tier tabs
2. **Check Notion**: All 3 should appear with correct Score and Tier values
3. **Check GitHub**: 3 JSON files in /leads folder with timestamps
4. **Check Email**: 2 emails received (for HIGH and MEDIUM tests)

### Time Estimate: 5 minutes

---

## Configuration Reference

### Quick Copy: All IDs in One Place

Keep this filled out for reference:

```javascript
// Google Apps Script CONFIG
const CONFIG = {
  // Email addresses (no changes needed)
  emailRecipients: ['info@bizdeedz.com', 'jessa@bizdeedz.com'],

  // REPLACE THESE:
  spreadsheetId: 'YOUR_SPREADSHEET_ID_HERE',           // From Phase 2
  notionApiKey: 'YOUR_NOTION_API_KEY_HERE',            // From Phase 3
  notionDatabaseId: 'YOUR_NOTION_DATABASE_ID_HERE',    // From Phase 3
  githubToken: 'YOUR_GITHUB_TOKEN_HERE',               // From Phase 4
  githubRepo: 'YOUR_USERNAME/YOUR_REPO',               // Your GitHub repo

  // Thresholds (you can adjust these)
  thresholds: {
    high: 75,    // Scores 75+ are HIGH tier
    medium: 50   // Scores 50-74 are MEDIUM tier
  }
};
```

---

## Common Issues & Quick Fixes

### Issue: "Permission denied" in Apps Script
**Fix**: Make sure you've authorized the script
- Click the deployment URL
- Click "Review Permissions"
- Select your BizDeedz Google account
- Click "Advanced" → "Go to [project name] (unsafe)"
- Click "Allow"

### Issue: No data appearing in Google Sheet
**Fix**: Check the Sheet ID
- Make sure Sheet ID in CONFIG exactly matches your Sheet URL
- Sheet ID should NOT include `https://` or `/edit`
- It's just the long alphanumeric string

### Issue: Notion integration failing
**Fix**: Database must be shared with integration
- Open database
- Click "..." → "Add connections"
- Select your integration
- Try again

### Issue: GitHub commits not working
**Fix**: Token permissions
- Go to GitHub Settings → Developer Settings → Personal Access Tokens
- Click your token → Edit
- Ensure "repo" scope is checked
- Regenerate and update in CONFIG

### Issue: Form submissions return error
**Fix**: Check Apps Script logs
- Open Apps Script editor
- Click "Executions" (left sidebar)
- Find the failed execution
- Click to see error details
- Common errors:
  - "SpreadsheetId not found" → Wrong Sheet ID
  - "Notion 401 Unauthorized" → Wrong API key or database not shared
  - "GitHub 404" → Wrong repo name format (should be "username/repo")

### Issue: Emails not sending
**Fix**: Gmail service requires authorization
- Run the `testConfiguration()` function in Apps Script
- Authorize Gmail access when prompted
- Check spam folder for test emails

---

## Post-Deployment Checklist

After successful deployment:

- ✅ Bookmark your live form URL
- ✅ Add form link to BizDeedz website navigation
- ✅ Share form URL with marketing team
- ✅ Set up Google Sheet notification rules (Tools → Notification rules)
- ✅ Add Notion database to team dashboards
- ✅ Create saved views in Notion for each tier
- ✅ Document internal SOP for lead follow-up based on tier
- ✅ Schedule weekly review of LOW tier leads for nurture campaigns

---

## Next Steps

### Immediate Actions
1. **Test with real data**: Have team members submit test forms
2. **Customize messaging**: Update email templates in `lead_scoring_engine.gs`
3. **Adjust thresholds**: Fine-tune HIGH/MEDIUM/LOW score cutoffs based on early results

### Ongoing Optimization
1. **Monitor conversion rates** by tier (are HIGH leads actually converting?)
2. **Refine scoring algorithm** (adjust point values in `calculateLeadScore()`)
3. **Add custom fields** to capture additional lead data
4. **Create automated follow-up sequences** for each tier
5. **Build reporting dashboard** pulling data from Sheet or Notion

---

## Success Metrics to Track

After 30 days of operation, measure:

- **Lead Volume**: Total submissions per week
- **Tier Distribution**: % HIGH / % MEDIUM / % LOW
- **Conversion by Tier**: Which tiers actually become customers?
- **Time to Contact**: How quickly do HIGH leads get followed up?
- **Response Rates**: Do scored leads respond better to outreach?

Adjust scoring algorithm if:
- 🔴 More than 40% of leads are HIGH (scoring too generously)
- 🔴 Less than 10% of leads are HIGH (scoring too strictly)
- 🔴 MEDIUM tier converts better than HIGH (algorithm miscalibrated)

---

## Support Resources

### Detailed Setup Guides
- [Google Apps Script Setup](SETUP_GOOGLE_APPS_SCRIPT_DETAILED.md)
- [Google Sheets Setup](SETUP_GOOGLE_SHEET_DETAILED.md)
- [Notion Integration](SETUP_NOTION_DETAILED.md)
- [GitHub Integration](SETUP_GITHUB_DETAILED.md)
- [Form Hosting Options](SETUP_FORM_HOSTING_DETAILED.md)

### Complete Documentation
- [AI Readiness Audit Skill Overview](ai_readiness_audit.md)
- [Lead Scoring Engine Code](lead_scoring_engine.gs)
- [Form HTML/JavaScript](ai_readiness_audit_form.html)

### External Documentation
- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Notion API Documentation](https://developers.notion.com)
- [GitHub REST API Documentation](https://docs.github.com/rest)

---

## Deployment Time Log

Use this to track your actual deployment time:

| Phase | Estimated | Actual | Notes |
|-------|-----------|--------|-------|
| 1. Google Apps Script | 10 min | _____ min | |
| 2. Google Sheets | 5 min | _____ min | |
| 3. Notion Integration | 7 min | _____ min | |
| 4. GitHub Integration | 5 min | _____ min | |
| 5. Form Hosting | 3 min | _____ min | |
| 6. Testing & Verification | 5 min | _____ min | |
| **Total** | **35 min** | **_____ min** | |

---

## Congratulations!

You now have a fully functional AI Readiness Audit system that:

✅ Captures qualified leads through a professional form
✅ Automatically scores and tiers every submission
✅ Logs to multiple platforms (Sheet, Notion, GitHub)
✅ Sends instant email alerts for high-value prospects
✅ Provides actionable data for sales follow-up

**What's Next?** Share the form link with your audience and start capturing leads!

---

**Last Updated**: January 21, 2026
**Version**: 1.0
**Deployment Time**: 30-35 minutes
