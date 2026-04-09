# Daily Operator

Run the weekday live-to-sheet workflow, review result, and append a stable status record.

## Steps
1. Ensure log folder exists:
   - `powershell -NoProfile -Command "New-Item -ItemType Directory -Force output/logs | Out-Null"`
2. Run:
   - `cmd /c scripts\\daily_market_intel_to_sheet.bat`
3. Review:
   - latest `output/logs/daily_market_intel_*.log`
   - CSV/sync outputs expected for this run
4. Append status line to `output/logs/daily-operator-status.log`:
   - `powershell -NoProfile -Command "$ts=Get-Date -Format 'yyyy-MM-dd HH:mm:ss'; Add-Content -Path 'output/logs/daily-operator-status.log' -Value \"$ts | PASS|FAIL | summary | next_action\""`
5. Return:
   - `PASS` or `FAIL`
   - one-line reason
   - immediate next action if failed

## Notes
- Always append exactly one status line per operator run.
- Escalate credential errors explicitly.
