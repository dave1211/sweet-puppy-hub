# Memory: index.md
Updated: now

Tanner Terminal — XRPL-native crypto trading terminal. Phase 1 complete.

## Design System
- Dark terminal: deep navy bg (225 25% 5%), green primary (142 70% 45%)
- Premium tokens: --glow-green, --glow-red, --panel-shadow, --panel-inset
- CSS classes: terminal-panel, terminal-panel-header, terminal-panel-title, terminal-panel-subtitle, depth-bar-bid/ask, glow-green/red
- Custom scrollbar (4px, themed)
- Fonts: JetBrains Mono (mono), Inter (sans)
- Bloomberg Terminal × modern crypto aesthetic — tight, sharp, no rounded bubbles

## Architecture (Phase 1 — XRPL Native)
- **State**: Zustand stores — walletStore, marketStore, tradingStore, portfolioStore, uiStore
- **Services**: xrplService (WebSocket singleton), walletService (Xaman/Crossmark/Ledger)
- **Types**: src/types/xrpl.ts — all domain types
- **Layout**: TerminalLayout (topbar + sidebar + main), TerminalTopBar, TerminalSidebar, WatchlistSidebar
- **Trading**: ChartPanel (Recharts), OrderBook, TradeForm, RecentTrades, OpenOrders, TradeConfirmModal, PairSelector, XRPLWalletButton
- **Portfolio**: PortfolioPanel, TransactionHistory
- **Pages**: TradingPage (default /), PortfolioPage (/portfolio)
- **Routing**: / = TerminalLayout > TradingPage

## Key Decisions
- xrpl.js v4 for WebSocket + data
- Mock data fallbacks for all panels when no live data
- Session-persisted wallet state via Zustand persist
- WebSocket-first, auto-reconnect
- Old Solana code still in src/components/terminal/, src/contexts/, src/hooks/

## Supabase (Lovable Cloud)
- Tables: alerts, merch_products, rewards, tracked_wallets, watchlist
- Edge functions: jupiter-swap, tanner-token-stats, telegram-alert, token-data
