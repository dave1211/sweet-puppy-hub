Tanner Terminal clone project - dark terminal trading UI with JetBrains Mono, Inter fonts, green primary accent on dark navy.

## Design System
- Dark terminal theme: navy bg (220 20% 7%), green primary (142 70% 45%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)
- pulse-glow animation for live indicators

## Architecture  
- TierContext defaults to "elite" — all features unlocked, no upgrade gating
- 3 contexts: TierContext, WalletContext, SelectedTokenContext
- Supabase tables: watchlist, alerts, tracked_wallets, rewards, merch_products, snipe_history
- Edge functions for token data (DexScreener, Jupiter APIs)
- Sniper feature: stores (sniperStore, executionStore, autoSniperStore), auto-snipe engine, hotkeys, mobile tabs, snipe recorder
- Source project: 71b5d5e1-ca96-4bb0-af4b-e88f31c74d3d

## Key Decisions
- Fees/upgrade overlay removed — all gates return true
- snipe_history table persists all snipe records per device_id
- Auto-snipe exits at +50% TP / -30% SL
