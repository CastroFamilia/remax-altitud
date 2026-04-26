#!/usr/bin/env bash
# =============================================================================
# list-properties.sh — List all properties with their full URLs
# Usage:
#   ./scripts/list-properties.sh              # all properties (both locales)
#   ./scripts/list-properties.sh --visible    # only visible (is_visible = true)
#   ./scripts/list-properties.sh --hidden     # only soft-deleted (is_visible = false)
#   ./scripts/list-properties.sh --locale es  # output es locale URLs
# =============================================================================

set -euo pipefail

# ---------- defaults ---------------------------------------------------------
LOCALE="en"
FILTER=""       # empty = all
BASE_URL="http://localhost:3000"

# Read DATABASE_URL from .env.local if not already set in environment
if [[ -z "${DATABASE_URL:-}" ]]; then
  ENV_FILE="$(dirname "$0")/../.env.local"
  if [[ -f "$ENV_FILE" ]]; then
    DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | sed 's/DATABASE_URL=//;s/"//g')
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌  DATABASE_URL is not set. Export it or add it to .env.local." >&2
  exit 1
fi

# ---------- parse args -------------------------------------------------------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --visible)  FILTER="AND is_visible = true";  shift ;;
    --hidden)   FILTER="AND is_visible = false"; shift ;;
    --locale)   LOCALE="$2";                     shift 2 ;;
    --base-url) BASE_URL="$2";                   shift 2 ;;
    -h|--help)
      grep '^# ' "$0" | sed 's/^# //'
      exit 0
      ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

# ---------- query ------------------------------------------------------------
SQL="
SELECT
  slug,
  is_visible,
  title_en,
  title_es,
  price_usd,
  property_type
FROM properties
WHERE 1=1 $FILTER
ORDER BY synced_at DESC;
"

# Use psql via docker if the host is localhost, otherwise connect directly
if echo "$DATABASE_URL" | grep -qE 'localhost|127\.0\.0\.1'; then
  CONTAINER=$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E 'postgres|remax' | head -1)
  DB_USER=$(echo "$DATABASE_URL" | sed -E 's|postgresql://([^:]+):.*|\1|')
  DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')

  if [[ -n "$CONTAINER" ]]; then
    ROWS=$(docker exec "$CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -t -A -F $'\t' -c "$SQL" 2>/dev/null)
  else
    ROWS=$(psql "$DATABASE_URL" -t -A -F $'\t' -c "$SQL" 2>/dev/null)
  fi
else
  ROWS=$(psql "$DATABASE_URL" -t -A -F $'\t' -c "$SQL" 2>/dev/null)
fi

# ---------- output -----------------------------------------------------------
TOTAL=0
VISIBLE=0
HIDDEN=0

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
printf "  %-10s  %-8s  %-12s  %s\n" "STATUS" "PRICE" "TYPE" "URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

while IFS=$'\t' read -r slug is_visible title_en title_es price_usd property_type; do
  [[ -z "$slug" ]] && continue

  URL="${BASE_URL}/${LOCALE}/property/${slug}"

  if [[ "$is_visible" == "t" ]]; then
    STATUS="✅ visible"
    ((VISIBLE++))
  else
    STATUS="🚫 hidden "
    ((HIDDEN++))
  fi

  PRICE=$(printf "%'d" "$price_usd" 2>/dev/null || echo "$price_usd")

  printf "  %-10s  \$%-7s  %-12s  %s\n" "$STATUS" "$PRICE" "$property_type" "$URL"
  ((TOTAL++))
done <<< "$ROWS"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Total: $TOTAL  |  Visible: $VISIBLE  |  Hidden (soft-deleted): $HIDDEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
