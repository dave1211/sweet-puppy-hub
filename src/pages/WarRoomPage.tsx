import { useState, useRef, useCallback } from "react";
import {
  DollarSign, Users, TrendingUp, Activity, Crosshair, Bell,
  ShieldAlert, Rocket, BarChart3, Crown, Brain, Send, Loader2,
  Bot, User as UserIcon, Zap, Eye, Flame, Power, Key
} from "lucide-react";
import { KillSwitchPanel } from "@/components/admin/KillSwitchPanel";
import { InviteCodeManager } from "@/components/admin/InviteCodeManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

// Mock metrics — replace with real Supabase queries
const METRICS = {
  revenue: { total: "$12,847", change: "+18.3%", period: "30d" },
  users: { total: "2,341", change: "+124", period: "7d" },
  activeUsers: { total: "892", change: "+12%", period: "24h" },
  launches: { total: "47", change: "+8", period: "7d" },
  sniperUsage: { total: "1,204", change: "+34%", period: "7d" },
  alertsFired: { total: "3,891", change: "+22%", period: "7d" },
  conversionRate: { total: "4.2%", change: "+0.3%", period: "30d" },
  churnRate: { total: "2.1%", change: "-0.4%", period: "30d" },
};

interface AdvisorMessage {
  role: "user" | "assistant";
  content: string;
}

