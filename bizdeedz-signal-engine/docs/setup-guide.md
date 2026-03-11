# BizDeedz Signal Engine — Setup Guide

## Prerequisites

- n8n instance (self-hosted or n8n Cloud)
- Google account with Sheets API enabled
- OpenAI API key (for classifier)
- Anthropic API key (for digest)
- Apify account (for Reddit scraper)
- Gmail account for sending emails

---

## Step 1: Clone / Copy Project Files

Copy the project into your working directory. The folder structure should be:

```
bizdeedz-signal-engine/
  config/
  prompts/
  scripts/
  n8n/
  docs/
  .env.example
  README.md
  CLAUDE.md
```

---

## Step 2: Configure Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

Required values:

```
EMAIL_PRIMARY=tureasimpson@gmail.com
EMAIL_SECONDARY=info@bizdeedz.com

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

APIFY_API_TOKEN=apify_api_...

GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

TIMEZONE=America/Chicago
```

In n8n, set these as environment variables in your n8n instance settings, or use n8n's built-in credential system.

---

## Step 3: Set Up Google Sheets

1. Create a new Google Spreadsheet
2. Name the first sheet: `High_Value_Signals`
3. Add headers in row 1 (columns A through S):

```
captured_at | source | source_type | title | url | author | published_at | matched_keywords | lane | signal_type | keyword_cluster | score | confidence | summary | why_it_matters | recommended_action | status | notes | dedupe_hash
```

4. Copy the Spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/[THIS_IS_YOUR_ID]/edit`

5. Enable the Google Sheets API in Google Cloud Console
6. Create a Service Account and download the JSON key
7. Share the spreadsheet with the service account email

See `docs/google-sheets-schema.md` for full column descriptions.

---

## Step 4: Set Up Apify

1. Create an account at [apify.com](https://apify.com)
2. Go to Settings → Integrations → API token
3. Copy your API token to `APIFY_API_TOKEN`
4. The workflow uses the `trudax/reddit-scraper-lite` actor
5. No additional configuration needed — the actor is called via API

---

## Step 5: Set Up RSS Feeds

RSS feeds are configured in `config/rss-feeds.json`.

The default V1 feeds are:
- Artificial Lawyer
- LawSites
- Legal Tech Trends
- LawDroid Manifesto
- Legal Evolution

To add a feed, add an entry to the `feeds` array with `"active": true`.

In n8n, the RSS Feed Read node accepts comma-separated URLs. Set the `RSS_FEED_URLS` environment variable with all active feed URLs joined by commas, or update the node directly.

---

## Step 6: Configure n8n Credentials

In n8n, create these credentials:

### OpenAI
- Name: `OpenAI`
- API Key: your OpenAI key

### Anthropic
- Name: `Anthropic`
- API Key: your Anthropic key

### Google Sheets
- Name: `Google Sheets`
- Authentication: Service Account
- Email: your service account email
- Private Key: your service account private key

### Gmail
- Name: `Gmail`
- Authentication: OAuth2 or App Password
- If using App Password: set `GMAIL_USER` and `GMAIL_APP_PASSWORD` env vars

---

## Step 7: Import n8n Workflows

1. Open your n8n instance
2. Go to Workflows → Import
3. Import each workflow JSON file:
   - `n8n/daily_collector.workflow.json`
   - `n8n/daily_digest.workflow.json`
   - `n8n/weekly_report.workflow.json` (scaffold, do not activate)

4. Open each imported workflow and:
   - Verify credential assignments on each node
   - Set the Google Sheets Spreadsheet ID
   - Activate the workflow

---

## Step 8: Test the Workflows

### Test Collector (manual run)
1. Open `BizDeedz — Daily Collector`
2. Click "Execute Workflow" to run manually
3. Check that items appear in Google Sheets High_Value_Signals tab
4. If no items appear, check: API tokens, keyword config, rule score threshold

### Test Digest (manual run)
1. Ensure at least one row exists in High_Value_Signals with today's date
2. Open `BizDeedz — Daily Digest`
3. Click "Execute Workflow"
4. Check inbox for digest email

### Common Issues

| Problem | Solution |
|---------|---------|
| No Reddit posts collected | Check APIFY_API_TOKEN, verify actor ID |
| No items passing filter | Lower rule_score_threshold in config/scoring.json |
| Classifier returns error | Check OPENAI_API_KEY, verify model name in config/models.json |
| Digest not sending | Check Gmail credential, verify EMAIL_PRIMARY/SECONDARY env vars |
| Google Sheets not writing | Check service account permissions, verify spreadsheet ID |

---

## Step 9: Activate Schedules

Once manual tests pass:

1. Activate `BizDeedz — Daily Collector` (7:00 AM Central)
2. Activate `BizDeedz — Daily Digest` (7:20 AM Central)
3. Leave `BizDeedz — Weekly Report` inactive (Phase 2)

---

## Customization After Setup

See `CLAUDE.md` for guidance on:
- Updating keywords
- Adding RSS feeds
- Changing models
- Modifying prompts
- Extending the workflows
