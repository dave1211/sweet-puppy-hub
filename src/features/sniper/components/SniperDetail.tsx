// Sniper Detail Panel — Full token analysis view
import { ExternalLink, Copy, Globe, Users, TrendingUp, Droplets, Brain, Clock } from "lucide-react";
import { toast } from "sonner";
import type { SniperToken } from "../types";
import { STATE_COLORS } from "../types";
import { PlatformLinks, PlatformBadge } from "@/components/terminal/PlatformLinks";
import { ScoreBreakdown } from "./ScoreBreakdown";
import { RiskPanel } from "./RiskPanel";

function formatAge(ms: number): string {
  const min = ms / 60_000;
  if (min < 60) return `${Math.floor(min)}m`;
  return `${Math.floor(min / 60)}h ${Math.floor(min % 60)}m`;
}

export function SniperDetail({ token: st }: { token: SniperToken | null }) {
  if (!st) {
    return (
      <div className="flex items-center justify-center h-full text-[10px] font-mono text-muted-foreground">
        ← Select a token to analyze
      </div>
    );
  }

  const { token, score, risk, state, smartMoneyEntries } = st;
  const age = Date.now() - token.pairCreatedAt;

  const copyAddress = () => {
    navigator.clipboard.writeText(token.address);
    toast.success("Address copied");
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-mono font-bold text-foreground">{token.symbol}</h3>
            <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${STATE_COLORS[state]}`}>{state}</span>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground">{token.name}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground transition-colors">
            <Copy className="h-3.5 w-3.5" />
          </button>
          <a href={token.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Address */}
      <div className="text-[9px] font-mono text-muted-foreground bg-muted/30 rounded px-2 py-1 truncate">
        {token.address}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Droplets, label: "LIQUIDITY", value: `$${token.liquidity >= 1000 ? (token.liquidity / 1000).toFixed(1) + "K" : token.liquidity.toFixed(0)}`, color: "text-terminal-blue" },
          { icon: TrendingUp, label: "VOLUME", value: `$${token.volume24h >= 1000 ? (token.volume24h / 1000).toFixed(1) + "K" : token.volume24h.toFixed(0)}`, color: "text-terminal-cyan" },
          { icon: Clock, label: "AGE", value: formatAge(age), color: "text-muted-foreground" },
          { icon: Users, label: "HOLDERS", value: String(token.holderCount), color: "text-terminal-green" },
          { icon: Brain, label: "SMART $", value: String(st.smartMoneyCount), color: "text-terminal-amber" },
          { icon: Globe, label: "DEX", value: token.dexId, color: "text-muted-foreground" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-muted/20 border border-border rounded px-2 py-1.5">
            <div className="flex items-center gap-1 mb-0.5">
              <Icon className={`h-2.5 w-2.5 ${color}`} />
              <span className="text-[7px] font-mono text-muted-foreground">{label}</span>
            </div>
            <div className={`text-[10px] font-mono font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Trade Stats */}
      <div className="bg-muted/20 border border-border rounded p-2">
        <div className="text-[8px] font-mono text-muted-foreground mb-1.5">TRADE ACTIVITY</div>
        <div className="grid grid-cols-4 gap-2 text-[9px] font-mono">
          <div><span className="text-muted-foreground block text-[7px]">BUYS</span><span className="text-terminal-green font-bold">{token.buyCount}</span></div>
          <div><span className="text-muted-foreground block text-[7px]">SELLS</span><span className="text-terminal-red font-bold">{token.sellCount}</span></div>
          <div><span className="text-muted-foreground block text-[7px]">RATIO</span><span className="text-foreground font-bold">{(token.buyCount / Math.max(1, token.buyCount + token.sellCount) * 100).toFixed(0)}%</span></div>
          <div><span className="text-muted-foreground block text-[7px]">TOP %</span><span className={`font-bold ${token.topHolderPct > 30 ? "text-terminal-red" : "text-terminal-green"}`}>{token.topHolderPct.toFixed(1)}%</span></div>
        </div>
        <div className="mt-1.5 h-2 bg-muted/30 rounded-full overflow-hidden flex">
          <div className="h-full bg-terminal-green" style={{ width: `${(token.buyCount / Math.max(1, token.txCount)) * 100}%` }} />
          <div className="h-full bg-terminal-red" style={{ width: `${(token.sellCount / Math.max(1, token.txCount)) * 100}%` }} />
        </div>
      </div>

      {/* Score & Risk */}
      <div className="bg-muted/20 border border-border rounded p-2">
        <ScoreBreakdown score={score} />
      </div>

      <div className="bg-muted/20 border border-border rounded p-2">
        <RiskPanel risk={risk} />
      </div>

      {/* Smart Money Entries */}
      {smartMoneyEntries.length > 0 && (
        <div className="bg-muted/20 border border-border rounded p-2">
          <div className="text-[9px] font-mono text-muted-foreground mb-1.5">SMART MONEY ACTIVITY</div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {smartMoneyEntries.map((entry, i) => (
              <div key={i} className="flex items-center justify-between text-[9px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className={entry.action === "buy" ? "text-terminal-green" : "text-terminal-red"}>
                    {entry.action === "buy" ? "BUY" : "SELL"}
                  </span>
                  <span className="text-muted-foreground">{entry.walletLabel}</span>
                </div>
                <span className="text-foreground">{entry.amount.toFixed(2)} SOL</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      {(token.metadata.website || token.metadata.twitter || token.metadata.telegram) && (
        <div className="bg-muted/20 border border-border rounded p-2">
          <div className="text-[8px] font-mono text-muted-foreground mb-1">LINKS</div>
          <div className="flex flex-wrap gap-1.5">
            {token.metadata.website && (
              <a href={token.metadata.website} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-primary hover:underline">🌐 Website</a>
            )}
            {token.metadata.twitter && (
              <span className="text-[9px] font-mono text-terminal-cyan">𝕏 {token.metadata.twitter}</span>
            )}
            {token.metadata.telegram && (
              <span className="text-[9px] font-mono text-terminal-blue">📱 {token.metadata.telegram}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
