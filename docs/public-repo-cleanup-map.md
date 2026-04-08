# Public Repo Cleanup Map (Audit)

Date: 2026-04-08  
Repository audited: `fowler128/claude-code-practice`

## Scope and method

This audit classifies current repository contents and visible pull request history into public-safe proof-of-work vs private/commercially-sensitive assets.

Sources reviewed:
- Local files and folders in this repository (`BizDeedz/`, `index.html`, `kpi-scoreboard.html`, `CLAUDE.md`, `example.py`).
- Public PR list and closed PR tab on GitHub (`20 open`, `1 closed`) including PR titles and dates.

No destructive changes were made.

---

## 1) Current repo shape (major files/folders)

### A. Product-specific app track
- `BizDeedz/` (iOS legal-tech filing tracker app source + firestore rules + legal TOS text).

### B. Generic/demo artifacts
- `index.html` (landing page demo with malformed closing tags).
- `kpi-scoreboard.html` (KPI dashboard demo with hard-coded sample metrics).
- `example.py` (simple calculator script; currently has indentation/formatting issues).
- `CLAUDE.md` (general Claude usage guidance doc, not repo-specific).

### C. Process/history signal from PR titles
The PR history indicates multiple parallel product/GTM tracks that likely belong in separate business-focused repos (especially BizDeedz and service-offering/SOP work), not a single mixed sandbox.

---

## 2) Risk and value classification (path-level)

## Keep public (proof-of-work candidates)

These are good public artifacts if positioned as examples/sandbox output:

1. `index.html`
   - Keep public as a front-end prototype/sample.
   - Recommendation: clearly label as “demo/scratch,” not production.

2. `kpi-scoreboard.html`
   - Keep public as UI proof-of-concept for dashboard cards and simple JS rendering.
   - Recommendation: keep synthetic KPI values only.

3. `example.py`
   - Keep public only as a basic code exercise sample.
   - Recommendation: fix formatting and move under a `sandbox/` or `examples/` directory in a later cleanup pass.

4. `CLAUDE.md`
   - Keep public as a general AI-collaboration notes file if you want “how I work” transparency.
   - Recommendation: trim it into a concise project-specific contributor guide later.

## Move private (commercially sensitive or business-internal)

### Entire `BizDeedz/` tree should be private by default

Reason: even without secrets, this folder exposes product strategy, compliance/legal positioning, pricing, and implementation intent specific to a commercial legal-tech concept.

Specific files:

- `BizDeedz/README.md`
  - Contains explicit pricing tiers and product positioning.
  - Includes legal vertical focus and operational framing that can be treated as GTM-sensitive.

- `BizDeedz/Sources/Views/TermsOfServiceView.swift`
  - Contains detailed legal terms, liability language, arbitration/class action clauses, support channels, and business address details.
  - This is legal-operational content better governed privately until finalized by counsel.

- `BizDeedz/Sources/Firebase/firestore.rules`
  - Security model details and data-shape assumptions are visible; useful to attackers and competitors for threat modeling and architectural inference.

- `BizDeedz/Sources/ViewModels/FilingViewModel.swift`
  - Reveals domain logic assumptions (court holidays, filing lifecycle, governance scoring) that are part of proprietary workflow design.

- `BizDeedz/Sources/Services/FirebaseService.swift`
  - Exposes intended auth/data patterns and compliance-oriented audit behavior.

- `BizDeedz/Sources/Models/FilingModel.swift`
  - Exposes internal domain model and paid tier framing.

- `BizDeedz/Sources/App/BizDeedzApp.swift`
  - Exposes bundle-id target and overall app structure.

- `BizDeedz/Sources/Views/AddFilingView.swift`
- `BizDeedz/Sources/Views/FilingDashboardView.swift`
  - Expose workflow UX and product-specific language suitable for competitors to copy directly.

## Archive or de-emphasize

These are not high-value public portfolio assets in current form:

- `example.py`
  - Too trivial/noisy for a portfolio unless cleaned and contextualized.

- `CLAUDE.md`
  - Very generic and currently over-formatted; doesn’t showcase unique execution.

- `index.html` and `kpi-scoreboard.html`
  - Keep if needed, but de-emphasize in repo root (they read as practice snippets vs flagship work).

## Redundant / likely better suited elsewhere

Based on PR history titles, these tracks appear mixed into this repo but are better housed in dedicated repos:

- BizDeedz product line: “Ops Platform MVP,” “Platform OS,” “Mission Control dashboard,” “Signal Engine MVP,” “GTM audit,” filing tracker work.
- Service/SOP assets: “AI Readiness Accelerator product offering and delivery SOP.”
- Distinct educational/consumer builds: “Algebra Quest,” “AlgebraMasteryApp replacement,” transcriber/intelligence blueprint.

Recommendation:
- Consolidate BizDeedz-related code/docs into one private mono-repo or a small private repo set (e.g., `BizDeedz-app`, `BizDeedz-ops`, `BizDeedz-gtm`).
- Keep this repo for either public demos only or selected sanitized case studies.

---

## 3) Open PR history signal (what it implies)

Observed public state:
- Open PR count: 20.
- Closed PR count: 1.
- Closed PR #1 (“Add BizDeedz Filing Tracker iOS app”) merged on 2026-01-23.
- Open PR titles indicate many concurrent tracks (BizDeedz GTM, mission control, signal engine, SOP/productized services, web/app experiments).

Implication:
- The repo currently behaves like a **public lab stream** with mixed strategic and implementation work.
- It is not yet curated as a coherent portfolio with a single narrative.

---

## 4) Recommendation: repo identity decision

## Recommended decision: **C) split into both roles later**

Why:
1. There is valid public proof-of-work here (small demos, iterative velocity, PR trail).
2. There is also business-sensitive BizDeedz and SOP/GTM-adjacent material that should not remain broadly exposed long-term.
3. A two-repo strategy gives clarity:
   - **Public lab repo** for experiments, lightweight demos, tooling practice.
   - **Curated portfolio repo** for polished, sanitized case studies and selected technical walkthroughs.

---

## 5) Specific cleanup map (actionable, non-destructive)

## Phase 1 (now, in-place classification only)

Public-safe keep list (current paths):
- `index.html` — keep public, label as demo.
- `kpi-scoreboard.html` — keep public, label as demo.
- `example.py` — keep public but mark as exercise.
- `CLAUDE.md` — keep public but mark as generic guidance.

Private-candidate list (for future migration, not done in this audit):
- `BizDeedz/**` (all files under this path).

De-emphasize list:
- `example.py`
- `CLAUDE.md`

## Phase 2 (future split execution)

1. Establish a dedicated private BizDeedz repo set.
2. Copy (not move during this audit) `BizDeedz/**` into private destination and continue development there.
3. In this public repo, replace BizDeedz-specific detail with sanitized architecture notes/case-study summaries only.
4. Keep root focused on polished demo artifacts, each with brief README context and screenshots.

## Phase 3 (portfolio curation)

Build a portfolio-oriented public narrative around:
- one front-end demo,
- one data/dashboard demo,
- one short engineering write-up (sanitized),
- links to selected merged PRs that show iteration quality.

---

## 6) Final call

If the decision must be made immediately today:
- **Do not position this repo as a curated portfolio yet.**
- Keep it as a **public lab repo for now** while planning a split.
- Official target state: **Option C (split into both roles later)**.
