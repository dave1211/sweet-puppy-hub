# Contributing to Tanner Terminal

This guide explains the safety rules and hardening measures that protect this repository from broken, unsafe, or unfinished code.

## Quick Start

```bash
# 1. Install dependencies with Bun (only package manager)
bun install

# 2. Setup git pre-commit hooks
bash scripts/setup-deno-hooks.sh

# 3. Make your changes
# (code...)

# 4. Lint & format your code
bun run lint
bun run typecheck
deno lint --fix
deno fmt

# 5. Commit (hooks will verify)
git add .
git commit -m "feat: your change"

# 6. Push to branch and create PR
git push origin your-branch
# Create PR at https://github.com/dave1211/sweet-puppy-hub/pulls
```

---

## Repository Hardening Rules

This repository enforces STRICT safety rules to prevent broken code from reaching `main`. These rules are non-negotiable.

### 🚫 RULE 1: Single Package Manager (Bun Only)

**Status:** HARD GATE - Cannot be bypassed

The repository uses **Bun exclusively** for dependency management.

#### What's Required:
- ✅ Only `bun.lockb` file present
- ✅ All packages installed with `bun install`
- ❌ NO `package-lock.json`
- ❌ NO `yarn.lock`
- ❌ NO `pnpm-lock.yaml`
- ❌ NO `bun.lock` (old format)

#### Why:
Mixing package managers causes:
- Dependency resolution conflicts
- Security vulnerabilities
- Inconsistent deployments
- Failed CI builds

#### If You See Mixed Lockfiles:
```bash
# Remove wrong lockfiles
rm -f package-lock.json bun.lock yarn.lock pnpm-lock.yaml

# Reinstall with Bun
bun install --frozen

# Commit the fixed bun.lockb
git add bun.lockb
git commit -m "chore: enforce Bun single lockfile"
```

#### Where It's Enforced:
- **Local:** `.git/hooks/pre-commit` blocks commits
- **CI:** `lockfile-integrity.yml` workflow blocks PRs
- **Dependabot:** Configured for Bun/npm (as Bun uses npm registry)

---

### 🔍 RULE 2: Code Quality Gates

**Status:** HARD GATE - All must pass before merge

Every PR must pass all these checks. No exceptions.

#### Frontend/App:
```bash
bun run typecheck  # TypeScript type checking
bun run lint       # ESLint linting
bun run build      # Build verification
bun run test       # Unit tests (if configured)
```

#### Deno Functions:
```bash
deno lint          # Lint without disabling rules
deno fmt --check   # Format verification
deno test -A       # Test execution
```

#### Android:
```bash
./gradlew assembleDebug  # Build APK
# Verify APK artifact created
```

#### Where It's Enforced:
- **Local:** `.git/hooks/pre-commit` (warning level)
- **CI:** `ci-gate.yml` workflow (blocking)

---

### 📦 RULE 3: Dependency Pinning

**Status:** HARD GATE - Version constraints enforced

Certain packages are pinned to prevent conflicts or breaking changes.

#### Pinned Packages:
- **React:** `^18.x` (NOT 19)
- **@supabase/supabase-js:** `^2.x` (NOT 3)
- **@solana/web3.js:** `^1.x` (NOT 2)
- **Node:** 22.x (CI only)
- **Java:** 17 (Android builds)
- **Deno:** 1.x (latest stable)

#### Where It's Enforced:
- **GitHub:** `.github/dependabot.yml` blocks updates
- **Local:** No blocking, but CI will fail if changed
- **CI:** `ci-gate.yml` validates React version

#### To Update Dependencies Safely:
1. Create a feature branch
2. Run `bun upgrade` carefully
3. Test thoroughly in local and CI
4. Create PR with clear changelog
5. Get 2+ approvals
6. Monitor post-merge

---

### 🔐 RULE 4: Secrets & Security

**Status:** HARD GATE - Secrets cannot be committed

This repository contains sensitive keys for Supabase, Telegram, and Solana. These MUST NEVER be committed.

#### Protected Secrets:
- `SUPABASE_SERVICE_ROLE_KEY` - Database auth
- `TELEGRAM_API_KEY` - Bot authentication
- `SOLANA_RPC` endpoints with rate limits
- `.env` files with API keys
- Android keystore (`release-keystore.jks`)

#### Pre-Commit Hook Check:
```bash
# The pre-commit hook scans for these patterns:
# - SUPABASE_SERVICE_ROLE_KEY
# - TELEGRAM_API_KEY
# - private_key
# - api_key = ...
# - secret = ...
```

#### If You Accidentally Commit a Secret:
```bash
# 1. DO NOT PUSH
# 2. Regenerate the secret immediately
# 3. Use git filter-repo to remove from history:
git filter-repo --invert-paths --path secrets.txt

# 4. Push new commit and rotate keys in production
```

---

### ⚡ RULE 5: Deno Linting Cannot Be Disabled

**Status:** HARD GATE - No disabling, only fixing

Deno lint rules cannot be disabled globally or per-file without justification.

#### What's Allowed:
```deno
// deno-lint-ignore no-unused-vars -- Intentional, used in template
const unused = 123;
```

