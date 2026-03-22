# Memory: index.md
Updated: now

Tanner Terminal — XRPL-native crypto trading terminal. Phase 1 complete.

## Design System
- Dark terminal theme: navy bg (220 20% 7%), green primary (142 70% 45%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)
- Bloomberg Terminal × modern crypto app aesthetic

## Architecture (Phase 1 — XRPL Native)
- **State**: Zustand stores — walletStore, marketStore, tradingStore, portfolioStore, uiStore
- **Services**: xrplService (WebSocket singleton), walletService (Xaman/Crossmark/Ledger)
- **Types**: src/types/xrpl.ts — all domain types
- **Layout**: TerminalLayout (topbar + sidebar + main), TerminalTopBar, TerminalSidebar
- **Trading**: ChartPanel (Recharts), OrderBook, TradeForm, RecentTrades, OpenOrders, TradeConfirmModal, PairSelector, XRPLWalletButton
- **Portfolio**: PortfolioPanel, TransactionHistory
- **Pages**: TradingPage (default), PortfolioPage
- **Routing**: / = TradingPage, /portfolio = PortfolioPage

## Key Decisions
- xrpl.js v4 for WebSocket + data
- Wallet providers: Xaman, Crossmark, Ledger (demo fallback when SDK not detected)
- Session-persisted wallet state via Zustand persist
- WebSocket-first architecture, auto-reconnect
- Old Solana code still exists in src/components/terminal/, src/contexts/, src/hooks/ — can be cleaned up

## Supabase (Lovable Cloud)
- Tables: alerts, merch_products, rewards, tracked_wallets, watchlist
- Edge functions: jupiter-swap, tanner-token-stats, telegram-alert, token-data
