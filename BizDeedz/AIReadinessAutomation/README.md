# BizDeedz AI Readiness Email Automation

A complete lead nurturing system with two implementation options:
1. **Simple**: Google Apps Script (rule-based automation)
2. **Advanced**: Python Autonomous Agent (AI-powered with Claude)

## Overview

This automation system handles the complete lead journey for AI Readiness Audits:

```
Form Submission → AI Analysis → Booking Invite → Smart Follow-ups → Booking Detection → Pre-Call Checklist → Qualification → Scorecard Delivery
```

## Choose Your Implementation

| Feature | Google Apps Script | Python Agent |
|---------|-------------------|--------------|
| Setup Complexity | Easy | Moderate |
| AI Personalization | None | Full |
| Reply Handling | Manual | Autonomous |
| Booking Detection | Manual | Automatic |
| Decision Making | Rule-based | AI-powered |
| Infrastructure | Google only | Python server |

---

# Option 1: Google Apps Script (Simple)

Rule-based automation using only Google services.

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

---

# Option 2: Python Autonomous Agent (Advanced)

Full AI-powered autonomous agent using Claude for intelligent decision-making.

## Agent Architecture

```
agent/
├── __init__.py           # Package exports
├── agent.py              # Core Claude agent with tool use
├── config.py             # Configuration management
├── memory.py             # SQLite-based conversation memory
├── orchestrator.py       # Main coordinator
├── state.py              # Lead state machine
├── run_agent.py          # Entry point
│
├── tools/
│   ├── sheets.py         # Google Sheets operations
│   ├── gmail.py          # Email sending/reading
│   └── calendar.py       # Booking detection
│
├── handlers/
│   ├── new_lead.py       # New submission processing
│   ├── reply.py          # Email reply handling
│   ├── booking.py        # Booking detection
│   └── followup.py       # Follow-up decisions
│
└── prompts/
    └── system.py         # AI system prompts
```

## What the Agent Does

### 1. Intelligent Lead Analysis
When a new lead submits the form, the agent:
- Analyzes their practice area, firm size, and stated needs
- Assigns a priority score (high/medium/low)
- Generates personalization notes for all future communications

### 2. Personalized Email Generation
Every email is AI-generated based on:
- Lead's specific context and needs
- Previous conversation history
- Current stage in the funnel

### 3. Autonomous Reply Handling
When a lead replies, the agent:
- Analyzes intent (booking, question, pause, unsubscribe)
- Generates an appropriate response
- Updates lead status automatically
- Escalates complex situations to humans

### 4. Automatic Booking Detection
The agent monitors your calendar to:
- Detect when leads book appointments
- Match bookings to leads automatically
- Trigger pre-call checklist emails

### 5. Smart Follow-up Decisions
Instead of fixed timing, the agent considers:
- How engaged the lead has been
- What their responses indicate
- Optimal timing for each individual

## Agent Setup

### Prerequisites

- Python 3.10+
- Anthropic API key
- Google Cloud project with enabled APIs:
  - Google Sheets API
  - Gmail API
  - Google Calendar API

### Step 1: Install Dependencies

```bash
cd BizDeedz/AIReadinessAutomation
pip install -r requirements.txt
```

### Step 2: Set Up Google Cloud Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - Google Sheets API
   - Gmail API
   - Google Calendar API
4. Create OAuth 2.0 credentials:
   - Go to APIs & Services → Credentials
   - Create OAuth client ID → Desktop app
   - Download the JSON file as `credentials.json`
5. Place `credentials.json` in the `AIReadinessAutomation` directory

### Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
SPREADSHEET_ID=your-google-sheet-id
FROM_EMAIL=your-email@gmail.com
BOOKING_LINK=https://calendar.google.com/calendar/appointments/xxxxx

# Optional
LOG_LEVEL=INFO
MEMORY_DB_PATH=agent_memory.db
```

### Step 4: First Run (OAuth Setup)

```bash
python run_agent.py --once
```

This will:
1. Open a browser for Google OAuth
2. Request permissions for Sheets, Gmail, Calendar
3. Save the token for future use
4. Run a single processing cycle

### Step 5: Run Continuously

```bash
# Default: polls every 5 minutes
python run_agent.py

