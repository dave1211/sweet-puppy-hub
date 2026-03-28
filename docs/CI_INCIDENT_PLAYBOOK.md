# CI Incident Playbook

**Version:** 1.0  
**Last Updated:** 2026-03-28  
**Audience:** Developers, DevOps, Maintainers

Quick reference for fixing failing CI checks and unblocking merges.

---

## Table of Contents

1. Quick Diagnostics
2. Dependency Integrity Failures
3. App Validation Failures
4. Deno Validation Failures
5. Android Build Failures
6. Lockfile Integrity Failures
7. Branch Protection Issues
8. Recovery Procedures

---

## 1. Quick Diagnostics

### Check CI Status
```bash
# View PR status in GitHub CLI
gh pr view <pr_number> --json statusCheckRollup

# View which specific jobs failed
gh pr view <pr_number> --json statusCheckRollup \
  --jq '.statusCheckRollup[] | {name: .name, status: .status, conclusion: .conclusion}'
```

### Find Logs
- Go to PR → "Checks" tab → Click failing check → View logs
- All logs include `set -euo pipefail` output for clarity
- Search logs for `::error::` for explicit failure reasons

### Quick PR Summary
```bash
# Get PR details
gh pr view <pr_number> --json title,body,state,checks
```

---

## 2. Dependency Integrity Failures

**Symptom:** "Full CI Validation & Gating / Dependency Integrity" ❌

### Cause 1: Forbidden Lockfile Detected
**Error:** `::error::FORBIDDEN: Found <filename> — this repository is Bun-only`

**Fix:**
```bash
# Remove the forbidden file
git rm package-lock.json  # or yarn.lock / pnpm-lock.yaml / bun.lock
git add .gitignore        # ensure it's ignored
git commit -m "chore: remove forbidden lockfile (Bun-only policy)"
git push
```

**Prevention:** Once removed, lockfile never comes back (checked in CI).

### Cause 2: bun.lockb Missing
**Error:** `::error::CRITICAL: bun.lockb is missing`

**Fix:**
```bash
# Regenerate with Bun
bun install --frozen  # or just: bun install
git add bun.lockb
git commit -m "chore: regenerate bun.lockb"
git push
```

### Cause 3: Non-Bun Package Manager in Workflows
**Error:** `::error::FORBIDDEN: Detected non-Bun package manager usage`

**Fix:**
```bash
# Search and remove npm/yarn/pnpm from workflows
grep -r "npm " .github/workflows/  # or yarn, pnpm
grep -r "setup-node" .github/workflows/

# Replace with Bun equivalent
# OLD: - uses: actions/setup-node@v4
# NEW: - uses: oven-sh/setup-bun@v2

# OLD: npm install
# NEW: bun install

git add .github/workflows/
git commit -m "chore: replace npm with Bun in workflows"
git push
```

### Cause 4: React Version Not Pinned to 18.x
**Error:** `::warning::React version may not be clearly pinned to 18`

**Fix:** (Warning, not blocking - but verify intentional)
```bash
# Check package.json
grep '"react"' package.json

# Ensure pinned to 18
# Valid: "react": "^18.2.0" or "~18.2.0" or "18.2.0"
# Invalid: "react": "^19.0.0"

# If needed, fix and reinstall
npm install react@18
bun install --frozen
git add package.json bun.lockb
git commit -m "chore: pin React to 18.x"
git push
```

---

## 3. App Validation Failures

**Symptom:** "Full CI Validation & Gating / App - Lint & TypeCheck" ❌

### Quick Check Locally
```bash
# Run the exact same checks as CI
bun run typecheck
bun run lint

# Fix linting errors automatically
bun run lint -- --fix
```

### Cause 1: TypeScript Errors
**Error:** `error TS2345: Argument of type X is not assignable to parameter of type Y`

**Fix:**
```bash
# View all TypeScript errors
bun run typecheck 2>&1 | head -20

# Fix commonerrors:
# - Missing type annotations
# - Incorrect type usage
# - Undefined variables

# After fixes:
bun run typecheck
git add src/
git commit -m "fix: resolve TypeScript errors"
git push
```

### Cause 2: ESLint Errors
**Error:** `error [rule-name]: <explanation>`

