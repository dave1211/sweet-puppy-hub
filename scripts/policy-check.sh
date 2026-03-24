#!/bin/bash
# ─────────────────────────────────────────────────
# Tanner Terminal — Repo Policy Enforcement
# Single source of truth for automated policy gates.
# Called by .github/workflows/policy.yml and usable locally.
# Exit non-zero on any violation.
# ─────────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

VIOLATIONS=0

fail() {
  echo -e "${RED}✗ POLICY VIOLATION:${NC} $1"
  echo "  → $2"
  ((VIOLATIONS++))
}

pass() {
  echo -e "${GREEN}✓${NC} $1"
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "══════════════════════════════════════"
echo " Tanner Terminal — Policy Check"
echo "══════════════════════════════════════"

# ── 1. Forbidden lockfiles ──────────────────────
echo ""
echo "── Lockfile policy ──"
for BAD in package-lock.json yarn.lock pnpm-lock.yaml bun.lock; do
  if [ -f "$BAD" ]; then
    fail "Forbidden lockfile detected: $BAD" "Remove it. Only bun.lockb is allowed."
  fi
done

if [ -f bun.lockb ]; then
  pass "bun.lockb present"
else
  fail "bun.lockb missing" "Run: bun install"
fi

# ── 2. .env must not be tracked ─────────────────
echo ""
echo "── Secret leakage policy ──"
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  fail "Tracked .env detected" "Run: git rm --cached .env && echo '.env' >> .gitignore"
else
  pass ".env not tracked"
fi

# ── 3. React 18.x enforcement ──────────────────
echo ""
echo "── React version policy ──"
for PKG in react react-dom; do
  if [ -d "node_modules/$PKG" ]; then
    VER=$(node -e "console.log(require('./node_modules/$PKG/package.json').version)")
    MAJOR=$(echo "$VER" | cut -d. -f1)
    if [ "$MAJOR" != "18" ]; then
      fail "$PKG version drift: found $VER" "$PKG must remain on 18.x"
    else
      pass "$PKG $VER (18.x ✓)"
    fi
  fi
done

# Also check package.json declarations
for PKG in react react-dom; do
  DECLARED=$(node -e "
    const p = require('./package.json');
    const v = (p.dependencies && p.dependencies['$PKG']) || (p.devDependencies && p.devDependencies['$PKG']) || '';
    console.log(v);
  " 2>/dev/null || echo "")
  if [ -n "$DECLARED" ]; then
    if echo "$DECLARED" | grep -qE '^(\^|~|>=)?19\.|^19\.'; then
      fail "$PKG declared as $DECLARED in package.json" "Pin to 18.x: \"$PKG\": \"^18.3.1\""
    fi
  fi
done

# ── 4. No npm/yarn/pnpm in Bun-scoped workflows ─
echo ""
echo "── Workflow package-manager policy ──"
BUN_SCOPED_WORKFLOWS=(
  ".github/workflows/ci-gate.yml"
  ".github/workflows/security-sentinel.yml"
  ".github/workflows/security-auto-repair.yml"
  ".github/workflows/android-apk.yml"
  ".github/workflows/android-release.yml"
  ".github/workflows/lockfile-integrity.yml"
  ".github/workflows/policy.yml"
)

for WF in "${BUN_SCOPED_WORKFLOWS[@]}"; do
  if [ -f "$WF" ]; then
    # Match lines like "npm install", "npm ci", "yarn install", "pnpm install"
    # but not comments or echo strings mentioning npm for informational purposes
    if grep -nE '^\s*(run:|-).*\b(npm (install|ci|run|test)|yarn (install|add)|pnpm (install|add))\b' "$WF" >/dev/null 2>&1; then
      LINES=$(grep -nE '^\s*(run:|-).*\b(npm (install|ci|run|test)|yarn (install|add)|pnpm (install|add))\b' "$WF" | head -3)
      fail "npm/yarn/pnpm usage in Bun-scoped workflow: $WF" "Replace with bun equivalents. Lines: $LINES"
    else
      pass "$WF — no npm/yarn/pnpm usage"
    fi
  fi
done

# ── 5. Duplicate Android validation ─────────────
echo ""
echo "── Android validation dedup policy ──"
if [ -f ".github/workflows/ci-gate.yml" ] && [ -f ".github/workflows/android-apk.yml" ]; then
  if grep -qE 'android-validate|assembleDebug|gradlew' ".github/workflows/ci-gate.yml" 2>/dev/null; then
    fail "Duplicate Android validation in ci-gate.yml" "Android validation belongs in android-apk.yml only."
  else
    pass "No duplicate Android validation in ci-gate.yml"
  fi
else
  pass "Android validation structure OK"
fi

# ── 6. Workflow permissions audit ────────────────
echo ""
echo "── Permissions policy ──"
for WF in .github/workflows/*.yml; do
  if [ -f "$WF" ]; then
    if grep -qE '^\s*permissions:\s*write-all' "$WF" 2>/dev/null; then
      fail "Overly broad permissions in $WF" "Use minimal permissions (contents: read, etc.)"
    fi
  fi
done
pass "No write-all permissions detected"

# ── Summary ─────────────────────────────────────
echo ""
echo "══════════════════════════════════════"
if [ "$VIOLATIONS" -eq 0 ]; then
  echo -e "${GREEN}✓ ALL POLICY CHECKS PASSED${NC}"
  echo "══════════════════════════════════════"
  exit 0
else
  echo -e "${RED}✗ $VIOLATIONS POLICY VIOLATION(S) DETECTED${NC}"
  echo "Fix all violations above before merging."
  echo "══════════════════════════════════════"
  exit 1
fi