# Custom interval (10 minutes)
python run_agent.py --interval 600

# Run in background
nohup python run_agent.py > agent.log 2>&1 &
```

## Agent Commands

```bash
# Run single cycle
python run_agent.py --once

# Run continuously
python run_agent.py

# Custom polling interval (seconds)
python run_agent.py --interval 300

# View pipeline status
python run_agent.py --status

# View follow-up schedule
python run_agent.py --schedule

# Get specific lead details
python run_agent.py --lead john@example.com

# Debug mode
python run_agent.py --log-level DEBUG
```

## Lead States (Agent)

The agent uses an expanded state machine:

| State | Description |
|-------|-------------|
| `NEW_SUBMISSION` | Just submitted form |
| `ANALYZING` | Agent is analyzing the lead |
| `BOOKING_INVITE_SENT` | Initial outreach sent |
| `FOLLOW_UP_1` | First follow-up sent |
| `FOLLOW_UP_2` | Second follow-up sent |
| `FOLLOW_UP_3` | Final follow-up sent |
| `REPLY_RECEIVED` | Lead replied, needs processing |
| `CONVERSATION_ACTIVE` | Ongoing conversation |
| `BOOKED` | Appointment scheduled |
| `CHECKLIST_SENT` | Pre-call checklist sent |
| `CALL_COMPLETED` | Call finished |
| `QUALIFIED` | Good fit, ready for scorecard |
| `NOT_A_FIT` | Disqualified |
| `SCORECARD_DELIVERED` | Final deliverable sent |
| `PAUSED` | Lead requested pause |
| `UNSUBSCRIBED` | Lead opted out |
| `ESCALATED` | Needs human review |

## Memory System

The agent maintains persistent memory in SQLite:

- **Conversation History**: Full email thread per lead
- **Action Log**: Every action taken with timestamps
- **Analysis Cache**: AI analysis results
- **Processing State**: Tracks what's been processed

Database location: `agent_memory.db` (configurable)

## Customizing Agent Behavior

### Modify System Prompts

Edit `agent/prompts/system.py` to change:
- Brand voice and tone
- Decision-making criteria
- Email generation guidelines
- Qualification criteria

### Adjust Follow-up Timing

In `config.py` or `.env`:
```python
follow_up_hours = [24, 72, 168]  # 24h, 72h, 7d
max_follow_ups = 3
```

### Add New Tools

Create new tools in `agent/tools/` following the pattern:
1. Extend `GoogleBaseTool` or `BaseTool`
2. Define `ToolDefinition` for each capability
3. Implement `execute()` method
4. Register in orchestrator

---

# Common Configuration

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
| conversationHistory | (Agent only) JSON conversation |
| aiAnalysis | (Agent only) AI analysis results |
| priority | (Agent only) high/medium/low |
| qualificationScore | (Agent only) 0-100 score |

## Google Calendar Appointment Schedule Setup

1. Go to [Google Calendar](https://calendar.google.com)
2. Click the gear icon → **Settings**
3. Select **Appointment schedules** in the left sidebar
4. Click **Create**
5. Configure:
   - Title: "AI Readiness Diagnostic"
   - Duration: 30 minutes
   - Availability: Your preferred times
6. Copy the booking link

## Security Considerations

- Store API keys in environment variables, never in code
- Use OAuth tokens (not API keys) for Google APIs
- Regularly rotate credentials
- Review agent logs for unusual activity
- Enable 2FA on all accounts

## Quotas and Limits

**Anthropic API:**
- Rate limits vary by tier
- Monitor usage in Anthropic Console

**Google APIs:**
- Sheets: 300 requests/minute
- Gmail: 250 quota units/second
- Calendar: 1,000,000 queries/day

**Gmail Sending:**
- Free: 100 emails/day
- Workspace: 2,000 emails/day

---

## Support

For questions or issues:
1. Check the Troubleshooting section in each implementation
2. Review execution/agent logs
3. Contact BizDeedz support

---

*Last Updated: January 2026*

*BizDeedz - Operational guidance for law firms. Not legal advice.*