**Fix:**
```bash
# Run ESLint with auto-fix
bun run lint -- --fix

# Some errors can't auto-fix:
# - unused imports (fix manually)
# - overly complex functions (refactor)

# After manual fixes:
bun run lint
git add src/
git commit -m "fix: resolve ESLint violations"
git push
```

### Cause 3: Dependencies Not Installed
**Error:** `Cannot find module 'xyz'` or `error TS[xxxx]: Cannot find name 'xyz'`

**Fix:**
```bash
# Verify bun.lockb is current
bun install --frozen

# Check if dependency is in package.json
grep '"xyz"' package.json  # Should exist

# If missing, install it
bun add xyz
git add package.json bun.lockb
git commit -m "feat: add xyz dependency"
git push
```

### Cause 4: App Files Not Actually Changed
**Expected:** Job should skip (fast-path)  
**Issue:** Job failed even though app unchanged

**Fix:**
```bash
# Verify detect-changes output
# Go to PR → Checks → Full CI Validation & Gating / Detect Changed Paths
# Should show: "app_changed=false"

# If showing true but no app changed, it's a detection bug
# Check: did you change package.json, tsconfig, eslint config, vite.config?
# Those also trigger app-validate

git diff origin/main -- src/ package.json tsconfig*.json eslint.config.js vite.config.ts vitest.config.ts
```

---

## 4. Deno Validation Failures

**Symptom:** "Full CI Validation & Gating / Deno - Lint & Tests" ❌

### Quick Check Locally
```bash
# Setup Deno
deno --version
export DENO_DIR="/tmp/deno-cache"  # fresh cache

# Run the exact same checks as CI
cd supabase/functions/
deno lint
deno fmt --check
deno test -A --allow-all
```

### Cause 1: Lint Errors
**Error:** `error[rule-name]: <description>`

**Fix:**
```bash
# Auto-fix if possible
deno lint --fix supabase/functions/

# For errors that can't auto-fix:
#  - Replace `window` with `globalThis`
#  - Remove unused imports
#  - Satisfy strict typing

deno lint  # Verify all fixed
git add supabase/functions/
git commit -m "fix: resolve Deno lint errors"
git push
```

### Cause 2: Format Errors
**Error:** `error: Not formatted diff ...`

**Fix:**
```bash
# Auto-format
 deno fmt supabase/functions/

git add supabase/functions/
git commit -m "style: format Deno code"
git push
```

### Cause 3: Test Failures
**Error:** `FAILED: test name` or `error evaluating module`

**Fix:**
```bash
# Run tests locally to see failures
deno test -A --allow-all supabase/functions/

# Fix test failures:
# - Missing test files (tests are soft-pass if missing)
# - Runtime errors in functions
# - Permission issues

git add supabase/functions/
git commit -m "fix: resolve Deno test failures"
git push
```

### Cause 4: Deno Files Not Actually Changed
**Expected:** Job should skip (fast-path)  
**Issue:** Job failed even though Deno unchanged

**Fix:**
```bash
# Check detect-changes output in PR Checks
# Go to Full CI Validation & Gating / Detect Changed Paths
# Should show: "deno_changed=false"

# Verify using git
git diff origin/main -- supabase/functions/
```

---

## 5. Android Build Failures

**Symptom:** "Full CI Validation & Gating / Android APK - Build & Verify" ❌

### Quick Check Locally
```bash
# Setup local Android build environment
# (complex - usually just check CI logs)

# Verify web assets build first
bun run mobile:prep
```

### Cause 1: Gradle Configuration Error
**Error:** `error: (some gradle error)` or `Build failed`

**Fix:**
```bash
# Check Android config files
cat android/build.gradle
cat android/app/build.gradle
cat android/variables.gradle

# Common fixes:
# - Update SDK versions in variables.gradle
# - Fix buildTypes or productFlavors
# - Resolve dependency conflicts

git add android/
git commit -m "fix: resolve Android build configuration"
git push
```

### Cause 2: Missing Platform
**Error:** `error: Unable to locate Android SDK`

**Fix:** (Usually CI environment issue)
```bash
# This is usually a CI runner issue, not your code
# Try rebasing and re-pushing to trigger fresh CI run
git rebase origin/main
git push --force-with-lease
```

