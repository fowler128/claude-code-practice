# GitHub Integration Setup - Detailed Guide

## Overview

This guide walks you through setting up GitHub integration for automatically committing AI Readiness Audit lead submissions as JSON files. This creates a permanent, version-controlled record of all submissions that can be analyzed, backed up, and integrated with other tools.

**Time Required**: 5-7 minutes
**Difficulty**: Beginner to Intermediate
**Prerequisites**: GitHub account with repository access

---

## What You'll Accomplish

By the end of this guide, you'll have:

✅ A `/leads` folder in your GitHub repository
✅ A Personal Access Token with proper permissions
✅ Apps Script configured to commit JSON files automatically
✅ Verified connectivity between Apps Script and GitHub
✅ A tested workflow that commits leads on each submission
✅ (Optional) GitHub Actions automation for additional processing

---

## Part 1: Repository Setup

### Step 1.1: Choose or Create Repository

**Option A: Use Existing Repository**

If you already have a repository for your BizDeedz operations:
1. Go to [github.com](https://github.com)
2. Navigate to your repository
3. Note the repository path: `username/repository-name`

**Option B: Create New Repository**

1. Go to [github.com](https://github.com)
2. Click the "**+**" icon (top right) → "**New repository**"
3. Fill out form:
   - **Repository name**: `ai-readiness-leads` (or any name you prefer)
   - **Description**: "AI Readiness Audit lead submissions"
   - **Visibility**: **Private** (recommended - contains lead data)
   - **Initialize**: Check "Add a README file"
4. Click "**Create repository**"

![Screenshot placeholder: GitHub new repository form with fields filled]

**Your repository URL** will be:
```
https://github.com/YOUR_USERNAME/ai-readiness-leads
```

**Your repository path** (needed for Apps Script) is:
```
YOUR_USERNAME/ai-readiness-leads
```

### Step 1.2: Create `/leads` Folder

GitHub doesn't support empty folders, so we'll create it with a placeholder file.

1. In your repository, click "**Add file**" → "**Create new file**"
2. In the "Name your file..." field, type: `leads/.gitkeep`
   - The `/` creates a folder named "leads"
   - `.gitkeep` is a placeholder file (common convention)
3. Leave the file content empty or add a comment:
   ```
   # This folder stores AI Readiness Audit submissions as JSON files
   ```
4. Scroll down and click "**Commit new file**"

![Screenshot placeholder: GitHub file creation with "leads/.gitkeep" in filename field]

**You now have a `/leads` folder in your repository!** ✅

### Step 1.3: Verify Folder Creation

1. Go to your repository homepage
2. You should see a "**leads**" folder listed
3. Click it - you should see the `.gitkeep` file inside

---

## Part 2: Creating a Personal Access Token

### Step 2.1: Access Token Settings

1. Click your **profile picture** (top right) → "**Settings**"
2. Scroll down the left sidebar to "**Developer settings**" (near the bottom)
3. Click "**Personal access tokens**" → "**Tokens (classic)**"
4. Click "**Generate new token**" → "**Generate new token (classic)**"

![Screenshot placeholder: GitHub settings with Developer settings and Personal access tokens highlighted]

**Why "classic" tokens?** They're simpler to configure for this use case. Fine-grained tokens work too but require more setup.

### Step 2.2: Configure Token Settings

**Note**: Enter a descriptive note for the token

1. **Note**: `AI Readiness Audit - Apps Script Integration`
   - This helps you remember what the token is for

**Expiration**: Choose based on security preference

2. **Expiration**: Select expiration period
   - **30 days**: Most secure (must regenerate monthly)
   - **60 days**: Balanced
   - **90 days**: Less frequent rotation
   - **No expiration**: Least secure (not recommended for production)

   **Recommendation**: 90 days with a calendar reminder to regenerate

**Select Scopes**: Choose what the token can access

3. Under "**Select scopes**", check these boxes:
   - ✅ **repo** (Full control of private repositories)
     - This includes: `repo:status`, `repo_deployment`, `public_repo`, `repo:invite`, `security_events`
   - ✅ **workflow** (Update GitHub Action workflows) - optional but recommended

![Screenshot placeholder: Token scopes with "repo" and "workflow" checked]

**Why these scopes?**
- `repo`: Allows Apps Script to create/update files in your repository
- `workflow`: Allows automating additional processes (optional)

### Step 2.3: Generate Token

1. Scroll to the bottom
2. Click "**Generate token**"
3. GitHub shows your new token (starts with `ghp_`)

**CRITICAL STEP**: Copy the token immediately!

```
ghp_1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk
```

⚠️ **You can only see this token ONCE**. If you navigate away, you'll need to regenerate it.

### Step 2.4: Save Token Securely

Save your token in a secure location:

**Good options:**
- Password manager (1Password, LastPass, Bitwarden)
- Encrypted note in your vault
- Secure document (not in GitHub!)

**Bad options:**
- ❌ Plain text file on desktop
- ❌ Committed to GitHub
- ❌ Shared in Slack/email
- ❌ Sticky note on monitor

![Screenshot placeholder: GitHub showing newly generated token with copy button]

---

## Part 3: Configuring Apps Script

### Step 3.1: Update CONFIG Object

1. Open your Google Apps Script project
2. Find the `CONFIG` object at the top of the code
3. Update the GitHub settings:

```javascript
const CONFIG = {
  // ... other settings ...

  githubToken: 'ghp_1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk',
  githubRepo: 'YOUR_USERNAME/ai-readiness-leads',

  // ... other settings ...
};
```

**Example:**
```javascript
const CONFIG = {
  emailRecipients: ['info@bizdeedz.com', 'jessa@bizdeedz.com'],
  spreadsheetId: '1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P',
  notionApiKey: 'secret_...',
  notionDatabaseId: 'a1b2c3d4...',
  githubToken: 'ghp_AbCdEf123456...',
  githubRepo: 'bizdeedz/ai-readiness-leads',
  thresholds: {
    high: 75,
    medium: 50
  }
};
```

**Important formatting:**
- `githubRepo` format: `username/repository-name` (no `https://`, no `.git`)
- Keep quotes around both values
- Don't forget the comma after `githubToken` line

### Step 3.2: Save Configuration

1. Click the **Save icon** (or press Ctrl+S / Cmd+S)
2. Wait for "All changes saved" confirmation

---

## Part 4: Testing GitHub Integration

### Step 4.1: Run Configuration Test

1. In Apps Script editor, select function: `testConfiguration`
2. Click the "**Run**" button
3. Check the execution log

**Expected output:**
```
✅ GitHub API: Connected (Repo: bizdeedz/ai-readiness-leads)
```

**If you see an error:**
- `401 Bad credentials`: Token is incorrect
- `404 Not Found`: Repository path is wrong (check format: `username/repo`)
- `403 Forbidden`: Token doesn't have `repo` scope

### Step 4.2: Run Full Test with Sample Data

1. Select function: `testWithSampleData`
2. Click "**Run**"
3. Check execution log for: `✅ Committed to GitHub`

**Expected output:**
```
✅ Committed to GitHub (/leads/test_20260121_143022.json)
```

### Step 4.3: Verify Commit in GitHub

1. Go to your GitHub repository
2. Navigate to the `/leads` folder
3. You should see a new file: `test_YYYYMMDD_HHMMSS.json`
4. Click the file to view its contents

![Screenshot placeholder: GitHub repository showing /leads folder with test JSON file]

**Example file content:**
```json
{
  "timestamp": "2026-01-21T14:30:22Z",
  "lead_score": 88,
  "lead_tier": "HIGH",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@testcompany.com",
  "company_name": "Test Company Inc",
  ...
}
```

**If the file appears with correct data, your integration is working!** ✅

---

## Part 5: Understanding the Commit Process

### Step 5.1: How Files Are Named

Each submission creates a uniquely named file:

**Format:** `lead_YYYYMMDD_HHMMSS.json`

**Examples:**
- `lead_20260121_143022.json` (submitted Jan 21, 2026 at 2:30:22 PM)
- `lead_20260121_150445.json` (submitted Jan 21, 2026 at 3:04:45 PM)

**Why timestamps?**
- Prevents filename conflicts
- Easy to sort chronologically
- Searchable by date

### Step 5.2: Commit Messages

Each commit has a descriptive message:

**Format:** `New lead submission: [Company Name] (Score: [X], Tier: [Y])`

**Examples:**
- `New lead submission: Acme Corp (Score: 92, Tier: HIGH)`
- `New lead submission: TechStart Inc (Score: 68, Tier: MEDIUM)`

**Why detailed commit messages?**
- Easy to scan commit history
- Searchable by company name or tier
- Helpful for auditing

### Step 5.3: Viewing Commit History

1. Go to your repository homepage
2. Click the "**XX commits**" link (top right, near the repo stats)
3. You'll see all commits with timestamps and messages

![Screenshot placeholder: GitHub commit history showing lead submission commits]

**Each commit shows:**
- Who made it (the GitHub token owner)
- When it was made
- The commit message
- Files changed

---

## Part 6: Advanced GitHub Features (Optional)

### Step 6.1: Create GitHub Actions Workflow

Automatically process new lead submissions with a workflow.

**Create workflow file:**

1. In your repository, click "**Add file**" → "**Create new file**"
2. Name it: `.github/workflows/process-leads.yml`
3. Paste this content:

```yaml
name: Process New Leads

on:
  push:
    paths:
      - 'leads/lead_*.json'

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Get changed files
        id: changed-files
        uses: tj-actions/changed-files@v40
        with:
          files: leads/lead_*.json

      - name: Process new leads
        run: |
          for file in ${{ steps.changed-files.outputs.all_changed_files }}; do
            echo "Processing: $file"
            # Add your processing logic here
            # Examples:
            # - Send to another API
            # - Trigger webhooks
            # - Update analytics
            # - Generate reports
          done
```

4. Commit the file

**What this does:**
- Triggers on every new lead JSON commit
- Extracts the changed file(s)
- Runs custom processing logic

**Use cases:**
- Send HIGH tier leads to Slack
- Update analytics dashboard
- Sync to external CRM
- Generate daily reports

### Step 6.2: Set Up Repository Secrets

Store sensitive data for GitHub Actions:

1. Go to repository "**Settings**" → "**Secrets and variables**" → "**Actions**"
2. Click "**New repository secret**"
3. Add secrets for external integrations:
   - `SLACK_WEBHOOK_URL`
   - `ANALYTICS_API_KEY`
   - etc.

These can be used in your workflows without exposing them in code.

### Step 6.3: Add README to /leads Folder

Document the folder structure:

1. Create file: `leads/README.md`
2. Add content:

```markdown
# Lead Submissions

This folder contains AI Readiness Audit lead submissions as JSON files.

## File Naming Convention

`lead_YYYYMMDD_HHMMSS.json`

Example: `lead_20260121_143022.json`

## File Structure

Each JSON file contains:
- Lead scoring data (score, tier)
- Contact information (name, email, phone)
- Company information (name, size, industry)
- AI readiness details (usage, challenges, goals)
- Timeline and budget data
- UTM tracking parameters

## Data Retention

- Files are permanent records (not auto-deleted)
- For GDPR compliance, leads can be manually removed upon request
- Backups are maintained in Google Sheets and Notion

## Access Control

This repository is private. Only authorized team members have access.

```

3. Commit the file

---

## Part 7: Security Best Practices

### Step 7.1: Token Security

✅ **Do:**
- Store token in password manager
- Set expiration dates
- Regenerate tokens periodically
- Use separate tokens for different integrations
- Revoke tokens immediately if compromised

❌ **Don't:**
- Commit tokens to any repository
- Share tokens via email or Slack
- Use tokens with broader permissions than needed
- Keep tokens without expiration indefinitely

### Step 7.2: Repository Security

**Keep repository private:**
1. Go to repository "**Settings**"
2. Scroll to "**Danger Zone**"
3. Verify "**Visibility**" is set to **Private**

**Add collaborators carefully:**
1. Settings → "**Collaborators and teams**"
2. Only add team members who need access
3. Use "**Read**" permission for non-technical team (can view, can't edit)

### Step 7.3: Enable Security Features

**Dependabot alerts** (monitors for security issues):
1. Repository Settings → "**Security & analysis**"
2. Enable: "**Dependabot alerts**"

**Secret scanning** (detects leaked tokens):
1. In "Security & analysis"
2. Enable: "**Secret scanning**"
3. GitHub will alert if tokens are accidentally committed

---

## Part 8: Monitoring and Maintenance

### Step 8.1: Review Commit Activity

Check that leads are being committed properly:

**Daily:**
- Visit repository commits page
- Verify new submissions are appearing
- Check commit messages are descriptive

**Weekly:**
- Review total number of lead files in `/leads` folder
- Compare with Google Sheet count (should match)
- Investigate any discrepancies

### Step 8.2: Backup Strategy

GitHub is already a backup, but consider:

**Monthly export:**
1. Clone repository locally: `git clone https://github.com/username/repo.git`
2. Zip the `/leads` folder
3. Store in secure backup location

**Or use GitHub's archive feature:**
1. Repository Settings → scroll to bottom
2. Click "**Archive this repository**" when no longer active

### Step 8.3: Token Rotation

When your token expires:

1. Generate new token (follow Part 2 steps)
2. Update Apps Script CONFIG with new token
3. Save and test with `testConfiguration()`
4. Revoke old token in GitHub Settings

**Set a calendar reminder** 1 week before expiration to rotate smoothly.

---

## Troubleshooting

### Error: "401 Bad credentials"

**Cause**: GitHub token is incorrect or expired

**Fix:**
1. Verify token is copied correctly (no spaces, no truncation)
2. Check token hasn't expired (GitHub Settings → Personal access tokens)
3. If expired, regenerate token and update CONFIG
4. Ensure token has `repo` scope

### Error: "404 Not Found"

**Cause**: Repository path is incorrect

**Fix:**
1. Verify `githubRepo` format: `username/repository-name`
2. **Not** `https://github.com/username/repository-name`
3. **Not** `username/repository-name.git`
4. Check repository exists and hasn't been renamed/deleted
5. If private repo, ensure token has `repo` scope (not just `public_repo`)

### Error: "403 Forbidden" or "Resource not accessible"

**Cause**: Token doesn't have required permissions

**Fix:**
1. Go to GitHub Settings → Personal access tokens
2. Click your token → Edit
3. Ensure these scopes are checked:
   - ✅ `repo` (all sub-scopes)
4. Update token (generates new token)
5. Copy new token and update CONFIG

### Error: "Reference does not exist"

**Cause**: Repository doesn't have a default branch (main/master)

**Fix:**
1. Make sure repository has at least one commit
2. Check default branch name (Settings → Branches)
3. Update Apps Script if using non-standard branch name:
   ```javascript
   const branch = 'main'; // or 'master'
   ```

### Issue: Commits work but files are empty

**Cause**: JSON encoding issue in Apps Script

**Fix:**
1. Check Apps Script `commitToGitHub()` function
2. Verify `Utilities.base64Encode()` is used correctly
3. Check the `content` variable contains actual data before encoding

### Issue: Files appear but commit message is wrong

**Cause**: Commit message template issue

**Fix:**
1. Check Apps Script `commitToGitHub()` function
2. Verify commit message uses correct variables:
   ```javascript
   const message = `New lead submission: ${lead.company_name} (Score: ${lead.lead_score}, Tier: ${lead.lead_tier})`;
   ```

---

## Data Analysis with Git

### Step 9.1: Clone Repository Locally

Work with lead data on your computer:

```bash
git clone https://github.com/username/ai-readiness-leads.git
cd ai-readiness-leads/leads
```

### Step 9.2: Analyze Leads with Command Line

**Count total leads:**
```bash
ls lead_*.json | wc -l
```

**View recent leads:**
```bash
ls -lt lead_*.json | head -n 10
```

**Search for HIGH tier leads:**
```bash
grep -l '"lead_tier": "HIGH"' lead_*.json
```

**Extract all company names:**
```bash
jq -r '.company_name' lead_*.json
```

### Step 9.3: Analyze with Python Script

Create `analyze_leads.py`:

```python
import json
import glob

# Load all JSON files
leads = []
for filepath in glob.glob('leads/lead_*.json'):
    with open(filepath, 'r') as f:
        leads.append(json.load(f))

# Analysis
total = len(leads)
high = sum(1 for l in leads if l['lead_tier'] == 'HIGH')
medium = sum(1 for l in leads if l['lead_tier'] == 'MEDIUM')
low = sum(1 for l in leads if l['lead_tier'] == 'LOW')
avg_score = sum(l['lead_score'] for l in leads) / total

print(f"Total Leads: {total}")
print(f"HIGH: {high} ({high/total*100:.1f}%)")
print(f"MEDIUM: {medium} ({medium/total*100:.1f}%)")
print(f"LOW: {low} ({low/total*100:.1f}%)")
print(f"Average Score: {avg_score:.1f}")
```

Run: `python analyze_leads.py`

---

## Best Practices

### Do's ✅

- **Use descriptive commit messages**: Include company name and tier
- **Keep repository private**: Lead data is sensitive
- **Monitor commit history**: Check for submission errors
- **Rotate tokens regularly**: Set expiration and calendar reminders
- **Back up locally**: Clone repository monthly
- **Document structure**: Add README files explaining data

### Don'ts ❌

- **Don't commit tokens**: Never put tokens in any repository
- **Don't make repo public**: Keep lead data private
- **Don't manually edit files**: Let Apps Script handle all commits
- **Don't delete /leads folder**: Permanent data loss
- **Don't share tokens**: Each integration should have its own token

---

## GitHub Integration Checklist

Before going live, verify:

- ✅ Repository created (private visibility)
- ✅ `/leads` folder exists
- ✅ Personal Access Token generated with `repo` scope
- ✅ Token saved securely (password manager)
- ✅ Apps Script CONFIG updated with token and repo path
- ✅ `testConfiguration()` passes
- ✅ `testWithSampleData()` creates file in GitHub
- ✅ Commit appears in repository history with proper message
- ✅ JSON file content is correct and readable
- ✅ Token expiration date noted with calendar reminder

---

## Next Steps

1. **Update Apps Script**: Add your GitHub token and repository path
2. **Test integration**: Run testWithSampleData() and verify file appears
3. **Set up monitoring**: Check commit history daily for first week
4. **Add automation** (optional): Create GitHub Actions workflows
5. **Train team**: Show how to access and analyze lead data in GitHub

---

## Support & Resources

### GitHub Documentation
- [Personal Access Tokens](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub Actions](https://docs.github.com/en/actions)

### Related Setup Guides
- [Google Apps Script Setup](SETUP_GOOGLE_APPS_SCRIPT_DETAILED.md)
- [Google Sheets Setup](SETUP_GOOGLE_SHEET_DETAILED.md)
- [Notion Integration](SETUP_NOTION_DETAILED.md)
- [Form Hosting](SETUP_FORM_HOSTING_DETAILED.md)

---

**Congratulations!** Your GitHub integration is now ready to automatically log every AI Readiness Audit submission! 🎉

---

**Last Updated**: January 21, 2026
**Version**: 1.0
**Estimated Setup Time**: 5-7 minutes
