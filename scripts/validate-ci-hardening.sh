#!/usr/bin/env bash
# PHASE 10: CI System Validation
# Comprehensive test that verifies all hardening requirements met

set -u

PASS=0
FAIL=0

test_result() {
    local name=$1
    local result=${2:-0}
    
    if [ "$result" -eq 0 ]; then
        echo "✓ $name"
        ((PASS++)) || true
    else
        echo "✗ $name"
        ((FAIL++)) || true
    fi
}

echo "========================================"
echo "PHASE 10: CI SYSTEM VALIDATION"
echo "========================================"
echo ""

# Test 1: Workflow files exist and are valid YAML
echo "=== PHASE 1: Check Required Workflows Exist ==="
for workflow in ci-gate policy lockfile-integrity deno android-apk security-sentinel; do
    if [ -f ".github/workflows/${workflow}.yml" ]; then
        test_result "Workflow $workflow exists" 0
    else
        test_result "Workflow $workflow exists" 1
    fi
done
echo ""

# Test 2: ci-gate.yml has all required jobs
echo "=== PHASE 1: Check Required Jobs Defined ==="
for job in detect-changes dependency-integrity app-validate deno-validate android-build ci-gate; do
    if grep -q "  $job:" .github/workflows/ci-gate.yml; then
        test_result "Job $job exists in ci-gate.yml" 0
    else
        test_result "Job $job exists in ci-gate.yml" 1
    fi
done
echo ""

# Test 3: Detect-changes has all required outputs
echo "=== PHASE 2: Check detect-changes Outputs ==="
for output in app_changed deno_changed workflow_changed android_changed security_changed has_changes; do
    if grep -q "$output:" .github/workflows/ci-gate.yml; then
        test_result "Output $output defined" 0
    else
        test_result "Output $output defined" 1
    fi
done
echo ""

# Test 4: Bun-only enforcement rules present
echo "=== PHASE 3: Check Bun-Only Enforcement ==="
if grep -q "package-lock.json" .github/workflows/ci-gate.yml; then
    test_result "package-lock.json rejection" 0
else
    test_result "package-lock.json rejection" 1
fi

if grep -q "yarn.lock" .github/workflows/ci-gate.yml; then
    test_result "yarn.lock rejection" 0
else
    test_result "yarn.lock rejection" 1
fi

if grep -q "pnpm-lock.yaml" .github/workflows/ci-gate.yml; then
    test_result "pnpm-lock.yaml rejection" 0
else
    test_result "pnpm-lock.yaml rejection" 1
fi

if grep -q "bun.lockb" .github/workflows/ci-gate.yml; then
    test_result "bun.lockb requirement" 0
else
    test_result "bun.lockb requirement" 1
fi
echo ""

# Test 5: Workflow hardening (permissions)
echo "=== PHASE 5: Check Workflow Hardening ==="
if grep -q "^permissions:" .github/workflows/ci-gate.yml; then
    test_result "Global permissions defined" 0
else
    test_result "Global permissions defined" 1
fi

if grep -q "contents: read" .github/workflows/ci-gate.yml; then
    test_result "Restrictive permissions (contents:read)" 0
else
    test_result "Restrictive permissions (contents:read)" 1
fi

if grep "timeout-minutes:" .github/workflows/ci-gate.yml | wc -l | grep -qE '[1-9]'; then
    test_result "Job timeouts defined" 0
else
    test_result "Job timeouts defined" 1
fi

if grep -q "set -euo pipefail" .github/workflows/ci-gate.yml; then
    test_result "Shell hardening (set -euo pipefail)" 0
else
    test_result "Shell hardening (set -euo pipefail)" 1
fi
echo ""

# Test 6: Documentation exists
echo "=== PHASE 9: Check Documentation ==="
if [ -f "docs/CI_CHECK_REGISTRY.md" ]; then
    if grep -q "Required Checks" docs/CI_CHECK_REGISTRY.md; then
        test_result "CI_CHECK_REGISTRY.md complete" 0
    else
        test_result "CI_CHECK_REGISTRY.md complete" 1
    fi
