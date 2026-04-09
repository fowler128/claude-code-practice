[CmdletBinding()]
param(
    [string]$Event,
    [string]$Title,
    [string]$Message
)

$ErrorActionPreference = 'SilentlyContinue'

if (-not $Title) { $Title = if ($env:CLAUDE_HOOK_EVENT) { "Claude Code: $($env:CLAUDE_HOOK_EVENT)" } else { 'Claude Code' } }
if (-not $Message) { $Message = if ($env:CLAUDE_HOOK_MESSAGE) { $env:CLAUDE_HOOK_MESSAGE } else { 'Automation event triggered.' } }
if (-not $Event) { $Event = if ($env:CLAUDE_HOOK_EVENT) { $env:CLAUDE_HOOK_EVENT } else { 'event' } }

Add-Type -AssemblyName System.Windows.Forms | Out-Null
Add-Type -AssemblyName System.Drawing | Out-Null

$icon = New-Object System.Windows.Forms.NotifyIcon
$icon.Icon = [System.Drawing.SystemIcons]::Information
$icon.BalloonTipTitle = $Title
$icon.BalloonTipText = "[$Event] $Message"
$icon.Visible = $true
$icon.ShowBalloonTip(8000)
Start-Sleep -Seconds 9
$icon.Dispose()
