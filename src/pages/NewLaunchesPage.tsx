import { useState } from "react";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { formatPrice, formatVolume, pairAge } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Rocket, Crosshair, Eye, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useNewLaunches } from "@/hooks/useNewLaunches";
import { assessRug } from "@/hooks/useRugDetection";

const AGE_BUCKETS = ["All", "< 5m", "< 15m", "< 1h", "< 6h", "< 24h"];

export default function NewLaunchesPage() {
  const [ageBucket, setAgeBucket] = useState("All");
  const { data: launches, isLoading } = useNewLaunches();

  const filtered = (launches ?? []).filter(t => {
    if (ageBucket === "All") return true;
    const ageMs = Date.now() - t.pairCreatedAt;
    const ageMin = ageMs / 60_000;
    if (ageBucket === "< 5m") return ageMin < 5;
    if (ageBucket === "< 15m") return ageMin < 15;
    if (ageBucket === "< 1h") return ageMin < 60;
    if (ageBucket === "< 6h") return ageMin < 360;
    if (ageBucket === "< 24h") return ageMin < 1440;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-mono font-bold text-foreground">NEW LAUNCHES</h1>
          <p className="text-xs font-mono text-muted-foreground">Freshly launched tokens from pump.fun, DexScreener & more</p>
        </div>
        <StatusChip variant="success" dot>SCANNING</StatusChip>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {AGE_BUCKETS.map(b => (
          <button key={b} onClick={() => setAgeBucket(b)} className={cn("px-3 py-1.5 rounded text-[10px] font-mono transition-colors border", ageBucket === b ? "bg-primary/10 text-primary border-primary/30" : "bg-muted/30 text-muted-foreground border-border hover:text-foreground")}>
            {b}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-xs font-mono text-muted-foreground">Scanning for new launches…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Rocket className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs font-mono text-muted-foreground">No launches found in this time range</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(t => {
            const risk = assessRug({ liquidity: t.liquidity, volume24h: t.volume24h, change24h: t.change24h, pairCreatedAt: t.pairCreatedAt });
            return (
              <div key={t.address} className="terminal-panel p-4 space-y-3 hover:border-primary/20 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-mono font-bold text-primary">{t.symbol.slice(0, 2)}</div>
                    <div>
                      <p className="text-sm font-mono font-bold text-foreground">{t.symbol}</p>
                      <p className="text-[10px] text-muted-foreground">{t.name} · {t.dexId}</p>
                    </div>
                  </div>
                  <StatusChip variant="info">{pairAge(t.pairCreatedAt)} OLD</StatusChip>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">Price</p>
                    <p className="text-xs font-mono font-medium text-foreground">{formatPrice(t.price)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">Volume</p>
                    <p className="text-xs font-mono font-medium text-foreground">{formatVolume(t.volume24h)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-muted-foreground uppercase">Liq</p>
                    <p className="text-xs font-mono font-medium text-foreground">{formatVolume(t.liquidity)}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <ScoreMeter value={100 - (risk.flags.length * 25)} label="SAFETY" size="sm" />
                </div>

                {risk.flags.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {risk.flags.map(f => <StatusChip key={f.id} variant="warning">{f.label}</StatusChip>)}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <StatusChip variant={risk.level === "low" ? "success" : risk.level === "watch" ? "warning" : "danger"}>{risk.label}</StatusChip>
                  <div className="flex gap-1.5">
                    <Link to={`/token/${t.address}`} className="p-1.5 rounded bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                      <Eye className="h-3.5 w-3.5" />
                    </Link>
                    <a href={t.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                      <Crosshair className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
