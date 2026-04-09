# Run Content Intel

Run the existing live automation path with the smallest operator effort.

## Steps
1. Check whether `scripts/run_pipeline_live_to_google_sheets.bat` exists.
2. If it exists, run:
   - `cmd /c scripts\\run_pipeline_live_to_google_sheets.bat`
3. If it does not exist, run:
   - `cmd /c scripts\\run_pipeline_live.bat`
4. Return a short summary with:
   - script used
   - pass/fail
   - output log location (if provided by script)

## Notes
- Do not modify the pipeline.
- Reuse existing scripts exactly as-is.
