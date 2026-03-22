import { TrendingUp, TrendingDown, Users, DollarSign, BarChart3, Droplets, Rocket, Zap, Shield, Vote, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTannerTokenStats } from "@/hooks/useTannerTokenStats";
import { Skeleton } from "@/components/ui/skeleton";

function fmt(n: number): string { if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`; if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`; if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`; return `$${n.toFixed(2)}`; }

type PhaseStatus = "done" | "in-progress" | "upcoming";
interface Phase { id: number; title: string; status: PhaseStatus; items: string[]; icon: React.ReactNode; }
const PHASES: Phase[] = [
  { id: 1, title: "Foundation", status: "done", icon: <Rocket className="h-4 w-4" />, items: ["Token launch on pump.fun", "Website & terminal live", "Community channels open", "Initial liquidity deployed"] },
  { id: 2, title: "Growth", status: "in-progress", icon: <Zap className="h-4 w-4" />, items: ["CoinGecko / CMC listing", "1,000 holders milestone", "Smart-money signal engine", "Influencer partnerships"] },
  { id: 3, title: "Utility", status: "upcoming", icon: <Shield className="h-4 w-4" />, items: ["Staking rewards program", "Premium terminal access via $TANNER", "Rug-guard on-chain scanner", "Auto-sniper for holders"] },
  { id: 4, title: "Ecosystem", status: "upcoming", icon: <Globe className="h-4 w-4" />, items: ["CEX listing push", "Cross-chain bridge", "SDK for third-party tools", "Revenue sharing for holders"] },
  { id: 5, title: "Governance", status: "upcoming", icon: <Vote className="h-4 w-4" />, items: ["DAO launch", "Community-driven roadmap", "Treasury management votes", "Grant program for builders"] },
];
const STATUS_STYLES: Record<PhaseStatus, string> = { done: "bg-terminal-green/15 text-terminal-green border-terminal-green/40", "in-progress": "bg-amber-500/15 text-amber-400 border-amber-500/40", upcoming: "bg-muted text-muted-foreground border-border" };
const STATUS_LABEL: Record<PhaseStatus, string> = { done: "DONE", "in-progress": "🔥 IN PROGRESS", upcoming: "UPCOMING" };
const CARD_BORDER: Record<PhaseStatus, string> = { done: "border-terminal-green/30", "in-progress": "border-amber-500/40", upcoming: "border-border" };
const MILESTONES = [{ label: "Token Launch", target: 1, current: 1, done: true }, { label: "500 Holders", target: 500, current: 500, done: true }, { label: "1,000 Holders", target: 1000, current: 720, done: false }, { label: "CoinGecko Listing", target: 1, current: 0, done: false }];

function StatCard({ icon, label, value, sub, loading }: { icon: React.ReactNode; label: string; value: string; sub?: React.ReactNode; loading?: boolean }) {
  return <Card className="border-border bg-card"><CardContent className="p-4"><div className="flex items-center gap-2 mb-1">{icon}<span className="text-[10px] font-mono uppercase text-muted-foreground">{label}</span></div>{loading ? <Skeleton className="h-6 w-24 mt-1" /> : <p className="font-mono text-lg font-bold">{value}</p>}{sub && <div className="mt-0.5">{sub}</div>}</CardContent></Card>;
}

export default function Token() {
  const { data, isLoading } = useTannerTokenStats();
  const isPositive = (data?.priceChange24h ?? 0) > 0;
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1"><h1 className="font-mono text-2xl md:text-3xl font-bold tracking-tight"><span className="text-foreground">$</span><span className="text-primary">TANNER</span></h1><p className="text-xs font-mono text-muted-foreground">The token powering Tanner Terminal</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={<DollarSign className="h-3.5 w-3.5 text-primary" />} label="Price" value={data ? `$${data.price < 0.01 ? data.price.toFixed(8) : data.price.toFixed(4)}` : "—"} loading={isLoading} sub={data && <span className={`text-[10px] font-mono flex items-center gap-0.5 ${isPositive ? "text-terminal-green" : "text-terminal-red"}`}>{isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{isPositive ? "+" : ""}{data.priceChange24h.toFixed(2)}%</span>} />
        <StatCard icon={<BarChart3 className="h-3.5 w-3.5 text-terminal-cyan" />} label="Market Cap" value={data ? fmt(data.marketCap) : "—"} loading={isLoading} />
        <StatCard icon={<Droplets className="h-3.5 w-3.5 text-terminal-blue" />} label="Liquidity" value={data ? fmt(data.liquidity) : "—"} loading={isLoading} />
        <StatCard icon={<Users className="h-3.5 w-3.5 text-terminal-yellow" />} label="24h Volume" value={data ? fmt(data.volume24h) : "—"} loading={isLoading} />
      </div>
      <section className="space-y-3"><h2 className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Rocket className="h-4 w-4 text-primary" />Roadmap</h2><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{PHASES.map((phase) => (<Card key={phase.id} className={`border bg-card ${CARD_BORDER[phase.status]}`}><CardContent className="p-4 space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="text-primary">{phase.icon}</span><span className="font-mono text-xs font-bold">Phase {phase.id}: {phase.title}</span></div><Badge variant="outline" className={`text-[9px] font-mono ${STATUS_STYLES[phase.status]}`}>{STATUS_LABEL[phase.status]}</Badge></div><ul className="space-y-1.5">{phase.items.map((item) => (<li key={item} className="flex items-start gap-2 text-[11px] font-mono text-muted-foreground"><span className={phase.status === "done" ? "text-terminal-green" : "text-muted-foreground/40"}>{phase.status === "done" ? "✓" : "○"}</span>{item}</li>))}</ul></CardContent></Card>))}</div></section>
      <section className="space-y-3"><h2 className="font-mono text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><Zap className="h-4 w-4 text-terminal-yellow" />Community Milestones</h2><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{MILESTONES.map((m) => (<Card key={m.label} className="border-border bg-card"><CardContent className="p-3 space-y-1.5"><div className="flex items-center justify-between"><span className="font-mono text-[11px] font-medium">{m.label}</span>{m.done && <Badge variant="outline" className="text-[8px] font-mono bg-terminal-green/15 text-terminal-green border-terminal-green/40">✓ DONE</Badge>}</div><Progress value={m.done ? 100 : Math.min((m.current / m.target) * 100, 100)} className="h-1.5" />{!m.done && <p className="text-[9px] font-mono text-muted-foreground">{m.current.toLocaleString()} / {m.target.toLocaleString()}</p>}</CardContent></Card>))}</div></section>
    </div>
  );
}