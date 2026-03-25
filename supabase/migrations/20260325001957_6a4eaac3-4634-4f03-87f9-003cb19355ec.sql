
-- Add unique constraint for sniper opportunity upsert by token
ALTER TABLE public.sniper_opportunities ADD CONSTRAINT sniper_opportunities_token_address_key UNIQUE (token_address);

-- Add unique constraint for risk_scores upsert by token
ALTER TABLE public.risk_scores ADD CONSTRAINT risk_scores_token_address_key UNIQUE (token_address);

-- Enable realtime for live feeds
ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sniper_opportunities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
