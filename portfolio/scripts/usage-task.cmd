@echo off
rem Run daily from Windows Task Scheduler to refresh the Claude Code activity tile on /about.
rem Setup: see README (scripts/usage.ts). Output is appended to %LOCALAPPDATA%\claude-usage\task.log
setlocal
set "LOGDIR=%LOCALAPPDATA%\claude-usage"
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
cd /d "%~dp0.."
echo ==== %date% %time% >> "%LOGDIR%\task.log"
rem 1. Save this PC's daily totals and push them to claude-usage-log (merged with the Mac's file)
python -I "%USERPROFILE%\.claude\skills\claude-usage\usage.py" --sync --quiet >> "%LOGDIR%\task.log" 2>&1
rem 2. Write the merged totals to the portfolio (stats/claudeUsage)
call npm run usage -- --run >> "%LOGDIR%\task.log" 2>&1
