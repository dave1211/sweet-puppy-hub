import { useGrowthMetrics } from "@/hooks/useGrowthMetrics";
import { Loader2, TrendingUp, Users, Wallet, Crown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

function Delta({ value, suffix = "" }: { value: number; suffix?: string }) {
  if (value === 0) return null;
  const positive = value > 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[9px] font-mono ${positive ? "text-terminal-green" : "text-terminal-red"}`}>
      <Icon className="h-2.5 w-2.5" />
      {positive ? "+" : ""}{value}{suffix}
    </span>
  );
}

export function GrowthDashboard() {
  const { data: metrics, isLoading } = useGrowthMetrics(30);

  if (isLoading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  }

  const latest = metrics?.[metrics.length - 1];
  const prev = metrics?.[metrics.length - 2];

  const cards = [
    { label: "SIGNUPS", value: latest?.signups ?? 0, delta: (latest?.signups ?? 0) - (prev?.signups ?? 0), icon: Users, color: "text-terminal-cyan" },
    { label: "ACTIVE", value: latest?.active_users ?? 0, delta: (latest?.active_users ?? 0) - (prev?.active_users ?? 0), icon: TrendingUp, color: "text-terminal-green" },
    { label: "WALLETS", value: latest?.wallet_connects ?? 0, delta: (latest?.wallet_connects ?? 0) - (prev?.wallet_connects ?? 0), icon: Wallet, color: "text-terminal-amber" },
    { label: "UPGRADES", value: latest?.upgrades ?? 0, delta: (latest?.upgrades ?? 0) - (prev?.upgrades ?? 0), icon: Crown, color: "text-primary" },
  ];

  const chartData = (metrics ?? []).map((m) => ({
    date: m.date.slice(5),
    users: m.active_users,
    signups: m.signups,
    revenue: Number(m.revenue_usd),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-card/50 p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <c.icon className={`h-3 w-3 ${c.color}`} />
              <span className="text-[9px] font-mono text-muted-foreground">{c.label}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-mono font-bold text-foreground">{c.value}</span>
              <Delta value={c.delta} />
            </div>
          </div>
        ))}
      </div>

      {chartData.length > 1 && (
        <div className="rounded-lg border border-border bg-card/50 p-3">
          <span className="text-[9px] font-mono text-muted-foreground mb-2 block">GROWTH — 30 DAYS</span>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fontFamily: "monospace" }} stroke="hsl(var(--border))" />
              <YAxis tick={{ fontSize: 9, fontFamily: "monospace" }} stroke="hsl(var(--border))" width={30} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 10, fontFamily: "monospace" }} />
              <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" fill="url(#growthFill)" strokeWidth={1.5} />
              <Area type="monotone" dataKey="signups" stroke="hsl(var(--terminal-cyan))" fill="none" strokeWidth={1} strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {(!metrics || metrics.length === 0) && (
        <div className="text-center py-6">
          <p className="text-[10px] font-mono text-muted-foreground">No growth data yet. Metrics populate daily as users sign up and engage.</p>
        </div>
      )}
    </div>
  );
}
