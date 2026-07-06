#!/bin/bash
# Nightly Postgres backup to S3. Install on the EC2 box with:
#   crontab -e
#   30 21 * * * /home/ubuntu/pharma-field-api/scripts/backup-db.sh >> /home/ubuntu/backup.log 2>&1
# (21:30 UTC = 03:00 IST, after the working-hours window)
set -euo pipefail

# Reads DATABASE_URL and AWS_S3_BUCKET from the app's .env
source <(grep -E '^(DATABASE_URL|AWS_S3_BUCKET)=' "$(dirname "$0")/../.env" | sed 's/^/export /')

STAMP=$(date +%Y-%m-%d_%H%M)
FILE="/tmp/pharma-field-db-${STAMP}.sql.gz"

pg_dump "${DATABASE_URL%%\?*}" | gzip > "$FILE"
aws s3 cp "$FILE" "s3://${AWS_S3_BUCKET}/db-backups/pharma-field-db-${STAMP}.sql.gz"
rm -f "$FILE"

# Keep the last 14 backups, delete older ones
aws s3 ls "s3://${AWS_S3_BUCKET}/db-backups/" | sort | head -n -14 | awk '{print $4}' | while read -r old; do
  [ -n "$old" ] && aws s3 rm "s3://${AWS_S3_BUCKET}/db-backups/${old}"
done

echo "Backup complete: ${STAMP}"
