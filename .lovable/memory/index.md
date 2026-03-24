Tanner Terminal clone project - dark terminal trading UI with JetBrains Mono, Inter fonts, green primary accent on dark navy.

## Design System
- Dark terminal theme: navy bg (220 20% 7%), green primary (142 70% 45%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)
- pulse-glow animation for live indicators

## Architecture  
- 3 contexts: TierContext (free/pro/elite gating), WalletContext (Phantom/Solflare/Backpack - Solana), SelectedTokenContext
- Supabase for persistence (watchlist, alerts, tracked_wallets tables)
- Edge functions for token data (DexScreener, Jupiter APIs)
- Sidebar split: SOLANA section, XRPL section, OTHER section
- XRPL is separate module at /xrpl route, not mixed with Solana

## Key Routes
- /claim-sol — Claim Your SOL (dust account reclaim)
- /sol-burn — SOL Burn Incinerator
- /holdings — Token Holdings viewer
- /xrpl — XRPL Ledger (separate module)

## CI/CD
- Android APK: Node 18, Java 17 (Temurin), SDK 34 w/ fallback to 33
- FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true
- actions/checkout@v6, actions/setup-node@v6, actions/setup-java@v5
