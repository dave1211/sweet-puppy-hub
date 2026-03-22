-- Delete orphaned rows with NULL user_id (legacy device_id-only data)
DELETE FROM public.alerts WHERE user_id IS NULL;
DELETE FROM public.tracked_wallets WHERE user_id IS NULL;
DELETE FROM public.watchlist WHERE user_id IS NULL;
DELETE FROM public.snipe_history WHERE user_id IS NULL;
DELETE FROM public.rewards WHERE user_id IS NULL;
DELETE FROM public.burn_history WHERE user_id IS NULL;

-- Now make user_id NOT NULL with default auth.uid()
ALTER TABLE public.alerts ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.tracked_wallets ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.watchlist ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.snipe_history ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.rewards ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE public.burn_history ALTER COLUMN user_id SET NOT NULL, ALTER COLUMN user_id SET DEFAULT auth.uid();