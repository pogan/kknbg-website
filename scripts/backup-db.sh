#!/usr/bin/env bash
# Kopia zapasowa bazy SQLite + katalogu uploads.
# Cron (codziennie 3:15):  15 3 * * * /var/www/kknbg-website/scripts/backup-db.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

mkdir -p "$BACKUP_DIR"

# Spójna kopia bazy (SQLite .backup)
sqlite3 "$APP_DIR/data/kknbg.sqlite" ".backup '$BACKUP_DIR/kknbg-$STAMP.sqlite'"
gzip -f "$BACKUP_DIR/kknbg-$STAMP.sqlite"

# Uploads (przyrostowo w archiwum)
tar -czf "$BACKUP_DIR/uploads-$STAMP.tar.gz" -C "$APP_DIR/public" uploads 2>/dev/null || true

# Rotacja
find "$BACKUP_DIR" -name '*.gz' -mtime "+$KEEP_DAYS" -delete

echo "✔ Backup: $BACKUP_DIR (kknbg-$STAMP.sqlite.gz)"
