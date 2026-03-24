#!/bin/bash

set -euo pipefail

echo "========================================="
echo "Deno Lint Repair Script"
echo "========================================="

WORKSPACE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$WORKSPACE_DIR"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========== PHASE 1: CAPTURE BASELINE ==========
echo -e "\n${BLUE}PHASE 1: Capturing current lint errors...${NC}"

LINT_OUTPUT_BEFORE=$(mktemp)
LINT_OUTPUT_AFTER=$(mktemp)
LINT_ERRORS_BEFORE=0
LINT_ERRORS_AFTER=0

if command -v deno &> /dev/null; then
    echo "Using Deno from: $(which deno)"
    deno --version
    
    echo -e "\n${YELLOW}Running: deno lint${NC}"
    if deno lint 2>&1 | tee "$LINT_OUTPUT_BEFORE" || true; then
        LINT_ERRORS_BEFORE=$(grep -c "error" "$LINT_OUTPUT_BEFORE" || echo "0")
    else
        LINT_ERRORS_BEFORE=$(grep -c "error" "$LINT_OUTPUT_BEFORE" || echo "unknown")
    fi
    
    echo -e "\n${BLUE}Lint errors before fixes: ${LINT_ERRORS_BEFORE}${NC}"
    echo "Full output saved to: $LINT_OUTPUT_BEFORE"
else
    echo -e "${RED}Deno not found. Please install Deno: https://deno.land${NC}"
    exit 1
fi

# ========== PHASE 2: AUTO-FIX ==========
echo -e "\n${BLUE}PHASE 2: Running auto-fix...${NC}"

echo -e "${YELLOW}Running: deno lint --fix${NC}"
if deno lint --fix 2>&1; then
    echo -e "${GREEN}Auto-fix completed${NC}"
else
    echo -e "${YELLOW}Auto-fix encountered some issues (may still have made fixes)${NC}"
fi

# ========== PHASE 3: VERIFY FIXES ==========
echo -e "\n${BLUE}PHASE 3: Verifying remaining lint issues...${NC}"

echo -e "${YELLOW}Running: deno lint (after auto-fix)${NC}"
if deno lint 2>&1 | tee "$LINT_OUTPUT_AFTER" || true; then
    LINT_ERRORS_AFTER=$(grep -c "error" "$LINT_OUTPUT_AFTER" || echo "0")
else
    LINT_ERRORS_AFTER=$(grep -c "error" "$LINT_OUTPUT_AFTER" || echo "unknown")
fi

echo -e "\n${BLUE}Lint errors after fixes: ${LINT_ERRORS_AFTER}${NC}"
echo "Full output saved to: $LINT_OUTPUT_AFTER"

# ========== PHASE 4: FORMAT CODE ==========
echo -e "\n${BLUE}PHASE 4: Formatting code with deno fmt...${NC}"

echo -e "${YELLOW}Running: deno fmt${NC}"
if deno fmt; then
    echo -e "${GREEN}Code formatting completed${NC}"
else
    echo -e "${YELLOW}Code formatting encountered some issues${NC}"
fi

# ========== PHASE 5: SUMMARY ==========
echo -e "\n${BLUE}======== SUMMARY ========${NC}"
echo "Before fixes: $LINT_ERRORS_BEFORE errors"
echo "After fixes:  $LINT_ERRORS_AFTER errors"

if [ "$LINT_ERRORS_AFTER" = "0" ] || [ "$LINT_ERRORS_AFTER" = "unknown" ]; then
    echo -e "${GREEN}✓ All lint errors resolved!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some lint errors remain (see details below)${NC}"
    echo -e "\n${YELLOW}Remaining errors:${NC}"
    tail -50 "$LINT_OUTPUT_AFTER"
    exit 1
fi

cleanup() {
    rm -f "$LINT_OUTPUT_BEFORE" "$LINT_OUTPUT_AFTER"
}

trap cleanup EXIT
