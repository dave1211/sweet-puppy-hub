# 🛡️ Tanner Sentinel — Security Bot

Automated security scanning, blocking, and low-risk auto-repair for Tanner Terminal.

## How It Works

### Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `security-sentinel.yml` | PR, push to main, nightly | Full security scan, blocks unsafe PRs |
| `security-auto-repair.yml` | Weekly Monday, manual | Auto-fix low-risk issues via PR |

### What Gets Scanned

1. **Hard blocks** (fail CI immediately):
   - LIVE trading default changed to enabled
   - Emergency stop removed
   - Max trade size checks removed
   - Service role key in frontend
   - VITE_ secrets misused
   - Wallet private key logic anywhere
   - Raw SQL execution in edge functions

2. **Secret leaks**: Hardcoded API keys, tokens, credentials

3. **Dependency security**: npm audit, lockfile drift, React version pinning

4. **Edge function security**: Missing CORS, missing auth, missing input validation

5. **Protected path changes**: Flagged for strict review

6. **Environment safety**: .env secrets exposure

### Protected Paths

Files in `scripts/security/protected-paths.json` are **never auto-repaired** and trigger alerts when modified in PRs:

- Execution engine (`src/lib/executionEngine.ts`)
- Wallet context & stores
- Auth context & routes
- All edge functions (`supabase/functions/*`)
- Rug guard, sniper engine
- Trading components (live mode, swap, wallet panels)

### Auto-Repair (Safe Only)

The auto-repair workflow **only** fixes:
- Lockfile drift
- Safe patch-level dependency updates
- Trailing whitespace in docs

It **never**:
- Pushes directly to main (creates PR)
- Touches protected paths
- Modifies trading, wallet, auth, or execution logic

## Reviewing Alerts

### On a PR
- Sentinel comments with a security report table
- Blocked items prevent merge
- Non-blocked items are warnings for review

### Nightly Scan
- Check Actions → Tanner Sentinel for the report artifact
- Download `sentinel-report.json` for full details

### Auto-Repair PRs
- Labeled `security`, `auto-repair`, `sentinel`
- Review diff before merging — even safe fixes deserve a look

## Report Format

```json
{
  "scan_time": "2026-03-22T03:00:00Z",
  "passed": true,
  "total_findings": 2,
  "blocked_count": 0,
  "findings": [
    {
      "severity": "medium",
      "issue": "Missing CORS headers in edge function",
      "file": "supabase/functions/example/index.ts",
      "fixed_automatically": false,
      "blocked": false,
      "recommendation": "Add CORS headers"
    }
  ]
}
```

## Audit Trail

- All scan reports stored as GitHub Actions artifacts (90-day retention)
- PR comments document blocked/allowed decisions
- Auto-repair PRs have full diff for review

## Dependabot

Configured in `.github/dependabot.yml`:
- Weekly npm updates
- React 19+ ignored (pinned to 18.x)
- PRs labeled `dependencies` + `security`
