# CI Check Registry

**Version:** 1.0  
**Last Updated:** 2026-03-28  
**Status:** PRODUCTION - All required checks enforced

This document is the source of truth for all CI/CD checks that run on this repository.

---

## Required Checks (BRANCH PROTECTED)

These checks are **REQUIRED** for all PRs to merge. They appear in GitHub's branch protection rules.

### Workflow: Full CI Validation & Gating (`ci-gate.yml`)

The primary CI pipeline that validates changes before merge. **All jobs always run; none are skipped.**

#### Job 1: `detect-changes` (Always Runs)
- **Purpose:** Detect what files changed to determine scope
- **Outputs:**
  - `app_changed` - app source code or config changed
  - `deno_changed` - Deno edge functions changed
  - `workflow_changed` - CI workflows changed
  - `android_changed` - Android build files changed
  - `security_changed` - security/policy files changed
  - `has_changes` - any changes exist
- **Trigger:** Always runs first  
- **Status Check Name:** "Full CI Validation & Gating / Detect Changed Paths"
- **Required:** ✅ YES

#### Job 2: `dependency-integrity` (Always Runs)
- **Purpose:** Enforce Bun-only policy, validate lockfile, check dependencies
- **Validations:**
  - ❌ FAIL if `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, or `bun.lock` exists
  - ❌ FAIL if `bun.lockb` is missing
  - ⚠️ WARN if React version not pinned to 18.x
  - ❌ FAIL if npm/yarn/pnpm detected in workflows
- **Status Check Name:** "Full CI Validation & Gating / Dependency Integrity"
- **Required:** ✅ YES (branch protected)

#### Job 3: `app-validate` (Always Runs)
- **Purpose:** TypeScript type-check and ESLint validation for React app
- **Behavior:**
  - Immediately exits (success) if app files unchanged
  - Runs full validation if app files changed
- **Steps (if changed):**
  1. Setup Bun
  2. `bun install --frozen`
  3. `bun run typecheck`
  4. `bun run lint`
- **Status Check Name:** "Full CI Validation & Gating / App - Lint & TypeCheck"
- **Required:** ✅ YES (branch protected)
- **Fast-path:** ~5 seconds if unchanged
- **Slow-path:** ~20 minutes if changed

#### Job 4: `deno-validate` (Always Runs)
- **Purpose:** Deno edge functions linting, formatting, and testing
- **Behavior:**
  - Immediately exits (success) if Deno files unchanged
  - Runs full validation if Deno files changed
- **Steps (if changed):**
  1. Setup Deno v1.x
  2. `deno lint --fix` (attempt auto-fix)
  3. `deno lint` (strict - must pass)
  4. `deno fmt --check`
  5. `deno test -A` (soft-pass if not configured)
- **Status Check Name:** "Full CI Validation & Gating / Deno - Lint & Tests"
- **Required:** ✅ YES (branch protected)
- **Fast-path:** ~5 seconds if unchanged
- **Slow-path:** ~15 minutes if changed

#### Job 5: `android-build` (Always Runs)
- **Purpose:** Verify Android build configuration and artifact generation
- **Behavior:**
  - Immediately exits (success) if Android files unchanged
  - Builds APK if Android files changed
- **Steps (if changed):**
  1. Setup Bun, Java 21, Android SDK
  2. `bun install --frozen`
  3. `bun run mobile:prep` (web asset build)
  4. Verify Android build configuration
- **Status Check Name:** "Full CI Validation & Gating / Android APK - Build & Verify"
- **Required:** ✅ YES (branch protected)
- **Fast-path:** ~3 seconds if unchanged
- **Slow-path:** ~35 minutes if changed

#### Job 6: `ci-gate` (Final Check)
- **Purpose:** Verify all required checks passed before merge
- **Validation:** All upstream jobs must have `result == success`
- **Status Check Name:** "Full CI Validation & Gating / CI Gate - Require All Checks"
- **Required:** ✅ YES (branch protected)

---

### Workflow: Lockfile Integrity (`lockfile-integrity.yml`)

Validates that only `bun.lockb` is used.

#### Job 1: `lockfile-check`
- **Purpose:** Verify single lockfile, reject mixed package managers
- **Rejects:**
  - ❌ `package-lock.json` (npm)
  - ❌ `yarn.lock` (yarn)
  - ❌ `pnpm-lock.yaml` (pnpm)
  - ❌ `bun.lock` (old bun format)
- **Requires:** ✅ `bun.lockb` only
- **Status Check Name:** "Lockfile Integrity Check / Verify Single Lockfile"
- **Required:** ✅ YES (branch protected)

#### Job 2: `fail-if-wrong-lockfile`
- **Purpose:** HARD GATE - rejects PR if lockfile invalid
- **Status Check Name:** "Lockfile Integrity Check / GATE - Lockfile Must Be Correct"
- **Required:** ✅ YES (branch protected)

---

## Supporting Checks (Non-Blocking)

These checks run but are NOT in branch protection. They provide insights and security scanning.

### Workflow: Repo Policy Gate (`policy.yml`)

#### Job: `policy-check`
- **Purpose:** Enforce repository policies (.env tracking, etc.)
- **Status Check Name:** "Repo Policy Gate / Policy Enforcement"
- **Required:** ❌ NO (informational)
- **Failure Impact:** Should not block merge if branch protection doesn't require it

### Workflow: Tanner Sentinel — Security Scan (`security-sentinel.yml`)

#### Job: `security-scan`
- **Purpose:** Detect secrets, vulnerable patterns, unsafe actions
- **Status Check Name:** "Tanner Sentinel — Security Scan / Security Sentinel Scan"
- **Required:** ❌ NO (but recommended)

#### Job: `dependency-audit`
- **Purpose:** Audit npm/security vulnerabilities
- **Status Check Name:** "Tanner Sentinel — Security Scan / Dependency Audit"
- **Required:** ❌ NO (but recommended)

### Workflow: Deno (`deno.yml`)

#### Job: `lint-and-test`
- **Purpose:** Standalone Deno linting (separate from ci-gate)
- **Note:** This is **redundant** with `deno-validate` in `ci-gate.yml`
- **Status Check Name:** "Deno / lint-and-test"
- **Required:** ❌ NO (can be disabled)

### Workflow: Android APK (`android-apk.yml`)

#### Job: `build-android`
- **Purpose:** Build Android APK (separate from ci-gate)
- **Note:** This is **redundant** with `android-build` in `ci-gate.yml`
- **Status Check Name:** "Android APK (Capacitor) / build-android"
- **Required:** ❌ NO (can be disabled)

---

## Merge Requirement Summary

For a PR to merge to `main`, ALL of these checks must **PASS**:

```
✅ Full CI Validation & Gating / Detect Changed Paths
✅ Full CI Validation & Gating / Dependency Integrity
✅ Full CI Validation & Gating / App - Lint & TypeCheck
✅ Full CI Validation & Gating / Deno - Lint & Tests
✅ Full CI Validation & Gating / Android APK - Build & Verify
✅ Full CI Validation & Gating / CI Gate - Require All Checks
✅ Lockfile Integrity Check / Verify Single Lockfile
✅ Lockfile Integrity Check / GATE - Lockfile Must Be Correct
```

---

## Check Execution Timing

### Workflow-Only PR (e.g., update `.github/workflows/`)
```
Expected Total Time: ~1-2 minutes

