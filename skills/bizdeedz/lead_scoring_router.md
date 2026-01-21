# Lead Scoring Router

## Skill Overview
**Purpose**: Automatically score and route inbound leads (from DM, email, or form submissions) into the appropriate next action while generating structured CRM notes.

**Use Case**: When you receive new leads through various channels and need to quickly assess quality, determine next steps, and ensure proper follow-up.

## What This Skill Does

### Input Processing
- Analyzes lead information from any source (LinkedIn DM, email, contact form)
- Extracts key data points (company size, role, pain points, urgency signals)
- Identifies intent and qualification level

### Lead Scoring
Evaluates leads based on:
- **Fit**: Company size, industry, role alignment
- **Interest**: Engagement level, specific questions asked
- **Timing**: Urgency indicators, timeline mentions
- **Authority**: Decision-making power, budget authority

### Routing Decision
Determines appropriate next action:
- **Hot Lead → Immediate Call**: High score, clear intent, ready to buy
- **Warm Lead → Email Sequence**: Qualified but needs nurturing
- **Cold Lead → Long-term Drip**: Potential but not ready
- **Disqualified → Archive**: Not a fit, no follow-up needed

### CRM Note Generation
Creates structured notes including:
- Lead score breakdown
- Key information extracted
- Recommended next action
- Suggested talking points
- Follow-up timeline

## How to Use

### Basic Usage
```
Analyze this lead and provide scoring + routing:

[Paste lead information from DM/email/form]
```

### Advanced Usage
```
Score and route this lead:

Source: LinkedIn DM
Message: [paste message]
Profile: [paste LinkedIn profile info]

Scoring priorities:
- Emphasize company size (need 50+ employees)
- Must have marketing automation in place
```

## Input Format

### Minimum Required Information
- Source (LinkedIn, email, form)
- Message/inquiry text
- Any available context (profile, company name, role)

### Ideal Information
- Full name and role
- Company name and size
- Specific pain points or questions
- Timeline/urgency indicators
- Budget indicators
- Previous interactions (if any)

## Output Structure

### Lead Score Card
```
LEAD SCORE: 85/100 (HOT)

Breakdown:
- Fit Score: 90/100 (VP at 200-person SaaS company)
- Interest Score: 85/100 (Asked specific pricing questions)
- Timing Score: 80/100 (Mentioned "need solution by Q2")
- Authority Score: 85/100 (VP level, likely decision maker)
```

### Routing Recommendation
```
RECOMMENDED ACTION: Immediate Call

Priority: HIGH
Timeline: Respond within 4 hours
Channel: Phone call (backup: personalized email)
```

### CRM Note Template
```
SOURCE: LinkedIn DM - January 21, 2026
LEAD: Jane Smith, VP Marketing @ TechCorp (250 employees)

SUMMARY:
Inbound inquiry about lead automation. Company currently using manual
processes, looking to scale. Budget approved, timeline Q1-Q2 2026.

KEY POINTS:
- Current pain: Manual lead follow-up, low conversion rates
- Budget: Approved for marketing automation
- Timeline: Need solution implemented by Q2
- Authority: VP level, reports to CMO

NEXT STEPS:
1. Call within 4 hours (best time: afternoons per profile)
2. Prepare demo focused on lead automation ROI
3. Have case study ready: Similar company size + industry

TALKING POINTS:
- Address manual process pain points
- Show ROI timeline (break-even in 6 months typical)
- Discuss implementation timeline (6-8 weeks)
- Mention Q1 onboarding availability
```

## Scoring Criteria Details

### Fit Score (0-100)
- **Company Size**:
  - 50-500 employees: 80-100
  - 20-49 employees: 60-79
  - <20 or >500: 40-59
  - Unknown: 50

- **Industry Alignment**:
  - Target industries: 80-100
  - Adjacent industries: 60-79
  - Unrelated: 40-59

- **Role Relevance**:
  - Decision maker (VP, Director): 90-100
  - Influencer (Manager): 70-89
  - End user: 50-69

### Interest Score (0-100)
- **Engagement Level**:
  - Specific questions, details shared: 80-100
  - General inquiry: 60-79
  - Vague interest: 40-59

- **Research Evident**:
  - Mentions specific services/features: +20
  - References case studies/content: +15
  - Generic outreach: 0

### Timing Score (0-100)
- **Urgency Indicators**:
  - "Need ASAP", specific deadline: 80-100
  - "Looking to implement this quarter": 60-79
  - "Exploring options": 40-59
  - "Future planning": 20-39

### Authority Score (0-100)
- **Decision-Making Power**:
  - C-level, VP: 90-100
  - Director, Senior Manager: 70-89
  - Manager: 50-69
  - Individual contributor: 30-49

- **Budget Authority**:
  - Mentions approved budget: +20
  - Asks about pricing: +10
  - No budget discussion: 0

## Routing Rules

