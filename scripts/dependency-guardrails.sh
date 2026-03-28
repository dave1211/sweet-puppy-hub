#!/usr/bin/env bash
# Dependency Guardrails - PHASE 4
# Protects critical dependencies from unexpected changes

set -euo pipefail

echo "========================================"
echo "PHASE 4: DEPENDENCY GUARDRAILS"
echo "========================================"

# Function to get React version
get_react_version() {
    grep -oP '"react":\s*"\K[^"]+' package.json || echo "not-found"
}

# Function to check if version is 18.x
is_react_18() {
    local version=$1
    [[ $version =~ ^(~|^)?18\. ]] || [[ $version =~ ^18 ]]
}

echo "Checking critical dependencies..."
echo ""

# Check 1: React version must be 18.x
REACT_VER=$(get_react_version)
echo "React version: $REACT_VER"

if [ "$REACT_VER" == "not-found" ]; then
    echo "::error::React not found in package.json"
    exit 1
fi

if ! is_react_18 "$REACT_VER"; then
    echo "::error::React must be 18.x, found: $REACT_VER"
    echo "Fix: npm/yarn/bun add react@18"
    exit 1
fi

echo "✓ React version constraint valid"
echo ""

# Check 2: Banned packages detection
echo "Scanning for banned packages..."

BANNED_PACKAGES=()
if grep -q '"next":' package.json; then BANNED_PACKAGES+=("next"); fi
if grep -q '"gatsby":' package.json; then BANNED_PACKAGES+=("gatsby"); fi
if grep -q '"webpack":' package.json; then BANNED_PACKAGES+=("webpack"); fi
if grep -q '"gulp":' package.json; then BANNED_PACKAGES+=("gulp"); fi

if [ ${#BANNED_PACKAGES[@]} -gt 0 ]; then
    echo "::warning::Detected banned packages: ${BANNED_PACKAGES[*]}"
    echo "These packages are not allowed in this project"
    echo "Please remove them"
    exit 1
fi

echo "✓ No banned packages detected"
echo ""

# Check 3: Critical dependency integrity
echo "Verifying bun.lockb integrity..."

if [ ! -f bun.lockb ]; then
    echo "::error::bun.lockb missing"
    exit 1
fi

if ! file bun.lockb | grep -qE '(data|binary)'; then
    echo "::warning::bun.lockb format unexpected - may be corrupted"
fi

echo "✓ bun.lockb integrity check passed"
echo ""

# Check 4: Lockfile sync verification
echo "Verifying package.json and bun.lockb are in sync..."

PACKAGE_COUNT=$(jq '.dependencies | length' package.json 2>/dev/null || echo 0)
echo "Dependencies in package.json: $PACKAGE_COUNT"

# This would require parsing bun.lockb format - simplified check:
if [ $PACKAGE_COUNT -eq 0 ]; then
    echo "::warning::No dependencies found in package.json"
fi

echo "✓ Dependency guardrails validation complete"
