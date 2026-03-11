# AGENTS.md

## Project
BizDeedz Mission Control is an internal operations platform for BizDeedz.

## Source of truth
Follow `BizDeedz-Mission-Control-v1-Build-Spec.md` exactly.

## Working style
- Build in phases
- Do not add features outside v1 scope
- Keep architecture simple and extensible
- Use event-driven design
- Prioritize clarity over abstraction
- If behavior is unclear, document the assumption

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Supabase
- PostgreSQL
- Prisma
- Vercel

## Validation
After each phase:
- summarize what was implemented
- list files changed
- list assumptions made
- run relevant checks if available
