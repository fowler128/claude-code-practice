# BizDeedz Automation Runbook (Windows-first)

## What runs automatically
- Scheduled task runs `scripts/daily_market_intel_to_sheet.bat` each weekday morning.
- Wrapper prefers `scripts/run_pipeline_live_to_google_sheets.bat` when available.
- If the Google Sheets wrapper is unavailable, it falls back to `scripts/run_pipeline_live.bat`.

## Install weekday schedule
Run in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install_task_scheduler.ps1
```

Optional custom time:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/install_task_scheduler.ps1 -RunTime 07:30
```

## Manual fallback commands
- Full live-to-sheet path:
  - `cmd /c scripts\\daily_market_intel_to_sheet.bat`
- Existing live pipeline only:
  - `cmd /c scripts\\run_pipeline_live.bat`
- Existing live-to-sheet wrapper directly:
  - `cmd /c scripts\\run_pipeline_live_to_google_sheets.bat`
- Google Sheets sync setup (if credentials or config changed):
  - `cmd /c scripts\\setup_google_sheets_sync.bat`

## Where logs live
- Daily wrapper logs: `output/logs/daily_market_intel_YYYYMMDD_HHMMSS.log`
- Optional operator notes: `output/logs/daily-operator-status.log`

## If credentials fail
1. Re-run `scripts/setup_google_sheets_sync.bat`.
2. Confirm local credential files/tokens are still valid.
3. Re-run `scripts/daily_market_intel_to_sheet.bat`.
4. If still failing, open the latest log in `output/logs` and escalate with the first auth-related error line.

## Quick remove/edit scheduler task
- Edit start time:
  - `schtasks /Change /TN "BizDeedz Daily Market Intel" /ST HH:MM`
- Remove task:
  - `schtasks /Delete /TN "BizDeedz Daily Market Intel" /F`