const ADVISOR_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-advisor`;

const STAT_CARDS = [
  { icon: DollarSign, label: "Revenue", value: METRICS.revenue.total, change: METRICS.revenue.change, color: "text-terminal-green" },
  { icon: Users, label: "Total Users", value: METRICS.users.total, change: METRICS.users.change, color: "text-terminal-cyan" },
  { icon: Activity, label: "Active (24h)", value: METRICS.activeUsers.total, change: METRICS.activeUsers.change, color: "text-primary" },
  { icon: Crosshair, label: "Sniper Uses", value: METRICS.sniperUsage.total, change: METRICS.sniperUsage.change, color: "text-terminal-amber" },
  { icon: Rocket, label: "Launches", value: METRICS.launches.total, change: METRICS.launches.change, color: "text-terminal-green" },
  { icon: Bell, label: "Alerts Fired", value: METRICS.alertsFired.total, change: METRICS.alertsFired.change, color: "text-primary" },
  { icon: TrendingUp, label: "Conversion", value: METRICS.conversionRate.total, change: METRICS.conversionRate.change, color: "text-terminal-green" },
  { icon: ShieldAlert, label: "Churn Rate", value: METRICS.churnRate.total, change: METRICS.churnRate.change, color: "text-terminal-red" },
];

const INSIGHTS = [
  { type: "revenue", title: "Pro upgrades spiked after sniper launch", desc: "32 new Pro subs in the last 48h — directly correlated with Sniper Mode usage.", icon: Crown, color: "text-terminal-green" },
  { type: "growth", title: "Referral loop activating", desc: "Top 5 referrers drove 89 signups this week. Consider boosting their rewards.", icon: Users, color: "text-terminal-cyan" },
  { type: "risk", title: "Alert system latency spike", desc: "p95 alert delivery time increased to 4.2s (target: <2s). Check edge function cold starts.", icon: ShieldAlert, color: "text-terminal-red" },
  { type: "opportunity", title: "Elite tier underperforming", desc: "Only 3% of Pro users upgrade to Elite. Consider adding an exclusive feature or trial.", icon: Zap, color: "text-terminal-amber" },
];

const FUNNEL = [
  { stage: "Visitors", count: 12450, pct: 100 },
  { stage: "Sign Ups", count: 2341, pct: 18.8 },
  { stage: "Wallet Connected", count: 1892, pct: 15.2 },
  { stage: "First Signal Viewed", count: 1204, pct: 9.7 },
  { stage: "Pro Upgrade", count: 312, pct: 2.5 },
  { stage: "Elite Upgrade", count: 47, pct: 0.4 },
];

export default function WarRoomPage() {
  const [timeFilter, setTimeFilter] = useState<"24h" | "7d" | "30d">("7d");
  const [advisorMessages, setAdvisorMessages] = useState<AdvisorMessage[]>([
    { role: "assistant", content: "Welcome to the **War Room**, commander. I'm your strategic AI adviser. Ask me about revenue, growth, user behavior, or system health." },
  ]);
  const [advisorInput, setAdvisorInput] = useState("");
  const [advisorStreaming, setAdvisorStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sendToAdvisor = useCallback(async () => {
    const text = advisorInput.trim();
    if (!text || advisorStreaming) return;
    setAdvisorInput("");

    const userMsg: AdvisorMessage = { role: "user", content: text };
    const all = [...advisorMessages, userMsg];
    setAdvisorMessages(all);
    setAdvisorStreaming(true);

    // Use the same AI chat endpoint with owner context
    let content = "";
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: all,
          context: { tier: "owner", page: "war-room" },
        }),
      });

      if (!resp.ok || !resp.body) {
        setAdvisorMessages(prev => [...prev, { role: "assistant", content: "⚠️ AI unavailable right now." }]);
        setAdvisorStreaming(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx);
          buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setAdvisorMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length === all.length + 1) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content } : m);
                }
                return [...prev, { role: "assistant", content }];
              });
            }
          } catch {
            buf = line + "\n" + buf;
            break;
          }
        }
      }
    } catch {
      setAdvisorMessages(prev => [...prev, { role: "assistant", content: "⚠️ Connection failed." }]);
    }
    setAdvisorStreaming(false);
  }, [advisorInput, advisorStreaming, advisorMessages]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg font-mono font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-terminal-amber" /> WAR ROOM
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground">Owner intelligence dashboard — live metrics & AI adviser</p>
        </div>
        <div className="flex items-center gap-1">
          {(["24h", "7d", "30d"] as const).map(t => (
            <Button
              key={t}
              variant={timeFilter === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeFilter(t)}
              className="font-mono text-[10px] h-7 px-3"
            >
              {t.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {STAT_CARDS.map(s => (
          <Card key={s.label} className="border-border bg-card">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <s.icon className={cn("h-4 w-4", s.color)} />
                <span className="text-[10px] font-mono text-muted-foreground">{s.label}</span>
              </div>
              <p className="text-lg font-mono font-bold text-foreground">{s.value}</p>
              <p className={cn("text-[10px] font-mono", s.change.startsWith("+") || s.change.startsWith("-0") ? "text-terminal-green" : "text-terminal-red")}>
                {s.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="insights" className="space-y-3">
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger value="insights" className="font-mono text-[10px]">INSIGHTS</TabsTrigger>
          <TabsTrigger value="funnel" className="font-mono text-[10px]">FUNNEL</TabsTrigger>
          <TabsTrigger value="advisor" className="font-mono text-[10px]">AI ADVISER</TabsTrigger>
          <TabsTrigger value="invites" className="font-mono text-[10px]">
            <Key className="h-3 w-3 mr-1" />INVITES
          </TabsTrigger>
          <TabsTrigger value="controls" className="font-mono text-[10px]">
            <Power className="h-3 w-3 mr-1" />CONTROLS
          </TabsTrigger>
        </TabsList>

        {/* Insights */}
        <TabsContent value="insights" className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {INSIGHTS.map((ins, i) => (
              <Card key={i} className="border-border bg-card">
                <CardContent className="p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <ins.icon className={cn("h-4 w-4", ins.color)} />
                    <span className="text-xs font-mono font-bold text-foreground">{ins.title}</span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground leading-relaxed">{ins.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Funnel */}
        <TabsContent value="funnel">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {FUNNEL.map((stage, i) => (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-foreground">{stage.stage}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">{stage.count.toLocaleString()} ({stage.pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", i === 0 ? "bg-primary" : i < 3 ? "bg-terminal-cyan" : "bg-terminal-green")}
                      style={{ width: `${stage.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Adviser */}
        <TabsContent value="advisor">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Brain className="h-4 w-4 text-terminal-cyan" /> SUPER ADVISER
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div ref={scrollRef} className="h-[280px] overflow-y-auto space-y-3 pr-1">
                {advisorMessages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="h-5 w-5 rounded-full bg-terminal-cyan/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Brain className="h-3 w-3 text-terminal-cyan" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[85%] rounded-lg px-3 py-2 text-xs font-mono",
                      msg.role === "user" ? "bg-primary/10 text-foreground" : "bg-muted/50 text-foreground"
                    )}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm prose-invert max-w-none [&_p]:text-xs [&_p]:font-mono [&_p]:text-foreground [&_p]:mb-1 [&_strong]:text-terminal-cyan [&_li]:text-xs [&_li]:font-mono">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <span>{msg.content}</span>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <UserIcon className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={e => { e.preventDefault(); sendToAdvisor(); }} className="flex gap-2">
                <input
                  value={advisorInput}
                  onChange={e => setAdvisorInput(e.target.value)}
                  placeholder="Ask your adviser..."
                  disabled={advisorStreaming}
                  className="flex-1 bg-muted/30 rounded-md px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-terminal-cyan/50 transition-colors"
                />
                <Button type="submit" size="icon" disabled={advisorStreaming || !advisorInput.trim()} className="h-8 w-8 shrink-0">
                  {advisorStreaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </form>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-1">
                {["What matters now?", "Revenue insights", "Growth opportunities", "Churn risks"].map(q => (
                  <button
                    key={q}
                    onClick={() => { setAdvisorInput(q); }}
                    className="text-[9px] font-mono px-2 py-1 rounded bg-muted/30 border border-border text-muted-foreground hover:text-foreground hover:border-terminal-cyan/30 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invite Codes */}
        <TabsContent value="invites">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Key className="h-4 w-4 text-terminal-amber" /> INVITE CODES
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InviteCodeManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Controls / Kill Switches */}
        <TabsContent value="controls">
          <Card className="border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono flex items-center gap-2">
                <Power className="h-4 w-4 text-terminal-red" /> PLATFORM CONTROLS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KillSwitchPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
