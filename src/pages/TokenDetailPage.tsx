import { useParams, Link } from "react-router-dom";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { MiniChart } from "@/components/shared/MiniChart";
import { formatPrice, formatVolume, pairAge } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { ArrowLeft, Star, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";
import { useNewLaunches } from "@/hooks/useNewLaunches";
import { assessRug } from "@/hooks/useRugDetection";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useLivePriceTicks } from "@/hooks/useLivePriceTicks";
import { toast } from "sonner";

const TABS = ["Overview", "Price Action", "Risk Analysis", "Smart Money", "Notes"];

export default function TokenDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");
  const { tokens } = useUnifiedSignals();
  const { data: launches } = useNewLaunches();
  const { addItem } = useWatchlist();
  const { data: priceData } = useTokenPrices(id ? [id] : []);
  const liveTicks = useLivePriceTicks(15_000);

  const signal = tokens.find(t => t.address === id);
  const launch = (launches ?? []).find(t => t.address === id);
  const token = signal ?? launch;
  const price = priceData?.[id ?? ""];

  if (!token) {
    return (
      <div className="space-y-4">
        <Link to="/live-pairs" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs font-mono">
          <ArrowLeft className="h-4 w-4" /> Back to Live Pairs
        </Link>
        <div className="text-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-3" />
          <p className="text-xs font-mono text-muted-foreground">Loading token data for {id?.slice(0, 8)}…</p>
          <p className="text-[10px] text-muted-foreground mt-2">If this persists, the token may not be in current feeds.</p>
        </div>
      </div>
    );
  }

  const rug = assessRug({ liquidity: token.liquidity, volume24h: token.volume24h, change24h: token.change24h, pairCreatedAt: token.pairCreatedAt });
  const displayPrice = price?.price ?? token.price;
  const displayChange = price?.change24h ?? token.change24h;

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-start sm:items-center gap-2 sm:gap-3">
        <Link to="/live-pairs" className="p-1.5 sm:p-2 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-xs sm:text-sm font-mono font-bold text-primary shrink-0">{token.symbol.slice(0, 2)}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-mono font-bold text-foreground truncate">{token.name}</h1>
                <span className="text-xs sm:text-sm font-mono text-muted-foreground">{token.symbol}</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[9px] sm:text-[10px] font-mono text-muted-foreground flex-wrap">
                <span>{token.dexId}</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline">{token.address.slice(0, 12)}…{token.address.slice(-4)}</span>
                <button onClick={() => { navigator.clipboard.writeText(token.address); toast.success("Copied!"); }} className="text-primary hover:text-primary/80"><Copy className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        </div>
        <button onClick={() => addItem.mutate({ address: token.address, label: token.symbol })} className="p-2 rounded hover:bg-muted/50 text-muted-foreground hover:text-terminal-amber transition-colors shrink-0"><Star className="h-4 w-4" /></button>
      </div>

      {/* Badges */}
      <div className="flex gap-1 sm:gap-1.5 flex-wrap">
        {signal && <StatusChip variant={signal.label === "HIGH SIGNAL" ? "success" : "info"} dot>{signal.label}</StatusChip>}
        <StatusChip variant={rug.level === "low" ? "success" : rug.level === "watch" ? "warning" : "danger"}>{rug.label}</StatusChip>
        {rug.flags.map(f => <StatusChip key={f.id} variant="warning">{f.label}</StatusChip>)}
        {signal?.sniperType && <StatusChip variant="info">{signal.sniperType === "sniper" ? "Sniper" : "Early Accum."}</StatusChip>}
        {signal?.whaleCount && signal.whaleCount > 0 && <StatusChip variant="success">Whale ×{signal.whaleCount}</StatusChip>}
      </div>

      {/* Price chart */}
      <PanelShell title="Price Action" subtitle={`${token.symbol} / USD`}>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-xl sm:text-2xl font-mono font-bold text-foreground">{formatPrice(displayPrice)}</p>
            <p className={cn("text-xs sm:text-sm font-mono", displayChange >= 0 ? "text-terminal-green" : "text-destructive")}>
              {displayChange >= 0 ? "+" : ""}{displayChange.toFixed(2)}%
              <span className="text-muted-foreground text-[10px] ml-1">24h</span>
            </p>
          </div>
        </div>
        <MiniChart baseValue={displayPrice} change={displayChange} height={140} />
      </PanelShell>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="terminal-panel p-3">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Liquidity</p>
          <p className="text-sm font-mono font-bold text-foreground mt-1">{formatVolume(token.liquidity)}</p>
        </div>
        <div className="terminal-panel p-3">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Volume 24h</p>
          <p className="text-sm font-mono font-bold text-foreground mt-1">{formatVolume(token.volume24h)}</p>
        </div>
        <div className="terminal-panel p-3">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">Pair Age</p>
          <p className="text-sm font-mono font-bold text-foreground mt-1">{pairAge(token.pairCreatedAt)}</p>
        </div>
        <div className="terminal-panel p-3">
          <p className="text-[9px] font-mono text-muted-foreground uppercase">DEX</p>
          <p className="text-sm font-mono font-bold text-foreground mt-1">{token.dexId}</p>
        </div>
      </div>

      {/* Scores */}
      {signal && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="terminal-panel p-3 sm:p-4">
            <p className="text-[9px] font-mono text-muted-foreground uppercase mb-2">Signal Score</p>
            <ScoreMeter value={signal.score} label="" size="md" />
            <div className="flex gap-1 flex-wrap mt-2">
              {signal.factors.map(f => <span key={f} className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.5 rounded bg-primary/5 text-primary/80">{f}</span>)}
            </div>
          </div>
          <div className="terminal-panel p-3 sm:p-4">
            <p className="text-[9px] font-mono text-muted-foreground uppercase mb-2">Safety Assessment</p>
            <ScoreMeter value={Math.max(0, 100 - rug.flags.length * 25)} label="" size="md" />
            <p className="text-[10px] text-muted-foreground mt-2">{rug.flags.length === 0 ? "No risk flags detected" : `${rug.flags.length} risk flag(s) identified`}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0.5 sm:gap-1 border-b border-border pb-0 overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={cn("px-2 sm:px-3 py-2 text-[10px] sm:text-xs font-mono transition-colors border-b-2 shrink-0 whitespace-nowrap", activeTab === tab ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground")}>
            {tab}
          </button>
        ))}
      </div>

      <PanelShell title={activeTab}>
        {activeTab === "Overview" && (
          <div className="space-y-3 text-xs sm:text-sm text-muted-foreground">
            <p>{token.name} ({token.symbol}) is traded on {token.dexId} with {formatVolume(token.liquidity)} liquidity and {formatVolume(token.volume24h)} daily volume.</p>
            <p>The pair was created {pairAge(token.pairCreatedAt)} ago. Risk assessment: {rug.label}.</p>
            <a href={token.url} target="_blank" rel="noopener noreferrer" className="text-primary text-xs font-mono hover:underline block">View on DEX →</a>
          </div>
        )}
        {activeTab === "Price Action" && (
          <div className="space-y-4">
            <MiniChart baseValue={displayPrice} change={displayChange} height={200} label="24H PRICE" />
            <MiniChart baseValue={token.volume24h} change={0} height={80} type="bar" label="VOLUME" />
          </div>
        )}
        {activeTab === "Risk Analysis" && (
          <div className="space-y-3">
            {rug.flags.length === 0 ? (
              <p className="text-xs text-terminal-green">No risk flags detected for this token.</p>
            ) : (
              rug.flags.map(f => (
                <div key={f.id} className="flex items-center gap-2 p-2 rounded bg-destructive/5 border border-destructive/10">
                  <span className="text-xs font-mono text-foreground">{f.label}</span>
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === "Smart Money" && signal ? (
          <div className="space-y-3 text-xs sm:text-sm text-muted-foreground">
            <p>Wallet count: {signal.walletCount} | Wallet touches: {signal.walletTouches}</p>
            {signal.sniperType && <p>Sniper type: {signal.sniperType}</p>}
            {signal.whaleCount > 0 && <p>Whale interest: {signal.whaleCount} whale(s) active</p>}
          </div>
        ) : activeTab === "Smart Money" ? (
          <p className="text-xs text-muted-foreground py-4">No smart money data available for this token.</p>
        ) : null}
        {activeTab === "Notes" && (
          <p className="text-xs text-muted-foreground py-4">Notes feature coming soon. Track this token by adding it to your watchlist.</p>
        )}
      </PanelShell>
    </div>
  );
}
