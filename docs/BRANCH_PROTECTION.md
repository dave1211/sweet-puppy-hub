# Branch Protection & CI Gating Configuration

## Overview
This repository uses multiple CI gates to prevent broken, unsafe, or unfinished code from being merged to `main`. All pull requests must pass all required checks.

## Required GitHub Settings

### For `main` branch, enable these settings:

#### 1. Require Pull Requests
- ✅ Require a pull request before merging
- ✅ Require approvals: **1** (or more per team policy)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners (if CODEOWNERS file exists)

#### 2. Require Status Checks to Pass
- ✅ **REQUIRED** status checks (all must pass):
  - `Full CI Validation & Gating / Dependency Integrity`
  - `Full CI Validation & Gating / App - Lint & TypeCheck`
  - `Full CI Validation & Gating / Deno - Lint & Tests`
  - `Full CI Validation & Gating / Android APK - Build & Verify`
  - `Full CI Validation & Gating / CI Gate - Require All Checks`
  - `Lockfile Integrity Check / Verify Single Lockfile`
  - `Lockfile Integrity Check / GATE - Lockfile Must Be Correct`

#### 3. Require Branches to Be Up to Date
- ✅ Require branches to be up to date before merging
  - This prevents merging stale branches with old dependencies/code

#### 4. Require Status Checks Strict
- ✅ Require code reviews before merging
- ✅ Require conversation resolution before merging

#### 5. Restrict Force Pushes & Deletions
- ✅ Allow force pushes: **OFF**
- ✅ Allow deletions: **OFF**
- ✅ Allow dismissal of pull request reviews: **OFF**

#### 6. Require CODEOWNERS Review
- ✅ Require CODEOWNERS review: Enable if a CODEOWNERS file exists
- ✅ Restrict who can dismiss pull request reviews: Everyone

---

## CI Workflow Gates

### Gate 1: Lockfile Integrity
**Workflow:** `lockfile-integrity.yml`
- Ensures exactly ONE package manager (Bun)
- Blocks if package-lock.json is present
- Blocks if mixed lockfiles detected
- **HARD GATE** - cannot be skipped

### Gate 2: Dependency Integrity
**Workflow:** `ci-gate.yml` (dependency-integrity job)
- Detects package manager
- Enforces single lockfile
- Validates React pinned to 18.x
- Checks for dangerous dependency patterns

### Gate 3: Frontend/App Validation
**Workflow:** `ci-gate.yml` (app-validate job)
- TypeScript type checking
- ESLint linting
- Build artifact validation

### Gate 4: Deno Function Validation
**Workflow:** `ci-gate.yml` (deno-validate job)
- Deno lint with auto-fix attempt
- Deno format verification
- Test execution
- Strict lint gating

### Gate 5: Android Build
**Workflow:** `ci-gate.yml` (android-validate job)
- Gradle configuration validation
- Android SDK tool verification
- APK artifact generation and integrity check
- Build failures block merge

### Gate 6: Final CI Gate
**Workflow:** `ci-gate.yml` (ci-gate job)
- Verifies ALL previous gates passed
- No PR can merge if any gate failed
- Clear failure messaging

---

## How to Set Up in GitHub

### Option A: Web UI (Easiest)

1. Go to **Settings > Branches**
2. Click **Add Rule**
3. Branch name: `main`
4. Enable:
   - ✅ Require a pull request before merging (1 approval)
   - ✅ Require status checks to pass (see list above)
   - ✅ Require branches to be up to date
   - ✅ Require code reviews before merging
   - ✅ Require conversation resolution
   - ✅ Dismiss stale PR approvals
   - ❌ Allow force pushes
   - ❌ Allow deletions

5. Click **Create** and **Save changes**

### Option B: GitHub API / Terraform

Use the GitHub API endpoint:
```
PATCH /repos/{owner}/{repo}/branches/{branch}/protection
```

Required body:
```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "Full CI Validation & Gating / Dependency Integrity",
      "Full CI Validation & Gating / App - Lint & TypeCheck",
      "Full CI Validation & Gating / Deno - Lint & Tests",
      "Full CI Validation & Gating / Android APK - Build & Verify",
      "Full CI Validation & Gating / CI Gate - Require All Checks",
      "Lockfile Integrity Check / Verify Single Lockfile",
      "Lockfile Integrity Check / GATE - Lockfile Must Be Correct"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": {
    "users": [],
    "teams": [],
    "apps": []
  },
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

---

## What Can't Be Merged

### Auto-Blocked:
- ❌ Code with lint errors (deno lint, ESLint)
- ❌ TypeScript type errors
- ❌ Failed Android APK build
- ❌ Mixed lockfiles (npm + bun)
- ❌ Broken Deno functions
- ❌ Stale branches with outdated dependencies
- ❌ Unsigned/unsigned commits to main
- ❌ Force pushes
- ❌ Direct pushes (must use PR)

### Manual Review Required:
- Dependency version updates (Dependabot PRs)
- Changes to CI/CD workflows
- Security-related changes
- Android/Gradle changes
- Package.json changes that affect lockfile

---

## Exceptions & Overrides

### When Can Branch Protection Be Bypassed?
- **NEVER for critical security issues** (use hotfix process with full CI validation)
- **NEVER to merge unreviewed code**
- **NEVER to merge code without passing CI**

### Emergency Hotfix Process
1. Create hotfix PR against `main`
2. Ensure ALL CI gates pass first
3. Get 2+ approvals for critical changes
4. Create release tag after merge
5. Monitor in production

---

## Monitoring & Alerts

### What Gets Logged:
- ✅ All PR approvals
- ✅ All CI job results
- ✅ All branch protection violations
- ✅ All status check failures

### What Triggers Notification:
- ❌ CI failure (auto-notification in PR)
- ❌ Security check failure (comment on PR)
- ❌ Dependency audit findings
- ⚠️ Stale branch detection

---

## Related Files

- **CI Workflows:** `.github/workflows/ci-gate.yml`, `lockfile-integrity.yml`, `deno.yml`
- **Dependency Config:** `.github/dependabot.yml`
- **Security Policy:** `SECURITY.md`
- **Pre-commit Hooks:** `.git/hooks/pre-commit`

---

## Verification Checklist

- [ ] Branch protection rule exists for `main`
- [ ] All required status checks are listed
- [ ] Require status checks to pass is enabled
- [ ] Require up-to-date branches before merge is enabled
- [ ] Require code reviews (1+ approval) is enabled
- [ ] Dismiss stale PR approvals is enabled
- [ ] Force pushes are disabled
- [ ] Deletions are disabled
- [ ] Enforce admins is enabled
- [ ] All CI workflows are active and running

---

## References
- [GitHub Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Status Checks](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-status-checks)
