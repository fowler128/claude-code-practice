# Notion Integration Setup - Detailed Guide

## Overview

This guide walks you through setting up the Notion database that tracks your AI Readiness Audit leads. Notion provides a collaborative workspace where your team can view, organize, and act on leads in real-time.

**Time Required**: 7-10 minutes
**Difficulty**: Beginner to Intermediate
**Prerequisites**: Notion account with BizDeedz Operations workspace access

---

## What You'll Accomplish

By the end of this guide, you'll have:

✅ A Notion database named "AI Readiness Leads" in BizDeedz Operations
✅ Properly configured database properties for all lead data
✅ A Notion integration with API access
✅ The Database ID and API key needed for Apps Script
✅ Verified connectivity between Apps Script and Notion
✅ Custom views for filtering and organizing leads

---

## Part 1: Creating the Notion Database

### Step 1.1: Navigate to BizDeedz Operations Workspace

1. Open [notion.so](https://notion.so) and log in
2. In the left sidebar, find your workspaces
3. Click "**BizDeedz Operations**" (or your team workspace name)

![Screenshot placeholder: Notion sidebar with BizDeedz Operations workspace]

**Don't see BizDeedz Operations?**
- You may need to create it (click "+ Add a workspace" at bottom of sidebar)
- Or ask your admin to invite you to the workspace

### Step 1.2: Create New Database

1. In the BizDeedz Operations workspace, click anywhere on a page (or create a new page)
2. Type `/database` and press Enter
3. Select "**Database - Full page**" (this creates a dedicated database page)
4. Or click "**+ New page**" in sidebar → select "**Database**"

![Screenshot placeholder: Notion slash command menu with "Database - Full page" highlighted]

### Step 1.3: Name the Database

1. Click "**Untitled**" at the top
2. Rename to: `AI Readiness Leads`
3. Add an emoji icon (optional): Click the page icon → search for 🎯 or 🚀
4. The name auto-saves

![Screenshot placeholder: Notion database titled "AI Readiness Leads" with emoji]

---

## Part 2: Setting Up Database Properties

Notion databases use "properties" (like columns in a spreadsheet). We'll create properties for all lead data.

### Step 2.1: Understanding Default Properties

Every new database starts with:
- **Name** (Title property) - We'll use this for the company name
- **Tags** (Multi-select property)

We'll modify and add properties to match our lead data.

### Step 2.2: Rename the "Name" Property

1. Click the "**Name**" column header
2. Select "**Edit property**"
3. Change name to: `Company Name`
4. Click outside to save

### Step 2.3: Delete Unnecessary Properties

1. Click the "**Tags**" column header
2. Select "**Delete property**"
3. Confirm deletion

Now you have a clean slate with just "Company Name".

### Step 2.4: Add Lead Scoring Properties

Click the "**+**" button at the right of the column headers to add new properties.

**Property 1: Lead Score**
1. Click "**+**"
2. Property name: `Lead Score`
3. Property type: **Number**
4. Format: **Number** (not percent or currency)
5. Click outside to save

**Property 2: Lead Tier**
1. Click "**+**"
2. Property name: `Lead Tier`
3. Property type: **Select**
4. Add options:
   - `HIGH` (color: red or green)
   - `MEDIUM` (color: yellow or orange)
   - `LOW` (color: gray or blue)
5. Click outside to save

![Screenshot placeholder: Lead Tier property with colored options HIGH, MEDIUM, LOW]

**Property 3: Timestamp**
1. Click "**+**"
2. Property name: `Submitted`
3. Property type: **Date**
4. Include time: **Yes**
5. Click outside to save

### Step 2.5: Add Contact Information Properties

**Property 4: Email**
1. Click "**+**"
2. Property name: `Email`
3. Property type: **Email**

**Property 5: Phone**
1. Click "**+**"
2. Property name: `Phone`
3. Property type: **Phone number**

**Property 6: Contact Name**
1. Click "**+**"
2. Property name: `Contact Name`
3. Property type: **Text**

**Property 7: Role**
1. Click "**+**"
2. Property name: `Role`
3. Property type: **Text**

### Step 2.6: Add Company Information Properties

**Property 8: Company Size**
1. Click "**+**"
2. Property name: `Company Size`
3. Property type: **Select**
4. Add options:
   - `1-10 employees`
   - `10-50 employees`
   - `50-200 employees`
   - `200-1000 employees`
   - `1000+ employees`

**Property 9: Industry**
1. Click "**+**"
2. Property name: `Industry`
3. Property type: **Select** (or **Text** if you want free-form)
4. Add common options:
   - `Technology/SaaS`
   - `Healthcare`
   - `Financial Services`
   - `Retail/E-commerce`
   - `Manufacturing`
   - `Professional Services`
   - `Other`

**Property 10: Website**
1. Click "**+**"
2. Property name: `Website`
3. Property type: **URL**

### Step 2.7: Add AI Readiness Properties

**Property 11: Current AI Usage**
1. Click "**+**"
2. Property name: `Current AI Usage`
3. Property type: **Select**
4. Add options:
   - `No AI usage`
   - `Basic (ChatGPT/simple tools)`
   - `Moderate (integrated tools)`
   - `Advanced (custom AI systems)`

**Property 12: AI Challenges**
1. Click "**+**"
2. Property name: `AI Challenges`
3. Property type: **Text** (use "Long text" if available)

**Property 13: AI Goals**
1. Click "**+**"
2. Property name: `AI Goals`
3. Property type: **Text**

### Step 2.8: Add Timeline & Budget Properties

**Property 14: Timeline**
1. Click "**+**"
2. Property name: `Implementation Timeline`
3. Property type: **Select**
4. Add options:
   - `Within 3 months`
   - `3-6 months`
   - `6-12 months`
   - `Just exploring`

**Property 15: Budget**
1. Click "**+**"
2. Property name: `Budget Range`
3. Property type: **Select**
4. Add options:
   - `Under $5k/month`
   - `$5k-10k/month`
   - `$10k-25k/month`
   - `$25k-50k/month`
   - `$50k+/month`

**Property 16: Decision Authority**
1. Click "**+**"
2. Property name: `Decision Authority`
3. Property type: **Select**
4. Add options:
   - `Decision maker`
   - `Influencer`
   - `Evaluator`
   - `Individual contributor`

### Step 2.9: Add Tracking Properties

**Property 17: UTM Source**
1. Click "**+**"
2. Property name: `UTM Source`
3. Property type: **Text**

**Property 18: UTM Medium**
1. Click "**+**"
2. Property name: `UTM Medium`
3. Property type: **Text**

**Property 19: UTM Campaign**
1. Click "**+**"
2. Property name: `UTM Campaign`
3. Property type: **Text**

**Property 20: Questions/Notes**
1. Click "**+**"
2. Property name: `Questions`
3. Property type: **Text**

### Step 2.10: Review Property List

You should now have these properties (in any order):

✅ Company Name (Title)
✅ Lead Score (Number)
✅ Lead Tier (Select: HIGH/MEDIUM/LOW)
✅ Submitted (Date)
✅ Email (Email)
✅ Phone (Phone)
✅ Contact Name (Text)
✅ Role (Text)
✅ Company Size (Select)
✅ Industry (Select)
✅ Website (URL)
✅ Current AI Usage (Select)
✅ AI Challenges (Text)
✅ AI Goals (Text)
✅ Implementation Timeline (Select)
✅ Budget Range (Select)
✅ Decision Authority (Select)
✅ UTM Source (Text)
✅ UTM Medium (Text)
✅ UTM Campaign (Text)
✅ Questions (Text)

![Screenshot placeholder: Notion database showing all properties in header row]

---

## Part 3: Creating Useful Database Views

### Step 3.1: Default Table View

Your database starts with a "Table" view showing all entries.

**Customize the default view:**

1. Click the "**...**" menu at the top right of the database
2. Select "**Properties**"
3. Check/uncheck which properties to show in this view
4. Drag properties to reorder columns

**Recommended visible columns for default view:**
- Company Name
- Lead Score
- Lead Tier
- Email
- Implementation Timeline
- Budget Range
- Submitted

### Step 3.2: Create HIGH Priority View

1. Click "**+ Add a view**" next to the view tabs
2. Select "**Table**"
3. Name it: `HIGH Priority`
4. Click "**Create**"
5. Click "**Filter**" button
6. Add filter: `Lead Tier` → `Is` → `HIGH`
7. Click "**Sort**" button
8. Sort by: `Lead Score` → `Descending`

Now this view only shows HIGH tier leads sorted by score.

![Screenshot placeholder: HIGH Priority view showing filtered and sorted leads]

### Step 3.3: Create MEDIUM Nurture View

1. Click "**+ Add a view**"
2. Select "**Table**"
3. Name it: `MEDIUM Nurture`
4. Add filter: `Lead Tier` → `Is` → `MEDIUM`
5. Sort by: `Submitted` → `Descending` (newest first)

### Step 3.4: Create Board View (by Timeline)

Perfect for tracking leads by urgency:

1. Click "**+ Add a view**"
2. Select "**Board**"
3. Name it: `By Timeline`
4. Group by: `Implementation Timeline`

Now leads are organized in columns by their timeline (Within 3 months, 3-6 months, etc.)

![Screenshot placeholder: Board view with columns for each timeline option]

### Step 3.5: Create Calendar View (Optional)

See leads by submission date:

1. Click "**+ Add a view**"
2. Select "**Calendar**"
3. Name it: `Submission Calendar`
4. Show on calendar: `Submitted`

---

## Part 4: Creating a Notion Integration

To connect Google Apps Script to Notion, you need an API integration.

### Step 4.1: Access Integrations Settings

1. Click your workspace name in the sidebar
2. Select "**Settings & members**"
3. In the left menu, click "**Integrations**"

![Screenshot placeholder: Workspace settings with Integrations menu highlighted]

### Step 4.2: Create New Integration

1. Scroll to "**Develop or manage integrations**"
2. Click "**Develop your own integrations**" (or "**My integrations**")
3. This opens a new browser tab at: `https://www.notion.so/my-integrations`

![Screenshot placeholder: Notion integrations page]

### Step 4.3: Create Integration

1. Click "**+ New integration**"
2. Fill out the form:
   - **Name**: `AI Readiness Audit Integration`
   - **Logo**: Upload BizDeedz logo (optional)
   - **Associated workspace**: Select **BizDeedz Operations**
3. Click "**Submit**"

![Screenshot placeholder: Create integration form filled out]

### Step 4.4: Configure Integration Capabilities

On the integration settings page:

1. Under "**Capabilities**", ensure these are enabled:
   - ✅ **Read content**: Yes
   - ✅ **Update content**: Yes
   - ✅ **Insert content**: Yes
2. Under "**Content Capabilities**", check:
   - ✅ **No user information**: Enabled (for privacy)
3. Click "**Save changes**"

### Step 4.5: Copy Your API Key

1. Under "**Secrets**" section, you'll see "**Internal Integration Token**"
2. Click "**Show**" then "**Copy**"
3. Your token looks like: `secret_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0`
4. **Save this somewhere safe** - you'll need it for Apps Script CONFIG

![Screenshot placeholder: Integration secrets section with token visible]

⚠️ **Security Warning**: This token gives full access to your Notion workspace. Keep it confidential. Never commit it to GitHub or share publicly.

---

## Part 5: Connecting Database to Integration

### Step 5.1: Share Database with Integration

The integration needs explicit access to your database:

1. Go back to your "**AI Readiness Leads**" database in Notion
2. Click the "**...**" menu (top right)
3. Scroll down and click "**Add connections**"
4. In the search box, type: `AI Readiness Audit Integration`
5. Click your integration to add it
6. You'll see "Connected to 1 integration" at the top of the database

![Screenshot placeholder: Add connections menu with integration selected]

**Without this step, Apps Script cannot write to your database!**

### Step 5.2: Get Your Database ID

You need the Database ID for Apps Script configuration.

**Method 1: From Full Page View (Easiest)**

1. Open your database as a full page
2. Look at the URL in your browser:
   ```
   https://www.notion.so/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6?v=...
   ```
3. Copy the string between `.so/` and `?v=` (or before the end if no `?v=`)
   - In the example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
4. Remove any hyphens: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

![Screenshot placeholder: Browser URL with database ID highlighted]

**Method 2: From Inline Database**

If the database is embedded on a page:

1. Click the "**...**" menu on the database
2. Select "**Copy link to view**"
3. Paste the link somewhere - it looks like:
   ```
   https://www.notion.so/workspace/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6?v=...
   ```
4. Extract the ID between the last `/` and `?v=`

**Your Database ID** (save this):
```
_________________________________
```

---

## Part 6: Testing the Notion Connection

### Step 6.1: Update Apps Script CONFIG

1. Open your Google Apps Script project
2. Find the CONFIG object at the top
3. Add your Notion credentials:

```javascript
const CONFIG = {
  // ... other settings
  notionApiKey: 'secret_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  notionDatabaseId: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
  // ... other settings
};
```

4. Click "**Save**" (Ctrl+S / Cmd+S)

### Step 6.2: Run Configuration Test

1. In Apps Script, select function: `testConfiguration`
2. Click "**Run**"
3. Check the execution log

**Expected output:**
```
✅ Notion API: Connected (Database: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6)
```

**If you see an error:**
- `401 Unauthorized`: Wrong API key or database not shared with integration
- `404 Not Found`: Wrong Database ID
- `403 Forbidden`: Integration doesn't have permission

### Step 6.3: Run Full Test with Sample Data

1. Select function: `testWithSampleData`
2. Click "**Run**"
3. Check execution log for: `✅ Logged to Notion`

### Step 6.4: Verify in Notion

1. Go back to your "AI Readiness Leads" Notion database
2. You should see a new entry for "Test Company Inc"
3. Verify all properties are filled correctly:
   - Lead Score: 88
   - Lead Tier: HIGH
   - Email: test@testcompany.com
   - etc.

![Screenshot placeholder: Notion database with test entry visible]

**If the entry appears, your integration is working!** ✅

---

## Part 7: Customizing Database Layout

### Step 7.1: Reorder Properties

Drag properties to organize them logically:

1. Click "**...**" → "**Properties**"
2. Drag properties in this recommended order:
   - Lead Score
   - Lead Tier
   - Company Name
   - Contact Name
   - Email
   - Phone
   - Company Size
   - Industry
   - Implementation Timeline
   - Budget Range
   - (rest of properties)

### Step 7.2: Add Color to Lead Tiers

Make HIGH/MEDIUM/LOW visually distinct:

1. Click a cell in the "Lead Tier" column
2. Select the tier (e.g., HIGH)
3. Click the color swatch next to the option name
4. Choose a color:
   - **HIGH**: Red or Green (bright)
   - **MEDIUM**: Yellow or Orange
   - **LOW**: Gray or Blue (muted)

Now the Lead Tier column is color-coded.

### Step 7.3: Add Database Description

Help your team understand the database:

1. Click the "**...**" menu → "**Customize page**"
2. Toggle on "**Page description**"
3. Add description:
   ```
   AI Readiness Audit lead submissions. Leads are automatically scored (0-100) and categorized as HIGH (75+), MEDIUM (50-74), or LOW (<50). Check the HIGH Priority view daily for immediate follow-up.
   ```
4. Click outside to save

![Screenshot placeholder: Database with description visible below title]

### Step 7.4: Create Database Icon

Add visual appeal:

1. Click the page icon at the top (or "Add icon" if none)
2. Search for: `target` or `rocket` or `chart`
3. Select an emoji: 🎯 or 🚀 or 📊
4. Click outside to save

---

## Part 8: Setting Up Team Access

### Step 8.1: Add Team Members to Workspace

1. In the sidebar, click your workspace name → "**Settings & members**"
2. Click "**Members**" in the left menu
3. Click "**Invite**"
4. Enter email addresses:
   - jessa@bizdeedz.com
   - info@bizdeedz.com
   - (other team members)
5. Set role: **Member** (can edit) or **Guest** (specific page access only)
6. Click "**Invite**"

![Screenshot placeholder: Invite members dialog]

### Step 8.2: Set Database Permissions

Control who can edit the database:

1. Open "AI Readiness Leads" database
2. Click "**...**" → "**Customize page**"
3. Toggle on "**Editing**" section
4. Options:
   - **Everyone**: All workspace members can edit (recommended for team databases)
   - **Only you**: Only you can edit (use for sensitive data)
   - **Specific people**: Select individuals

5. Toggle on "**Lock database**" if you want to prevent accidental deletion

---

## Part 9: Creating Notion Automations (Optional)

### Step 9.1: Create Slack Alert for HIGH Leads

If you use Slack:

1. Install the Notion Slack integration
2. In your database, click "**...**" → "**Automate**"
3. Create rule:
   - **When**: New item added
   - **And**: Lead Tier is HIGH
   - **Then**: Send to Slack channel #sales

### Step 9.2: Add Automatic Status Property

Track follow-up progress:

1. Add new property: `Status` (Select type)
2. Options: New, Contacted, Qualified, Converted, Lost
3. Use automation to set new entries to "New":
   - **When**: New item added
   - **Then**: Set Status to "New"

---

## Troubleshooting

### Issue: "Connection failed: 401 Unauthorized"

**Cause**: API key is incorrect or integration doesn't have access

**Fix:**
1. Verify API key is copied correctly (no extra spaces)
2. Check database is shared with integration:
   - Open database → "..." → "Add connections" → add your integration
3. Regenerate API key if needed

### Issue: "Connection failed: 404 Not Found"

**Cause**: Database ID is incorrect

**Fix:**
1. Re-copy Database ID from URL
2. Remove any hyphens from the ID
3. Ensure you're copying from the database page URL, not a parent page

### Issue: "Connection failed: 403 Forbidden"

**Cause**: Integration doesn't have required capabilities

**Fix:**
1. Go to notion.so/my-integrations
2. Select your integration
3. Under Capabilities, enable:
   - Read content
   - Update content
   - Insert content
4. Save changes

### Issue: Properties not populating correctly

**Cause**: Property names in Notion don't match what Apps Script expects

**Fix:**
1. Check property names exactly match (case-sensitive):
   - "Lead Score" not "Score"
   - "Lead Tier" not "Tier"
2. Update Apps Script `logToNotion()` function if you renamed properties

### Issue: Entries appearing but data is blank

**Cause**: Property types might not match data format

**Fix:**
1. Verify property types:
   - Numbers should be "Number" type
   - Emails should be "Email" type
   - Dates should be "Date" type
2. Check Apps Script logs for property-specific errors

---

## Best Practices

### Do's ✅

- **Use views**: Create filtered views for different team needs
- **Add descriptions**: Help team understand each view's purpose
- **Color code**: Use colors consistently across properties
- **Backup regularly**: Export database monthly (⋮ → Export)
- **Review permissions**: Ensure only necessary people have edit access

### Don't's ❌

- **Don't rename database**: Apps Script looks for "AI Readiness Leads" specifically
- **Don't delete properties**: Apps Script expects all properties to exist
- **Don't make database private**: Integration needs access
- **Don't share API key**: Keep integration token confidential
- **Don't overwhelm with properties**: Hide properties team doesn't need in views

---

## Advanced Features

### Creating Rollup Views

Aggregate data across leads:

1. Create new page with heading "Lead Dashboard"
2. Add "Linked view" of your database
3. Add formulas:
   - **Total Leads**: Count all entries
   - **Avg Score by Tier**: Rollup Lead Score by Lead Tier
   - **Conversion Rate**: % of leads marked "Converted"

### Setting Up Relations

Link to other databases:

1. Create "Companies" database with all clients/prospects
2. Add "Related Company" property (Relation type) in AI Readiness Leads
3. Link leads to existing company entries for historical context

### Using Templates for Follow-Up

Create follow-up templates:

1. Click "**...**" → "**New template**"
2. Create template: "HIGH Lead Follow-Up"
3. Include:
   - Email template
   - Call script
   - Qualification questions
4. Team can apply template when following up

---

## Maintenance Schedule

### Daily
- ✅ Check HIGH Priority view for new leads
- ✅ Assign HIGH leads to sales team

### Weekly
- ✅ Review MEDIUM Nurture view
- ✅ Update lead statuses (New → Contacted → Qualified)
- ✅ Archive converted/lost leads

### Monthly
- ✅ Analyze tier distribution and conversion rates
- ✅ Clean up old LOW tier leads
- ✅ Export database backup
- ✅ Review and update views based on team feedback

---

## Notion Integration Checklist

Before going live, verify:

- ✅ Database named "AI Readiness Leads" in BizDeedz Operations workspace
- ✅ All 20+ properties created with correct names and types
- ✅ Notion integration created with proper capabilities
- ✅ Database shared with integration (Add connections)
- ✅ API key copied and saved securely
- ✅ Database ID copied and saved
- ✅ Apps Script CONFIG updated with Notion credentials
- ✅ Test submission successfully created entry in Notion
- ✅ Team members invited and have access
- ✅ Views created for HIGH, MEDIUM, and different use cases

---

## Next Steps

1. **Update Apps Script**: Add your API key and Database ID to CONFIG
2. **Test integration**: Run testWithSampleData() and verify entry appears
3. **Create custom views**: Set up views your team needs
4. **Train team**: Show them how to use filters, views, and properties
5. **Set up notifications**: Configure Slack or email alerts for HIGH leads

---

## Support & Resources

### Notion Documentation
- [Notion API Documentation](https://developers.notion.com)
- [Database Guide](https://www.notion.so/help/guides/creating-a-database)
- [Integrations Help](https://www.notion.so/help/guides/what-are-integrations)

### Related Setup Guides
- [Google Apps Script Setup](SETUP_GOOGLE_APPS_SCRIPT_DETAILED.md)
- [Google Sheets Setup](SETUP_GOOGLE_SHEET_DETAILED.md)
- [GitHub Integration](SETUP_GITHUB_DETAILED.md)

---

**Congratulations!** Your Notion database is now ready to track and organize AI Readiness Audit leads collaboratively! 🚀

---

**Last Updated**: January 21, 2026
**Version**: 1.0
**Estimated Setup Time**: 7-10 minutes
