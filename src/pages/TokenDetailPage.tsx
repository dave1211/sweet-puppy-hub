import { useParams, Link } from "react-router-dom";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { mockTokens, formatPrice, formatVolume, formatNumber } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { ArrowLeft, Star, Bell, Copy, ExternalLink, Shield, Zap, TrendingUp, Users, Code, Activity } from "lucide-react";
import { useState } from "react";

const TABS = ["Overview", "Price Action", "Holders", "Smart Money", "Whale Activity", "Contract Risk", "Notes"];

const BADGES = [
  { label: "Fresh Launch", condition: (t: any) => t.status === "new", variant: "info" as const },
  { label: "Whale Inflow", condition: (t: any) => t.signalScore > 80, variant: "success" as const },
  { label: "Liquidity Stable", condition: (t: any) => t.liquidity > 5_000_000, variant: "success" as const },
  { label: "Contract Risk", condition: (t: any) => t.riskScore > 60, variant: "danger" as const },
  { label: "High Volatility", condition: (t: any) => Math.abs(t.change24h) > 50, variant: "warning" as const },
  { label: "Possible Rug", condition: (t: any) => t.status === "rug_risk", variant: "danger" as const },
  { label: "Sniper Ready", condition: (t: any) => t.signalScore > 85, variant: "info" as const },
];

export default function TokenDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");
  const token = mockTokens.find(t => t.id === id) ?? mockTokens[0];
  const activeBadges = BADGES.filter(b => b.condition(token));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/live-pairs" className="p-2 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-mono font-bold text-primary">{token.symbol.slice(0, 2)}</div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-mono font-bold text-foreground">{token.name}</h1>
                <span className="text-sm font-mono text-muted-foreground">{token.symbol}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <span>{token.chain}</span>
                <span>·</span>
                <span>{token.contractAddress}</span>
                <button className="text-primary hover:text-primary/80"><Copy className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="p-2 rounded hover:bg-muted/50 text-muted-foreground hover:text-terminal-amber transition-colors"><Star className="h-4 w-4" /></button>
          <button className="p-2 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"><Bell className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Badges */}
      <div className="flex gap-1.5 flex-wrap">
        {activeBadges.map(b => <StatusChip key={b.label} variant={b.variant} dot>{b.label}</StatusChip>)}
      </div>

      {/* Price + stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="terminal-panel p-3 col-span-2">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Price</p>
          <p className="text-2xl font-mono font-bold text-foreground">{formatPrice(token.price)}</p>
          <p className={cn("text-sm font-mono", token.change24h >= 0 ? "text-terminal-green" : "text-destructive")}>
            {token.change24h >= 0 ? "+" : ""}{token.change24h.toFixed(2)}% <span className="text-muted-foreground text-[10px]">24h</span>
          </p>
        </div>
        {[
          { label: "Market Cap", value: formatVolume(token.mcap) },
          { label: "FDV", value: formatVolume(token.fdv ?? token.mcap) },
          { label: "Liquidity", value: formatVolume(token.liquidity) },
          { label: "Volume 24h", value: formatVolume(token.volume) },
          { label: "Pair Age", value: token.pairAge },
          { label: "Holders", value: formatNumber(token.holders) },
        ].map(s => (
          <div key={s.label} className="terminal-panel p-3">
            <p className="text-[9px] font-mono text-muted-foreground uppercase">{s.label}</p>
            <p className="text-sm font-mono font-bold text-foreground mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="terminal-panel p-4">
          <p className="text-[9px] font-mono text-muted-foreground uppercase mb-2">Buy / Sell Ratio</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                <div className="h-full bg-terminal-green" style={{ width: `${(token.buys / (token.buys + token.sells)) * 100}%` }} />
                <div className="h-full bg-destructive flex-1" />
              </div>
            </div>
            <span className="text-xs font-mono text-foreground">{(token.buys / token.sells).toFixed(1)}:1</span>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground mt-1">
            <span className="text-terminal-green">{formatNumber(token.buys)} buys</span>
            <span className="text-destructive">{formatNumber(token.sells)} sells</span>
          </div>
        </div>
        <div className="terminal-panel p-4">
          <p className="text-[9px] font-mono text-muted-foreground uppercase mb-2">Safety Score</p>
          <ScoreMeter value={100 - token.riskScore} label="" size="md" />
          <p className="text-[10px] text-muted-foreground mt-2">Contract safety evaluation</p>
        </div>
        <div className="terminal-panel p-4">
          <p className="text-[9px] font-mono text-muted-foreground uppercase mb-2">AI Confidence</p>
          <ScoreMeter value={token.signalScore} label="" size="md" />
          <p className="text-[10px] text-muted-foreground mt-2">Sniper readiness: {token.signalScore >= 85 ? "READY" : "STANDBY"}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border pb-0 overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-3 py-2 text-xs font-mono transition-colors border-b-2 shrink-0", activeTab === tab ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground")}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <PanelShell title={activeTab}>
        {activeTab === "Overview" && (
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>{token.name} ({token.symbol}) is a {token.chain}-based token with a market cap of {formatVolume(token.mcap)} and daily volume of {formatVolume(token.volume)}.</p>
            <p>The token has {formatNumber(token.holders)} holders and a pair age of {token.pairAge}. Current risk assessment: {token.riskScore < 25 ? "Low risk" : token.riskScore < 50 ? "Moderate risk" : "High risk"}.</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded bg-muted/30">
                <p className="text-[9px] uppercase text-muted-foreground mb-1">5m Change</p>
                <p className={cn("text-sm font-mono font-bold", token.change5m >= 0 ? "text-terminal-green" : "text-destructive")}>{token.change5m >= 0 ? "+" : ""}{token.change5m.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded bg-muted/30">
                <p className="text-[9px] uppercase text-muted-foreground mb-1">1h Change</p>
                <p className={cn("text-sm font-mono font-bold", token.change1h >= 0 ? "text-terminal-green" : "text-destructive")}>{token.change1h >= 0 ? "+" : ""}{token.change1h.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        )}
        {activeTab !== "Overview" && (
          <div className="py-8 text-center text-muted-foreground text-sm">
            <p className="font-mono">{activeTab} data will be available when connected to live feeds.</p>
          </div>
        )}
      </PanelShell>
    </div>
  );
}
