#!/bin/bash
# Backup and Sync Workflow
# Purpose: Backup critical files and sync to cloud storage
# Schedule: Every 6 hours via cron

set -e

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_NAME="backup-$TIMESTAMP"
LOG_FILE="$BACKUP_DIR/backup-$TIMESTAMP.log"

# Directories to backup
SOURCE_DIRS=(
  "/var/www/html"
  "/etc/nginx"
  "/home/user/projects"
)

# Cloud storage settings
S3_BUCKET="s3://my-backups"
RETENTION_DAYS=30

# Functions
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

check_dependencies() {
  for cmd in tar gzip aws; do
    if ! command -v $cmd &> /dev/null; then
      log "ERROR: Required command '$cmd' not found"
      exit 1
    fi
  done
}

calculate_size() {
  du -sh "$1" | awk '{print $1}'
}

retry_with_backoff() {
  local max_attempts=3
  local timeout=5
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    if "$@"; then
      return 0
    fi

    log "Attempt $attempt failed. Retrying in $timeout seconds..."
    sleep $timeout
    attempt=$((attempt + 1))
    timeout=$((timeout * 2))
  done

  log "Command failed after $max_attempts attempts"
  return 1
}

# Start workflow
log "=== Starting Backup Workflow ==="

# Check dependencies
check_dependencies

# Create backup directory
mkdir -p "$BACKUP_DIR/$BACKUP_NAME"

# Step 1: Create database dump
log "Step 1: Backing up database..."
if command -v mysqldump &> /dev/null; then
  mysqldump --all-databases --single-transaction \
    --user="$DB_USER" --password="$DB_PASS" \
    | gzip > "$BACKUP_DIR/$BACKUP_NAME/database.sql.gz"
  log "Database backup complete ($(calculate_size "$BACKUP_DIR/$BACKUP_NAME/database.sql.gz"))"
fi

# Step 2: Backup file directories
log "Step 2: Backing up directories..."
for dir in "${SOURCE_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    dir_name=$(basename "$dir")
    log "Backing up $dir..."

    tar -czf "$BACKUP_DIR/$BACKUP_NAME/$dir_name.tar.gz" \
      --exclude="*/node_modules" \
      --exclude="*/vendor" \
      --exclude="*/.git" \
      --exclude="*/cache" \
      "$dir"

    size=$(calculate_size "$BACKUP_DIR/$BACKUP_NAME/$dir_name.tar.gz")
    log "Completed $dir ($size)"
  else
    log "WARNING: Directory $dir not found, skipping..."
  fi
done

# Step 3: Create checksums
log "Step 3: Creating checksums..."
cd "$BACKUP_DIR/$BACKUP_NAME"
sha256sum * > checksums.txt
cd - > /dev/null

# Step 4: Create archive
log "Step 4: Creating final archive..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" \
  -C "$BACKUP_DIR" "$BACKUP_NAME"
FINAL_SIZE=$(calculate_size "$BACKUP_DIR/$BACKUP_NAME.tar.gz")
log "Final archive created ($FINAL_SIZE)"

# Step 5: Sync to cloud storage
log "Step 5: Syncing to cloud storage..."
retry_with_backoff aws s3 cp \
  "$BACKUP_DIR/$BACKUP_NAME.tar.gz" \
  "$S3_BUCKET/$BACKUP_NAME.tar.gz" \
  --storage-class STANDARD_IA

# Verify upload
if aws s3 ls "$S3_BUCKET/$BACKUP_NAME.tar.gz" &> /dev/null; then
  log "Cloud sync verified successfully"
else
  log "ERROR: Cloud sync verification failed"
  exit 1
fi

# Step 6: Cleanup old backups locally
log "Step 6: Cleaning up old local backups..."
find "$BACKUP_DIR" -name "backup-*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -type d -name "backup-*" -mtime +1 -exec rm -rf {} +
DELETED=$(find "$BACKUP_DIR" -name "backup-*" | wc -l)
log "Local cleanup complete (kept $(find "$BACKUP_DIR" -name "backup-*.tar.gz" | wc -l) recent backups)"

# Step 7: Cleanup old cloud backups
log "Step 7: Cleaning up old cloud backups..."
aws s3 ls "$S3_BUCKET/" | grep "backup-" | while read -r line; do
  file_date=$(echo "$line" | awk '{print $1}')
  file_name=$(echo "$line" | awk '{print $4}')

  # Calculate age
  file_timestamp=$(date -d "$file_date" +%s)
  current_timestamp=$(date +%s)
  age_days=$(( (current_timestamp - file_timestamp) / 86400 ))

  if [ $age_days -gt $RETENTION_DAYS ]; then
    log "Deleting old backup: $file_name (age: $age_days days)"
    aws s3 rm "$S3_BUCKET/$file_name"
  fi
done

# Step 8: Generate backup report
log "Step 8: Generating backup report..."
cat > "$BACKUP_DIR/backup-report-$TIMESTAMP.txt" << EOF
=== Backup Report ===
Date: $(date)
Backup Name: $BACKUP_NAME
Final Size: $FINAL_SIZE

Files Backed Up:
$(tar -tzf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" | wc -l) files

Directories Backed Up:
$(for dir in "${SOURCE_DIRS[@]}"; do echo "- $dir"; done)

Cloud Storage: $S3_BUCKET/$BACKUP_NAME.tar.gz

Checksums:
$(cat "$BACKUP_DIR/$BACKUP_NAME/checksums.txt")

Status: SUCCESS
EOF

# Step 9: Send notification
log "Step 9: Sending notification..."
mail -s "Backup Successful - $TIMESTAMP" \
  -a "$BACKUP_DIR/backup-report-$TIMESTAMP.txt" \
  admin@example.com << EOF
Backup completed successfully.

Backup: $BACKUP_NAME
Size: $FINAL_SIZE
Location: $S3_BUCKET

See attached report for details.
EOF

log "=== Backup Workflow Complete ==="
log "Total time: $SECONDS seconds"

# Cleanup temporary backup directory
rm -rf "$BACKUP_DIR/$BACKUP_NAME"

exit 0
