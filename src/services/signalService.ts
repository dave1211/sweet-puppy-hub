/**
 * Signal & Sniper service — frontend data layer for the signal pipeline.
 */
import { supabase } from "@/integrations/supabase/client";

// ── Signal Feed ──
export async function fetchSignalFeed(options?: {
  limit?: number;
  minScore?: number;
  category?: string;
}) {
  let query = supabase
    .from("signal_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 50);

  if (options?.minScore) query = query.gte("score", options.minScore);
  if (options?.category) query = query.eq("category", options.category);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ── Sniper Opportunities ──
export async function fetchSniperOpportunities(options?: {
  limit?: number;
  minScore?: number;
  actionLabel?: string;
}) {
  let query = supabase
    .from("sniper_opportunities")
    .select("*")
    .order("sniper_score", { ascending: false })
    .limit(options?.limit ?? 30);

  if (options?.minScore) query = query.gte("sniper_score", options.minScore);
  if (options?.actionLabel) query = query.eq("action_label", options.actionLabel);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ── Risk Scores ──
export async function fetchRiskScore(tokenAddress: string) {
  const { data, error } = await supabase
    .from("risk_scores")
    .select("*")
    .eq("token_address", tokenAddress)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchHighRiskTokens(minScore = 50) {
  const { data, error } = await supabase
    .from("risk_scores")
    .select("*")
    .gte("score", minScore)
    .order("score", { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}

// ── Notifications ──
export async function fetchNotifications(limit = 30) {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  if (error) throw error;
}

// ── Usage Events (analytics) ──
export async function trackUsageEvent(
  eventType: string,
  eventData?: Record<string, unknown>
) {
  const { error } = await supabase.from("usage_events").insert({
    event_type: eventType,
    event_data: eventData ?? {},
    user_id: (await supabase.auth.getUser()).data.user?.id,
  });

  if (error) console.warn("[trackUsageEvent]", error.message);
}

// ── Profile ──
export async function fetchProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateProfile(updates: {
  display_name?: string;
  avatar_url?: string;
  wallet_address?: string;
  onboarded?: boolean;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) throw error;
}

// ── Feature Flags ──
export async function fetchFeatureFlags() {
  const { data, error } = await supabase
    .from("feature_flags")
    .select("key, enabled, min_tier");

  if (error) throw error;
  return data;
}

// ── Subscriptions ──
export async function fetchSubscription() {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
