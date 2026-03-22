# Memory: index.md
Updated: now

Tanner Terminal — XRPL-native crypto trading terminal. Phase 2 complete.

## Design System
- Dark terminal: deep navy bg (225 25% 5%), green primary (142 70% 45%)
- Premium tokens: --glow-green, --glow-red, --panel-shadow, --panel-inset
- CSS classes: terminal-panel, terminal-panel-header, terminal-panel-title, depth-bar-bid/ask, glow-green/red
- Custom scrollbar, tick-up/tick-down animations
- Fonts: JetBrains Mono (mono), Inter (sans)

## Architecture
- **State**: Zustand — walletStore, marketStore, tradingStore, portfolioStore, uiStore, alertStore, ammStore
- **Services**: xrplService (WebSocket), walletService, routingService (smart router DEX vs AMM), riskService
- **Types**: src/types/xrpl.ts — all domain types incl AMM, alerts, trust lines, NFTs, risk
- **Layout**: TerminalLayout > TerminalTopBar + TerminalSidebar + main
- **Tabs**: Trade, Portfolio, Orders, Alerts, NFTs
- **Trading**: ChartPanel, OrderBook, TradeForm, RecentTrades, OpenOrders, OrderHistory, AMMPanel, PairSearch, PairSelector, TradeConfirmModal, XRPLWalletButton
- **Portfolio**: PortfolioPanel, PnLPanel, TrustLineManager, TransactionHistory
- **Alerts**: AlertCenter (feed + settings)
- **NFT**: NFTGallery (gallery + detail + transfer)
- **Risk**: RiskBadge, RiskWarningList

## Key Decisions
- xrpl.js v4 for WebSocket
- Smart routing compares DEX, AMM, and split routes
- Mock data fallbacks for all panels
- Session-persisted wallet via Zustand persist
- Old Solana code still in src/components/terminal/, src/contexts/, src/hooks/
