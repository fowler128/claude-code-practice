---
name: workflow-automation
description: Create, manage, and execute automated workflows combining multiple
  tasks and tools. Use when the user needs to automate repetitive processes,
  build data pipelines, schedule tasks, or orchestrate complex multi-step
  operations. Supports task sequencing, error handling, and parallel execution.
---

# Workflow Automation Skill

This skill helps create robust automated workflows that combine multiple tools, services, and operations into repeatable processes.

## Core Concepts

### Workflow Components

1. **Tasks**: Individual units of work (API calls, file operations, data processing)
2. **Sequences**: Ordered execution of tasks with dependencies
3. **Parallelization**: Concurrent execution of independent tasks
4. **Error Handling**: Retry logic, fallbacks, and error recovery
5. **Scheduling**: Time-based or event-driven execution
6. **State Management**: Tracking workflow progress and data

## Workflow Patterns

### Pattern 1: Sequential Pipeline

Tasks that depend on previous results execute in order:

```bash
#!/bin/bash
set -e  # Exit on error

echo "Step 1: Fetch data..."
curl -s "https://api.example.com/data" > raw-data.json

echo "Step 2: Process data..."
jq '.items[] | {id, name, value}' raw-data.json > processed-data.json

echo "Step 3: Upload results..."
curl -X POST "https://api.example.com/upload" \
  -H "Content-Type: application/json" \
  -d @processed-data.json

echo "Pipeline complete!"
```

### Pattern 2: Parallel Execution

Independent tasks run concurrently for better performance:

```bash
#!/bin/bash

# Start multiple tasks in background
echo "Starting parallel tasks..."

curl -s "https://api1.example.com/data" > data1.json &
PID1=$!

curl -s "https://api2.example.com/data" > data2.json &
PID2=$!

curl -s "https://api3.example.com/data" > data3.json &
PID3=$!

# Wait for all tasks to complete
wait $PID1 $PID2 $PID3

echo "All tasks completed!"
# Merge results
jq -s '.[0] + .[1] + .[2]' data1.json data2.json data3.json > merged.json
```

### Pattern 3: Retry with Backoff

Handle transient failures gracefully:

```bash
#!/bin/bash

retry_with_backoff() {
  local max_attempts=5
  local timeout=1
  local attempt=1
  local exitCode=0

  while [ $attempt -le $max_attempts ]; do
    "$@"
    exitCode=$?

    if [ $exitCode -eq 0 ]; then
      return 0
    fi

    echo "Attempt $attempt failed. Retrying in $timeout seconds..."
    sleep $timeout
    attempt=$((attempt + 1))
    timeout=$((timeout * 2))
  done

  echo "Command failed after $max_attempts attempts."
  return $exitCode
}

# Usage
retry_with_backoff curl -f "https://api.example.com/data" -o output.json
```

### Pattern 4: Conditional Execution

Make decisions based on data or state:

```bash
#!/bin/bash

# Fetch data
response=$(curl -s "https://api.example.com/status")
status=$(echo "$response" | jq -r '.status')

# Conditional logic
if [ "$status" = "ready" ]; then
  echo "System is ready, proceeding with processing..."
  ./process-data.sh
elif [ "$status" = "pending" ]; then
  echo "System is pending, waiting 30 seconds..."
  sleep 30
  exec "$0"  # Re-run script
else
  echo "Unexpected status: $status"
  exit 1
fi
```

### Pattern 5: Event-Driven Workflow

React to file changes or external triggers:

```bash
#!/bin/bash

# Watch directory for new files
inotifywait -m -e create --format '%f' /path/to/watch | while read filename; do
  echo "New file detected: $filename"

  # Process the file
  ./process-file.sh "/path/to/watch/$filename"

  # Archive processed file
  mv "/path/to/watch/$filename" "/path/to/archive/$filename"
done
```

## Common Workflow Templates

### Template 1: Web Scraping Pipeline

```bash
#!/bin/bash
# Scrape → Transform → Store

# 1. Scrape data using agent-browser
agent-browser goto "https://example.com/data"
agent-browser evaluate "
  Array.from(document.querySelectorAll('.item')).map(el => ({
    title: el.querySelector('h2')?.textContent,
    price: el.querySelector('.price')?.textContent
  }))
" > scraped-data.json

# 2. Transform and validate
python3 << EOF
import json
with open('scraped-data.json') as f:
    data = json.load(f)
# Clean and validate
cleaned = [item for item in data if item['title'] and item['price']]
with open('cleaned-data.json', 'w') as f:
    json.dump(cleaned, f, indent=2)
EOF

# 3. Store in database
curl -X POST "https://api.example.com/store" \
  -H "Content-Type: application/json" \
  -d @cleaned-data.json

echo "Scraping pipeline complete!"
```

### Template 2: Report Generation Workflow

```bash
#!/bin/bash
# Collect metrics → Generate report → Distribute

REPORT_DATE=$(date +%Y-%m-%d)
REPORT_FILE="report-$REPORT_DATE.html"

# 1. Collect metrics from various sources
echo "Collecting metrics..."
curl -s "https://api.example.com/metrics/sales" > sales.json
curl -s "https://api.example.com/metrics/traffic" > traffic.json
curl -s "https://api.example.com/metrics/conversions" > conversions.json

# 2. Generate HTML report
python3 generate_report.py \
  --sales sales.json \
  --traffic traffic.json \
  --conversions conversions.json \
  --output "$REPORT_FILE"

# 3. Convert to PDF
wkhtmltopdf "$REPORT_FILE" "report-$REPORT_DATE.pdf"

# 4. Distribute via email
mail -s "Daily Report - $REPORT_DATE" \
  -a "report-$REPORT_DATE.pdf" \
  team@example.com < report-email.txt

echo "Report generated and distributed!"
```

