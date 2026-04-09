@echo off
setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
for %%I in ("%SCRIPT_DIR%..") do set "REPO_ROOT=%%~fI"
set "LOG_DIR=%REPO_ROOT%\output\logs"

if not exist "%LOG_DIR%" (
  mkdir "%LOG_DIR%" >nul 2>&1
)

for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd_HHmmss"') do set "RUN_TS=%%I"
set "LOG_FILE=%LOG_DIR%\daily_market_intel_%RUN_TS%.log"

set "TARGET_SCRIPT=%SCRIPT_DIR%run_pipeline_live_to_google_sheets.bat"
if not exist "%TARGET_SCRIPT%" (
  set "TARGET_SCRIPT=%SCRIPT_DIR%run_pipeline_live.bat"
)

if not exist "%TARGET_SCRIPT%" (
  echo [%date% %time%] ERROR: No runnable pipeline script found.>>"%LOG_FILE%"
  echo Expected one of: run_pipeline_live_to_google_sheets.bat or run_pipeline_live.bat>>"%LOG_FILE%"
  exit /b 1
)

echo [%date% %time%] INFO: Running "%TARGET_SCRIPT%">>"%LOG_FILE%"
cmd /c ""%TARGET_SCRIPT%"" >>"%LOG_FILE%" 2>&1
set "EXIT_CODE=%ERRORLEVEL%"

if not "%EXIT_CODE%"=="0" (
  echo [%date% %time%] ERROR: Daily market intel run failed with exit code %EXIT_CODE%.>>"%LOG_FILE%"
  exit /b %EXIT_CODE%
)

echo [%date% %time%] INFO: Daily market intel run completed successfully.>>"%LOG_FILE%"
exit /b 0
