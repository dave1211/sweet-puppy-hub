# Security Policy — Tanner Terminal

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly. Do not open a public issue.

## Automated Protection

This project uses **Tanner Sentinel**, an automated security bot that:
- Scans every PR and nightly for vulnerabilities
- Blocks unsafe changes to protected files
- Auto-repairs low-risk issues via PRs (never direct push)

See [docs/SECURITY_SENTINEL.md](docs/SECURITY_SENTINEL.md) for details.

## Security Rules

1. **No secrets in frontend** — all private keys stay in edge functions
2. **No wallet private key handling** — only public keys via wallet adapters
3. **Live trading off by default** — requires explicit user confirmation
4. **Emergency stop always available** — cannot be removed
5. **npm only** — package-lock.json required, React pinned to 18.x
6. **RLS on all tables** — users access only their own data
7. **Edge functions validate JWT** — no anonymous access to user data
8. **Rate limiting on all public endpoints**

## Protected Files

Changes to execution engine, wallet logic, auth, and edge functions require strict review.
Full list: `scripts/security/protected-paths.json`
