# BizDeedz AI Readiness Email Automation

A booking-first lead nurturing funnel powered by Google Sheets + Google Apps Script + Gmail + Google Calendar Appointment Schedules. No n8n or external automation tools required.

## Overview

This automation system handles the complete lead journey for AI Readiness Audits:

```
Form Submission → Booking Invite → Follow-ups → Pre-Call Checklist → Scorecard Delivery
```

### Trigger Events

| Event | Action |
|-------|--------|
| New Lead Submitted | Sends booking invite email |
| Lead Booked | Sends pre-call checklist |
| No Booking (24h/72h/7d) | Sends follow-up reminders |
| Post-Call (Qualified) | Sends scorecard delivery email |

## File Structure

```
AIReadinessAutomation/
├── Code.gs           # Google Apps Script automation code
├── lead-form.html    # HTML lead capture form
└── README.md         # This file
```

## Quick Start

### Step 1: Create Your Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it "BizDeedz AI Readiness Leads"
3. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

### Step 2: Set Up Google Apps Script

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Delete any existing code in the editor
4. Copy the entire contents of `Code.gs` and paste it into the editor
5. Update the configuration at the top of the script:

```javascript
const SHEET_ID = "YOUR_SHEET_ID_HERE";
const SHEET_NAME = "Leads";
const FROM_NAME = "BizDeedz";
const BOOKING_LINK_DEFAULT = "YOUR_GOOGLE_APPOINTMENT_SCHEDULE_LINK";
```

6. Save the project (Ctrl+S or Cmd+S)

### Step 3: Initialize Your Sheet

1. In Apps Script, select `setupSheet` from the function dropdown
2. Click **Run**
3. Authorize the script when prompted (first time only)
4. Check your sheet - it should now have the correct headers

### Step 4: Set Up Time-Based Triggers

1. In Apps Script, click the clock icon (Triggers) in the left sidebar
2. Click **+ Add Trigger**

**Trigger 1: Process New Submissions**
- Function: `processNewSubmissions`
- Event source: Time-driven
- Type: Minutes timer
- Interval: Every 5 minutes

**Trigger 2: Send Follow-ups**
- Function: `sendFollowUps`
- Event source: Time-driven
- Type: Hour timer
- Interval: Every 1 hour

**Trigger 3: Process Booked Leads**
- Function: `processBooked`
- Event source: Time-driven
- Type: Minutes timer
- Interval: Every 5 minutes

**Trigger 4: Process Qualified Leads (Optional)**
- Function: `processQualified`
- Event source: Time-driven
- Type: Minutes timer
- Interval: Every 5 minutes

### Step 5: Deploy as Web App (for form submissions)

1. In Apps Script, click **Deploy → New deployment**
2. Click the gear icon and select **Web app**
3. Configure:
   - Description: "BizDeedz Lead Form Handler"
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**
5. Copy the Web app URL

### Step 6: Configure the Lead Form

1. Open `lead-form.html` in a text editor
2. Find this line near the bottom:
   ```javascript
   const SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
   ```
3. Replace with your Web app URL from Step 5
4. Host the HTML file on your website or use it directly

## Sheet Structure

Your "Leads" sheet should have these columns:

| Column | Description |
|--------|-------------|
| timestamp | When the lead was submitted |
| leadKey | Unique 8-character identifier |
| name | Lead's name |
| email | Lead's email address |
| phone | Lead's phone number |
| firmName | Law firm name |
| practiceArea | Type of law practiced |
| monthlyLeads | Lead volume range |
| primaryNeed | Main reason for audit |
| status | Current lead status |
| bookingLink | Personalized booking link (optional) |
| lastEmailSent | Timestamp of last email |
| followUpStage | Current follow-up stage (0-3) |
| notes | Internal notes and tracking |

## Lead Statuses

| Status | Description | Triggered Action |
|--------|-------------|------------------|
| `NEW_SUBMISSION` | Just submitted form | Sends booking invite |
| `BOOKING_INVITE_SENT` | Received booking invite | Follow-up sequence starts |
| `BOOKED` | Scheduled a call | Sends pre-call checklist |
| `NO_SHOW` | Missed scheduled call | (Manual handling) |
| `QUALIFIED` | Completed call, good fit | Sends scorecard email |
| `NOT_A_FIT` | Completed call, not qualified | (No automated action) |
| `SCORECARD_DELIVERED` | Received final deliverable | (Sequence complete) |

## Email Templates

### Email A: Booking Invite
- **Sent when:** Status = `NEW_SUBMISSION`
- **Subject:** AI Readiness Scorecard - Book Your Diagnostic ({firmName})
- **Content:** Confirmation, booking link, what to prepare, expectations

