# Tanner Terminal — Agent & Copilot Instructions

## Hard Rules — Do Not Violate

1. **Bun only** — no npm, yarn, or pnpm. The only valid lockfile is `bun.lockb`.
2. **React 18.x only** — never upgrade React or ReactDOM beyond 18.x.
3. **No `.env` in Git** — `.env` must remain untracked and in `.gitignore`.
4. **No direct pushes to `main`** — all changes go through PRs.
5. **No permission broadening** — workflow permissions stay minimal (`contents: read`). Only add `write` scopes when clearly required.
6. **No duplicate CI paths** — Android validation lives in `android-apk.yml` only, not in `ci-gate.yml`.
7. **No Deno migration** — Deno-specific paths (`supabase/functions/`) stay on Deno. Do not convert them to Bun or Node.
8. **No scope creep** — fix only what is asked. Do not refactor unrelated code.
9. **No new workflows without need** — do not create duplicate or overlapping CI workflows.
10. **Fail closed** — if uncertain, block the action rather than allow it.

## Lockfile Rules

- Only `bun.lockb` is accepted.
- If you see `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, or `bun.lock` — delete them.
- Install commands must use: `bun install --frozen`

## Dependency Rules

- Check `package.json` before adding dependencies.
- Never introduce packages that require React 19.
- Prefer existing dependencies over new ones.

## Workflow Rules

- All automation PRs use `peter-evans/create-pull-request` — never push directly.
- Required status checks: `ci-gate`, `security-sentinel`, `policy-check`.
- Keep workflow permissions to the absolute minimum needed.

## Code Rules

- Secrets go in edge functions or environment variables — never in frontend code.
- All trade execution requires user confirmation.
- Wallet security: public keys only, no private key handling.
- Input validation on all user-facing inputs.

## Autonomous Maintenance Rules

Automated fixes may ONLY touch these categories:
1. Remove forbidden lockfiles (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`, `bun.lock`)
2. Deno lint auto-fix in `supabase/functions/` only
3. ESLint auto-fix in `src/` only

Automated fixes must NEVER:
- Upgrade React beyond 18.x
- Change product logic, database schema, or auth config
- Modify secrets or environment values
- Broaden workflow permissions
- Alter Deno runtime behavior
- Rewrite test architecture
- Merge PRs without human review
- Push directly to `main`
