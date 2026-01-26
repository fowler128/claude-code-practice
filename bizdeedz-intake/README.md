# BizDeedz Intake System

A booking-first, decision-grade intake system using Google Apps Script + Google Sheets + Google Calendar.

## Overview

This system provides:
- **HTML intake form** - Multi-step qualification form
- **Google Apps Script webhook** - Receives form data and writes to Google Sheets
- **Google Calendar integration** - Booking-first gate via Appointment Schedules

## Files

| File | Description |
|------|-------------|
| `Code.gs` | Google Apps Script code to deploy as a Web App |
| `intake-form.html` | Multi-step intake form with validation |

## Setup Instructions

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet
2. Name it "BizDeedz Leads" (or similar)
3. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID_HERE]/edit
   ```

### Step 2: Create Google Calendar Appointment Schedule

1. Go to [Google Calendar](https://calendar.google.com)
2. Click the gear icon → **Appointment schedules**
3. Create a new appointment schedule for your diagnostic calls
4. Copy the **booking page link**

### Step 3: Deploy Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Create a new project
3. Copy the contents of `Code.gs` into the editor
4. Replace `PASTE_YOUR_SHEET_ID_HERE` with your actual Sheet ID
5. Click **Deploy** → **New deployment**
6. Configure:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (or "Anyone with the link")
7. Click **Deploy** and authorize when prompted
8. Copy the **Web App URL**

### Step 4: Configure HTML Form

1. Open `intake-form.html`
2. Replace the configuration values at the top of the `<script>` section:
   ```javascript
   const WEBHOOK_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL";
   const BOOKING_URL = "YOUR_GOOGLE_CALENDAR_APPOINTMENT_SCHEDULE_LINK";
   ```
3. Host the HTML file on your website

### Step 5: Test

1. Run `testSheetConnection()` in Apps Script to verify sheet access
2. Submit a test form entry
3. Check your Google Sheet for the new row

## Form Fields

The intake collects:

| Field | Description |
|-------|-------------|
| `timestamp` | ISO timestamp of submission |
| `leadKey` | Unique key (email + firm name) |
| `name` | Contact name |
| `role` | Role at firm |
| `email` | Email address |
| `phone` | Phone number |
| `firmName` | Law firm name |
| `website` | Firm website (optional) |
| `practiceArea` | Primary practice area |
| `teamSize` | Team size range |
| `monthlyLeads` | Monthly lead volume |
| `urgency` | Implementation timeline |
| `bottleneck` | #1 current bottleneck |
| `pms` | Practice management system |
| `emailPlatform` | Email platform |
| `docManagement` | Document storage |
| `intakeTools` | Current intake tools (optional) |
| `primaryNeed` | Selected service tier |
| `decisionMaker` | Decision-making authority |
| `budgetReadiness` | Budget readiness level |
| `consent` | Contact consent |
| `source` | Traffic source |

## Flow

```
┌─────────────────┐
│  HTML Form      │
│  (4 steps)      │
└────────┬────────┘
         │ POST JSON
         ▼
┌─────────────────┐
│  Apps Script    │
│  Web App        │
└────────┬────────┘
         │ appendRow()
         ▼
┌─────────────────┐
│  Google Sheet   │
│  (Leads)        │
└─────────────────┘
         │
         │ redirect
         ▼
┌─────────────────┐
│  Google Calendar│
│  Booking Page   │
└─────────────────┘
```

## Upgrading to n8n

When ready to add automation:

1. Create an n8n webhook node
2. Replace `WEBHOOK_URL` with your n8n webhook URL
3. n8n can then:
   - Write to Google Sheets
   - Send Slack/email notifications
   - Trigger follow-up sequences
   - Integrate with CRMs

## Troubleshooting

**Form submission doesn't appear in sheet:**
- Verify SHEET_ID is correct
- Check Apps Script execution logs
- Ensure Web App is deployed with correct permissions

**CORS errors in console:**
- Expected behavior with `no-cors` mode
- Data still posts successfully
- Check sheet for new rows

**Booking redirect not working:**
- Verify BOOKING_URL is a valid appointment schedule link
- Check for JavaScript errors in console
