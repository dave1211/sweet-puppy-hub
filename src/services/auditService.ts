/**
 * Audit logging service — records privileged actions for forensic review.
 * All admin/owner actions flow through here.
 */
import { supabase } from "@/integrations/supabase/client";

interface AuditEntry {
  action: string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditEntry) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("audit_logs").insert({
    actor_id: user.id,
    action: entry.action,
    target_type: entry.target_type ?? null,
    target_id: entry.target_id ?? null,
    details: entry.details ?? {},
  } as any);
}

export async function toggleFeatureFlagAudited(key: string, enabled: boolean) {
  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled })
    .eq("key", key);

  if (error) throw error;

  await writeAuditLog({
    action: enabled ? "feature_flag_enabled" : "feature_flag_disabled",
    target_type: "feature_flag",
    target_id: key,
    details: { key, enabled },
  });
}

export async function fetchAnomalyEvents(limit = 50) {
  const { data, error } = await supabase
    .from("anomaly_events" as any)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function resolveAnomaly(id: string, notes: string) {
  const { data: { user } } = await supabase.auth.getUser();

  await (supabase.from("anomaly_events" as any) as any)
    .update({
      status: "resolved",
      resolution_notes: notes,
      resolved_by: user?.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);

  await writeAuditLog({
    action: "anomaly_resolved",
    target_type: "anomaly_event",
    target_id: id,
    details: { notes },
  });
}
