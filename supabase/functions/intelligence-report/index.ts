import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

function adminClient() {
  return createClient(supabaseUrl, serviceKey);
}

/** Verify caller is admin */
async function verifyAdmin(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  if (token === anonKey) return false; // anon key is not admin

  const sb = createClient(supabaseUrl, anonKey);
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return false;

  const admin = adminClient();
  const { data } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  return !!data;
}

interface ReportSection {
  title: string;
  metrics: Record<string, number | string>;
  notes: string[];
}

async function generateHourlyReport(): Promise<{ type: string; generated_at: string; sections: ReportSection[] }> {
  const sb = adminClient();
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  // Active users (usage events in last hour)
  const { count: activeHour } = await sb
    .from("usage_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneHourAgo);

  // New users (profiles created in last hour)
  const { count: newUsers } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneHourAgo);

  // Sniper uses
  const { count: sniperUses } = await sb
    .from("snipe_history")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneHourAgo);

  // Alerts triggered
  const { count: alerts } = await sb
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneHourAgo);

  // Launches
  const { count: launches } = await sb
    .from("launches")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneHourAgo);

  // Anomalies (open)
  const { count: anomalies } = await sb
    .from("anomaly_events")
    .select("*", { count: "exact", head: true })
    .eq("status", "open");

  // Signal events
  const { count: signals } = await sb
    .from("signal_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneHourAgo);

  // 24h active for context
  const { count: active24h } = await sb
    .from("usage_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", oneDayAgo);

  const notes: string[] = [];
  if ((sniperUses ?? 0) > 10) notes.push("High sniper activity — monitor for abuse");
  if ((anomalies ?? 0) > 5) notes.push("Multiple open anomalies require attention");
  if ((newUsers ?? 0) > 0) notes.push(`${newUsers} new user(s) joined this hour`);

  return {
    type: "hourly",
    generated_at: now.toISOString(),
    sections: [
      {
        title: "Activity Overview",
        metrics: {
          active_users_1h: activeHour ?? 0,
          active_users_24h: active24h ?? 0,
          new_users: newUsers ?? 0,
        },
        notes: [],
      },
      {
        title: "Platform Activity",
        metrics: {
          sniper_uses: sniperUses ?? 0,
          alerts_fired: alerts ?? 0,
          launches: launches ?? 0,
          signal_events: signals ?? 0,
        },
        notes: [],
      },
      {
        title: "System Health",
        metrics: {
          open_anomalies: anomalies ?? 0,
        },
        notes,
      },
    ],
  };
}

async function generate3HourReport(): Promise<{ type: string; generated_at: string; sections: ReportSection[] }> {
  const sb = adminClient();
  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString();
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();

  // Current 3h window
  const { count: active3h } = await sb
    .from("usage_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", threeHoursAgo);

  // Previous 3h window (for comparison)
  const { count: activePrev3h } = await sb
    .from("usage_events")
    .select("*", { count: "exact", head: true })
    .gte("created_at", sixHoursAgo)
    .lt("created_at", threeHoursAgo);

  // Sniper patterns
  const { count: sniper3h } = await sb
    .from("snipe_history")
    .select("*", { count: "exact", head: true })
    .gte("created_at", threeHoursAgo);

  // Wallet connections
  const { count: walletConnects } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("wallet_address", "is", null)
    .gte("updated_at", threeHoursAgo);

  // Risk signals
  const { data: riskSignals } = await sb
    .from("signal_events")
    .select("severity, category")
    .gte("created_at", threeHoursAgo)
    .in("severity", ["high", "critical"]);

  // Conversion: new users who also connected wallet
  const { count: convertedUsers } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .not("wallet_address", "is", null)
    .gte("created_at", threeHoursAgo);

  const { count: totalNew3h } = await sb
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .gte("created_at", threeHoursAgo);

  const conversionRate = (totalNew3h ?? 0) > 0
    ? Math.round(((convertedUsers ?? 0) / (totalNew3h ?? 1)) * 100)
    : 0;

  const engagementChange = (activePrev3h ?? 0) > 0
    ? Math.round((((active3h ?? 0) - (activePrev3h ?? 0)) / (activePrev3h ?? 1)) * 100)
    : 0;

  const notes: string[] = [];
  if (engagementChange > 20) notes.push(`Engagement UP ${engagementChange}% vs previous 3h window`);
  if (engagementChange < -20) notes.push(`Engagement DOWN ${Math.abs(engagementChange)}% — investigate`);
  if ((riskSignals?.length ?? 0) > 3) notes.push(`${riskSignals?.length} high/critical risk signals detected`);
  if (conversionRate > 50) notes.push("Strong wallet conversion rate");

  return {
    type: "3-hour-intelligence",
    generated_at: now.toISOString(),
    sections: [
      {
        title: "Engagement Analysis",
        metrics: {
          active_users_3h: active3h ?? 0,
          previous_3h: activePrev3h ?? 0,
          engagement_change_pct: engagementChange,
        },
        notes: [],
      },
      {
        title: "Conversion Behavior",
        metrics: {
          new_users_3h: totalNew3h ?? 0,
          wallet_converts: convertedUsers ?? 0,
          conversion_rate_pct: conversionRate,
          wallet_connections: walletConnects ?? 0,
        },
        notes: [],
      },
      {
        title: "Sniper & Risk Intelligence",
        metrics: {
          sniper_uses_3h: sniper3h ?? 0,
          high_risk_signals: riskSignals?.length ?? 0,
        },
        notes,
      },
    ],
  };
}

