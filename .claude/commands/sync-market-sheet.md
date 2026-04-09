# Sync Market Sheet

Run only the Google Sheets sync path and verify expected artifacts.

## Steps
1. Run:
   - `cmd /c scripts\\setup_google_sheets_sync.bat` (optional if first-time setup is needed)
   - `cmd /c scripts\\run_pipeline_live_to_google_sheets.bat`
2. Validate expected outputs exist (when applicable):
   - `output/`
   - `output/logs/`
   - any CSV files documented by the repo runbook or sync docs
3. Return:
   - pass/fail
   - missing files (if any)
   - next action to recover

## Notes
- Do not run full setup unless credentials are missing or invalid.
- Keep operator feedback concise.
