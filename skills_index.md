# Skills Index

## Overview
This document serves as the central index for all Claude skills organized by project. Each skill represents a specialized capability that can be invoked to perform specific tasks.

## How to Use This Index
1. **Browse by Project**: Find skills organized under BizDeedz or Turea
2. **Read Skill Descriptions**: Understand what each skill does
3. **Access Full Documentation**: Follow links to detailed skill guides
4. **Request Skill Execution**: Reference the skill name when asking Claude to perform tasks

---

## BizDeedz

### Lead Scoring Router
**File**: [`skills/bizdeedz/lead_scoring_router.md`](skills/bizdeedz/lead_scoring_router.md)

**Purpose**: Automatically score and route inbound leads from any source (DM, email, form) into appropriate next actions with structured CRM notes.

**Key Capabilities**:
- Lead scoring (0-100) based on fit, interest, timing, and authority
- Smart routing recommendations (hot, warm, cold, disqualified)
- Automated CRM note generation
- Customizable scoring criteria and routing rules

**When to Use**:
- Processing new inbound leads
- Prioritizing sales team follow-up
- Standardizing lead qualification
- Creating structured CRM documentation

**Typical Input**: Lead information from any source with context
**Typical Output**: Score breakdown, routing recommendation, formatted CRM note

---

### LinkedIn Post Factory
**File**: [`skills/bizdeedz/linkedin_post_factory.md`](skills/bizdeedz/linkedin_post_factory.md)

**Purpose**: Generate complete LinkedIn content packages with hooks, body content, CTAs, and multi-channel repurposing options.

**Key Capabilities**:
- Scroll-stopping hook generation (multiple options)
- Value-driven body content aligned with brand voice
- Compelling calls-to-action
- Multi-platform repurposing (Twitter, email, blog, carousel, video)
- Algorithm optimization best practices

**When to Use**:
- Creating LinkedIn posts from scratch
- Repurposing content across channels
- Testing different content angles
- Building consistent posting schedule

**Typical Input**: Topic, audience, goal, and any specific requirements
**Typical Output**: Complete post with alternatives, repurposing options, engagement strategy

---

### AI Readiness Audit Discovery
**File**: [`skills/bizdeedz/ai_readiness_audit.md`](skills/bizdeedz/ai_readiness_audit.md)

**Purpose**: Complete lead generation and qualification system through an interactive AI Readiness Audit form with automated scoring, tiering, and multi-platform integration.

**Key Capabilities**:
- Professional 5-step wizard form with progress tracking
- Intelligent lead scoring (0-100) and automatic tiering (HIGH/MEDIUM/LOW)
- Multi-platform integration (Google Sheets, Make.com, Zapier, CRM)
- UTM tracking and spam protection
- Automated email notifications and follow-up routing
- Mobile-responsive design matching BizDeedz brand

**When to Use**:
- Generating qualified leads from website traffic
- Automating lead capture and qualification
- Building lead generation landing pages
- Assessing prospect AI/automation readiness
- Creating data-driven lead routing systems

**Typical Input**: Website visitors completing audit form
**Typical Output**: Scored and tiered leads with full data in CRM/spreadsheet, automated notifications

**Components**:
- `ai_readiness_audit_form.html` - Interactive wizard form
- `lead_scoring_logic.js` - Scoring engine and validation
- `ai_readiness_audit.md` - Complete setup and integration guide

---

## Turea

*Skills to be added as they are created.*

### Placeholder for Future Skills
As Turea skills are developed, they will be documented here with:
- Skill name and purpose
- Key capabilities
- When to use
- Link to full documentation

---

## Skill Development Guidelines

### Creating a New Skill
When adding a new skill to this index:

1. **Create the Skill Document**
   - Place in appropriate project folder (`skills/bizdeedz/` or `skills/turea/`)
   - Use descriptive filename (e.g., `skill_name.md`)
   - Follow skill documentation template

2. **Update This Index**
   - Add entry under correct project section
   - Include clear description
   - Link to full documentation
   - Specify key capabilities and use cases

3. **Review Brand Guidelines**
   - Ensure alignment with brand voice (`brand/[project]_voice.md`)
   - Check against restrictions (`brand/do_not_do.md`)
   - Verify operating rules compliance (`operating_rules.md`)

### Skill Documentation Template
Each skill document should include:
- **Skill Overview**: Purpose and use case
- **What This Skill Does**: Detailed capabilities
- **How to Use**: Basic and advanced usage examples
- **Input Requirements**: What information is needed
- **Output Structure**: What you'll receive
- **Best Practices**: Do's and don'ts
- **Examples**: Real-world usage scenarios

---

## Quick Reference

### By Use Case

**Lead Generation**:
- AI Readiness Audit Discovery → Capture and qualify leads via interactive form

**Lead Management**:
- Lead Scoring Router → Score and route inbound leads
- AI Readiness Audit Discovery → Automated lead scoring and tiering

**Content Creation**:
- LinkedIn Post Factory → Generate LinkedIn content packages

**Sales Enablement**:
- Lead Scoring Router → CRM notes and follow-up guidance
- AI Readiness Audit Discovery → Intelligent lead routing and prioritization

**Marketing Operations**:
- LinkedIn Post Factory → Multi-channel content repurposing
- AI Readiness Audit Discovery → Lead capture automation and CRM integration

---

## Related Documentation

- **Brand Guidelines**: See [`brand/`](brand/) folder for voice and restrictions
- **Operating Rules**: See [`operating_rules.md`](operating_rules.md) for workflow guidelines
- **Project Setup**: See [`README.md`](README.md) for project structure overview

---

## Skill Request Format

When asking Claude to use a skill, provide:
1. **Skill Name**: Which skill to invoke
2. **Input Data**: All required information
3. **Context**: Any relevant background
4. **Customization**: Specific requirements or preferences

**Example Request**:
```
Use the Lead Scoring Router skill:

Source: LinkedIn DM
From: Jane Smith, VP Marketing @ TechCorp
Message: "Interested in your lead automation tools. We're a 200-person
SaaS company with budget approved. Need to implement by Q2."

Scoring priorities:
- Emphasize SaaS industry fit
- Q2 timeline is important
```

---

## Metrics & Optimization

### Track Skill Performance
- **Usage Frequency**: Which skills are used most
- **Output Quality**: User satisfaction with results
- **Time Saved**: Efficiency gains from automation
- **Conversion Impact**: Business results from skill usage

### Continuous Improvement
- Review skill outputs monthly
- Gather user feedback
- Update documentation based on common questions
- Refine templates and examples
- Add new capabilities as needed

---

## Version History
- **v1.1** (January 2026): Added AI Readiness Audit Discovery system
  - Complete lead generation form with wizard interface
  - Intelligent scoring and tiering engine
  - Multi-platform integration guides
- **v1.0** (January 2026): Initial skills index with BizDeedz skills
  - Lead Scoring Router
  - LinkedIn Post Factory
  - Turea section prepared for future additions

---

*This index is a living document. As new skills are created and existing skills are enhanced, this index will be updated to reflect the current state of available capabilities.*

**Last Updated**: January 21, 2026
