---
name: agent-browser
description: Automate browser interactions using the agent-browser CLI tool.
  Use when the user needs web scraping, automated testing, form filling,
  screenshot capture, or any browser automation task. Supports navigation,
  clicking, typing, and extracting content from web pages.
---

# Agent Browser Automation Skill

This skill enables automated browser interactions using the `agent-browser` CLI tool from Vercel Labs.

## Prerequisites

Before using this skill, ensure agent-browser is installed:

```bash
npm install -g agent-browser
agent-browser install
```

## Core Capabilities

### 1. Navigation and Page Loading
Use agent-browser to navigate to URLs and wait for pages to load:

```bash
agent-browser goto "https://example.com"
```

### 2. Taking Screenshots
Capture visual snapshots of web pages:

```bash
agent-browser screenshot output.png
```

### 3. Getting Page Snapshot
Get an accessibility tree snapshot optimized for AI comprehension:

```bash
agent-browser snapshot
```

This returns structured information about page elements including:
- Element references for interaction
- ARIA roles and accessibility labels
- Text content and interactive elements

### 4. Clicking Elements
Click on buttons, links, or other interactive elements using CSS selectors or element references:

```bash
agent-browser click "button#submit"
agent-browser click '[aria-label="Login"]'
```

### 5. Typing Text
Fill in form fields and input areas:

```bash
agent-browser type "input#email" "user@example.com"
agent-browser type "textarea" "This is my message"
```

### 6. Scrolling
Scroll through pages to load dynamic content:

```bash
agent-browser scroll down 500
agent-browser scroll up 300
```

### 7. JavaScript Execution
Execute custom JavaScript in the browser context:

```bash
agent-browser evaluate "document.title"
agent-browser evaluate "document.querySelectorAll('h1').length"
```

### 8. Session Management
Create isolated browser sessions for stateful workflows:

```bash
agent-browser --session mySession goto "https://example.com"
agent-browser --session mySession type "input#username" "testuser"
```

Sessions maintain cookies, localStorage, and authentication state across commands.

## Workflow Patterns

### Pattern 1: Web Scraping
```bash
# Navigate to page
agent-browser goto "https://news.example.com"

# Wait for content
agent-browser snapshot > page-structure.json

# Extract data using evaluate
agent-browser evaluate "Array.from(document.querySelectorAll('h2')).map(h => h.textContent)"

# Take screenshot for verification
agent-browser screenshot news-capture.png
```

### Pattern 2: Form Automation
```bash
# Start session
agent-browser --session formFill goto "https://example.com/form"

# Fill form fields
agent-browser --session formFill type "input#name" "John Doe"
agent-browser --session formFill type "input#email" "john@example.com"

# Submit
agent-browser --session formFill click "button[type='submit']"

# Capture result
agent-browser --session formFill screenshot form-result.png
```

### Pattern 3: Authentication Testing
```bash
# Create authenticated session
agent-browser --session auth goto "https://app.example.com/login"
agent-browser --session auth type "input#username" "testuser"
agent-browser --session auth type "input#password" "testpass"
agent-browser --session auth click "button#login"

# Navigate to protected areas
agent-browser --session auth goto "https://app.example.com/dashboard"
agent-browser --session auth snapshot
```

### Pattern 4: Visual Testing
```bash
# Navigate to different viewport sizes
agent-browser goto "https://example.com" --viewport 1920x1080
agent-browser screenshot desktop.png

agent-browser goto "https://example.com" --viewport 375x667
agent-browser screenshot mobile.png
```

## Best Practices

1. **Use Sessions for Stateful Tasks**: When authentication or cookies are needed, use `--session` flag
2. **Wait for Content**: Use `snapshot` to verify page structure before interacting
3. **Verify Actions**: Take screenshots after important interactions for debugging
4. **Specific Selectors**: Use unique CSS selectors or ARIA labels for reliable element targeting
5. **Error Handling**: Check command outputs and take screenshots when errors occur

## Advanced Features

### Network Interception
Monitor or mock network requests:

```bash
agent-browser --intercept goto "https://example.com"
```

### Device Emulation
Emulate mobile devices:

```bash
agent-browser --device "iPhone 12" goto "https://example.com"
```

### Geolocation
Set geographic location for testing:

```bash
agent-browser --geolocation "37.7749,-122.4194" goto "https://example.com"
```

## When to Use This Skill

Invoke this skill when the user needs to:
- Scrape data from websites
- Automate form submissions
- Test web applications
- Capture screenshots of web pages
- Interact with dynamic JavaScript applications
- Verify authentication flows
- Extract structured data from HTML
- Monitor web page changes
- Perform visual regression testing

## Output Handling

Always save important outputs:
- Screenshots to timestamped files
- Snapshot data to JSON files
- Extracted data to structured formats (JSON, CSV)
- Console logs for debugging

## Example Usage

**User Request**: "Scrape the top headlines from Hacker News"

**Response**:
```bash
# Navigate to Hacker News
agent-browser goto "https://news.ycombinator.com"

# Get page structure
agent-browser snapshot > hn-structure.json

# Extract headlines
agent-browser evaluate "Array.from(document.querySelectorAll('.titleline > a')).slice(0, 10).map(a => ({title: a.textContent, url: a.href}))" > headlines.json

# Take screenshot
agent-browser screenshot hackernews.png
```

Then parse and present the headlines.json data to the user.
