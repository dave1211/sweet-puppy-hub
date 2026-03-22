Tanner Terminal clone project - dark terminal trading UI with JetBrains Mono, Inter fonts, green primary accent on dark navy.

## Design System
- Dark terminal theme: navy bg (220 20% 7%), green primary (142 70% 45%)
- Terminal colors: green, red, amber, blue, cyan (all HSL in index.css)
- Fonts: JetBrains Mono (mono), Inter (sans)
- pulse-glow animation for live indicators

## Architecture  
- Auth: Supabase Auth (email/password, auto-confirm enabled)
- AuthContext wraps app, ProtectedRoute guards all routes except /auth
- All tables have user_id column with RLS policies using auth.uid()
- 3 contexts: TierContext, WalletContext, AuthContext
- Edge functions secured with JWT (getClaims)
- Telegram-alert has rate limiting (10 req/min per user)

## Security
- All RLS policies use auth.uid() - no more device_id-based policies
- Edge functions validate JWT before processing
- No anonymous access to user data tables
