import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { mockTokens, formatPrice } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Star, Plus, Tag, Bell, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const WATCHLISTS = [
  { id: "default", name: "Default", tokens: mockTokens.slice(0, 5) },
  { id: "launches", name: "New Launches", tokens: mockTokens.filter(t => t.status === "new") },
  { id: "whales", name: "Whale Targets", tokens: mockTokens.filter(t => t.signalScore > 80) },
];

export default function WatchlistPage() {
  const [activeList, setActiveList] = useState("default");
  const currentList = WATCHLISTS.find(w => w.id === activeList) ?? WATCHLISTS[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">WATCHLIST</h1>
          <p className="text-xs font-mono text-muted-foreground">Organize and track your favorite tokens</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary/10 text-primary text-xs font-mono border border-primary/30 hover:bg-primary/20 transition-colors">
          <Plus className="h-3.5 w-3.5" /> NEW LIST
        </button>
      </div>

      {/* List tabs */}
      <div className="flex gap-1.5">
        {WATCHLISTS.map(w => (
          <button key={w.id} onClick={() => setActiveList(w.id)} className={cn("px-3 py-1.5 rounded text-xs font-mono border transition-colors", activeList === w.id ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border hover:text-foreground")}>
            {w.name} ({w.tokens.length})
          </button>
        ))}
      </div>

      <PanelShell title={currentList.name} subtitle={`${currentList.tokens.length} tokens`} noPad>
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th className="text-left p-3">TOKEN</th>
              <th className="text-right p-3">PRICE</th>
              <th className="text-right p-3">24H</th>
              <th className="text-center p-3 hidden md:table-cell">AI SCORE</th>
              <th className="text-center p-3 hidden md:table-cell">RISK</th>
              <th className="text-center p-3 hidden lg:table-cell">ALERTS</th>
              <th className="text-center p-3 w-20">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {currentList.tokens.map(t => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="p-3">
                  <Link to={`/token/${t.id}`} className="flex items-center gap-2 hover:text-primary">
                    <Star className="h-3.5 w-3.5 text-terminal-amber fill-terminal-amber" />
                    <div>
                      <p className="font-medium text-foreground">{t.symbol}</p>
                      <p className="text-[9px] text-muted-foreground">{t.chain}</p>
                    </div>
                  </Link>
                </td>
                <td className="p-3 text-right text-foreground">{formatPrice(t.price)}</td>
                <td className={cn("p-3 text-right", t.change24h >= 0 ? "text-terminal-green" : "text-destructive")}>{t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%</td>
                <td className="p-3 hidden md:table-cell"><ScoreMeter value={t.signalScore} size="sm" /></td>
                <td className="p-3 text-center hidden md:table-cell">
                  <StatusChip variant={t.riskScore < 25 ? "success" : t.riskScore < 50 ? "warning" : "danger"}>{t.riskScore}</StatusChip>
                </td>
                <td className="p-3 text-center hidden lg:table-cell">
                  <StatusChip variant="muted">2 active</StatusChip>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-center gap-1">
                    <button className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground"><Bell className="h-3 w-3" /></button>
                    <button className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </PanelShell>
    </div>
  );
}
