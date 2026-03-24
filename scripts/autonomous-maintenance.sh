#!/bin/bash
# ─────────────────────────────────────────────────────────
# Tanner Terminal — Autonomous Maintenance Engine
# Detects and fixes ONLY approved repo drift categories.
# Must pass full validation before changes are committed.
# ─────────────────────────────────────────────────────────

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

FIXES_APPLIED=0
FIXES_SKIPPED=0

fix_applied() {
  echo -e "${GREEN}⚡ FIXED:${NC} $1"
  ((FIXES_APPLIED++))
}

fix_skipped() {
  echo -e "${YELLOW}⏭  SKIPPED:${NC} $1 — $2"
  ((FIXES_SKIPPED++))
}

echo "══════════════════════════════════════════"
echo " Tanner Terminal — Autonomous Maintenance"
echo "══════════════════════════════════════════"
echo ""

# ── APPROVED FIX 1: Remove forbidden lockfiles ──
echo -e "${BLUE}── Fix Category: Forbidden Lockfiles ──${NC}"
for BAD in package-lock.json yarn.lock pnpm-lock.yaml bun.lock; do
  if [ -f "$BAD" ]; then
    rm -f "$BAD"
    fix_applied "Removed forbidden lockfile: $BAD"
  fi
done

# ── APPROVED FIX 2: Verify bun.lockb exists ──
echo -e "${BLUE}── Fix Category: Lockfile Presence ──${NC}"
if [ ! -f bun.lockb ]; then
  fix_skipped "bun.lockb missing" "Cannot auto-generate — requires manual: bun install"
else
  echo -e "${GREEN}✓${NC} bun.lockb present"
fi

# ── APPROVED FIX 3: Deno lint auto-fix (approved paths only) ──
echo -e "${BLUE}── Fix Category: Deno Lint (supabase/functions/) ──${NC}"
if command -v deno &>/dev/null && [ -d "supabase/functions" ]; then
  DENO_CLEAN=0
  deno lint supabase/functions/ >/dev/null 2>&1 && DENO_CLEAN=1 || true
  if [ "$DENO_CLEAN" -eq 1 ]; then
    echo -e "${GREEN}✓${NC} Deno lint clean — no fixes needed"
  else
    DENO_FIXED=0
    deno lint --fix supabase/functions/ >/dev/null 2>&1 && DENO_FIXED=1 || true
    if [ "$DENO_FIXED" -eq 1 ]; then
      fix_applied "Auto-fixed Deno lint issues in supabase/functions/"
    else
      fix_skipped "Deno lint issues" "Auto-fix could not resolve all issues"
    fi
  fi
else
  echo -e "${YELLOW}⏭${NC}  Deno not available or no functions directory — skipping"
fi

# ── APPROVED FIX 4: Frontend lint auto-fix ──
echo -e "${BLUE}── Fix Category: Frontend Lint ──${NC}"
if command -v bun &>/dev/null; then
  LINT_CLEAN=0
  bun run lint >/dev/null 2>&1 && LINT_CLEAN=1 || true
  if [ "$LINT_CLEAN" -eq 1 ]; then
    echo -e "${GREEN}✓${NC} Frontend lint clean — no fixes needed"
  else
    LINT_FIXED=0
    bunx eslint --fix src/ >/dev/null 2>&1 && LINT_FIXED=1 || true
    if [ "$LINT_FIXED" -eq 1 ]; then
      fix_applied "Auto-fixed ESLint issues in src/"
    else
      fix_skipped "ESLint issues" "Auto-fix could not resolve all issues"
    fi
  fi
fi

# ── FORBIDDEN: Categories we explicitly do NOT touch ──
echo ""
echo -e "${BLUE}── Forbidden Categories (not touched) ──${NC}"
echo "  ✗ React version — not modified (locked to 18.x)"
echo "  ✗ Database schema — not modified"
echo "  ✗ Auth config — not modified"
echo "  ✗ Product logic — not modified"
echo "  ✗ Secrets/env — not modified"
echo "  ✗ Workflow permissions — not broadened"
echo "  ✗ Deno runtime behavior — not modified"
echo "  ✗ Test architecture — not modified"

# ── Output summary ──
echo ""
echo "══════════════════════════════════════════"
echo -e " Fixes applied: ${GREEN}$FIXES_APPLIED${NC}"
echo -e " Fixes skipped: ${YELLOW}$FIXES_SKIPPED${NC}"
echo "══════════════════════════════════════════"

# Signal to the calling workflow whether there are changes
if [ "$FIXES_APPLIED" -gt 0 ]; then
  echo "has_changes=true" >> "${GITHUB_OUTPUT:-/dev/null}"
  echo ""
  echo -e "${GREEN}Changes were made. Validation must pass before PR creation.${NC}"
else
  echo "has_changes=false" >> "${GITHUB_OUTPUT:-/dev/null}"
  echo ""
  echo -e "${GREEN}Repo is clean. No maintenance needed.${NC}"
fi