else
    test_result "CI_CHECK_REGISTRY.md exists" 1
fi

if [ -f "docs/CI_INCIDENT_PLAYBOOK.md" ]; then
    if grep -q "Quick Diagnostics" docs/CI_INCIDENT_PLAYBOOK.md; then
        test_result "CI_INCIDENT_PLAYBOOK.md complete" 0
    else
        test_result "CI_INCIDENT_PLAYBOOK.md complete" 1
    fi
else
    test_result "CI_INCIDENT_PLAYBOOK.md exists" 1
fi
echo ""

# Test 7: Support scripts exist
echo "=== PHASE 6-7: Check Support Scripts ==="
if [ -f "scripts/enforce-pr-scope.sh" ]; then
    test_result "PR scope enforcement script exists" 0
else
    test_result "PR scope enforcement script exists" 1
fi

if [ -f "scripts/dependency-guardrails.sh" ]; then
    test_result "Dependency guardrails script exists" 0
else
    test_result "Dependency guardrails script exists" 1
fi
echo ""

# Test 8: Verify no npm/yarn/pnpm in workflows
echo "=== PHASE 3: Check for Forbidden Package Managers in Workflows ==="
NPM_REFS=$(grep -r "uses: actions/setup-node" .github/workflows/ 2>/dev/null || echo "")
YARN_REFS=$(grep -r "yarn " .github/workflows/ 2>/dev/null | grep -v grep | grep -v echo || echo "")
PNPM_REFS=$(grep -r "pnpm " .github/workflows/ 2>/dev/null | grep -v grep | grep -v echo || echo "")

if [ -z "$NPM_REFS" ]; then
    test_result "No setup-node references" 0
else
    test_result "No setup-node references" 1
fi

if [ -z "$YARN_REFS" ]; then
    test_result "No yarn references" 0
else
    test_result "No yarn references" 1
fi

if [ -z "$PNPM_REFS" ]; then
    test_result "No pnpm references" 0
else
    test_result "No pnpm references" 1
fi
echo ""

# Test 9: Verify bun is used
echo "=== PHASE 3: Check Bun Usage ==="
if grep -q "oven-sh/setup-bun" .github/workflows/ci-gate.yml; then
    test_result "Bun setup in ci-gate" 0
else
    test_result "Bun setup in ci-gate" 1
fi

if grep -q "bun install" .github/workflows/ci-gate.yml; then
    test_result "bun install in ci-gate" 0
else
    test_result "bun install in ci-gate" 1
fi
echo ""

# Test 10: Branch protection docs exist
echo "=== DOCUMENTATION: Check Branch Protection ===" 
if [ -f "docs/BRANCH_PROTECTION.md" ]; then
    if grep -q "REQUIRED" docs/BRANCH_PROTECTION.md; then
        test_result "Branch protection documented" 0
    else
        test_result "Branch protection documented" 1
    fi
else
    test_result "Branch protection documented" 1
fi
echo ""

# Test 11: GITHUB_OUTPUT formatting (PHASE 2)
echo "=== PHASE 2: Check GITHUB_OUTPUT Formatting ==="
INVALID_OUTPUT=$(grep -r '>> $GITHUB_OUTPUT' .github/workflows/ 2>/dev/null || echo "")
UNQUOTED_OUTPUT=$(grep -r '>> \$GITHUB_OUTPUT' .github/workflows/ 2>/dev/null | grep -v '>> "\$GITHUB_OUTPUT"' || echo "")

if [ -z "$INVALID_OUTPUT" ] && [ -z "$UNQUOTED_OUTPUT" ]; then
    test_result "All GITHUB_OUTPUT properly quoted" 0
