---
name: workflow-use
description: Use Browser Use Workflow Use to record browser workflows once, run them deterministically, launch its GUI, and generate reusable workflows from natural-language tasks.
---

# Workflow Use

Use this skill when the user wants help with Browser Use's Workflow Use project: recording a workflow, running an existing workflow, launching the GUI, or generating a reusable workflow from a natural-language task.

## When to use

Trigger this skill for requests like:
- "Use workflow-use to record this browser flow"
- "Run this Workflow Use workflow/json"
- "Generate a workflow from this task description"
- "Launch the Workflow Use GUI"
- "Help me set up browser-use/workflow-use"

## Quick workflow

1. Confirm where the `browser-use/workflow-use` repository is available locally.
2. If the repo is not present, tell the user it must be cloned or unpacked first.
3. Pick the appropriate mode:
   - **Generate from task**: `python cli.py generate-workflow "<task>"`
   - **Run stored workflow**: `python cli.py run-stored-workflow <workflow-id> --prompt "<prompt>"`
   - **Run workflow file as tool**: `python cli.py run-as-tool <workflow.json> --prompt "<prompt>"`
   - **Run workflow with predefined variables**: `python cli.py run-workflow <workflow.json>`
   - **Record a workflow**: `python cli.py create-workflow`
   - **Launch GUI**: `python cli.py launch-gui`
4. If the Python environment is not set up yet, prepare it from the repo's `workflows/` directory:
   - `uv sync`
   - `source .venv/bin/activate` on macOS/Linux
   - `playwright install chromium`
   - copy `.env.example` to `.env` and set `OPENAI_API_KEY`
5. For the extension, build it from `extension/` with `npm install && npm run build`.

## Notes

- Workflow Use is an early-stage project; expect setup changes and rough edges.
- Generated workflows are stored under `workflows/storage/`.
- The GUI starts the backend and frontend together and opens `http://localhost:5173`.
- Cloud browser runs require `BROWSER_USE_API_KEY`.

## Response guidance

When helping the user:
- Be explicit about which directory each command should run in.
- Distinguish between **setup**, **recording**, **execution**, **generation**, and **GUI** flows.
- If the user only provides a high-level task, recommend generation mode first.
- If the user already has a workflow JSON file, recommend `run-as-tool` or `run-workflow`.
