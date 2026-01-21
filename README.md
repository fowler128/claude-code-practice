# Skills & Brand Guidelines Project

## Overview
This repository contains a structured system for managing Claude AI skills and brand guidelines across multiple projects. It provides standardized frameworks for content generation, lead management, and other business operations while maintaining consistent brand voice and quality.

## Quick Start

### For Content Creation
1. Review [`skills_index.md`](skills_index.md) to find the right skill
2. Read the specific skill documentation (in `skills/` folder)
3. Check brand guidelines (in `brand/` folder)
4. Request skill execution with required inputs

### For Skill Development
1. Read [`operating_rules.md`](operating_rules.md) for guidelines
2. Review existing skills in `skills/` for examples
3. Follow skill documentation template
4. Update [`skills_index.md`](skills_index.md) when adding new skills

---

## Project Structure

```
claude-code-practice/
│
├── README.md                    # This file - project overview
├── skills_index.md             # Central index of all skills
├── operating_rules.md          # Workflow guidelines and quality standards
│
├── brand/                      # Brand voice and guidelines
│   ├── bizdeedz_voice.md      # BizDeedz brand voice guidelines
│   ├── turea_voice.md         # Turea brand voice guidelines (template)
│   └── do_not_do.md           # Universal content restrictions
│
├── skills/                     # Skill documentation by project
│   ├── bizdeedz/              # BizDeedz-specific skills
│   │   ├── lead_scoring_router.md      # Lead scoring and routing
│   │   └── linkedin_post_factory.md    # LinkedIn content generation
│   │
│   └── turea/                 # Turea-specific skills (to be added)
│
└── [other project files]       # Existing project files
```

---

## What's Included

### Core Documentation

#### [`skills_index.md`](skills_index.md)
Central directory of all available skills. Browse by project or use case to find the right tool for your needs.

**Contains**:
- Complete skill listings by project
- Quick reference by use case
- Skill request format guide
- Links to detailed documentation

#### [`operating_rules.md`](operating_rules.md)
Operational guidelines for using skills and maintaining quality standards.

**Contains**:
- Skill execution workflow
- Quality standards and checklists
- Brand compliance rules
- Troubleshooting guides

### Brand Guidelines (`brand/`)

#### `bizdeedz_voice.md`
Complete brand voice guidelines for BizDeedz content.

**Defines**:
- Tone and style characteristics
- Preferred and prohibited language
- Content type guidelines
- Brand personality and examples

#### `turea_voice.md`
Template for Turea brand voice (to be completed as brand develops).

#### `do_not_do.md`
Universal restrictions that apply across all brands and projects.

**Covers**:
- Content restrictions
- Prohibited language patterns
- Ethical guidelines
- Platform-specific rules

### Skills Documentation (`skills/`)

#### BizDeedz Skills

**Lead Scoring Router** (`skills/bizdeedz/lead_scoring_router.md`)
- Score inbound leads (0-100)
- Route to appropriate next action
- Generate structured CRM notes
- Customize scoring criteria

**LinkedIn Post Factory** (`skills/bizdeedz/linkedin_post_factory.md`)
- Generate complete LinkedIn posts
- Create attention-grabbing hooks
- Develop compelling CTAs
- Repurpose across platforms (Twitter, email, blog, etc.)

#### Turea Skills
*To be added as skills are created*

---

## How to Use This System

### Step 1: Identify Your Need
Ask yourself:
- What am I trying to accomplish?
- Is there a skill for this?
- Which project does this relate to?

**Resource**: Browse [`skills_index.md`](skills_index.md)

### Step 2: Review Documentation
Once you've identified the right skill:
- Read the complete skill documentation
- Review input requirements
- Check examples for reference

**Resource**: Individual skill files in `skills/[project]/`

### Step 3: Check Brand Guidelines
Before generating content:
- Review the appropriate brand voice guide
- Check universal restrictions in `do_not_do.md`
- Ensure compliance with quality standards

**Resources**: Files in `brand/` folder

### Step 4: Execute the Skill
Provide Claude with:
- Skill name
- All required inputs
- Any specific customization needs
- Relevant context

**Example**:
```
Use the LinkedIn Post Factory skill:

Topic: Lead automation ROI
Audience: B2B marketing directors at 50-500 person companies
Goal: Drive engagement and demo requests
Tone: Professional but approachable, data-driven
Include: Repurposing options for email newsletter
```

### Step 5: Review and Iterate
- Check output against quality standards
- Verify brand alignment
- Request refinements if needed
- Provide feedback for improvement

**Resource**: [`operating_rules.md`](operating_rules.md)

---

## Key Concepts

### Skills
**What**: Structured frameworks for specific tasks (content creation, lead analysis, etc.)

**Why**: Consistency, quality, efficiency

**Where**: Documented in `skills/[project]/[skill_name].md`

**When**: Whenever you need to perform a task the skill covers

### Brand Voice
**What**: Guidelines for tone, style, and language for each project

**Why**: Maintain consistent brand identity across all content

**Where**: `brand/[project]_voice.md`

**When**: Before creating any customer-facing content

### Operating Rules
**What**: Workflows, quality standards, and best practices

**Why**: Ensure high-quality, compliant outputs

**Where**: [`operating_rules.md`](operating_rules.md)

**When**: Reference throughout skill execution process

---

## Projects

### BizDeedz
**Description**: B2B business services focused on lead generation and marketing automation

**Brand Position**: Professional, data-driven, results-focused

**Current Skills**:
- Lead Scoring Router
- LinkedIn Post Factory

**Documentation**:
- Brand voice: `brand/bizdeedz_voice.md`
- Skills: `skills/bizdeedz/`