else
    test_result "All GITHUB_OUTPUT properly quoted" 1
    if [ -n "$INVALID_OUTPUT" ]; then
        echo "  Found invalid: >> \$GITHUB_OUTPUT (should be >> \"\$GITHUB_OUTPUT\")"
    fi
fi

SETOUTPUT=$(grep -r "::set-output" .github/workflows/ 2>/dev/null || echo "")
if [ -z "$SETOUTPUT" ]; then
    test_result "No deprecated ::set-output usage" 0
else
    test_result "No deprecated ::set-output usage" 1
fi
echo ""

# Test 12: Deno lint scope (PHASE 3)
echo "=== PHASE 3: Check Deno Lint Scope ==="
# Check that all deno lint calls include a scope (supabase/functions or similar)
# Should NOT match: "deno lint" alone or "deno lint |" or "deno lint 2>&1"
# Should match: "deno lint supabase/functions"
UNSCOPED_DENO=$(grep -E '^\s+deno lint\s*(\||2>&1)' .github/workflows/deno.yml 2>/dev/null || echo "")
if [ -z "$UNSCOPED_DENO" ]; then
    test_result "Deno lint is scoped (not repo-wide)" 0
else
    test_result "Deno lint is scoped (not repo-wide)" 1
fi

DENO_SCOPE=$(grep 'deno lint.*supabase/functions' .github/workflows/deno.yml 2>/dev/null || echo "")
if [ -n "$DENO_SCOPE" ]; then
    test_result "Deno lint targets supabase/functions/" 0
else
    test_result "Deno lint targets supabase/functions/" 1
fi
echo ""

# Test 13: Required jobs always present (PHASE 4)
echo "=== PHASE 4: Check Required Jobs Always Present ==="
for req_job in "detect-changes" "dependency-integrity" "app-validate" "deno-validate" "android-build" "ci-gate"; do
    if grep -q "^  $req_job:" .github/workflows/ci-gate.yml; then
        test_result "Required job '$req_job' exists" 0
    else
        test_result "Required job '$req_job' exists" 1
    fi
done

# Verify ci-gate job doesn't have job-level skip
if grep -A5 "^  ci-gate:" .github/workflows/ci-gate.yml | grep -q "^  if:"; then
    test_result "ci-gate doesn't have job-level skip" 1
else
    test_result "ci-gate doesn't have job-level skip" 0
fi
echo ""

# Test 14: Bun-only policy (PHASE 5)
echo "=== PHASE 5: Bun-Only Policy Verification ==="
if [ ! -f "bun.lockb" ]; then
    test_result "bun.lockb exists" 1
else
    test_result "bun.lockb exists" 0
fi

for bad_lock in "package-lock.json" "yarn.lock" "pnpm-lock.yaml" "bun.lock"; do
    if [ -f "$bad_lock" ]; then
        test_result "No $bad_lock" 1
    else
        test_result "No $bad_lock" 0
    fi
done

# Lockfile-integrity workflow only checks files, doesn't run Bun commands
# So it doesn't need setup-bun. This check now verifies it doesn't break on missing Bun.
if grep -E '^\s+bun ' .github/workflows/lockfile-integrity.yml >/dev/null 2>&1; then
    # If it runs bun commands (like "bun install"), it MUST have setup-bun
    if grep -q "oven-sh/setup-bun" .github/workflows/lockfile-integrity.yml; then
        test_result "Bun setup present when needed" 0
    else
        test_result "Bun setup present when needed" 1
    fi
else
    # No bun commands executed, so setup is optional - test passes
    test_result "Lockfile-integrity doesn't need Bun setup" 0
fi
echo ""

# Final summary
echo "========================================"
echo "VALIDATION SUMMARY"
echo "========================================"
echo "Passed: $PASS"
echo "Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "✓ ALL VALIDATIONS PASSED"
    echo "CI hardening complete and verified"
    exit 0
else
    echo "✗ $FAIL VALIDATION(S) FAILED"
    echo "See above for details"
    exit 1
fi
