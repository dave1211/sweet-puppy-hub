Tanner Terminal clone project - dark terminal trading UI with JetBrains Mono, Inter fonts, green primary accent on dark navy.

## Design System
- Dark terminal theme: navy bg (220 20% 7%), green primary (142 70% 45%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)
- pulse-glow animation for live indicators

## Architecture  
- 3 contexts: TierContext (free/pro/elite gating), WalletContext (Phantom/Solflare), SelectedTokenContext
- Supabase for persistence (watchlist, alerts, tracked_wallets, snipe_history tables)
- Edge functions for token data (DexScreener, Jupiter APIs)
- Mobile: hamburger sidebar with overlay, responsive grids
- Live price polling via useLivePriceTicks hook (replaces synthetic chart data)
- WalletConnectButton in topbar, notification bell popover with real alerts
- forwardRef on StatusChip, PanelShell, MiniChart to avoid React warnings

## Key Hooks
- useLivePriceTicks: polls SOL price, accumulates ticks for live charts
- useSnipeHistory: reads snipe_history table, exposes wins/losses/active
- useNewLaunches, useTrendingSignals: edge function data
- useUnifiedSignals: merged signal scoring
