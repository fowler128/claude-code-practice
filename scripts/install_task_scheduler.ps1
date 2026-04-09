[CmdletBinding()]
param(
    [string]$TaskName = "BizDeedz Daily Market Intel",
    [string]$RunTime = "08:00"
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$wrapperScript = Join-Path $scriptDir "daily_market_intel_to_sheet.bat"

if (-not (Test-Path $wrapperScript)) {
    throw "Wrapper script not found: $wrapperScript"
}

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c \"$wrapperScript\"" -WorkingDirectory $repoRoot
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Tuesday,Wednesday,Thursday,Friday -At $RunTime
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 2)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Runs BizDeedz daily market intel pipeline and sheet sync wrapper." -Force | Out-Null

Write-Host "Installed task: $TaskName"
Write-Host "Run time (local): $RunTime on weekdays"
Write-Host "Wrapper: $wrapperScript"
Write-Host ""
Write-Host "Edit task schedule:"
Write-Host "  schtasks /Change /TN \"$TaskName\" /ST HH:MM"
Write-Host "Remove task:"
Write-Host "  schtasks /Delete /TN \"$TaskName\" /F"
