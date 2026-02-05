#!/bin/bash
# Daily Report Generation Workflow
# Purpose: Collect metrics, generate report, and distribute to team
# Schedule: Daily at 9 AM via cron

set -e

# Configuration
REPORT_DATE=$(date +%Y-%m-%d)
REPORT_DIR="./reports"
REPORT_FILE="$REPORT_DIR/daily-report-$REPORT_DATE.html"
LOG_FILE="$REPORT_DIR/workflow-$REPORT_DATE.log"

# Create reports directory if it doesn't exist
mkdir -p "$REPORT_DIR"

# Logging function
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handler
error_handler() {
  log "ERROR: Workflow failed at step: $CURRENT_STEP"
  # Send error notification
  echo "Workflow failed. Check $LOG_FILE for details." | \
    mail -s "Report Workflow Failed - $REPORT_DATE" admin@example.com
  exit 1
}

trap error_handler ERR

# Start workflow
log "=== Starting Daily Report Workflow ==="

# Step 1: Collect sales data
CURRENT_STEP="Collecting sales data"
log "$CURRENT_STEP..."
curl -s -H "Authorization: Bearer $API_TOKEN" \
  "https://api.example.com/sales?date=$REPORT_DATE" > "$REPORT_DIR/sales-$REPORT_DATE.json"

# Step 2: Collect website traffic data
CURRENT_STEP="Collecting traffic data"
log "$CURRENT_STEP..."
curl -s -H "Authorization: Bearer $GA_TOKEN" \
  "https://analytics.google.com/api/data?date=$REPORT_DATE" > "$REPORT_DIR/traffic-$REPORT_DATE.json"

# Step 3: Collect conversion data
CURRENT_STEP="Collecting conversion data"
log "$CURRENT_STEP..."
curl -s -H "Authorization: Bearer $API_TOKEN" \
  "https://api.example.com/conversions?date=$REPORT_DATE" > "$REPORT_DIR/conversions-$REPORT_DATE.json"

# Step 4: Generate HTML report
CURRENT_STEP="Generating report"
log "$CURRENT_STEP..."
python3 << EOF
import json
from datetime import datetime

# Load data
with open('$REPORT_DIR/sales-$REPORT_DATE.json') as f:
    sales = json.load(f)
with open('$REPORT_DIR/traffic-$REPORT_DATE.json') as f:
    traffic = json.load(f)
with open('$REPORT_DIR/conversions-$REPORT_DATE.json') as f:
    conversions = json.load(f)

# Generate HTML
html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Daily Report - {datetime.now().strftime('%Y-%m-%d')}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .metric {{ background: #f0f0f0; padding: 20px; margin: 10px 0; border-radius: 5px; }}
        .metric h2 {{ margin: 0 0 10px 0; color: #333; }}
        .value {{ font-size: 2em; color: #007bff; font-weight: bold; }}
    </style>
</head>
<body>
    <h1>Daily Report - {datetime.now().strftime('%B %d, %Y')}</h1>

    <div class="metric">
        <h2>Total Sales</h2>
        <div class="value">\${sales.get('total', 0):,.2f}</div>
        <p>{sales.get('orders', 0)} orders</p>
    </div>

    <div class="metric">
        <h2>Website Traffic</h2>
        <div class="value">{traffic.get('visitors', 0):,}</div>
        <p>{traffic.get('pageviews', 0):,} pageviews</p>
    </div>

    <div class="metric">
        <h2>Conversion Rate</h2>
        <div class="value">{conversions.get('rate', 0):.2f}%</div>
        <p>{conversions.get('total', 0)} conversions</p>
    </div>

    <hr>
    <p style="color: #666; font-size: 0.9em;">
        Generated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
    </p>
</body>
</html>
"""

with open('$REPORT_FILE', 'w') as f:
    f.write(html)

print("Report generated successfully")
EOF

# Step 5: Distribute report
CURRENT_STEP="Distributing report"
log "$CURRENT_STEP..."

# Send via email
mail -s "Daily Report - $REPORT_DATE" \
  -a "Content-Type: text/html" \
  team@example.com < "$REPORT_FILE"

# Upload to storage
curl -X POST "https://storage.example.com/reports" \
  -F "file=@$REPORT_FILE" \
  -H "Authorization: Bearer $STORAGE_TOKEN"

# Step 6: Cleanup old reports (keep last 30 days)
CURRENT_STEP="Cleaning up old reports"
log "$CURRENT_STEP..."
find "$REPORT_DIR" -name "*.html" -mtime +30 -delete
find "$REPORT_DIR" -name "*.json" -mtime +30 -delete

log "=== Workflow Complete ==="
log "Report saved to: $REPORT_FILE"

# Send success notification
echo "Daily report generated successfully. View at: $REPORT_FILE" | \
  mail -s "Report Generated - $REPORT_DATE" admin@example.com