async function generateDailyReport(): Promise<{ type: string; generated_at: string; sections: ReportSection[] }> {
  const sb = adminClient();
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString();

  const { count: totalUsers } = await sb.from("profiles").select("*", { count: "exact", head: true });
  const { count: newToday } = await sb.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo);
  const { count: newYesterday } = await sb.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", twoDaysAgo).lt("created_at", oneDayAgo);
  const { count: premiumUsers } = await sb.from("subscriptions").select("*", { count: "exact", head: true }).eq("status", "active").neq("tier", "free");
  const { count: sniperToday } = await sb.from("snipe_history").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo);
  const { count: alertsToday } = await sb.from("alerts").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo);
  const { count: launchesToday } = await sb.from("launches").select("*", { count: "exact", head: true }).gte("created_at", oneDayAgo);
  const { count: referrals } = await sb.from("referral_invites").select("*", { count: "exact", head: true }).not("used_by", "is", null).gte("used_at", oneDayAgo);

  const growthRate = (newYesterday ?? 0) > 0
    ? Math.round((((newToday ?? 0) - (newYesterday ?? 0)) / (newYesterday ?? 1)) * 100)
    : 0;

  const notes: string[] = [];
  const recommendations: string[] = [];

  if (growthRate > 0) notes.push(`User growth trending UP ${growthRate}% day-over-day`);
  if (growthRate < 0) notes.push(`User growth DOWN ${Math.abs(growthRate)}% — review acquisition`);
  if ((premiumUsers ?? 0) < (totalUsers ?? 0) * 0.05) recommendations.push("Premium conversion below 5% — consider promotion or trial");
  if ((sniperToday ?? 0) > 50) recommendations.push("High sniper volume — ensure rate limits are active");
  if ((referrals ?? 0) > 5) notes.push(`${referrals} referral conversions today — viral loop active`);
  recommendations.push("Review open anomalies in War Room");

  return {
    type: "daily-summary",
    generated_at: now.toISOString(),
    sections: [
      {
        title: "Daily Overview",
        metrics: {
          total_users: totalUsers ?? 0,
          new_users_today: newToday ?? 0,
          growth_rate_pct: growthRate,
          premium_users: premiumUsers ?? 0,
        },
        notes,
      },
      {
        title: "Feature Usage",
        metrics: {
          sniper_uses: sniperToday ?? 0,
          alerts_created: alertsToday ?? 0,
          launches: launchesToday ?? 0,
          referral_conversions: referrals ?? 0,
        },
        notes: [],
      },
      {
        title: "Recommendations",
        metrics: {},
        notes: recommendations,
      },
    ],
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const isAdmin = await verifyAdmin(req.headers.get("authorization"));
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized — admin only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type } = await req.json().catch(() => ({ type: "hourly" }));

    let report;
    switch (type) {
      case "3hour":
        report = await generate3HourReport();
        break;
      case "daily":
        report = await generateDailyReport();
        break;
      case "hourly":
      default:
        report = await generateHourlyReport();
        break;
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
