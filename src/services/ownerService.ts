/**
 * Owner intelligence service — admin-only data for war room and adviser.
 */
import { supabase } from "@/integrations/supabase/client";

export async function fetchOwnerBrief() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/owner-brief`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to fetch owner brief");
  }

  const json = await res.json();
  return json.brief;
}

export async function fetchAuditLogs(limit = 50) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function fetchAnalyticsDaily(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data, error } = await supabase
    .from("analytics_daily")
    .select("*")
    .gte("date", since)
    .order("date", { ascending: true });

  if (error) throw error;
  return data;
}

export async function toggleFeatureFlag(key: string, enabled: boolean) {
  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled })
    .eq("key", key);

  if (error) throw error;
}

export async function writeAuditLog(action: string, details?: Record<string, unknown>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_logs").insert([{
    actor_id: user.id,
    action,
    details: details ?? {},
  }] as any);
}