### Turea
**Description**: [To be defined as project develops]

**Brand Position**: [To be defined]

**Current Skills**: None yet (prepared for additions)

**Documentation**:
- Brand voice template: `brand/turea_voice.md`
- Skills folder: `skills/turea/`

---

## Common Use Cases

### Content Creation
- **Need**: Create a LinkedIn post
- **Skill**: LinkedIn Post Factory
- **Process**: Review brand voice → Use skill → Check output

### Lead Management
- **Need**: Score and route new leads
- **Skill**: Lead Scoring Router
- **Process**: Gather lead info → Use skill → Act on recommendations

### Brand Compliance
- **Need**: Ensure content matches brand
- **Resource**: `brand/[project]_voice.md` and `brand/do_not_do.md`
- **Process**: Review guidelines → Create content → Verify compliance

### Skill Development
- **Need**: Create a new skill
- **Resource**: [`operating_rules.md`](operating_rules.md) → Skill Development section
- **Process**: Define purpose → Document thoroughly → Test → Update index

---

## Quality Standards

All outputs must meet these standards:
✅ **Accurate**: Facts and data are correct
✅ **On-Brand**: Matches project voice guidelines
✅ **Complete**: Includes all required elements
✅ **Clear**: Easy to understand and act upon
✅ **Compliant**: Follows all restrictions and guidelines
✅ **Valuable**: Provides genuine utility

See [`operating_rules.md`](operating_rules.md) for detailed checklists.

---

## Getting Help

### Documentation Issues
- Something unclear? Note where and what's confusing
- Something missing? Identify the gap
- Something outdated? Flag what needs updating

### Skill Questions
1. Check skill documentation in `skills/` folder
2. Review examples in the skill file
3. Consult [`skills_index.md`](skills_index.md) for overview
4. Ask specific questions with context

### Brand Questions
1. Read relevant `brand/[project]_voice.md`
2. Check `brand/do_not_do.md` for restrictions
3. Review examples in brand guidelines
4. Ask about specific scenarios with examples

---

## Contributing

### Adding a New Skill

1. **Create Skill Document**
   - Place in `skills/[project]/[skill_name].md`
   - Follow existing skills as template
   - Include comprehensive examples

2. **Update Skills Index**
   - Add entry to [`skills_index.md`](skills_index.md)
   - Include clear description and use cases
   - Link to full documentation

3. **Test Thoroughly**
   - Try skill with multiple scenarios
   - Verify outputs meet quality standards
   - Gather feedback from initial users

4. **Document Changes**
   - Note version history
   - Explain what the skill does
   - Update this README if needed

### Updating Brand Guidelines

1. **Identify Changes Needed**
   - What's unclear or missing?
   - What feedback has been received?
   - Has brand positioning evolved?

2. **Make Updates**
   - Revise relevant `brand/` files
   - Add examples where helpful
   - Ensure consistency across documents

3. **Review Impact**
   - Do existing skills need updates?
   - Do examples need refreshing?
   - Are quality standards affected?

4. **Communicate Changes**
   - Update version history
   - Notify active users
   - Update related documentation

---

## Best Practices

### Do's ✅
- Review brand guidelines before creating content
- Provide complete context when using skills
- Check outputs against quality standards
- Iterate based on feedback
- Keep documentation updated
- Share successful patterns
- Ask questions when uncertain

### Don'ts ❌
- Skip brand compliance checks
- Use skills without reading documentation
- Accept first draft without review
- Ignore quality checklists
- Create content that violates `do_not_do.md`
- Assume one-size-fits-all solutions
- Rush through the process

---

## Metrics & Success

### Track These Metrics
- Skills usage frequency
- Quality of outputs (acceptance rate)
- Time saved vs. manual process
- Business impact (leads, conversions, engagement)
- User satisfaction

### Success Indicators
- Consistent skill usage
- High first-draft acceptance
- Positive user feedback
- Measurable business results
- Growing skill library

---

## Future Roadmap

### Planned Additions
- Additional Turea skills (as brand develops)
- More BizDeedz skills based on needs
- Enhanced customization options
- Integration guides for tools/platforms
- Video tutorials and walkthroughs

### Continuous Improvement
- Regular documentation updates
- Skill refinements based on feedback
- New templates and examples
- Performance optimization
- Expanded use case coverage

---

## Version History

### v1.0 (January 2026)
- Initial project structure
- Core documentation (README, skills_index, operating_rules)
- Brand guidelines (BizDeedz complete, Turea template)
- BizDeedz skills (Lead Scoring Router, LinkedIn Post Factory)
- Turea framework prepared for future additions

---

## Quick Links

### Documentation
- [Skills Index](skills_index.md) - Find the right skill
- [Operating Rules](operating_rules.md) - Workflows and standards
- [BizDeedz Voice](brand/bizdeedz_voice.md) - Brand guidelines
- [Do Not Do](brand/do_not_do.md) - Universal restrictions

### Skills
- [Lead Scoring Router](skills/bizdeedz/lead_scoring_router.md)
- [LinkedIn Post Factory](skills/bizdeedz/linkedin_post_factory.md)

### Other Resources
- CLAUDE.md - General AI assistant guide
- example.py - Code examples
- index.html - Project landing page

---

## Contact & Support

For questions, feedback, or assistance with this skills system, reference the relevant documentation first, then ask specific questions with context.

---

*This system is designed to make AI-assisted work more consistent, efficient, and brand-compliant. Use it as a framework, adapt it to your needs, and improve it based on your experience.*

**Last Updated**: January 21, 2026
**Version**: 1.0
