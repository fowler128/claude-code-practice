# Form Hosting Setup - Detailed Guide

## Overview

This guide walks you through the final step: making your AI Readiness Audit form publicly accessible on the web. You'll learn three hosting methods (GitHub Pages, custom domain, embedded on existing site) with step-by-step instructions for each.

**Time Required**: 3-10 minutes (depending on method)
**Difficulty**: Beginner-friendly
**Prerequisites**: Completed backend setup (Apps Script, Sheet, Notion, GitHub)

---

## What You'll Accomplish

By the end of this guide, you'll have:

✅ Your form hosted and accessible via a public URL
✅ The webhook URL properly configured in the form
✅ A tested, live form that captures real submissions
✅ Data flowing to all destinations (Sheet, Notion, GitHub, Email)
✅ A shareable link for marketing campaigns

---

## Pre-Hosting Checklist

Before hosting the form, ensure you've completed:

- ✅ Google Apps Script backend deployed (webhook URL obtained)
- ✅ Google Sheet created and ID added to CONFIG
- ✅ Notion database created and API credentials added
- ✅ GitHub integration set up with token and repo path
- ✅ Test submission verified (data appears in all 4 destinations)

**If any of these are incomplete, go back and finish them first!**

---

## Part 0: Updating the Form Files

### Step 0.1: Update Webhook URL in HTML

Before hosting, you MUST update the webhook URL.

1. Open `ai_readiness_audit_form.html` in a text editor
2. Find this line (around line 420):
   ```javascript
   const WEBHOOK_URL = 'YOUR_WEBHOOK_URL_HERE';
   ```
3. Replace `YOUR_WEBHOOK_URL_HERE` with your actual Apps Script webhook URL:
   ```javascript
   const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzABC123XYZ789.../exec';
   ```
4. Save the file

**Where to find your webhook URL:**
- It's the URL you got when deploying your Apps Script as a web app
- Should start with `https://script.google.com/macros/s/`
- Should end with `/exec`

### Step 0.2: Verify Files Are Ready

You need these files in your hosting location:
- ✅ `ai_readiness_audit_form.html` (with updated webhook URL)
- ✅ `lead_scoring_logic.js` (unchanged)

Both files are in the `skills/bizdeedz/` folder of this repository.

---

## HOSTING OPTION 1: GitHub Pages (Recommended)

**Best for**: Quick deployment, no cost, easy updates

**Pros:**
- ✅ Free hosting
- ✅ Simple setup (3-5 minutes)
- ✅ Automatic HTTPS
- ✅ Easy to update (just push to GitHub)
- ✅ Version control built-in

**Cons:**
- ❌ URL is `username.github.io/repo-name` (can add custom domain)
- ❌ Public repository required (or GitHub Pro for private repo Pages)

### Step 1.1: Prepare Repository

**If using existing repository:**
1. Copy `ai_readiness_audit_form.html` and `lead_scoring_logic.js` to repository root (or a `/docs` folder)
2. Commit and push files

**If creating new repository:**
1. Create new repository named `ai-readiness-audit` (or any name)
2. Upload `ai_readiness_audit_form.html` and `lead_scoring_logic.js`
3. Commit files

**Repository structure:**
```
your-repo/
├── ai_readiness_audit_form.html
├── lead_scoring_logic.js
└── README.md
```

Or with `/docs` folder:
```
your-repo/
├── docs/
│   ├── ai_readiness_audit_form.html
│   └── lead_scoring_logic.js
└── README.md
```

### Step 1.2: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click "**Settings**" tab
3. In the left sidebar, click "**Pages**"
4. Under "**Source**":
   - Select: **Deploy from a branch**
