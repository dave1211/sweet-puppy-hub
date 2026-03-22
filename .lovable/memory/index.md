Tanner Terminal - premium crypto intelligence terminal with electric blue accent on near-black background.

## Design System
- Dark terminal theme: near-black bg (220 20% 4%), electric blue primary (217 91% 60%)
- Terminal colors: green (gains), red (losses), amber (warnings), blue (primary), cyan (info)
- Fonts: JetBrains Mono (mono), Inter (sans)
- Green/red ONLY for gains/losses, blue for primary accents

## Architecture
- AppShell layout: AppTopbar + AppSidebar (shadcn sidebar) + BottomStrip (marquee)
- 15 pages: Dashboard, LivePairs, NewLaunches, SniperMode, WalletTracker, CopyTrade, AISignals, RiskScanner, Watchlist, AlertsCenter, Portfolio, Strategies, Settings, TokenDetail, WalletDetail
- Shared components: PanelShell, StatusChip, ScoreMeter, DashboardStatCard
- Mock data in src/data/mockData.ts
- No TierContext/WalletContext (removed old structure)
- Supabase Cloud for persistence (watchlist, alerts, tracked_wallets, etc.)
