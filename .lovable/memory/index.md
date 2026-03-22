Tanner Terminal — Solana memecoin launchpad & rug protection terminal, with XRPL as secondary chain + bridge.

## Design System
- Dark terminal: deep navy bg (225 25% 5%), green primary (142 70% 45%)
- Premium tokens: --glow-green, --glow-red, --panel-shadow, --panel-inset
- CSS classes: terminal-panel, terminal-panel-header, terminal-panel-title, depth-bar-bid/ask, glow-green/red
- Custom scrollbar, tick-up/tick-down animations
- Fonts: JetBrains Mono (mono), Inter (sans)

## Architecture
- **Primary**: Solana memecoin launchpad (pump.fun, rug detection, smart money, copy trading, sniper)
- **Secondary**: XRPL trading at /xrpl with bridge panel
- **State**: Zustand — walletStore, marketStore, tradingStore, portfolioStore, uiStore, alertStore, ammStore
- **Contexts**: TierContext (free/pro/elite), WalletContext (Phantom/Solflare), SelectedTokenContext
- **Layout**: Index (Solana pages via TerminalHeader) + TerminalLayout (XRPL via TerminalTopBar+Sidebar)
- **Routing**: / = Solana Dashboard, /xrpl = XRPL Trading

## Key Decisions
- Solana-first, XRPL secondary with bridging
- Keep all existing Solana tools (sniper, rug guard, copy trading, smart money, etc.)
- XRPL code kept but isolated under /xrpl route
- xrpl.js v4 for WebSocket (XRPL section only)