#### What's NOT Allowed:
```deno
// deno-lint-ignore - No explanation
const unused = 123;

// In deno.json:
// "lint": { "rules": { "exclude": ["no-unused-vars"] } }  ❌ BLOCKED
```

#### Where It's Enforced:
- **CI:** `deno.yml` workflow fails if issues remain after auto-fix
- **Pre-commit:** Optional warning (not blocking)

---

### 🤖 RULE 6: Android Build Must Succeed

**Status:** HARD GATE - APK artifact required

Every PR that touches Android code must produce a valid APK artifact.

#### What's Checked:
- ✅ Gradle configuration valid
- ✅ SDK levels detected correctly
- ✅ APK file generated
- ✅ APK file has reasonable size (>1MB)

#### Common Issues:
```bash
# SDK level mismatch
# Fix: Update android/variables.gradle to available SDK

# Missing gradlew
chmod +x android/gradlew

# Build tools missing
# CI auto-downloads, but verify locally

# Lint failures
./gradlew assembleDebug -x lint
```

#### Where It's Enforced:
- **CI:** `ci-gate.yml` `android-validate` job (required for all PRs)

---

### 📋 RULE 7: Branch Protection - No Direct Pushes to Main

**Status:** HARD GATE - Cannot bypass

The `main` branch is protected. All changes must come through PR.

#### Required:
- ✅ Create feature branch: `git checkout -b feat/feature-name`
- ✅ Push to your branch: `git push origin feat/feature-name`
- ✅ Create PR on GitHub
- ✅ Pass ALL CI checks
- ✅ Get approval (1+ reviewers)
- ✅ Merge only through PR interface

#### Forbidden:
- ❌ Direct push to main
- ❌ Force push (--force)
- ❌ Pushing unsigned commits
- ❌ Deleting main branch
- ❌ Disabling CI checks

#### If You Try to Push Directly:
```
error: refusing to allow you to push to this repository
Reason: repository has branch protection for "main"
```

---

### 📝 Commit Message Standards

While not a hard gate, follow these conventions:

```bash
# Good:
git commit -m "feat: add token swap feature"
git commit -m "fix: resolve broken Deno lint in wallet-auth"
git commit -m "chore: update dependencies to latest"
git commit -m "docs: add branch protection guide"

# Avoid:
git commit -m "fix"
git commit -m "asdf"
git commit -m "work in progress"
```

---

## Before Submitting a PR

Use this checklist:

- [ ] Installed with `bun install --frozen`
- [ ] Run `bun run typecheck` - no errors
- [ ] Run `bun run lint` - no errors
- [ ] Run `deno lint` - no errors (or fixed)
- [ ] Run `deno fmt` - formatting correct
- [ ] `.git/hooks/pre-commit` passes locally
- [ ] Created feature branch (not pushing to main)
- [ ] No secrets in code (no .env, API keys, etc.)
- [ ] Android changes tested (if applicable)
- [ ] Commit messages are clear and descriptive

---

## When CI Fails

### Common Failures & Fixes:

**Lockfile error - Mixed lockfiles:**
```bash
rm -f package-lock.json bun.lock yarn.lock
bun install
git add bun.lockb
```

**TypeScript errors:**
```bash
bun run typecheck
# Fix errors shown, then commit
```

**Lint errors:**
```bash
bun run lint
deno lint --fix  # Auto-fix Deno
# Or fix manually, then commit
```

**Android build failed:**
```bash
cd android && ./gradlew clean assembleDebug
# Check error output, fix, then push
```

**Deno lint strict gate:**
```bash
deno lint --fix
deno fmt
# Verify all issues resolved
```

---

## Getting Help

### If You're Stuck:

1. **Check the docs:**
   - `docs/BRANCH_PROTECTION.md` - CI & branch rules
   - `.githooks/pre-commit` - What the hook checks
   - `SECURITY.md` - Security policies

2. **Common Issues:**
   - Q: "My commit was blocked by pre-commit hook"  
     A: Run the checks manually (`bun run lint`, `deno lint --fix`) and commit again

   - Q: "PR is blocked and I don't know why"  
     A: Check the CI workflow results in GitHub, look at the error message

   - Q: "I need to push to main urgently"  
     A: Still must go through PR with passing CI. No exceptions for security/stability.

3. **Ask in Issues:**
   - Open an issue with your error message
   - Include: branch, error output, what you were trying to do

---

## Questions?

- **General contributing questions:** Open an issue
- **Security concerns:** See `SECURITY.md`
- **CI/CD problems:** Check `.github/workflows/`
- **Dependency issues:** See `.github/dependabot.yml`

---

## Summary: The Hard Rules

| Rule | Status | Override | Consequence |
|------|--------|----------|-------------|
| Single lockfile (Bun) | Hard Gate | Never | PR blocked, secrets exposed |
| Code quality (lint/type) | Hard Gate | Never | PR blocked |
| Tests pass | Hard Gate | Never | PR blocked |
| Android build succeeds | Hard Gate | Never | PR blocked |
| No pushed secrets | Hard Gate | Never | Production key rotation needed |
| No direct main pushes | Hard Gate | Never (always PR) | Push rejected |
| Deno lint issues resolved | Hard Gate | Never | PR blocked |

---

**By submitting a PR, you agree to these rules and the hardening measures in place to protect the repository.**
