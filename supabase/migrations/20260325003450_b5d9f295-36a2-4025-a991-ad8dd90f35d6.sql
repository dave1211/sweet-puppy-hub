
-- Add allocated_to for user-generated referral invites
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS label text DEFAULT NULL;
ALTER TABLE public.invite_codes ADD COLUMN IF NOT EXISTS allocated_to uuid DEFAULT NULL;

-- Allow authenticated users to read their own allocated invite codes
CREATE POLICY "Users read own invite codes" ON public.invite_codes
  FOR SELECT TO authenticated
  USING (allocated_to = auth.uid());
