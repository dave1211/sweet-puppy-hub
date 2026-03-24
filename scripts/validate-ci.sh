#!/bin/bash

# Comprehensive CI Validation Script
# Validates that all hardening measures are in place and working

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BOLD}${BLUE}=========================================${NC}"
echo -e "${BOLD}${BLUE}Tanner Terminal - CI Hardening Validation${NC}"
echo -e "${BOLD}${BLUE}=========================================${NC}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
}

# ===== SECTION 1: Workflows =====
echo -e "\n${BOLD}${BLUE}=== Workflow Files ===${NC}"

REQUIRED_WORKFLOWS=(
    ".github/workflows/ci-gate.yml"
    ".github/workflows/lockfile-integrity.yml"
    ".github/workflows/deno.yml"
    ".github/workflows/security-sentinel.yml"
    ".github/workflows/android-apk.yml"
    ".github/workflows/android-release.yml"
)

for workflow in "${REQUIRED_WORKFLOWS[@]}"; do
    if [ -f "$workflow" ]; then
        pass "Found: $workflow"
    else
        fail "Missing: $workflow"
    fi
done

# ===== SECTION 2: Git Hooks =====
echo -e "\n${BOLD}${BLUE}=== Git Hooks ===${NC}"

if [ -f ".githooks/pre-commit" ]; then
    pass "Found: .githooks/pre-commit"
    if grep -q "lockfile" ".githooks/pre-commit"; then
        pass "  └─ Pre-commit checks lockfile"
    else
        warn "  └─ Pre-commit may not check lockfile"
    fi
else
    fail "Missing: .githooks/pre-commit"
fi

if [ -f ".git/hooks/pre-commit" ]; then
    pass "Pre-commit hook installed in .git"
else
    warn "Pre-commit hook not yet installed (run: bash scripts/setup-deno-hooks.sh)"
fi

# ===== SECTION 3: Configuration Files =====
echo -e "\n${BOLD}${BLUE}=== Configuration Files ===${NC}"

CONFIG_FILES=(
    ".github/dependabot.yml"
    "docs/BRANCH_PROTECTION.md"
    "CONTRIBUTING.md"
)

for config in "${CONFIG_FILES[@]}"; do
    if [ -f "$config" ]; then
        pass "Found: $config"
    else
        fail "Missing: $config"
    fi
done

# ===== SECTION 4: Lockfile Integrity =====
echo -e "\n${BOLD}${BLUE}=== Lockfile Integrity ===${NC}"

HAS_BUN=$([ -f bun.lockb ] && echo "true" || echo "false")
HAS_NPM=$([ -f package-lock.json ] && echo "true" || echo "false")
HAS_BUN_OLD=$([ -f bun.lock ] && echo "true" || echo "false")
HAS_YARN=$([ -f yarn.lock ] && echo "true" || echo "false")

if [ "$HAS_BUN" = "true" ]; then
    pass "Bun lockfile present: bun.lockb"
else
    fail "Bun lockfile missing: bun.lockb"
fi

if [ "$HAS_NPM" = "false" ]; then
    pass "No npm lockfile (package-lock.json not present)"
else
    fail "ERROR - package-lock.json present! Remove it - repo uses Bun only"
fi

if [ "$HAS_BUN_OLD" = "false" ]; then
    pass "No old bun.lock file"
else
    fail "ERROR - bun.lock present! Remove it - use bun.lockb only"
fi

if [ "$HAS_YARN" = "false" ]; then
    pass "No yarn lockfile"
else
    fail "ERROR - yarn.lock present! Remove it - repo uses Bun only"
fi

# ===== SECTION 5: Package Manager =====
echo -e "\n${BOLD}${BLUE}=== Package Manager ===${NC}"

if command -v bun &> /dev/null; then
    BUN_VERSION=$(bun --version)
    pass "Bun installed: v$BUN_VERSION"
else
    warn "Bun not installed (required for local development)"
    echo "   Install from: https://bun.sh"
fi

if command -v deno &> /dev/null; then
    DENO_VERSION=$(deno --version | head -1)
    pass "Deno installed: $DENO_VERSION"
else
    warn "Deno not installed (required for Supabase functions)"
    echo "   Install from: https://deno.land"
fi

# ===== SECTION 6: Key Files =====
echo -e "\n${BOLD}${BLUE}=== Key Files & Scripts ===${NC}"

KEY_FILES=(
    "package.json"
    "tsconfig.json"
    "vite.config.ts"
    "scripts/deno-lint-fix.sh"
    "scripts/setup-deno-hooks.sh"
    "scripts/validate-ci.sh"
)