### Cause 3: Android Files Not Actually Changed
**Expected:** Job should skip (fast-path)  
**Issue:** Job failed even though Android unchanged

**Fix:**
```bash
# Verify detect-changes output
# Go to PR → Checks → Detect Changed Paths
# Should show: "android_changed=false"

git diff origin/main -- android/ capacitor.config.ts
```

---

## 6. Lockfile Integrity Failures

**Symptom:** "Lockfile Integrity Check" ❌

### Quick Check
```bash
# List lockfiles in root
ls -la package-lock.json yarn.lock pnpm-lock.yaml bun.lock bun.lockb 2>/dev/null

# Only bun.lockb should exist
```

### Cause 1: Wrong Lockfile Exists
**Error:** `FAIL: Found yarn.lock` (or npm / pnpm)

**Fix:**
```bash
# Remove wrong lockfile
git rm yarn.lock  # or package-lock.json, pnpm-lock.yaml, bun.lock

# Ensure it's in .gitignore
echo "package-lock.json" >> .gitignore
echo "yarn.lock" >> .gitignore
echo "pnpm-lock.yaml" >> .gitignore
echo "bun.lock" >> .gitignore

# Add bun.lockb if missing
bun install --frozen

git add -A
git commit -m "chore: enforce Bun-only lockfile"
git push
```

---

## 7. Branch Protection Issues

**Symptom:** "PR not mergeable" even though all checks pass

### Cause 1: Branch Not Up-to-Date
**Error:** `the base branch policy prohibits the merge` or `head branch is not up to date`

**Fix:**
```bash
# Fetch main and rebase
git fetch origin main
git rebase origin/main

# or use GitHub UI: "Update branch" button

git push --force-with-lease
```

### Cause 2: Missing Required Approvals
**Error:** "Requires X approvals"

**Fix:**
```bash
# Request review from code owner
# In GitHub UI: PR → "Reviewers" → select required reviewers

# Once approved, merge is available
```

### Cause 3: Conversations Not Resolved
**Error:** "Requires conversation resolution"

**Fix:**
```bash
# In GitHub UI: go to each comment marked "Unresolved"
# Reply or click "Resolve conversation"
# All must be marked resolved before merge
```

### Cause 4: Admin Override Needed
**Error:** `base branch policy prohibits the merge` (even with all checks passing)

**Fix:** (Rare - requires admin privilege)
```bash
# If you have admin rights:
gh pr merge <pr_number> --admin --squash

# Otherwise, ask repository maintainer
```

---

## 8. Recovery Procedures

### Procedure A: Force-Regenerate All CI Artifacts
```bash
# If CI seems stuck or corrupted
git fetch origin main
git rebase origin/main --force

# Remove all generated files
rm -rf node_modules dist build .next

# Regenerate
bun install --frozen
bun run build  # if exists

# Push and trigger new CI run
git push --force-with-lease
```

### Procedure B: Nuke and Restart (Last Resort)
```bash
# Close current PR (don't merge)
# Create new branch from fresh main
git fetch origin main
git checkout -b fix/restart origin/main

# Make your changes again
# Push new branch and create fresh PR
git push -u origin fix/restart  
gh pr create --head fix/restart --base main --title "..." --body "..."
```

### Procedure C: Skip CI Checks (NEVER In Production)
```bash
# Don't do this - but if absolutely necessary:
# Add to commit message: [skip ci]
# Only for non-app changes like documentation

git commit -m "docs: update README [skip ci]"
git push

# This will skip ALL checks - use only for docs/comments/etc
```

---

## When to Escalate

Contact the DevOps/DevSecOps team if:

1. **CI infrastructure failure** - "runner not available" errors persist after retry
2. **GitHub API failure** - branch protection rules won't update
3. **Security policy bypass needed** - legitimate exception required
4. **Workflow regression** - a check that used to pass now always fails
5. **Performance degradation** - CI takes 2x+ longer than expected

Document:
- PR number
- Workflow name
- Error message(s)
- Steps already attempted
- Timeline of when it started

---

## Reference

- [CI Check Registry](./CI_CHECK_REGISTRY.md) — comprehensive check documentation
- [Branch Protection](./BRANCH_PROTECTION.md) — required checks configuration
- [Security Hardening](../SECURITY.md) — security policies enforced by CI
