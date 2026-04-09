# Sync Market Sheet

Run only the Google Sheets sync setup/sync pathway without rerunning the full live content pipeline.

## Steps
1. Ensure log folder exists:
   - `powershell -NoProfile -Command "New-Item -ItemType Directory -Force output/logs | Out-Null"`
2. Run sync-only script:
   - `cmd /c scripts\\setup_google_sheets_sync.bat`
3. Validate expected sync outputs still exist:
   - `output/`
   - `output/logs/`
   - latest sync artifacts referenced by `docs/google-sheets-sync-setup.md` (if present)
4. Return:
   - pass/fail
   - missing artifacts (if any)
   - next action

## Notes
- This command is intentionally sync-only.
- Do not trigger `run_pipeline_live.bat` from this command.
