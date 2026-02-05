#!/bin/bash
# Combined Browser + Workflow Automation Example
# Purpose: Monitor competitor prices and update database
# Schedule: Every hour via cron

set -e

# Configuration
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DATA_DIR="./price-monitoring"
LOG_FILE="$DATA_DIR/monitoring-$TIMESTAMP.log"
SESSION="price-monitor-$TIMESTAMP"

# Competitors to monitor
declare -A COMPETITORS=(
  ["CompetitorA"]="https://competitor-a.com/products"
  ["CompetitorB"]="https://competitor-b.com/products"
  ["CompetitorC"]="https://competitor-c.com/products"
)

# Price alert threshold
ALERT_THRESHOLD=50.00

# Functions
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

scrape_prices() {
  local name=$1
  local url=$2
  local output=$3

  log "Scraping prices from $name..."

  # Use agent-browser to scrape
  agent-browser --session "$SESSION" goto "$url"
  sleep 2

  # Extract product data
  agent-browser --session "$SESSION" evaluate "
    Array.from(document.querySelectorAll('.product-item')).map(item => ({
      name: item.querySelector('.product-name')?.textContent.trim(),
      price: parseFloat(item.querySelector('.price')?.textContent.replace(/[^0-9.]/g, '')),
      sku: item.querySelector('[data-sku]')?.dataset.sku,
      inStock: item.querySelector('.in-stock') !== null,
      url: item.querySelector('a')?.href,
      timestamp: new Date().toISOString()
    }))
  " > "$output"

  # Take screenshot for verification
  agent-browser --session "$SESSION" screenshot "$DATA_DIR/$name-$TIMESTAMP.png"

  log "Scraped $(jq '. | length' "$output") products from $name"
}

compare_prices() {
  local current=$1
  local previous=$2
  local output=$3

  log "Comparing prices..."

  python3 << EOF
import json
from datetime import datetime

# Load data
with open('$current') as f:
    current = json.load(f)

try:
    with open('$previous') as f:
        previous = json.load(f)
except FileNotFoundError:
    previous = []

# Create lookup for previous prices
prev_prices = {item['sku']: item['price'] for item in previous if 'sku' in item}

# Compare and find changes
changes = []
for item in current:
    sku = item.get('sku')
    if not sku:
        continue

    current_price = item.get('price', 0)
    prev_price = prev_prices.get(sku, 0)

    if prev_price > 0:
        diff = current_price - prev_price
        pct_change = (diff / prev_price) * 100

        if abs(pct_change) > 1:  # More than 1% change
            changes.append({
                'sku': sku,
                'name': item.get('name'),
                'previous_price': prev_price,
                'current_price': current_price,
                'difference': diff,
                'percent_change': pct_change,
                'alert': current_price < $ALERT_THRESHOLD
            })

with open('$output', 'w') as f:
    json.dump(changes, f, indent=2)

print(f"Found {len(changes)} price changes")
EOF
}

send_alerts() {
  local changes_file=$1

  log "Checking for price alerts..."

  local alert_count=$(jq '[.[] | select(.alert == true)] | length' "$changes_file")

  if [ "$alert_count" -gt 0 ]; then
    log "Found $alert_count products below threshold!"

    # Generate alert email
    python3 << EOF
import json
with open('$changes_file') as f:
    changes = json.load(f)

alerts = [c for c in changes if c.get('alert')]

html = "<h2>Price Alert - Products Below \$$ALERT_THRESHOLD</h2><ul>"
for alert in alerts:
    html += f"""
    <li>
      <strong>{alert['name']}</strong> (SKU: {alert['sku']})<br>
      Current Price: \${alert['current_price']:.2f}<br>
      Previous Price: \${alert['previous_price']:.2f}<br>
      Change: \${alert['difference']:.2f} ({alert['percent_change']:.1f}%)
    </li>
    """
html += "</ul>"

with open('$DATA_DIR/alert-email.html', 'w') as f:
    f.write(html)
EOF

    # Send email alert
    mail -s "Price Alert - $alert_count Products Below Threshold" \
      -a "Content-Type: text/html" \
      team@example.com < "$DATA_DIR/alert-email.html"

    log "Alert email sent"
  else
    log "No products below threshold"
  fi
}

update_database() {
  local data_file=$1

  log "Updating database..."

  # Upload to API
  curl -X POST "https://api.example.com/prices/bulk" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_TOKEN" \
    -d @"$data_file"

  log "Database updated"
}

# Main workflow
log "=== Starting Price Monitoring Workflow ==="

# Create data directory
mkdir -p "$DATA_DIR"

# Step 1: Scrape prices from all competitors (in parallel)
log "Step 1: Scraping competitor prices..."

pids=()
for competitor in "${!COMPETITORS[@]}"; do
  url="${COMPETITORS[$competitor]}"
  output="$DATA_DIR/$competitor-$TIMESTAMP.json"

  # Run in background for parallel execution
  scrape_prices "$competitor" "$url" "$output" &
  pids+=($!)
done

# Wait for all scraping to complete
for pid in "${pids[@]}"; do
  wait $pid
done

log "All scraping complete"

# Step 2: Merge all competitor data
log "Step 2: Merging competitor data..."
jq -s 'add' "$DATA_DIR"/*-"$TIMESTAMP".json > "$DATA_DIR/all-prices-$TIMESTAMP.json"

# Step 3: Compare with previous prices
log "Step 3: Comparing with previous data..."
LATEST_PREVIOUS=$(ls -t "$DATA_DIR"/all-prices-*.json 2>/dev/null | sed -n 2p || echo "")

if [ -n "$LATEST_PREVIOUS" ]; then
  compare_prices \
    "$DATA_DIR/all-prices-$TIMESTAMP.json" \
    "$LATEST_PREVIOUS" \
    "$DATA_DIR/changes-$TIMESTAMP.json"

  # Step 4: Send alerts if needed
  send_alerts "$DATA_DIR/changes-$TIMESTAMP.json"
else
  log "No previous data found, skipping comparison"
fi

# Step 5: Update database
log "Step 5: Updating database..."
update_database "$DATA_DIR/all-prices-$TIMESTAMP.json"

# Step 6: Generate summary report
log "Step 6: Generating summary report..."
python3 << EOF
import json

with open('$DATA_DIR/all-prices-$TIMESTAMP.json') as f:
    prices = json.load(f)

summary = {
    'timestamp': '$TIMESTAMP',
    'total_products': len(prices),
    'competitors': list(set(p.get('url', '').split('/')[2] for p in prices if 'url' in p)),
    'price_ranges': {
        'min': min(p['price'] for p in prices if 'price' in p and p['price'] > 0),
        'max': max(p['price'] for p in prices if 'price' in p),
        'avg': sum(p['price'] for p in prices if 'price' in p) / len([p for p in prices if 'price' in p])
    },
    'below_threshold': len([p for p in prices if p.get('price', float('inf')) < $ALERT_THRESHOLD])
}

with open('$DATA_DIR/summary-$TIMESTAMP.json', 'w') as f:
    json.dump(summary, f, indent=2)

print(json.dumps(summary, indent=2))
EOF

# Step 7: Cleanup old data (keep last 7 days)
log "Step 7: Cleaning up old data..."
find "$DATA_DIR" -name "*.json" -mtime +7 -delete
find "$DATA_DIR" -name "*.png" -mtime +7 -delete

log "=== Workflow Complete ==="
log "Monitored ${#COMPETITORS[@]} competitors"
log "Results saved to $DATA_DIR"

exit 0
