# Run Content Intel

Run the existing live automation path with minimal manual orchestration.

## Steps
1. Ensure log folder exists:
   - `powershell -NoProfile -Command "New-Item -ItemType Directory -Force output/logs | Out-Null"`
2. Check whether `scripts/run_pipeline_live_to_google_sheets.bat` exists.
3. If it exists, run:
   - `cmd /c scripts\\run_pipeline_live_to_google_sheets.bat`
4. If it does not exist, run:
   - `cmd /c scripts\\run_pipeline_live.bat`
5. Return a short completion summary:
   - script used
   - pass/fail
   - latest log file path in `output/logs` (if available)

## Notes
- Do not modify the underlying pipeline.
- Reuse existing scripts exactly as-is.
