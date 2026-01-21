# Google Sheets Setup - Detailed Guide

## Overview

This guide walks you through creating and configuring the Google Sheet that stores all your AI Readiness Audit lead submissions. The Sheet automatically organizes leads by tier (HIGH/MEDIUM/LOW) and provides visual indicators for quick assessment.

**Time Required**: 5-7 minutes
**Difficulty**: Beginner-friendly
**Prerequisites**: Google account with BizDeedz workspace access

---

## What You'll Accomplish

By the end of this guide, you'll have:

✅ A Google Sheet named "AI Readiness Audit Leads"
✅ Four organized tabs: All Leads, HIGH, MEDIUM, LOW
✅ Properly formatted columns for all lead data
✅ Color-coded conditional formatting for easy scanning
✅ Shared access for your team
✅ The Sheet ID needed for Apps Script configuration

---

## Part 1: Creating the Spreadsheet

### Step 1.1: Create New Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Make sure you're logged into your **BizDeedz Google account**
3. Click the "**+ Blank**" button (or "Blank spreadsheet")

![Screenshot placeholder: Google Sheets home with "+ Blank" button highlighted]

### Step 1.2: Name Your Spreadsheet

1. Click "**Untitled spreadsheet**" at the top left
2. Rename it to: `AI Readiness Audit Leads`
3. The name will auto-save

![Screenshot placeholder: Spreadsheet title field with "AI Readiness Audit Leads" entered]

**Why this name?** It's descriptive and makes it easy to find in your Google Drive later.

---

## Part 2: Creating the Tab Structure

### Step 2.1: Rename First Tab

By default, you have one tab called "Sheet1".

1. **Right-click** the "Sheet1" tab at the bottom
2. Select "**Rename**"
3. Type: `All Leads`
4. Press Enter

![Screenshot placeholder: Right-click menu on sheet tab with "Rename" option highlighted]

### Step 2.2: Create HIGH Tab

1. Click the "**+**" button at the bottom left (next to the tab name)
2. A new sheet appears called "Sheet2"
3. **Right-click** the "Sheet2" tab
4. Select "**Rename**"
5. Type: `HIGH`
6. Press Enter

### Step 2.3: Create MEDIUM Tab

1. Click the "**+**" button again
2. Rename the new sheet to: `MEDIUM`

### Step 2.4: Create LOW Tab

1. Click the "**+**" button again
2. Rename the new sheet to: `LOW`

**You should now see four tabs at the bottom:**
- All Leads
- HIGH
- MEDIUM
- LOW

![Screenshot placeholder: Bottom of spreadsheet showing four tabs: All Leads, HIGH, MEDIUM, LOW]

---

## Part 3: Setting Up Column Headers

### Step 3.1: Add Headers to "All Leads" Tab

1. Click the "**All Leads**" tab to select it
2. Click cell **A1**
3. Type the following headers across row 1 (press Tab after each to move to the next cell):

| Column | Header Name |
|--------|-------------|
| A | Timestamp |
| B | Lead Score |
| C | Lead Tier |
| D | First Name |
| E | Last Name |
| F | Email |
| G | Phone |
| H | Company Name |
| I | Company Size |
| J | Industry |
| K | Website |
| L | Role |
| M | Decision Authority |
| N | Current AI Usage |
| O | AI Challenges |
| P | AI Goals |
| Q | Implementation Timeline |
| R | Budget Range |
| S | Success Metrics |
| T | Questions |
| U | How Heard |
| V | UTM Source |
| W | UTM Medium |
| X | UTM Campaign |

**Quick Copy/Paste Option:**

Copy this line and paste it into cell A1:
```
Timestamp	Lead Score	Lead Tier	First Name	Last Name	Email	Phone	Company Name	Company Size	Industry	Website	Role	Decision Authority	Current AI Usage	AI Challenges	AI Goals	Implementation Timeline	Budget Range	Success Metrics	Questions	How Heard	UTM Source	UTM Medium	UTM Campaign
```

(This is tab-separated - paste and it should spread across columns automatically)

![Screenshot placeholder: Row 1 filled with all column headers from A to X]

### Step 3.2: Format Header Row

Make the headers stand out:

1. Select the entire row 1 (click the "**1**" on the left)
2. Click "**Format**" in the menu → "**Text**" → "**Bold**"
3. With row 1 still selected, click the paint bucket icon → choose a light gray color
4. (Optional) Click "**Format**" → "**Text**" → "**Size**" → "10" to make headers slightly smaller