5. Under "**Branch**":
   - Select: **main** (or **master** if that's your default branch)
   - Select: **/ (root)** (or **/docs** if you used a docs folder)
6. Click "**Save**"

![Screenshot placeholder: GitHub Pages settings with branch and folder selected]

### Step 1.3: Wait for Deployment

1. GitHub will build your site (takes 1-3 minutes)
2. Refresh the Settings > Pages page
3. You'll see a message: "**Your site is live at https://username.github.io/repo-name/**"

![Screenshot placeholder: GitHub Pages success message with URL]

### Step 1.4: Access Your Form

Your form is now live at:
```
https://username.github.io/repo-name/ai_readiness_audit_form.html
```

**Example:**
```
https://bizdeedz.github.io/ai-readiness-audit/ai_readiness_audit_form.html
```

**Bookmark this URL** - this is what you'll share with prospects!

### Step 1.5: Test the Live Form

1. Open the URL in your browser
2. Fill out all 5 sections with test data
3. Submit the form
4. Verify you see the success message
5. Check data appeared in:
   - Google Sheet (All Leads tab)
   - Notion database
   - GitHub /leads folder
   - Email (if HIGH or MEDIUM tier)

**If all 4 checks pass, your form is production-ready!** ✅

---

## HOSTING OPTION 2: Custom Domain

**Best for**: Professional branding, using your own domain (audit.bizdeedz.com)

**Pros:**
- ✅ Professional URL (e.g., `audit.bizdeedz.com`)
- ✅ Brand consistency
- ✅ Easy to remember and share

**Cons:**
- ❌ Requires domain ownership
- ❌ DNS configuration needed (5-10 min)
- ❌ Propagation time (up to 24 hours, usually faster)

### Step 2.1: Set Up GitHub Pages First

Follow **Option 1** steps first (Steps 1.1-1.3) to get your form on GitHub Pages.

Your form will initially be at: `https://username.github.io/repo-name/ai_readiness_audit_form.html`

### Step 2.2: Choose Your Custom Domain

Decide on subdomain structure:

**Option A: Subdomain (Recommended)**
- `audit.bizdeedz.com`
- `leads.bizdeedz.com`
- `ai-audit.bizdeedz.com`

**Option B: Path on main domain**
- `bizdeedz.com/audit`
- This requires different setup (reverse proxy or hosting on main server)

**We'll focus on Option A (subdomain) as it's simpler.**

### Step 2.3: Configure DNS Settings

1. Log into your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.)
2. Go to DNS management for `bizdeedz.com`
3. Add a CNAME record:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| CNAME | audit | username.github.io | 3600 |

**Example:**
- **Type**: CNAME
- **Name**: `audit` (or `@` if using root domain)
- **Value**: `bizdeedz.github.io` (your GitHub Pages URL without the repo path)
- **TTL**: 3600 (1 hour) or Auto

![Screenshot placeholder: DNS management interface with CNAME record]

4. Save the DNS record

### Step 2.4: Configure Custom Domain in GitHub

1. Go to repository Settings → Pages
2. Under "**Custom domain**", enter: `audit.bizdeedz.com`
3. Click "**Save**"
4. GitHub will verify the domain (takes 1-5 minutes)
5. Once verified, check "**Enforce HTTPS**" (wait a few more minutes for cert)

![Screenshot placeholder: GitHub Pages custom domain settings]

### Step 2.5: Wait for DNS Propagation

DNS changes can take time:
- **Fastest**: 5-10 minutes
- **Typical**: 1-2 hours
- **Maximum**: 24-48 hours

