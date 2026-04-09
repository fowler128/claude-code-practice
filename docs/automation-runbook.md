# BizDeedz Automation Runbook (Windows-first)

## What runs automatically
- Scheduled task runs `scripts/daily_market_intel_to_sheet.bat` each weekday morning.
- Wrapper prefers `scripts/run_pipeline_live_to_google_sheets.bat` when available.
- If that wrapper is unavailable, it falls back to `scripts/run_pipeline_live.bat`.
- Logs are always written under `output/logs`.

## Claude operator commands
- `run-content-intel`: runs live path (prefers live-to-sheet wrapper).
- `sync-market-sheet`: sync-only path (does **not** run full live pipeline).
- `daily-operator`: runs wrapper + appends stable status line in `output/logs/daily-operator-status.log`.

## Notifications
- Claude notifications are handled by:
  - `scripts/claude_notify.ps1`
- The hook is configured in:
  - `.claude/settings.json`

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
- Google Sheets sync setup/sync-only path:
  - `cmd /c scripts\\setup_google_sheets_sync.bat`

## If credentials fail
1. Re-run `scripts/setup_google_sheets_sync.bat`.
2. Confirm local credential files/tokens are still valid.
3. Re-run `scripts/daily_market_intel_to_sheet.bat`.
4. If still failing, open latest `output/logs` file and escalate first auth-related error line.

## Quick remove/edit scheduler task
- Edit start time:
  - `schtasks /Change /TN "BizDeedz Daily Market Intel" /ST HH:MM`
- Remove task:
  - `schtasks /Delete /TN "BizDeedz Daily Market Intel" /F`
