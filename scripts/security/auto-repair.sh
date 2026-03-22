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
# 1. Lockfile consistency
# -------------------------------------------------------
echo "[1/3] Checking lockfile consistency..."

if [ -f package.json ] && [ -f package-lock.json ]; then
  npm install --package-lock-only --ignore-scripts 2>/dev/null && {
    if ! git diff --quiet package-lock.json 2>/dev/null; then
      echo "  ✅ Fixed lockfile drift"
      HAS_FIXES=true
    fi
  } || echo "  ⚠️  Could not fix lockfile"
fi

# -------------------------------------------------------
# 2. Safe dependency patches (patch-level only)
# -------------------------------------------------------
echo "[2/3] Checking for safe patch updates..."

npm audit fix --force=false 2>/dev/null && {
  if ! git diff --quiet package-lock.json package.json 2>/dev/null; then
    echo "  ✅ Applied safe dependency patches"
    HAS_FIXES=true
  fi
} || echo "  ℹ️  No safe patches available"

# -------------------------------------------------------
# 3. Trailing whitespace in safe files only
# -------------------------------------------------------
echo "[3/3] Fixing trailing whitespace in safe files..."

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
  echo "has_fixes=true" >> "${GITHUB_OUTPUT:-/dev/null}"
else
  echo "ℹ️  No fixes needed"
  echo "has_fixes=false" >> "${GITHUB_OUTPUT:-/dev/null}"
fi