![Screenshot placeholder: Formatted header row with bold text and gray background]

### Step 3.3: Freeze Header Row

Keep headers visible when scrolling:

1. Click "**View**" in the menu
2. Select "**Freeze**" → "**1 row**"
3. You'll see a gray line appear below row 1

Now when you scroll down, the headers stay at the top.

### Step 3.4: Copy Headers to Other Tabs

We need the same headers in HIGH, MEDIUM, and LOW tabs.

1. With row 1 still selected in "All Leads", press **Ctrl+C** (or Cmd+C on Mac)
2. Click the "**HIGH**" tab
3. Click cell **A1**
4. Press **Ctrl+V** (or Cmd+V) to paste
5. Repeat for "**MEDIUM**" tab (click tab, click A1, paste)
6. Repeat for "**LOW**" tab (click tab, click A1, paste)

**All four tabs should now have identical headers.** ✅

---

## Part 4: Adding Conditional Formatting

### Step 4.1: Color Code Lead Tiers in "All Leads" Tab

We'll color the "Lead Tier" column (column C) based on its value.

1. Click the "**All Leads**" tab
2. Click cell **C2** (first data cell under "Lead Tier")
3. Click and drag down to **C1000** (or just type `C2:C1000` in the name box and press Enter)
   - This selects a range large enough for future leads

![Screenshot placeholder: Column C selected from C2 to C1000]

4. Click "**Format**" in the menu → "**Conditional formatting**"
5. The conditional formatting panel opens on the right

### Step 4.2: Add HIGH Tier Formatting

In the conditional formatting panel:

1. Under "Format cells if...", select "**Text is exactly**"
2. In the value field, type: `HIGH`
3. Click the formatting style preview
4. Under "Background color", choose a **light red** or **light green** (your preference)
5. Under "Text color", choose **dark red** or **dark green** to match
6. Click "**Done**"

![Screenshot placeholder: Conditional formatting panel showing rule for "HIGH" with color settings]

### Step 4.3: Add MEDIUM Tier Formatting

1. Click "**+ Add another rule**" in the conditional formatting panel
2. Make sure the range is still `C2:C1000`
3. Under "Format cells if...", select "**Text is exactly**"
4. In the value field, type: `MEDIUM`
5. Choose **light yellow** or **light orange** for background
6. Choose **dark yellow** or **dark orange** for text
7. Click "**Done**"

### Step 4.4: Add LOW Tier Formatting

1. Click "**+ Add another rule**"
2. Range: `C2:C1000`
3. "Text is exactly": `LOW`
4. Choose **light gray** or **light blue** for background
5. Choose **dark gray** or **dark blue** for text
6. Click "**Done**"

**Now column C will automatically color-code based on tier!** 🎨

![Screenshot placeholder: Example rows showing HIGH in green, MEDIUM in yellow, LOW in gray]

### Step 4.5: Add Score Color Gradient (Optional)

For a visual heat map of scores:

1. Click the "**All Leads**" tab
2. Select range **B2:B1000** (the "Lead Score" column)
3. Click "**Format**" → "**Conditional formatting**"
4. Under "Format cells if...", select "**Color scale**"
5. Set:
   - Minimum: White (score 0)
   - Midpoint: Yellow (score 50)
   - Maximum: Green (score 100)
6. Click "**Done**"

Now scores will have a gradient from white (low) to green (high).

---

## Part 5: Configuring Individual Tier Tabs

### Step 5.1: Set Up HIGH Tab

The HIGH tab only shows high-priority leads (score 75+).

1. Click the "**HIGH**" tab
2. The headers are already there from Step 3.4
3. Color the tab for quick identification:
   - Right-click the "HIGH" tab
   - Select "**Change color**"
   - Choose **red** or **green**

### Step 5.2: Set Up MEDIUM Tab

1. Click the "**MEDIUM**" tab
2. Right-click the tab → "**Change color**" → **yellow** or **orange**

### Step 5.3: Set Up LOW Tab

1. Click the "**LOW**" tab
2. Right-click the tab → "**Change color**" → **gray** or **blue**

![Screenshot placeholder: Four tabs with different colors at the bottom]

**Note**: The Apps Script automatically writes to the appropriate tier tab based on lead score. You don't need to set up formulas - it's handled in the backend.

---

## Part 6: Adjusting Column Widths

### Step 6.1: Auto-Resize All Columns

Make columns fit their content:

1. Click the "**All Leads**" tab
2. Click the rectangle in the top-left corner (above row 1, left of column A)
   - This selects the entire sheet
3. Double-click the line between any two column letters (e.g., between A and B)
4. All columns auto-resize to fit their content

Repeat for HIGH, MEDIUM, and LOW tabs.

### Step 6.2: Manual Width Adjustments (Optional)

Some columns might need custom widths:

**Narrow columns** (only need ~80-100px):
- Timestamp
- Lead Score
- Lead Tier
- First Name
- Last Name
- Phone

**Medium columns** (~150-200px):
- Email
- Company Name
- Industry
- Role

**Wide columns** (~250-300px):
- AI Challenges
- AI Goals
- Success Metrics
- Questions

To adjust:
1. Click and drag the line between column letters
2. Or right-click column letter → "Resize column" → enter pixel width

---

## Part 7: Sharing with Your Team

### Step 7.1: Open Sharing Settings

1. Click the "**Share**" button (top right)
2. The sharing dialog opens

![Screenshot placeholder: Share button in top right corner]

### Step 7.2: Add Team Members

Add each team member who needs access:

1. In the "Add people and groups" field, type: `jessa@bizdeedz.com`
2. Click the dropdown next to their name (defaults to "Viewer")
3. Select "**Editor**" (so they can add notes, update leads, etc.)
4. Click "Send"

Repeat for:
- `info@bizdeedz.com`
- Any other team members who need access

![Screenshot placeholder: Sharing dialog with email addresses and "Editor" permission selected]

### Step 7.3: Set Link Sharing (Optional)

If you want anyone at BizDeedz to view:

1. In the sharing dialog, under "General access"
2. Click "Restricted" → "Change"
3. Select "**Anyone at BizDeedz with the link**"
4. Set permission to "**Viewer**" or "**Editor**"
5. Click "Done"

**Security Note**: Don't set to "Anyone with the link" unless you want the data publicly accessible.

---

## Part 8: Getting Your Sheet ID

### Step 8.1: Copy Sheet ID from URL

You need the Sheet ID to configure Google Apps Script.

1. Look at the URL in your browser's address bar
2. It looks like:
   ```
   https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P/edit#gid=0
   ```
3. Copy the long string between `/d/` and `/edit`
   - In the example above: `1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P`
4. **Save this ID** - you'll need it for Apps Script CONFIG

![Screenshot placeholder: Browser address bar with Sheet ID highlighted]

**Your Sheet ID** (write it here for reference):
```
_________________________________
```

### Step 8.2: Test Sheet ID

To verify you copied it correctly:

1. Open a new browser tab
2. Paste this URL, replacing `YOUR_SHEET_ID` with what you copied:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/edit
   ```
3. Press Enter
4. Your spreadsheet should open

If it says "File not found", you copied the wrong part of the URL.

---

## Part 9: Setting Up Notifications (Optional)

### Step 9.1: Enable Email Notifications for New Submissions

Get emailed when new leads are added:

1. Click "**Tools**" in the menu
2. Select "**Notification rules**"
3. Click "**Add a rule**"
4. Configure:
   - "Notify me when..." → "**Any changes are made**"
   - "Notify me with..." → "**Email - daily digest**" (or "right away" for immediate alerts)
5. Click "**Save**"

![Screenshot placeholder: Notification rules dialog with options selected]

**Why daily digest?** You'll also get email alerts from the Apps Script for HIGH/MEDIUM leads, so a daily Sheet digest prevents notification overload.

### Step 9.2: Set Up Sheet Protection (Optional)

Prevent accidental deletion of headers:

1. Click "**Data**" in the menu
2. Select "**Protect sheets and ranges**"
3. Click "**+ Add a sheet or range**"
4. Select "**Range**"
5. Enter: `All Leads!1:1` (this is row 1 of All Leads tab)
6. Click "**Set permissions**"
7. Select "**Only you**" (or choose specific team members who can edit)
8. Click "**Done**"

Repeat for HIGH!1:1, MEDIUM!1:1, and LOW!1:1

Now headers can't be accidentally deleted or changed.

---

## Part 10: Adding Data Validation (Optional)

### Step 10.1: Validate Lead Tier Column

Ensure only valid tier values are entered:

1. Go to "All Leads" tab
2. Select cells **C2:C1000** (Lead Tier column)
3. Click "**Data**" in menu → "**Data validation**"
4. Under "Criteria", select "**Dropdown (from a range)**"
5. Click "Add another item" and enter:
   - HIGH
   - MEDIUM
   - LOW
6. Check "**Show dropdown list in cell**"
7. Check "**Reject input**" for invalid data
8. Click "**Save**"

![Screenshot placeholder: Data validation dialog with dropdown options HIGH, MEDIUM, LOW]

Now if someone manually types in column C, they can only choose from the dropdown.

### Step 10.2: Validate Email Column

Ensure emails are properly formatted:

1. Select cells **F2:F1000** (Email column)
2. Click "**Data**" → "**Data validation**"
3. Under "Criteria", select "**Text**" → "**Contains**"
4. Enter: `@`
5. Check "**Reject input**"
6. Click "**Save**"

This ensures all entries in the Email column contain an @ symbol.

---

## Part 11: Creating Useful Views

### Step 11.1: Sort by Score (Descending)

See your best leads first:

1. Go to "All Leads" tab
2. Click any cell in the data range
3. Click "**Data**" in menu → "**Sort range**" → "**Advanced range sorting options**"
4. Check "**Data has header row**"
5. Sort by: "**Lead Score**" → **Z → A** (descending)
6. Click "**Sort**"

Now leads with highest scores appear at the top.

### Step 11.2: Filter by Timeline

See leads ready to move soon:

1. Click any cell in the data range
2. Click the "**Create a filter**" icon (funnel icon in toolbar)
3. Click the filter dropdown on column **Q** (Implementation Timeline)
4. Uncheck "Select all"
5. Check only: "Within 3 months" and "1-3 months"
6. Click "**OK**"

Now you only see leads with urgent timelines.

### Step 11.3: Create Filter Views for Team

Save common filters for your team:

1. Click "**Data**" in menu → "**Filter views**" → "**Create new filter view**"
2. Set up filters (e.g., HIGH tier + 3-month timeline + Tech industry)
3. Click the three dots (top right of filter view bar)
4. Select "**Name this filter view**"
5. Enter: `High Priority - Tech - Urgent`
6. Anyone with access can now select this view from the Data menu

---

## Part 12: Testing the Sheet

### Step 12.1: Add Test Data Manually

Before connecting Apps Script, test the Sheet:

1. Go to "All Leads" tab
2. Click cell **A2** (first data row)
3. Enter test data:

| Column | Test Value |
|--------|------------|
| Timestamp | 1/21/2026 14:30 |
| Lead Score | 88 |
| Lead Tier | HIGH |
| First Name | John |
| Last Name | Doe |
| Email | john@testcompany.com |
| Company Name | Test Company Inc |
| ... | (fill in remaining columns) |

### Step 12.2: Verify Conditional Formatting

- Column C (Lead Tier) should be colored based on "HIGH"
- Column B (Lead Score) should show gradient color
- Everything should look clean and readable

### Step 12.3: Copy to Tier Tab

1. Select the entire row 2 (click the "2" on the left)
2. Press **Ctrl+C** (Cmd+C)
3. Go to "HIGH" tab
4. Click cell A2
5. Press **Ctrl+V** (Cmd+V)

The test lead should appear in the HIGH tab with formatting intact.

**Delete the test data after verification:**
- Select rows 2 in both tabs
- Right-click → "Delete row"

---

## Troubleshooting

### Issue: Headers disappeared or were overwritten

**Fix:**
1. Click "**Edit**" in menu → "**Undo**" (or Ctrl+Z)
2. If that doesn't work, re-enter headers from Step 3.1
3. Set up header protection (Part 9.2) to prevent this

### Issue: Conditional formatting not working

**Fix:**
1. Click "**Format**" → "**Conditional formatting**"
2. Check that rules exist in the right panel
3. Verify the range is correct (C2:C1000, not C1:C1000)
4. Make sure "Text is exactly" is selected (not "Text contains")

### Issue: Can't share with team members

**Fix:**
1. Verify email addresses are correct (no typos)
2. Check that they have Google accounts
3. Ask them to check spam folder for the sharing invitation
4. Try using "Get link" and sending the link directly

### Issue: Sheet ID not working in Apps Script

**Fix:**
1. Re-copy the Sheet ID from the URL
2. Make sure you didn't include `https://` or `/edit`
3. Sheet ID should be 40-45 characters long
4. Should only contain letters, numbers, and underscores/hyphens

### Issue: Data not appearing when submitted from form

**Fix:**
1. Check Apps Script "Executions" log for errors
2. Verify Sheet ID in Apps Script CONFIG matches exactly
3. Make sure Apps Script has been authorized (run testConfiguration)
4. Check that Sheet hasn't been deleted or moved