### Template 3: Data Synchronization

```bash
#!/bin/bash
# Sync data between systems with conflict resolution

SYNC_LOG="sync-$(date +%Y%m%d-%H%M%S).log"

{
  echo "=== Sync Started at $(date) ==="

  # 1. Fetch from source
  echo "Fetching from source..."
  curl -s "https://source.example.com/api/data?since=$LAST_SYNC" > source-data.json

  # 2. Fetch from destination
  echo "Fetching from destination..."
  curl -s "https://dest.example.com/api/data?since=$LAST_SYNC" > dest-data.json

  # 3. Resolve conflicts and merge
  echo "Resolving conflicts..."
  python3 << EOF
import json
with open('source-data.json') as f:
    source = json.load(f)
with open('dest-data.json') as f:
    dest = json.load(f)

# Simple last-write-wins strategy
merged = {**dest, **source}

with open('merged-data.json', 'w') as f:
    json.dump(merged, f)
EOF

  # 4. Update both systems
  echo "Updating destination..."
  curl -X PUT "https://dest.example.com/api/data" \
    -H "Content-Type: application/json" \
    -d @merged-data.json

  # 5. Save sync timestamp
  date -Iseconds > last-sync.txt

  echo "=== Sync Completed at $(date) ==="
} | tee "$SYNC_LOG"
```

### Template 4: Automated Testing Workflow

```bash
#!/bin/bash
# Build → Test → Deploy

set -e  # Exit on any error

echo "=== Starting CI/CD Pipeline ==="

# 1. Build application
echo "Building application..."
npm install
npm run build

# 2. Run tests
echo "Running unit tests..."
npm test

echo "Running integration tests..."
npm run test:integration

# 3. Run browser tests with agent-browser
echo "Running E2E tests..."
for test in tests/e2e/*.spec.sh; do
  echo "Running $(basename $test)..."
  bash "$test" || exit 1
done

# 4. Generate coverage report
echo "Generating coverage report..."
npm run coverage

# 5. Deploy if all tests pass
if [ "$CI_BRANCH" = "main" ]; then
  echo "Deploying to production..."
  npm run deploy:production
else
  echo "Deploying to staging..."
  npm run deploy:staging
fi

echo "=== Pipeline Complete ==="
```

## Best Practices

### 1. Idempotency
Make workflows safe to re-run:

```bash
# Check if task already completed
if [ -f "task-completed.flag" ]; then
  echo "Task already completed, skipping..."
  exit 0
fi

# Do work...
process_data.sh

# Mark as complete
touch task-completed.flag
```

### 2. Logging and Monitoring

```bash
# Comprehensive logging
LOG_FILE="workflow-$(date +%Y%m%d-%H%M%S).log"
exec 1> >(tee -a "$LOG_FILE")
exec 2>&1

echo "Workflow started at $(date)"

# Your workflow steps...

echo "Workflow completed at $(date)"
```

### 3. Error Recovery

```bash
cleanup() {
  echo "Cleaning up temporary files..."
  rm -f /tmp/workflow-*
}

trap cleanup EXIT ERR

# Workflow continues safely...
```

### 4. Configuration Management

```bash
# Load config from file
if [ -f "config.env" ]; then
  source config.env
else
  echo "Error: config.env not found"
  exit 1
fi

# Use environment variables
API_KEY="${API_KEY:?API_KEY not set}"
API_URL="${API_URL:-https://api.example.com}"
```

### 5. Progress Tracking

```bash
TOTAL_STEPS=5
CURRENT_STEP=0

step() {
  CURRENT_STEP=$((CURRENT_STEP + 1))
  echo "[$CURRENT_STEP/$TOTAL_STEPS] $1"
}

step "Fetching data..."
# ... fetch data ...

step "Processing data..."
# ... process data ...

step "Generating report..."
# ... generate report ...
```

## Scheduling Workflows

### Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Run daily at 2 AM
0 2 * * * /path/to/workflow.sh

# Run every 15 minutes
*/15 * * * * /path/to/workflow.sh

# Run on weekdays at 9 AM
0 9 * * 1-5 /path/to/workflow.sh
```

### GitHub Actions

```yaml
name: Automated Workflow
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:      # Manual trigger

jobs:
  run-workflow:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run workflow
        run: ./workflow.sh
```

## When to Use This Skill

Invoke this skill when the user needs to:
- Automate repetitive manual tasks
- Build data processing pipelines
- Create scheduled jobs
- Orchestrate multi-step processes
- Integrate multiple systems or APIs
- Implement CI/CD workflows
- Set up monitoring and alerting
- Create backup and sync jobs
- Build report generation systems

## Integration with Other Skills

Combine with:
- **agent-browser**: For web automation workflows
- **git**: For automated deployment pipelines
- **docker**: For containerized workflow execution
- **python/node**: For complex data processing
- **cloud services**: For scalable workflow orchestration

## Example Usage

**User Request**: "Create a workflow that scrapes product prices daily and alerts me if any drop below $50"

**Response**:
Create a workflow script that:
1. Uses agent-browser to scrape prices
2. Compares with previous prices
3. Sends alert if threshold crossed
4. Logs results
5. Schedule with cron for daily execution

```bash
#!/bin/bash
# price-monitoring-workflow.sh

# ... implementation ...
```

Then set up cron to run daily.
