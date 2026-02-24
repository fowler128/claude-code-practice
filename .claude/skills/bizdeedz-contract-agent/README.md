# BizDeedz Contract Agent Skill

A Claude Code skill that runs the full BizDeedz 7-step contract workflow.

## Steps

1. **Intake** — collect client/matter data, assign matter ID
2. **Research** — jurisdiction statutes, standard clauses, precedents
3. **Draft** — produce first draft with all required clauses
4. **Review** — internal QA, consistency check, risk flagging
5. **Redline** — tracked-changes version with amendment log
6. **Client Approval** — gate step requiring explicit sign-off
7. **Notarize** — schedule, execute, archive, distribute

## MCP Tools Used

- `mcp__document__create/read/update/search/export`
- `mcp__notify__send`
- `mcp__calendar__schedule`

Falls back to local filesystem (`./contracts/<matter-id>/`) if MCP is unavailable.

## Usage

Say any of:
- "Start a new contract"
- "New intake for [client]"
- "Draft an NDA for [parties]"
- "Redline the contract"
- "Schedule notarization"

## File Layout

```
~/.claude/skills/bizdeedz-contract-agent/
├── skill.md          ← main skill prompt (loaded by Claude Code)
├── README.md         ← this file
└── examples/
    └── nda-example.md
```
