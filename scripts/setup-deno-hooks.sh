#!/bin/bash

# Setup script for Git hooks
# Installs pre-commit and other safety hooks

set -euo pipefail

echo "========================================="
echo "Setting up Git Pre-Commit Hooks"
echo "========================================="

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GIT_HOOKS_DIR="$REPO_ROOT/.git/hooks"
GITHOOKS_DIR="$REPO_ROOT/.githooks"

# Ensure directories exist
mkdir -p "$GIT_HOOKS_DIR"
mkdir -p "$GITHOOKS_DIR"

# List of hooks to install
HOOKS=("pre-commit")

echo ""
echo "Installing hooks from: $GITHOOKS_DIR"
echo ""

for hook in "${HOOKS[@]}"; do
    HOOK_SOURCE="$GITHOOKS_DIR/$hook"
    HOOK_DEST="$GIT_HOOKS_DIR/$hook"
    
    if [ -f "$HOOK_SOURCE" ]; then
        cp "$HOOK_SOURCE" "$HOOK_DEST"
        chmod +x "$HOOK_DEST"
        echo "✓ Installed: .$hook"
    else
        echo "⚠ Not found: $HOOK_SOURCE"
    fi
done

echo ""
echo "========================================="
echo "✓ Git hooks installed successfully!"
echo "========================================="
echo ""
echo "Installed hooks:"
for hook in "${HOOKS[@]}"; do
    echo "- $hook: Runs before each commit"
done
echo ""
echo "To see what each hook does:"
echo "  cat .githooks/pre-commit"
echo ""
echo "To bypass hooks (not recommended):"
echo "  git commit --no-verify"
echo ""
echo "To uninstall hooks:"
echo "  rm .git/hooks/pre-commit"
echo ""
