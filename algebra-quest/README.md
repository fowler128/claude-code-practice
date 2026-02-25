# Algebra Quest

Algebra Quest is a Vite + React app that generates adaptive algebra practice problems via a serverless API route (`/api/generate`).

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Deploy to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket.
2. In Vercel, import the repo and set **Root Directory** to `algebra-quest`.
3. Add environment variable:
   - `ANTHROPIC_API_KEY` (Production and Preview)
4. Deploy.

Because the frontend calls `fetch("/api/generate")`, frontend and API must be deployed in the same Vercel project.

## Post-deploy smoke test

1. Open your deployed URL.
2. Start a lesson and answer one problem.
3. Confirm a new question is generated (verifies `/api/generate` + API key).

## Production hardening checklist

- [ ] Add Vercel Firewall / WAF rate limits on `/api/generate`.
- [ ] Add server logs/alerts for non-2xx responses from the Anthropic API.
- [ ] Optionally restrict site access with password protection while testing.

