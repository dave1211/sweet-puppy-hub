# Tanner Terminal

A production-grade, security-hardened terminal trading UI for Solana with dark theme, real-time price feeds, and integrated wallet management.

## Status: Hardened & Locked Down

This repository is protected with **strict CI gates, branch protection, and automated safety checks**. No broken, unsafe, or unfinished code can merge to `main`.

### Quick Links
- **Contributing:** See [CONTRIBUTING.md](CONTRIBUTING.md) — Read this before coding
- **Security:** See [SECURITY.md](SECURITY.md) — Security policies and vulnerability handling
- **Branch Protection:** See [docs/BRANCH_PROTECTION.md](docs/BRANCH_PROTECTION.md) — CI gates & required checks
- **Architecture:** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (if available)

---

## Development Quick Start

### Prerequisites
- **Bun** (Node package manager) — https://bun.sh
- **Deno** (for Supabase functions) — https://deno.land
- **Java 21** (for Android builds)
- **Android SDK** (for mobile builds)

### Setup

```bash
# 1. Install dependencies (Bun only - NOT npm)
bun install --frozen

# 2. Setup git pre-commit hooks for safety
bash scripts/setup-deno-hooks.sh

# 3. Verify setup with validation script
bash scripts/validate-ci.sh
```

### Local Development

```bash
# Start dev server
bun run dev

# Type checking
bun run typecheck

# Linting
bun run lint

# Deno function validation
deno lint
deno fmt

# Run tests
bun run test
```

### Before Committing

```bash
# The pre-commit hook will verify:
# ✅ Single lockfile (Bun only)
# ✅ Code formatting
# ✅ No hardcoded secrets
# ✅ TypeScript types

git add .
git commit -m "feat: your feature"  # Hook runs automatically
```

---

## Building APK

### Option 1: Docker Build (Recommended)

```bash
bash build.sh
```

- ✅ No local setup required
- ✅ Works on Mac / Linux / Windows (WSL)
- ✅ Consistent with CI

Output: `android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Local Build

```bash
bash build-local.sh
```

Requires:
- Java 21 (Temurin distribution)
- Android SDK configured
- Gradle

---

## Hardening & Safety

This repository enforces **strict production-ready safeguards**:

### Hard Rules (Cannot Be Bypassed)
| Rule | Enforcement | Consequence |
|------|-------------|-------------|
| **Single Package Manager (Bun)** | Workflow + Hook | PR blocked, build fails |
| **Code Quality (Lint/TypeCheck)** | CI Required | Cannot merge |
| **No Secrets in Code** | Pre-commit + Scanning | Commit blocked, audit |
| **Android Build Succeeds** | CI Required | Cannot merge |
| **Branch Protection on Main** | GitHub Settings | No direct pushes |
| **All Tests Pass** | CI Required | Cannot merge |
| **Deno Lint Clean** | Strict Gate | Cannot merge |

### What CANNOT Merge
- ❌ Code with TypeScript errors
- ❌ Code with lint failures
- ❌ Code with hardcoded secrets/API keys
- ❌ Code without passing tests
- ❌ Mixed lockfiles (npm + bun)
- ❌ APK build failures
- ❌ Any failure in required CI checks

### Verification Commands

```bash
# Validate all hardening measures are in place
bash scripts/validate-ci.sh

# Run all local checks like CI would
deno lint
deno fmt --check
bun run typecheck
bun run lint
bun run test

