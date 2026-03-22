# Memory: index.md
Updated: now

Tanner Terminal — Solana-first memecoin launchpad & rug protection terminal with XRPL secondary chain support.

## Design System
- Dark terminal theme: navy bg (220 20% 7%), green primary (142 70% 45%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)
- pulse-glow animation for live indicators

## Architecture  
- 3 contexts: TierContext (free/pro/elite gating), WalletContext (Phantom/Solflare), SelectedTokenContext
- Supabase for persistence (watchlist, alerts, tracked_wallets, rewards, merch_products)
- Edge functions: token-data (DexScreener), jupiter-swap, telegram-alert, tanner-token-stats
- Solana primary route `/`, XRPL secondary at `/xrpl`
- Sniper Core at `/sniper` — full-feature module

## Sniper Core Module
- Location: `src/features/sniper/`
- Types: `types.ts` (SniperToken, ScoreBreakdown, RiskBreakdown, SniperState machine)
- Services: `scoringEngine.ts` (weighted 6-category scoring), `riskEngine.ts` (6-category risk analysis), `detectionService.ts` (enrichment pipeline)
- Stores: `sniperStore.ts` (feed + filters), `executionStore.ts` (buy/sell config)
- Hooks: `useSniperFeed.ts` (merges newLaunches + trending → processed tokens)
- Components: SniperHeader, SniperFilters, SniperFeed, SniperDetail, SniperExecution, ScoreBreakdown, RiskPanel
- 3-panel layout: feed left, detail center, execution right
- Token states: IGNORE → WATCH → HOT → SNIPE_READY → BLOCKED

## Bridge
- `src/components/bridge/` — XRP↔SOL cross-chain bridge with 3-step flow
- BridgeAssets.ts, BridgeAssetSelector.tsx, BridgeConfirmStep.tsx, XRPBridgePanel.tsx

## Key Decisions
- DO NOT remove XRPL code — keep as secondary chain
- Solana is the PRIMARY chain, all new features default to Solana
- Bridge connects XRPL to Solana ecosystem
