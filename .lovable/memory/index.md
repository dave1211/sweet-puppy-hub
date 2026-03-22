Tanner Terminal clone project - dark terminal trading UI with JetBrains Mono, Inter fonts, green primary accent on dark navy.

## Design System
- Dark terminal theme: navy bg (220 20% 7%), green primary (142 70% 45%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)
- pulse-glow animation for live indicators

## Architecture  
- 3 contexts: TierContext (free/pro/elite gating), WalletContext (Phantom/Solflare), SelectedTokenContext
- Lovable Cloud for persistence (watchlist, alerts, tracked_wallets, rewards, merch_products tables)
- 4 Edge functions: token-data, jupiter-swap, tanner-token-stats, telegram-alert
- Telegram connector connected for alert push
- Device-based access (no auth) - permissive RLS policies intentional
- 8 pages: Dashboard, Watchlist, Alerts, Token, Pricing, Rewards, MerchStore, NotFound

## Completed
- Full design system, all contexts, hooks, lib files, components
- Database tables with RLS (rewards, merch_products added)
- Rewards system with referral tracking
- Merch store with product listings (Stripe checkout deferred)
- Telegram alert edge function + TelegramAlertButton component
- Enhanced rug scanner panel (EnhancedRugPanel)
- All edge functions deployed