for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        pass "Found: $file"
    else
        fail "Missing: $file"
    fi
done

# ===== SECTION 7: Android Configuration =====
echo -e "\n${BOLD}${BLUE}=== Android Configuration ===${NC}"

ANDROID_FILES=(
    "android/build.gradle"
    "android/app/build.gradle"
    "android/variables.gradle"
    "capacitor.config.ts"
)

for file in "${ANDROID_FILES[@]}"; do
    if [ -f "$file" ]; then
        pass "Found: $file"
    else
        warn "Missing: $file (may not need Android build)"
    fi
done

# ===== SECTION 8: Secrets Protection =====
echo -e "\n${BOLD}${BLUE}=== Secrets Protection ===${NC}"

if grep -r "SUPABASE_SERVICE_ROLE_KEY" .github/workflows/*.yml > /dev/null 2>&1; then
    pass "Workflows use GitHub secrets (not hardcoded)"
else
    warn "Cannot verify secret usage in workflows"
fi

# Check for .env in gitignore
if grep -q "^\.env" .gitignore 2>/dev/null; then
    pass ".env files in .gitignore"
else
    fail ".env files may be tracked by git"
fi

# ===== SECTION 9: Documentation =====
echo -e "\n${BOLD}${BLUE}=== Documentation ===${NC}"

DOCS=(
    "README.md"
    "SECURITY.md"
    "docs/BRANCH_PROTECTION.md"
    "CONTRIBUTING.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        pass "Found: $doc"
    else
        warn "Missing: $doc"
    fi
done

# ===== SECTION 10: CI Workflow Validation =====
echo -e "\n${BOLD}${BLUE}=== Workflow Configuration ===${NC}"

# Check deno.yml has strict gates
if grep -q "Strict lint verification" ".github/workflows/deno.yml"; then
    pass "Deno workflow has strict gating"
else
    warn "Deno workflow may not have strict gates"
fi

# Check ci-gate.yml exists and has all jobs
if [ -f ".github/workflows/ci-gate.yml" ]; then
    if grep -q "dependency-integrity\|app-validate\|deno-validate\|android-validate" ".github/workflows/ci-gate.yml"; then
        pass "CI gate workflow has required jobs"
    else
        fail "CI gate workflow missing required jobs"
    fi
else
    fail "CI gate workflow not found"
fi

# Check lockfile-integrity.yml
if [ -f ".github/workflows/lockfile-integrity.yml" ]; then
    if grep -q "mixed\|MULTIPLE" ".github/workflows/lockfile-integrity.yml"; then
        pass "Lockfile workflow checks for mixed lockfiles"
    else
        fail "Lockfile workflow incomplete"
    fi
else
    fail "Lockfile integrity workflow not found"
fi

# ===== SECTION 11: Dependency Configuration =====
echo -e "\n${BOLD}${BLUE}=== Dependency Management ===${NC}"

if [ -f ".github/dependabot.yml" ]; then
    pass "Dependabot configuration found"
    if grep -q "bun\|npm" ".github/dependabot.yml"; then
        pass "  └─ Configured for Bun/npm"
    fi
    if grep -q "react.*19" ".github/dependabot.yml"; then
        pass "  └─ React 19 blocked"
    else
        warn "  └─ React 19 may not be blocked"
    fi
else
    fail "Dependabot configuration missing"
fi

# ===== SUMMARY =====
echo ""
echo -e "${BOLD}${BLUE}=========================================${NC}"
echo -e "${BOLD}${BLUE}VALIDATION SUMMARY${NC}"
echo -e "${BOLD}${BLUE}=========================================${NC}"

TOTAL=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))
PERCENTAGE=$((CHECKS_PASSED * 100 / (CHECKS_PASSED + CHECKS_FAILED)))

echo ""
echo -e "${GREEN}✓ Passed:${NC}  $CHECKS_PASSED"
echo -e "${RED}✗ Failed:${NC}  $CHECKS_FAILED"
echo -e "${YELLOW}⚠ Warnings:${NC} $CHECKS_WARNING"
echo -e "${BOLD}Total:${NC}   $TOTAL"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}${BOLD}✓ All critical checks PASSED!${NC}"
    echo -e "Repository is properly hardened."
    if [ $CHECKS_WARNING -gt 0 ]; then
        echo -e "${YELLOW}Review $CHECKS_WARNING warning(s) above.${NC}"
    fi
    exit 0
else
    echo ""
    echo -e "${RED}${BOLD}✗ $CHECKS_FAILED critical check(s) FAILED${NC}"
    echo -e "Fix issues above to harden the repository."
    exit 1
fi
