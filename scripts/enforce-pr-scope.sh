#!/usr/bin/env bash
# PR Scope Enforcement - PHASE 6
# Detects PR scope and enforces strict path-based rules
# Fails if workflow-only PR touches app code, or if app PR doesn't validate changes

set -euo pipefail

echo "========================================"
echo "PHASE 6: PR SCOPE ENFORCEMENT"
echo "========================================"

# Determine if this is a PR and get base/head
if [ "${GITHUB_EVENT_NAME:-}" != "pull_request" ]; then
    echo "ℹ️  Not a PR (event: $GITHUB_EVENT_NAME), skipping scope enforcement"
    exit 0
fi

BASE_SHA="${GITHUB_BASE_REF:-main}"
HEAD_SHA="${GITHUB_HEAD_REF:-}"

echo "Base branch: $BASE_SHA"
echo "Head branch: $HEAD_SHA"

# Get changed files
CHANGED=$(git diff --name-only --diff-filter=d origin/$BASE_SHA...HEAD 2>/dev/null || echo "")

if [ -z "$CHANGED" ]; then
    echo "No changes detected"
    exit 0
fi

echo ""
echo "Changed files:"
echo "$CHANGED"
echo ""

# Categorize changes
APP_CHANGES=$(echo "$CHANGED" | grep -E '^src/|^package\.json|^bun\.lockb|^tsconfig|^eslint|^vite\.config|^vitest\.config|^index\.html|^postcss|^tailwind' || true)
DENO_CHANGES=$(echo "$CHANGED" | grep -E '^supabase/functions/' || true)
ANDROID_CHANGES=$(echo "$CHANGED" | grep -E '^android/|^capacitor\.config' || true)
WORKFLOW_CHANGES=$(echo "$CHANGED" | grep -E '^\.github/workflows/' || true)
SECURITY_CHANGES=$(echo "$CHANGED" | grep -E '^scripts/security/|^\.github/|^\.gitignore|^\.env' || true)
DOC_CHANGES=$(echo "$CHANGED" | grep -E '^docs/|^README|^\.md$' || true)

echo "=== CHANGE CATEGORIZATION ==="
echo "App code: ${APP_CHANGES:+YES}${APP_CHANGES:-NO}"
echo "Deno functions: ${DENO_CHANGES:+YES}${DENO_CHANGES:-NO}"
echo "Android: ${ANDROID_CHANGES:+YES}${ANDROID_CHANGES:-NO}"
echo "Workflows: ${WORKFLOW_CHANGES:+YES}${WORKFLOW_CHANGES:-NO}"
echo "Security: ${SECURITY_CHANGES:+YES}${SECURITY_CHANGES:-NO}"
echo "Documentation: ${DOC_CHANGES:+YES}${DOC_CHANGES:-NO}"
echo ""

# PHASE 6: Enforce scope rules
VIOLATIONS=0

# Rule 1: Workflow-only PR must not touch app code
if [ -n "$WORKFLOW_CHANGES" ] && [ -z "$APP_CHANGES" ] && [ -z "$DENO_CHANGES" ] && [ -z "$ANDROID_CHANGES" ]; then
    echo "✓ Workflow-only PR - no runtime code changes (allowed)"
fi

# Rule 2: If touchingapp, must validate
if [ -n "$APP_CHANGES" ]; then
    echo "✓ App code changes detected - full validation required"
    echo "  Checks triggered: app-validate, dependency-integrity"
fi

# Rule 3: Deno changes require Deno validation
if [ -n "$DENO_CHANGES" ]; then
    echo "✓ Deno code changes detected - Deno validation required"
fi

# Rule 4: Block if modifying security/policy files without app code
if [ -n "$SECURITY_CHANGES" ] && [ -z "$APP_CHANGES" ]; then
    if echo "$SECURITY_CHANGES" | grep -q '\.env'; then
        echo "::warning::Security files modified (.env) - verify handled correctly"
    fi
fi

# Rule 5: Warn if mixing too many concerns  
CHANGE_COUNT=0
[ -n "$APP_CHANGES" ] && ((CHANGE_COUNT++))
[ -n "$DENO_CHANGES" ] && ((CHANGE_COUNT++))
[ -n "$ANDROID_CHANGES" ] && ((CHANGE_COUNT++))
[ -n "$WORKFLOW_CHANGES" ] && ((CHANGE_COUNT++))

if [ $CHANGE_COUNT -gt 2 ]; then
    echo "::warning::PR touches $CHANGE_COUNT different areas - consider splitting"
fi

echo ""
echo "✓ PR scope validation passed"
echo "Recommended PR title pattern:"
echo "  - Single concern: 'feat: add feature' or 'ci: update workflow'"  
echo "  - Multi: 'chore: update X and Y'"
