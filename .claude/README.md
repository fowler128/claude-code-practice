# Claude Skills Integration

This directory contains the Anthropic skills repository integrated as a git submodule.

## Skills Repository

Repository: https://github.com/anthropics/skills
Location: `.claude/skills/`

## Available Skill: skill-creator

The **skill-creator** skill is available at `.claude/skills/skills/skill-creator/`

This skill provides comprehensive guidance for creating effective skills that extend Claude's capabilities through specialized knowledge, workflows, and tool integrations.

### What the skill-creator skill provides:

- Guidelines for creating new skills
- Core principles: conciseness, appropriate freedom levels, progressive disclosure
- Skill anatomy and structure documentation
- Scripts for initializing and packaging skills
- Reference materials for workflows and output patterns
- Best practices for skill design

### Key Resources:

- **SKILL.md**: Complete skill documentation and instructions
- **scripts/**: Skill initialization and packaging scripts
  - `init_skill.py`: Initialize a new skill
  - `package_skill.py`: Package a skill for distribution
- **references/**: Reference documentation for skill creation patterns

### Usage:

To create a new skill using the skill-creator:

1. Review the SKILL.md file for comprehensive guidance
2. Use `scripts/init_skill.py <skill-name> --path <output-directory>` to initialize a new skill
3. Edit the skill contents (SKILL.md, scripts, references, assets)
4. Use `scripts/package_skill.py <path/to/skill-folder>` to package the skill

## Updating the Skills Repository

To update the skills submodule to the latest version:

```bash
cd .claude/skills
git pull origin main
cd ../..
git add .claude/skills
git commit -m "Update skills submodule"
```

## Additional Skills Available

The skills repository contains many other skills including:
- document skills (docx, pdf, pptx, xlsx)
- creative skills (algorithmic-art, canvas-design, theme-factory)
- development tools (mcp-builder, webapp-testing)
- communication tools (slack-gif-creator, internal-comms)
- and more

Browse the `.claude/skills/skills/` directory to explore all available skills.