### HOT (80-100)
- **Action**: Immediate personal outreach
- **Timeline**: Within 4 hours
- **Method**: Phone call or video call
- **Assignment**: Senior sales rep or founder

### WARM (60-79)
- **Action**: Personalized email sequence
- **Timeline**: Within 24 hours
- **Method**: Email with value content
- **Assignment**: Inside sales rep

### COLD (40-59)
- **Action**: Long-term nurture campaign
- **Timeline**: Within 1 week
- **Method**: Automated drip with valuable content
- **Assignment**: Marketing automation

### DISQUALIFIED (<40)
- **Action**: Archive or polite decline
- **Timeline**: Within 48 hours (courtesy response)
- **Method**: Brief email thanking for interest
- **Assignment**: Automated response

## Integration Points

### CRM Systems
- **HubSpot**: Direct note creation, contact tagging
- **Salesforce**: Lead record update, task creation
- **Pipedrive**: Deal creation, activity logging

### Communication Platforms
- **Email**: Gmail, Outlook integration for quick access
- **LinkedIn**: Sales Navigator for context gathering
- **Slack**: Notifications for hot leads

## Customization Options

### Adjust Scoring Weights
```
Modify scoring priorities based on your ICP:
- Increase weight on company size
- Prioritize specific industries
- Emphasize timing over authority
- Custom scoring fields
```

### Custom Routing Rules
```
Define your own thresholds:
- Hot: 75+ (more aggressive)
- Warm: 50-74
- Cold: 25-49
- DQ: <25
```

### CRM Note Templates
```
Customize note format for your CRM:
- Add custom fields
- Modify structure
- Include team-specific sections
- Add automation triggers
```

## Best Practices

### DO:
- ✅ Provide as much lead context as possible
- ✅ Include source information for tracking
- ✅ Note any previous interactions
- ✅ Update scoring criteria quarterly based on conversions
- ✅ Review disqualified leads monthly (criteria may change)

### DON'T:
- ❌ Auto-route without reviewing score rationale
- ❌ Ignore timing signals (hot leads cool fast)
- ❌ Use same template for all score ranges
- ❌ Forget to log the interaction in CRM
- ❌ Skip the CRM note (kills future context)

## Examples

### Example 1: Hot Lead
**Input:**
```
Source: LinkedIn DM
From: Sarah Johnson, VP Sales @ CloudTech Solutions
Message: "Hi, saw your post about lead automation. We're a 150-person
SaaS company struggling with manual follow-up. Have budget approved
and need to implement by end of Q1. Can we schedule a call this week?"
```

**Output:**
```
LEAD SCORE: 92/100 (HOT)

Fit: 95 (Perfect ICP - SaaS, 150 employees, VP level)
Interest: 92 (Specific problem, mentioned budget)
Timing: 90 (Q1 deadline = ~6 weeks)
Authority: 92 (VP Sales = decision maker)

ROUTE: Immediate Call
Priority: HIGHEST
Response: Within 2 hours
Assign: Senior AE or Founder

[Detailed CRM note generated...]
```

### Example 2: Warm Lead
**Input:**
```
Source: Website form
Name: Mike Chen
Role: Marketing Manager
Company: StartupXYZ (25 employees)
Message: "Interested in learning more about your lead scoring tools.
We're currently using basic email marketing but want to scale up."
```

**Output:**
```
LEAD SCORE: 68/100 (WARM)

Fit: 65 (Smaller company, manager level)
Interest: 70 (General inquiry, growth-minded)
Timing: 60 (No urgency mentioned)
Authority: 65 (Manager - likely needs approval)

ROUTE: Email Nurture Sequence
Priority: Medium
Response: Within 24 hours
Assign: Inside Sales Rep

[Detailed CRM note generated...]
```

### Example 3: Cold Lead
**Input:**
```
Source: Email
From: info@company.com
Message: "Can you send me information about your services?"
[No other context available]
```

**Output:**
```
LEAD SCORE: 45/100 (COLD)

Fit: 50 (Unknown company details)
Interest: 40 (Generic inquiry, minimal effort)
Timing: 40 (No timeline)
Authority: 50 (Unknown role/title)

ROUTE: Long-term Drip Campaign
Priority: Low
Response: Within 1 week
Assign: Marketing Automation

[Brief CRM note generated...]
```

## Metrics to Track

Monitor these KPIs to optimize scoring:
- **Score to Conversion Correlation**: Do high scores actually convert?
- **Routing Accuracy**: Were leads routed appropriately?
- **Response Time by Score**: How quickly are hot leads contacted?
- **Score Distribution**: Are thresholds set correctly?
- **Disqualification Rate**: Too high or too low?

## Version History
- **v1.0** (January 2026): Initial skill creation
- Future: Add AI-powered industry research, competitive intelligence integration

---

*This skill helps ensure no lead falls through the cracks while optimizing sales team time on highest-value opportunities.*