detect-changes:  PASS (5s) - detects workflow change
  ↓
dependency-integrity:  PASS (5s) - bun.lockb check
app-validate:         PASS (5s) - skip (app unchanged)
deno-validate:        PASS (5s) - skip (deno unchanged)
android-build:        PASS (3s) - skip (android unchanged)
  ↓
ci-gate:             PASS (5s) - all deps passed
```

### Full App PR (changes `src/` + configs)
```
Expected Total Time: ~30-40 minutes

detect-changes:  PASS (5s)  - detects app change
  ↓
dependency-integrity:  PASS (10s) - full checks
app-validate:         PASS (15m) - run full validation
deno-validate:        PASS (5s) - skip (deno unchanged)
android-build:        PASS (3s) - skip (android unchanged)
  ↓
ci-gate:             PASS (5s) - all deps passed
```

### Full Rebuild PR (changes everything)
```
Expected Total Time: ~45-55 minutes

detect-changes:  PASS (5s)
  ↓
dependency-integrity:  PASS (10s)
app-validate:         PASS (15m) - full app validation
deno-validate:        PASS (10m) - full deno validation
android-build:        PASS (35m) - full apk build
  ↓
ci-gate:             PASS (5s)
```

---

## Key Principles

1. **No Required Job Is Skipped** - All required jobs always run
2. **Early Exit on No Changes** - If files unchanged, job exits immediately (success)
3. **Single Source of Truth** - `detect-changes` drives all decisions
4. **Fail-Fast Security** - Lockfile and security checks run first
5. **Consistent & Deterministic** - Same PR always produces same results
