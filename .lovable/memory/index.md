# Memory: index.md
Updated: now

Tanner Terminal — hardened crypto terminal platform with dark terminal UI.

## Design System
- Dark terminal theme: navy bg (220 20% 4%), blue primary (217 91% 60%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)
- pulse-glow animation for live indicators

## Architecture
- 4 contexts: AuthContext, TierContext, WalletContext, SelectedTokenContext
- TierProvider MUST be inside AuthProvider and WalletProvider in App.tsx
- Supabase for persistence (25+ tables with RLS)
- Multi-chain abstraction layer in src/lib/multichain/ (adapters for SOL, BTC, ETH, XRPL, XLM, QNT)
- Edge functions: ai-chat, signal-ingest, sniper-rank, risk-score, owner-brief, wallet-auth, + more
- Feature flags + kill switches in DB
- WidgetErrorBoundary for dashboard panel isolation
- EnvErrorScreen for missing config (never white screen)
- Boot-time env validation in lib/envValidation.ts

## Multi-Chain Layer
- All chain logic in src/lib/multichain/ with adapter pattern
- UI never imports chain SDKs directly — only uses adapters via getChainAdapter()
- Chains: solana, bitcoin, ethereum, xrpl, stellar, quant
- Compliance-aligned chains: BTC, XRPL, XLM, QNT
- Hub page at /multichain with overview, wallet management, bridge placeholder
- Hook: useMultiChain.ts (useMultiChainPortfolio, useChainStatus, useMultiChainWallets)

## Security Model
- Wallet-only auth (no Google/Apple/email)
- Private alpha mode: invite-code gated
- Role-based: guest/user/premium/vip/moderator/admin/owner
- RLS on all tables
- Admin wallet: 4xMfshfwBG87cfeNwx4SBYBj24Ldn18gLEH1wJFiYCf6
