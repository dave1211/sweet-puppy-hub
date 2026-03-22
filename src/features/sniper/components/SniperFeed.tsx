// Sniper Feed — Live token list with real-time scoring
import { useSniperStore } from "../stores/sniperStore";
import { STATE_COLORS, SCORE_COLORS, RISK_COLORS } from "../types";
import type { SniperToken } from "../types";
import { Users, TrendingUp, Droplets, Brain } from "lucide-react";

function formatAge(pairCreatedAt: number): string {
  const min = (Date.now() - pairCreatedAt) / 60_000;
  if (min < 1) return "<1m";
  if (min < 60) return `${Math.floor(min)}m`;
  if (min < 1440) return `${Math.floor(min / 60)}h`;
  return `${Math.floor(min / 1440)}d`;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

function TokenRow({ st, isSelected, onClick }: { st: SniperToken; isSelected: boolean; onClick: () => void }) {
  const { token, score, risk, state, smartMoneyCount, whaleCount, momentumDelta } = st;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-2.5 py-2 border-b border-border/50 transition-colors hover:bg-muted/30 ${
        isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono font-bold text-foreground">{token.symbol}</span>
          <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${STATE_COLORS[state]}`}>
            {state}
          </span>
        </div>
        <span className="text-[9px] font-mono text-muted-foreground">{formatAge(token.pairCreatedAt)}</span>
      </div>

      <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
        <div className="flex items-center gap-1">
          <Droplets className="h-2.5 w-2.5 text-terminal-blue" />
          <span className="text-muted-foreground">${formatNum(token.liquidity)}</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="h-2.5 w-2.5 text-terminal-cyan" />
          <span className="text-muted-foreground">${formatNum(token.volume24h)}</span>
        </div>
        <div className={`font-bold ${SCORE_COLORS[score.band]}`}>
          {score.total}
        </div>
        <div className={`font-bold ${RISK_COLORS[risk.band]}`}>
          R:{risk.total}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <div className="flex items-center gap-0.5 text-[8px] font-mono text-muted-foreground">
          <Users className="h-2.5 w-2.5" />
          {token.holderCount}
        </div>
        {smartMoneyCount > 0 && (
          <div className="flex items-center gap-0.5 text-[8px] font-mono text-terminal-cyan">
            <Brain className="h-2.5 w-2.5" />
            {smartMoneyCount}
          </div>
        )}
        {whaleCount > 0 && (
          <span className="text-[8px] font-mono text-terminal-amber">🐋{whaleCount}</span>
        )}
        {momentumDelta > 20 && (
          <span className="text-[8px] font-mono text-terminal-green">🚀</span>
        )}
        {token.change24h > 0 ? (
          <span className="text-[8px] font-mono text-terminal-green ml-auto">+{token.change24h.toFixed(0)}%</span>
        ) : (
          <span className="text-[8px] font-mono text-terminal-red ml-auto">{token.change24h.toFixed(0)}%</span>
        )}
      </div>
    </button>
  );
}

export function SniperFeed({ tokens }: { tokens: SniperToken[] }) {
  const { selectedAddress, selectToken } = useSniperStore();

  if (tokens.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-[10px] font-mono text-muted-foreground">
        No tokens match filters
      </div>
    );
  }

  return (
    <div className="overflow-y-auto flex-1">
      {tokens.map((st) => (
        <TokenRow
          key={st.token.address}
          st={st}
          isSelected={selectedAddress === st.token.address}
          onClick={() => selectToken(st.token.address)}
        />
      ))}
    </div>
  );
}