### Email B: Follow-ups (3 stages)
- **Sent when:** Status = `BOOKING_INVITE_SENT` + time elapsed
- **Stage 1 (24h):** "Quick nudge: book your AI Readiness diagnostic"
- **Stage 2 (72h):** "Still want the AI Readiness Scorecard?"
- **Stage 3 (7d):** "Last call: AI Readiness diagnostic link"

### Email C: Pre-Call Checklist
- **Sent when:** Status = `BOOKED`
- **Subject:** Your AI Readiness Diagnostic - Prep Checklist ({firmName})
- **Content:** What to bring/prepare for the call

### Email D: Scorecard Delivered
- **Sent when:** Status = `QUALIFIED`
- **Subject:** Your AI Readiness Scorecard - {firmName}
- **Content:** Summary, next steps, call to action

## Manual Operations

### Marking a Lead as Booked

When someone books through Google Calendar:

1. Open your Google Sheet
2. Find the lead's row by email
3. Change the `status` column to `BOOKED`
4. The next trigger run will send the pre-call checklist

### Marking a Lead as Qualified

After a successful call:

1. Find the lead's row
2. Change `status` to `QUALIFIED`
3. The automation will send the scorecard delivery email

### Stopping Follow-ups for a Lead

To stop follow-ups (e.g., if they reply "pause"):

1. Find the lead's row
2. Change `status` to anything other than `BOOKING_INVITE_SENT`
3. Options: `PAUSED`, `NOT_A_FIT`, or manually to `BOOKED`

## Testing

### Add a Test Lead

1. In Apps Script, select `testAddLead` from the function dropdown
2. Click **Run**
3. Check your sheet - a test lead should appear
4. Wait for `processNewSubmissions` trigger (or run it manually)
5. Check the test email inbox for the booking invite

### Test Specific Functions

You can run any function manually in Apps Script:

- `processNewSubmissions()` - Process all NEW_SUBMISSION leads
- `sendFollowUps()` - Send any due follow-ups
- `processBooked()` - Send pre-call checklists to BOOKED leads
- `processQualified()` - Send scorecard emails to QUALIFIED leads

## Troubleshooting

### Emails not sending

1. Check Apps Script Executions log (View → Executions)
2. Ensure Gmail quota isn't exceeded (100/day for free accounts)
3. Verify email addresses are valid
4. Check that triggers are set up correctly

### Form submissions not appearing

1. Verify the Web app URL in `lead-form.html`
2. Check that the deployment is set to "Anyone" access
3. Look at Apps Script Executions for errors
4. Test the doPost function directly with test data

### Follow-ups not sending at expected times

1. Remember: times are calculated from `lastEmailSent`, not original submission
2. The trigger interval affects precision (e.g., hourly trigger = up to 1h delay)
3. Check that `followUpStage` is incrementing correctly

## Customization

### Modify Email Templates

Edit the template functions in `Code.gs`:
- `emailBookingInvite_()` - Booking invite
- `emailFollowUp_()` - Follow-up sequence
- `emailPreCallChecklist_()` - Pre-call prep
- `emailScorecardDelivered_()` - Final delivery

### Change Follow-up Timing

Modify the hour thresholds in `sendFollowUps()`:
- Stage 1: `hoursSince >= 24` (24 hours)
- Stage 2: `hoursSince >= 72` (3 days)
- Stage 3: `hoursSince >= 168` (7 days)

### Add HTML Formatting to Emails

Replace `GmailApp.sendEmail()` with `GmailApp.sendEmail()` using `htmlBody`:

```javascript
GmailApp.sendEmail(lead.email, tpl.subject, tpl.body, {
  name: FROM_NAME,
  htmlBody: '<html>Your HTML here</html>'
});
```

## Google Calendar Appointment Schedule Setup

1. Go to [Google Calendar](https://calendar.google.com)
2. Click the gear icon → **Settings**
3. Select **Appointment schedules** in the left sidebar
4. Click **Create**
5. Configure:
   - Title: "AI Readiness Diagnostic"
   - Duration: 30 minutes
   - Availability: Your preferred times
6. Copy the booking link and add it to `BOOKING_LINK_DEFAULT` in Code.gs

## Security Considerations

- The Web app runs with your permissions - be careful with access settings
- Don't store sensitive data in plain text in the sheet
- Consider adding validation to the doPost function
- Regularly review the execution logs for unusual activity

## Quotas and Limits

**Google Apps Script:**
- Email: 100 emails/day (free), 1,500/day (Workspace)
- Triggers: 20 triggers per script
- Execution time: 6 minutes max per execution

**Gmail:**
- Total daily sending varies by account type
- Consider upgrading to Workspace for higher limits

## Support

For questions or issues:
1. Check the Troubleshooting section above
2. Review Apps Script execution logs
3. Contact BizDeedz support

---

*Last Updated: January 2026*

*BizDeedz - Operational guidance for law firms. Not legal advice.*