# Check pre-commit hook is installed
test -f .git/hooks/pre-commit && echo "✓ Hook installed"
```

---

## CI/CD Workflows

### Automated on Every PR:
1. **Lockfile Integrity** — Ensures single package manager
2. **Dependency Security** — Checks for unsafe updates
3. **Deno Validation** — Lint, format, tests
4. **Frontend/App** — TypeScript, ESLint
5. **Android Build** — Gradle, APK generation
6. **Final Gate** — All checks must pass

### Required Status Checks
All of these must pass before merge:
- `Full CI Validation & Gating / Dependency Integrity`
- `Full CI Validation & Gating / App - Lint & TypeCheck`
- `Full CI Validation & Gating / Deno - Lint & Tests`
- `Full CI Validation & Gating / Android APK - Build & Verify`
- `Full CI Validation & Gating / CI Gate - Require All Checks`
- `Lockfile Integrity Check / Verify Single Lockfile`
- `Lockfile Integrity Check / GATE - Lockfile Must Be Correct`

See [docs/BRANCH_PROTECTION.md](docs/BRANCH_PROTECTION.md) for full details.

---

## Contributing

### Before Opening a PR

1. **Read [CONTRIBUTING.md](CONTRIBUTING.md)** — Non-negotiable rules
2. **Run local validation**: `bash scripts/validate-ci.sh`
3. **Setup hooks**: `bash scripts/setup-deno-hooks.sh`
4. **Test locally**: `bun run lint && bun run typecheck && deno lint`
5. **Use Bun**: `bun install` (never `npm install`)

### PR Checklist

- [ ] All CI checks passing (wait for green checkmarks)
- [ ] Code reviewed by maintainers
- [ ] No secrets or API keys in diff
- [ ] Lockfile is `bun.lockb` only (no npm/yarn)
- [ ] Tests added for new features
- [ ] Documentation updated

### What Happens on PR

1. **GitHub Actions runs all checks** (~5-15 min)
2. **Pre-commit hook runs** (locally before push)
3. **Dependabot checks dependencies** (if .json changed)
4. **Security scan runs** (SAST + secret scanning)
5. **Code review required** (1+ approval)
6. **Merge only if ALL green**

---

## Building APK

### Quick Build (Recommended)

```bash
bash build.sh
```

That's it.

- ✅ No setup required if Docker is installed
- ✅ Works on Mac / Linux / Windows (via WSL or Git Bash)

---

## Output

After build completes:

```
🎉 BUILD SUCCESS
📱 APK Location:
./path/to/app-debug.apk
```

Transfer that APK to your phone/tablet and install.

---

## Advanced (Local Build)

Only use if you already have:
- Java installed
- Android SDK configured

```bash
bash build-local.sh
```

---

## Troubleshooting

### Build Issues

- **Docker not found** → Install from https://docs.docker.com/get-docker/
- **Docker not running** → Start Docker Desktop and retry
- **APK not found** → Check Docker logs for build errors

### Development Issues

- **Bun install fails** → Try `bun install --frozen` or `rm bun.lockb && bun install`
- **Deno lint fails** → Run `deno lint --fix`
- **TypeScript errors** → Run `bun run typecheck` for details
- **Pre-commit blocks commit** → See error, fix issues, try again

### CI Issues

See [docs/BRANCH_PROTECTION.md](docs/BRANCH_PROTECTION.md#when-ci-fails) for common CI failures and fixes.

---

## Project Structure

```
.
├── src/                # React + TypeScript frontend
│   ├── components/     # Reusable UI components
│   ├── pages/         # Route pages
│   ├── hooks/         # Custom React hooks
│   ├── contexts/      # Auth, wallet, tier management
│   └── services/      # API integrations
├── supabase/
│   └── functions/     # Deno edge functions
├── android/           # Capacitor Android app
├── .github/workflows/ # CI/CD pipelines
├── scripts/          # Build & utility scripts
└── docs/            # Documentation (branch protection, etc.)
```

---

## Security & Privacy

- **No tracking** — No analytics, no tracking pixels
- **No spyware** — No hidden processes or data collection
- **Code auditable** — All code is here, no secrets
- **Self-contained** — Works offline (wallet + local state only)

See [SECURITY.md](SECURITY.md) for full security policy.

---

## License

(Add license info if applicable)

---

**Questions?** See [CONTRIBUTING.md](CONTRIBUTING.md) or open an issue.
