/**
 * Core analytics tracker — records user behavior events for war room intelligence.
 * Fail-silent: never blocks UI on tracking errors.
 */
import { supabase } from "@/integrations/supabase/client";

type TrackableEvent =
  | "page_view"
  | "wallet_connected"
  | "signal_clicked"
  | "signal_ignored"
  | "sniper_opportunity_opened"
  | "sniper_alert_clicked"
  | "feature_used"
  | "upgrade_prompt_shown"
  | "upgrade_clicked"
  | "upgrade_completed"
  | "upgrade_abandoned"
  | "launch_started"
  | "launch_completed"
  | "alert_created"
  | "watchlist_added"
  | "chatbot_message"
  | "referral_link_clicked"
  | "invite_shared"
  | "session_start"
  | "session_return";

let sessionId: string | null = null;

function getSessionId(): string {
  if (!sessionId) {
    sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
  return sessionId;
}

export async function trackEvent(
  eventType: TrackableEvent,
  data?: Record<string, unknown>
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("usage_events").insert({
      user_id: user?.id ?? null,
      event_type: eventType,
      event_data: data ?? {},
      session_id: getSessionId(),
    } as any);
  } catch {
    // Fail silent — never block UI for analytics
  }
}

/** Track page view with route info */
export function trackPageView(path: string) {
  trackEvent("page_view", { path, timestamp: Date.now() });
}

/** Track feature usage */
export function trackFeatureUsed(feature: string, meta?: Record<string, unknown>) {
  trackEvent("feature_used", { feature, ...meta });
}

/** Track upgrade funnel step */
export function trackUpgradeFunnel(step: "prompt_shown" | "clicked" | "completed" | "abandoned", tier?: string) {
  const eventMap = {
    prompt_shown: "upgrade_prompt_shown" as const,
    clicked: "upgrade_clicked" as const,
    completed: "upgrade_completed" as const,
    abandoned: "upgrade_abandoned" as const,
  };
  trackEvent(eventMap[step], { tier });
}

/** Track signal interaction */
export function trackSignalInteraction(action: "clicked" | "ignored", tokenAddress: string, score?: number) {
  trackEvent(action === "clicked" ? "signal_clicked" : "signal_ignored", {
    token_address: tokenAddress,
    score,
  });
}
