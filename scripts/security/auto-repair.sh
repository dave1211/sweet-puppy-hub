#!/usr/bin/env bash
set -euo pipefail

echo "🛡️  Tanner Sentinel — Auto-Repair"
echo "==================================="
echo ""

HAS_FIXES=false

# Load protected paths — never touch these
PROTECTED=$(cat scripts/security/protected-paths.json 2>/dev/null | jq -r '.auto_repair_forbidden[]' 2>/dev/null || echo "")

is_protected() {
  local file="$1"
  for p in $PROTECTED; do
    case "$file" in
      $p) return 0 ;;
    esac
  done
  return 1
}

# -------------------------------------------------------
# 1. Bun lockfile consistency (Bun-only repo)
# -------------------------------------------------------
echo "[1/2] Checking Bun lockfile consistency..."

# Verify bun.lockb exists
if [ ! -f bun.lockb ]; then
  echo "  ℹ️  bun.lockb missing — cannot auto-repair without it"
else
  # Re-lock without installing to check consistency
  if command -v bun &>/dev/null; then
    bun install --frozen 2>/dev/null && {
      if ! git diff --quiet bun.lockb 2>/dev/null; then
        echo "  ✅ Updated bun.lockb to match dependencies"
        HAS_FIXES=true
      else
        echo "  ✓ bun.lockb is consistent"
      fi
    } || echo "  ℹ️  Lockfile is already locked"
  else
    echo "  ⚠️  Bun not available"
  fi
fi

# -------------------------------------------------------
# 2. Trailing whitespace in safe files only
# -------------------------------------------------------
echo "[2/2] Fixing trailing whitespace in safe files..."

for f in docs/*.md README.md SECURITY.md; do
  [ -f "$f" ] || continue
  if is_protected "$f"; then continue; fi
  if sed -i 's/[[:space:]]*$//' "$f" 2>/dev/null; then
    if ! git diff --quiet "$f" 2>/dev/null; then
      echo "  ✅ Fixed whitespace in $f"
      HAS_FIXES=true
    fi
  fi
done

echo ""
echo "==================================="
if [ "$HAS_FIXES" = "true" ]; then
  echo "✅ Fixes applied — PR will be created"
  echo "has_changes=true" >> "${GITHUB_OUTPUT:-/dev/null}"
else
  echo "ℹ️  No fixes needed"
  echo "has_changes=false" >> "${GITHUB_OUTPUT:-/dev/null}"
fi
