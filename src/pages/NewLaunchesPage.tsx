import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { mockTokens, formatPrice, formatVolume } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Rocket, Crosshair, Eye, Shield } from "lucide-react";
import { Link } from "react-router-dom";

const AGE_BUCKETS = ["All", "< 5m", "< 15m", "< 1h", "< 6h", "< 24h"];

const newTokens = [
  { ...mockTokens[3], pairAge: "3m", launchAge: 3 },
  { ...mockTokens[10], pairAge: "12m", launchAge: 12 },
  { id: "n1", name: "SolPump", symbol: "SPUMP", chain: "SOL", price: 0.000234, change5m: 45.2, change1h: 0, change24h: 0, volume: 2_300_000, liquidity: 340_000, mcap: 234_000, pairAge: "2m", buys: 890, sells: 45, holders: 234, riskScore: 58, signalScore: 82, status: "new" as const, launchAge: 2 },
  { id: "n2", name: "MegaAI", symbol: "MAI", chain: "ETH", price: 0.0567, change5m: 12.3, change1h: 0, change24h: 0, volume: 890_000, liquidity: 450_000, mcap: 567_000, pairAge: "8m", buys: 340, sells: 23, holders: 123, riskScore: 42, signalScore: 76, status: "new" as const, launchAge: 8 },
  { id: "n3", name: "DogMoon", symbol: "DMOON", chain: "SOL", price: 0.0000123, change5m: 234.5, change1h: 0, change24h: 0, volume: 560_000, liquidity: 89_000, mcap: 123_000, pairAge: "45s", buys: 456, sells: 12, holders: 89, riskScore: 78, signalScore: 88, status: "new" as const, launchAge: 0.75 },
  { id: "n4", name: "VaultAI", symbol: "VAI", chain: "ETH", price: 0.234, change5m: 8.9, change1h: 0, change24h: 0, volume: 1_200_000, liquidity: 890_000, mcap: 2_340_000, pairAge: "3h", buys: 1200, sells: 340, holders: 567, riskScore: 25, signalScore: 71, status: "new" as const, launchAge: 180 },
];

export default function NewLaunchesPage() {
  const [ageBucket, setAgeBucket] = useState("All");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">NEW LAUNCHES</h1>
          <p className="text-xs font-mono text-muted-foreground">Freshly launched tokens across all chains</p>
        </div>
        <StatusChip variant="success" dot>SCANNING</StatusChip>
      </div>

      {/* Age filter */}
      <div className="flex gap-1.5 flex-wrap">
        {AGE_BUCKETS.map(b => (
          <button key={b} onClick={() => setAgeBucket(b)} className={cn("px-3 py-1.5 rounded text-[10px] font-mono transition-colors border", ageBucket === b ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border hover:text-foreground")}>
            {b}
          </button>
        ))}
      </div>

      {/* Launch cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {newTokens.map(t => (
          <div key={t.id} className="terminal-panel p-4 space-y-3 hover:border-primary/20 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-mono font-bold text-primary">{t.symbol.slice(0, 2)}</div>
                <div>
                  <p className="text-sm font-mono font-bold text-foreground">{t.symbol}</p>
                  <p className="text-[10px] text-muted-foreground">{t.name} · {t.chain}</p>
                </div>
              </div>
              <StatusChip variant="info">{t.pairAge} OLD</StatusChip>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Price</p>
                <p className="text-xs font-mono font-medium text-foreground">{formatPrice(t.price)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Volume</p>
                <p className="text-xs font-mono font-medium text-foreground">{formatVolume(t.volume)}</p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground uppercase">Liq</p>
                <p className="text-xs font-mono font-medium text-foreground">{formatVolume(t.liquidity)}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <ScoreMeter value={t.signalScore} label="SIGNAL" size="sm" />
              <ScoreMeter value={100 - t.riskScore} label="SAFETY" size="sm" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>B:{t.buys}</span>
                <span>S:{t.sells}</span>
                <span>H:{t.holders}</span>
              </div>
              <div className="flex gap-1.5">
                <Link to={`/token/${t.id}`} className="p-1.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                  <Eye className="h-3.5 w-3.5" />
                </Link>
                <button className="p-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                  <Crosshair className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