---

## Best Practices

### Do's ✅

- **Back up regularly**: File → Make a copy → save with date
- **Use filter views**: Create saved views for common searches
- **Protect headers**: Prevent accidental changes
- **Review weekly**: Check for data quality issues
- **Archive old leads**: Move leads older than 6 months to an "Archive" tab

### Don'ts ❌

- **Don't delete columns**: Apps Script expects specific columns
- **Don't rename tabs**: Apps Script writes to "All Leads", "HIGH", "MEDIUM", "LOW" exactly
- **Don't manually edit scores**: Let the algorithm calculate them
- **Don't share publicly**: Keep lead data private to your team
- **Don't skip backups**: One accidental delete can lose all data

---

## Maintenance Schedule

### Daily
- ✅ Review new HIGH tier leads in "HIGH" tab
- ✅ Verify no submission errors in "All Leads" tab

### Weekly
- ✅ Sort by most recent and review all new leads
- ✅ Check for duplicate submissions (same email)
- ✅ Update any lead status notes in column Y (if you add a status column)

### Monthly
- ✅ Archive leads older than 90 days to a separate tab
- ✅ Analyze tier distribution (% HIGH vs MEDIUM vs LOW)
- ✅ Review conversion rates by tier
- ✅ Adjust scoring thresholds in Apps Script if needed

---

## Advanced Features

### Adding Custom Columns

To track additional data:

1. Insert a new column (right-click column letter → "Insert 1 left")
2. Add header name (e.g., "Status", "Assigned To", "Follow-Up Date")
3. Update Apps Script if you want form to capture this data

**Popular custom columns:**
- Status (New, Contacted, Qualified, Lost)
- Assigned Sales Rep
- Follow-Up Date
- Notes
- Last Contact Date
- Conversion Status

### Creating Charts and Dashboards

Visual analysis:

1. Select data range
2. Click "**Insert**" → "**Chart**"
3. Choose chart type (pie chart for tier distribution, line chart for leads over time)
4. Customize and place on a new "Dashboard" tab

**Useful charts:**
- Pie chart: % of leads by tier
- Column chart: Leads per week
- Bar chart: Leads by industry
- Timeline: Score trends over time

### Connecting to Google Data Studio

For advanced reporting:

1. Go to [datastudio.google.com](https://datastudio.google.com)
2. Create new report
3. Add data source → Google Sheets
4. Select your "AI Readiness Audit Leads" sheet
5. Build interactive dashboards with filters and visualizations

---

## Sheet Configuration Checklist

Before connecting to Apps Script, verify:

- ✅ Sheet named "AI Readiness Audit Leads"
- ✅ Four tabs: All Leads, HIGH, MEDIUM, LOW
- ✅ Headers in row 1 of all tabs (24 columns from Timestamp to UTM Campaign)
- ✅ Conditional formatting on Lead Tier column (C2:C1000)
- ✅ Tabs are color-coded (optional but helpful)
- ✅ Sheet shared with team members
- ✅ Sheet ID copied and saved
- ✅ Test data successfully added and appears correctly

---

## Next Steps

1. **Copy your Sheet ID**: You'll need it for Google Apps Script setup
2. **Set up Apps Script**: See [SETUP_GOOGLE_APPS_SCRIPT_DETAILED.md](SETUP_GOOGLE_APPS_SCRIPT_DETAILED.md)
3. **Test integration**: Submit a test form and verify data appears in Sheet
4. **Train your team**: Show them how to use filters and views
5. **Monitor daily**: Check for new leads and any data issues

---

## Support & Resources

### Google Sheets Documentation
- [Google Sheets Help Center](https://support.google.com/docs/topic/9054603)
- [Conditional Formatting Guide](https://support.google.com/docs/answer/78413)
- [Sharing and Permissions](https://support.google.com/docs/answer/2494822)

### Related Setup Guides
- [Google Apps Script Setup](SETUP_GOOGLE_APPS_SCRIPT_DETAILED.md)
- [Notion Integration](SETUP_NOTION_DETAILED.md)
- [GitHub Integration](SETUP_GITHUB_DETAILED.md)

---

**Congratulations!** Your Google Sheet is now ready to receive and organize AI Readiness Audit leads! 📊

---

**Last Updated**: January 21, 2026
**Version**: 1.0
**Estimated Setup Time**: 5-7 minutes