**Check propagation:**
- Visit: [whatsmydns.net](https://www.whatsmydns.net)
- Enter your subdomain: `audit.bizdeedz.com`
- Select CNAME record type
- You should see it pointing to `username.github.io` globally

### Step 2.6: Create Clean URL (Optional)

Instead of `audit.bizdeedz.com/ai_readiness_audit_form.html`, create:
`audit.bizdeedz.com` (just the root)

**Method: Rename file to index.html**

1. In your repository, rename:
   - `ai_readiness_audit_form.html` → `index.html`
2. Update the `<script>` tag src if needed:
   ```html
   <script src="lead_scoring_logic.js"></script>
   ```
3. Commit and push

Now your form loads at: `https://audit.bizdeedz.com` 🎉

### Step 2.7: Test Custom Domain

1. Visit `https://audit.bizdeedz.com` (or your custom domain)
2. Verify form loads correctly
3. Check HTTPS padlock in browser (green/secure)
4. Submit test form
5. Verify data flows to all destinations

---

## HOSTING OPTION 3: Embedded on Existing Website

**Best for**: Adding form to your current BizDeedz website

**Pros:**
- ✅ Integrated with existing site navigation
- ✅ Consistent design with your brand
- ✅ No separate URL to promote

**Cons:**
- ❌ Requires access to your website's codebase
- ❌ May need to adjust styling to match site

### Step 3.1: Choose Embedding Method

**Method A: Full Page Embed**
- Create a new page on your site: `/ai-readiness-audit`
- Copy entire form HTML into that page

**Method B: iFrame Embed**
- Host form on GitHub Pages or custom domain
- Embed it on your site with an iframe

**We'll cover both methods.**

### Step 3.2: Method A - Full Page Embed

**If using WordPress:**

1. Go to Pages → Add New
2. Name page: "AI Readiness Audit"
3. Switch to "**Code Editor**" (or "Text" mode)
4. Paste entire contents of `ai_readiness_audit_form.html`
5. Or use a "Custom HTML" block and paste the code
6. Publish page
7. URL will be: `bizdeedz.com/ai-readiness-audit`

**If using custom CMS or static site:**

1. Create new page file: `ai-readiness-audit.html`
2. Copy contents of `ai_readiness_audit_form.html`
3. Wrap in your site's template (header/footer)
4. Update paths if JavaScript file is in different location
5. Deploy to server
6. Access at: `bizdeedz.com/ai-readiness-audit.html`

**Styling adjustments:**

You may need to adjust CSS to match your site:

```html
<style>
  /* Add to the existing <style> section in the form */

  /* Match your site's font */
  body {
    font-family: 'YourSiteFont', sans-serif;
  }

  /* Match your site's colors */
  :root {
    --primary-color: #YOUR_BRAND_COLOR;
    --primary-dark: #YOUR_DARKER_SHADE;
  }

  /* Adjust form width to fit your layout */
  .form-container {
    max-width: 800px; /* or whatever fits your layout */
  }
</style>
```

### Step 3.3: Method B - iFrame Embed

**Step 1: Host form on GitHub Pages** (follow Option 1)

**Step 2: Add iframe to your site**

Add this code to any page where you want the form:

```html
<iframe
  src="https://username.github.io/repo-name/ai_readiness_audit_form.html"
  width="100%"
  height="900"
  frameborder="0"
  style="border: none; min-height: 900px;"
  title="AI Readiness Audit"
></iframe>
```

**Adjust height:**
- Default: 900px
- Increase if form is cut off
- Or use this responsive trick:

```html
<div style="position: relative; padding-bottom: 150%; overflow: hidden;">
  <iframe
    src="https://username.github.io/repo-name/ai_readiness_audit_form.html"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;"
    title="AI Readiness Audit"
  ></iframe>
</div>
```

**Pros of iframe:**
- Easy to update (change form, no website deploy needed)
- Isolated CSS (won't conflict with site styles)

**Cons of iframe:**
- Less SEO friendly
- Can't easily customize styling
- Height can be tricky to set correctly

### Step 3.4: Test Embedded Form

1. Visit the page on your live site
2. Test on desktop and mobile
3. Verify form is fully visible (no cut-off sections)
4. Submit test data
5. Check all destinations receive data

---

## Part 4: Post-Hosting Configuration

### Step 4.1: Update Marketing Materials

Now that your form is live, update:

**Website:**
- Add link in main navigation: "Get AI Audit"
- Add CTA buttons on homepage: "Assess Your AI Readiness"
- Create blog post announcing the audit

**Email Signatures:**
- Add: "Take our free AI Readiness Audit: [link]"

**Social Media:**
- LinkedIn: Pin post with form link
- Twitter: Add to bio
- Facebook: Create pinned post

**Collateral:**
- Update pitch decks with form link QR code
- Add to email campaigns
- Include in proposals

### Step 4.2: Set Up URL Shortener (Optional)

Create memorable short link:

**Using Bitly:**
1. Go to [bitly.com](https://bitly.com)
2. Paste your form URL
3. Customize: `bit.ly/bizdeedz-audit`
4. Use this shortened URL in campaigns

**Using Custom Domain:**
1. Set up redirect on your domain
2. `bizdeedz.com/audit` → redirects to form
3. Easier to remember and share verbally

### Step 4.3: Add UTM Parameters for Tracking

Track where form submissions come from:

**Base URL:**
```
https://audit.bizdeedz.com/ai_readiness_audit_form.html
```

**LinkedIn campaign:**
```
https://audit.bizdeedz.com/ai_readiness_audit_form.html?utm_source=linkedin&utm_medium=social&utm_campaign=q1_audit_promo
```

**Email newsletter:**
```
https://audit.bizdeedz.com/ai_readiness_audit_form.html?utm_source=newsletter&utm_medium=email&utm_campaign=january_2026
```

**Blog post:**
```
https://audit.bizdeedz.com/ai_readiness_audit_form.html?utm_source=blog&utm_medium=article&utm_campaign=ai_readiness_guide
```

The form automatically captures these parameters and logs them!

### Step 4.4: Create QR Code

For offline marketing (events, printed materials):

1. Go to [qr-code-generator.com](https://www.qr-code-generator.com) or similar
2. Select "URL" type
3. Paste your form URL
4. Customize design (add BizDeedz logo)
5. Download high-res PNG
6. Add to:
   - Conference booth displays
   - Printed handouts
   - Business cards
   - Slide decks for presentations

![Screenshot placeholder: QR code pointing to audit form]

---

## Part 5: Testing the Live Form

### Step 5.1: Cross-Browser Testing

Test on multiple browsers:

- ✅ Chrome (desktop & mobile)
- ✅ Firefox
- ✅ Safari (desktop & mobile)
- ✅ Edge

**Check for:**
- Form renders correctly
- Progress bar works
- Navigation buttons function
- Submission succeeds
- Success message appears

### Step 5.2: Mobile Responsiveness

Test on actual mobile devices:

1. **iPhone/iOS Safari**: Test all form sections
2. **Android Chrome**: Verify touch targets are large enough
3. **Tablet**: Check layout on iPad-sized screens

**Common mobile issues to check:**
- Text too small to read
- Buttons too small to tap
- Form sections cut off or overflow
- Dropdowns not opening
- Keyboard covering input fields

### Step 5.3: Network Conditions

Test on slower connections:

**Chrome DevTools simulation:**
1. Open DevTools (F12)
2. Go to "Network" tab
3. Select "Slow 3G" from throttling dropdown
4. Fill out and submit form
5. Verify submission completes (may take longer)

### Step 5.4: End-to-End Test

Run complete submission flow:

1. **Open form** with UTM parameters
2. **Fill out all 5 sections** with realistic test data
3. **Submit form**
4. **Verify success message** appears
5. **Check Google Sheet**: Entry in "All Leads" and appropriate tier tab
6. **Check Notion**: Entry appears with all fields populated
7. **Check GitHub**: JSON file committed to /leads folder
8. **Check Email**: Alert sent to info@bizdeedz.com and jessa@bizdeedz.com (if HIGH/MEDIUM)
9. **Verify UTM tracking**: UTM parameters captured correctly

**If all 9 steps pass, your form is fully operational!** ✅

---

## Part 6: Monitoring and Optimization

### Step 6.1: Set Up Analytics

**Google Analytics (GA4):**

Add tracking code to form HTML:

1. In `<head>` section, add:
   ```html
   <!-- Google tag (gtag.js) -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'G-XXXXXXXXXX');
   </script>
   ```

2. Track form submissions:
   ```javascript
   // Add after successful submission
   gtag('event', 'form_submission', {
     'event_category': 'AI Readiness Audit',
     'event_label': leadData.lead_tier,
     'value': leadData.lead_score
   });
   ```

**Track key metrics:**
- Page views
- Time on page
- Section completion rates
- Submission rate
- Bounce rate

### Step 6.2: Monitor Submission Volume

**Daily (first 2 weeks):**
- Check Google Sheet for new entries
- Verify data quality
- Follow up on HIGH tier leads within 24 hours

**Weekly:**
- Review total submissions
- Analyze tier distribution
- Identify top traffic sources (UTM parameters)
- Calculate conversion rate (visitors → submissions)

**Monthly:**
- Total leads by tier
- Average lead score
- Top industries/company sizes
- Timeline distribution (how urgent are leads?)
- Conversion rate by traffic source

### Step 6.3: A/B Testing (Advanced)

Test variations to improve conversion:

**Test variations:**
- Different headlines
- Shorter vs longer forms
- Single page vs wizard
- Different button text
- Alternative color schemes

**Tools:**
- Google Optimize (free A/B testing)
- Unbounce (landing page builder with A/B testing)
- VWO (conversion optimization platform)

---

## Troubleshooting

### Issue: Form loads but is unstyled (no CSS)

**Cause:** CSS file path is broken

**Fix:**
1. If CSS is inline (in `<style>` tag), this shouldn't happen
2. If CSS is external, verify path is correct
3. Check browser console for 404 errors on CSS file

### Issue: Form loads but JavaScript doesn't work

**Cause:** JavaScript file path is broken

**Fix:**
1. Verify `<script src="lead_scoring_logic.js"></script>` path is correct
2. If hosting on GitHub Pages, ensure file is in same directory
3. Check browser console for errors

### Issue: Form submits but data doesn't appear anywhere

**Cause:** Webhook URL is incorrect or Apps Script not deployed

**Fix:**
1. Check `WEBHOOK_URL` in HTML matches your Apps Script deployment URL
2. Verify Apps Script is deployed (not just saved)
3. Check Apps Script "Executions" log for errors
4. Test webhook directly: `curl -X POST [WEBHOOK_URL]`

### Issue: "CORS error" in browser console

**Cause:** Apps Script not allowing cross-origin requests

**Fix:**
1. In Apps Script, ensure deployment has "Who has access: Anyone"
2. Apps Script automatically handles CORS for web apps
3. If still failing, check deployment settings

### Issue: Form is too slow to load

**Cause:** Large files or slow hosting

**Fix:**
1. Minify CSS and JavaScript
2. Optimize any images
3. Use CDN for faster delivery
4. Consider upgrading hosting plan

### Issue: Mobile version is broken

**Cause:** CSS media queries not working

**Fix:**
1. Check `<meta name="viewport">` tag is present:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```
2. Test responsive breakpoints in DevTools
3. Adjust CSS media queries if needed

---

## Best Practices

### Do's ✅

- **Test on multiple devices** before promoting
- **Use HTTPS** (GitHub Pages provides this automatically)
- **Monitor submissions daily** (first week especially)
- **Keep form code updated** with latest webhook URL
- **Back up form code** (commit to GitHub)
- **Track with UTM parameters** for all campaigns
- **Optimize for mobile** (majority of traffic)

### Don'ts ❌

- **Don't launch without testing** end-to-end submission
- **Don't use HTTP** (insecure, browsers will warn)
- **Don't forget webhook URL** (form won't work without it)
- **Don't ignore console errors** (check DevTools before launching)
- **Don't make form too long** (balance detail vs completion rate)
- **Don't forget accessibility** (keyboard navigation, screen readers)

---

## Form Hosting Checklist

Before promoting your form, verify:

- ✅ Form is hosted and accessible via public URL
- ✅ Webhook URL is configured in form HTML
- ✅ Test submission completes successfully
- ✅ Data appears in Google Sheet
- ✅ Data appears in Notion
- ✅ JSON file committed to GitHub
- ✅ Email alerts sent (for HIGH/MEDIUM tiers)
- ✅ Form works on desktop Chrome
- ✅ Form works on mobile Safari
- ✅ Form works on mobile Android
- ✅ HTTPS is enabled (secure connection)
- ✅ UTM parameter tracking works
- ✅ Success message displays after submission
- ✅ Form is linked from your main website
- ✅ Marketing team has the form URL

---

## Next Steps

1. **Promote your form**: Add to website, email signature, social media
2. **Monitor submissions**: Check daily for first week
3. **Follow up quickly**: Contact HIGH tier leads within 24 hours
4. **Analyze performance**: Review conversion rates and optimize
5. **Iterate**: Update form based on user feedback and completion rates

---

## Support & Resources

### Hosting Platforms Documentation
- [GitHub Pages](https://docs.github.com/en/pages)
- [Custom Domain Setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [Netlify](https://www.netlify.com) (alternative to GitHub Pages)
- [Vercel](https://vercel.com) (alternative hosting platform)

### Related Setup Guides
- [Google Apps Script Setup](SETUP_GOOGLE_APPS_SCRIPT_DETAILED.md)
- [Google Sheets Setup](SETUP_GOOGLE_SHEET_DETAILED.md)
- [Notion Integration](SETUP_NOTION_DETAILED.md)
- [GitHub Integration](SETUP_GITHUB_DETAILED.md)
- [Deployment Quick Start](DEPLOYMENT_QUICK_START.md)

---

**Congratulations!** Your AI Readiness Audit form is now live and ready to capture qualified leads! 🚀

Share your form URL and start growing your pipeline!

---

**Last Updated**: January 21, 2026
**Version**: 1.0
**Estimated Setup Time**: 3-10 minutes (depending on hosting method)
