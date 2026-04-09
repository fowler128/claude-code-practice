# Daily Operator

Operate the weekday live-to-sheet workflow and leave a clear local status note.

## Steps
1. Run:
   - `cmd /c scripts\\daily_market_intel_to_sheet.bat`
2. Review outputs:
   - Latest log in `output/logs`
   - Any generated CSV/sheet payload files
3. Append a short status note to:
   - `output/logs/daily-operator-status.log`
4. Return:
   - `PASS` or `FAIL`
   - one-line reason
   - immediate next action if failed

## Status note format
`YYYY-MM-DD HH:mm:ss | PASS|FAIL | summary | next_action`

## Notes
- Keep notes short and operator-friendly.
- Escalate credential errors explicitly.
