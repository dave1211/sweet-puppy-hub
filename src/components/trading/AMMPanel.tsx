import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAMMStore } from "@/stores/ammStore";
import { useMarketStore } from "@/stores/marketStore";
import { useWalletStore } from "@/stores/walletStore";
import { useTradingStore } from "@/stores/tradingStore";
import { computeRoutes } from "@/services/routingService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Droplets,
  ArrowRightLeft,
  TrendingUp,
  Lock,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { AMMPool, RouteQuote } from "@/types/xrpl";

// Mock pools
const MOCK_POOLS: AMMPool[] = [
  {
    id: "amm-xrp-usd",
    asset1: { currency: "XRP" },
    asset2: { currency: "USD", issuer: "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq" },
    asset1Balance: 1_250_000,
    asset2Balance: 2_937_500,
    lpTokenBalance: 1_700_000,
    tradingFee: 500,
  },
  {
    id: "amm-xrp-solo",
    asset1: { currency: "XRP" },
    asset2: { currency: "SOLO", issuer: "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz" },
    asset1Balance: 800_000,
    asset2Balance: 4_800_000,
    lpTokenBalance: 1_960_000,
    tradingFee: 300,
  },
];

export function AMMPanel() {
  const [tab, setTab] = useState<"swap" | "pools" | "liquidity">("swap");

  return (
    <div className="terminal-panel flex flex-col">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <Droplets className="h-3 w-3 text-terminal-cyan/60" />
          <span className="terminal-panel-title">AMM</span>
        </div>
        <div className="flex gap-0.5 bg-muted/30 rounded p-0.5">
          {(["swap", "pools", "liquidity"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider rounded transition-all",
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground/50"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="p-2.5">
        {tab === "swap" && <SwapTab />}
        {tab === "pools" && <PoolsTab />}
        {tab === "liquidity" && <LiquidityTab />}
      </div>
    </div>
  );
}

function SwapTab() {
  const [inputAmount, setInputAmount] = useState("");
  const [showRoutes, setShowRoutes] = useState(false);
  const { activePair, lastPrice } = useMarketStore();
  const { isConnected } = useWalletStore();
  const { setRouteQuotes, routeQuotes, bestRoute } = useAMMStore();

  const amount = Number(inputAmount) || 0;

  const quotes = useMemo(() => {
    if (amount <= 0) return [];
    return computeRoutes(activePair, amount, "buy", lastPrice || 2.35, MOCK_POOLS[0]);
  }, [amount, activePair, lastPrice]);

  const handleQuote = () => {
    if (amount <= 0) { toast.error("Enter an amount"); return; }
    setRouteQuotes(quotes);
    setShowRoutes(true);
  };

  return (
    <div className="space-y-2.5">
      <div>
        <label className="text-[8px] font-mono text-muted-foreground/50 mb-1 block uppercase tracking-wider">
          You pay ({activePair.quote.currency})
        </label>
        <Input
          value={inputAmount}
          onChange={(e) => setInputAmount(e.target.value)}
          placeholder="0.00"
          className="h-7 text-[11px] font-mono bg-background/50 border-border/60"
          type="number"
        />
      </div>

      <div className="flex justify-center">
        <div className="p-1.5 rounded-full bg-muted/30 border border-border/40">
          <ArrowRightLeft className="h-3 w-3 text-muted-foreground/50" />
        </div>
      </div>

      <div>
        <label className="text-[8px] font-mono text-muted-foreground/50 mb-1 block uppercase tracking-wider">
          You receive ({activePair.base.currency})
        </label>
        <div className="h-7 flex items-center px-3 rounded border border-border/60 bg-background/30 text-[11px] font-mono text-foreground/60 tabular-nums">
          {quotes.find((q) => q.isBest)?.outputAmount.toFixed(4) ?? "—"}
        </div>
      </div>

      {/* Route comparison */}
      {showRoutes && quotes.length > 0 && (
        <div className="space-y-1 pt-1">
          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground/50 uppercase tracking-wider"
          >
            Route comparison
            {showRoutes ? <ChevronUp className="h-2.5 w-2.5" /> : <ChevronDown className="h-2.5 w-2.5" />}
          </button>
          {quotes.map((q, i) => (
            <RouteRow key={i} quote={q} />
          ))}
        </div>
      )}

      <Button
        onClick={handleQuote}
        disabled={!isConnected || amount <= 0}
        className="w-full h-8 text-[9px] font-mono font-bold uppercase tracking-wider bg-terminal-cyan/10 text-terminal-cyan border border-terminal-cyan/20 hover:bg-terminal-cyan/20"
      >
        {!isConnected ? (
          <><Lock className="h-3 w-3 mr-1.5" />Connect Wallet</>
        ) : (
          <><Zap className="h-3 w-3 mr-1.5" />Get Best Route</>
        )}
      </Button>
    </div>
  );
}

function RouteRow({ quote }: { quote: RouteQuote }) {
  return (
    <div className={cn(
      "flex items-center justify-between px-2 py-1.5 rounded text-[9px] font-mono transition-colors",
      quote.isBest ? "bg-primary/8 border border-primary/20" : "bg-muted/20 border border-transparent"
    )}>
      <div className="flex items-center gap-2">
        {quote.isBest && <Zap className="h-2.5 w-2.5 text-primary" />}
        <span className={cn("uppercase font-bold", quote.isBest ? "text-primary" : "text-foreground/60")}>
          {quote.source}
        </span>
        {quote.splitPct && (
          <span className="text-muted-foreground/40">
            {quote.splitPct.dex}%/{quote.splitPct.amm}%
          </span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-foreground/60 tabular-nums">{quote.outputAmount.toFixed(4)}</span>
        <span className={cn(
          "text-[8px]",
          quote.priceImpact > 3 ? "text-destructive/70" : "text-muted-foreground/40"
        )}>
          -{quote.priceImpact.toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

function PoolsTab() {
  return (
    <div className="space-y-1.5">
      {MOCK_POOLS.map((pool) => (
        <div key={pool.id} className="p-2 rounded bg-muted/20 border border-border/30 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-foreground">
              {pool.asset1.currency}/{pool.asset2.currency}
            </span>
            <span className="text-[8px] font-mono text-muted-foreground/50">
              Fee: {(pool.tradingFee / 1000).toFixed(2)}%
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
            <div>
              <span className="text-muted-foreground/40">{pool.asset1.currency}</span>
              <p className="text-foreground/70 tabular-nums">{pool.asset1Balance.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground/40">{pool.asset2.currency}</span>
              <p className="text-foreground/70 tabular-nums">{pool.asset2Balance.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[8px] font-mono text-muted-foreground/40">
            <TrendingUp className="h-2.5 w-2.5" />
            <span>TVL: {((pool.asset1Balance * 2.35 + pool.asset2Balance) / 1000).toFixed(0)}K</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function LiquidityTab() {
  const { isConnected } = useWalletStore();
  const [amount1, setAmount1] = useState("");
  const [amount2, setAmount2] = useState("");

  return (
    <div className="space-y-2.5">
      <div className="p-2 rounded bg-muted/10 border border-border/30">
        <div className="flex items-center gap-1.5 mb-2">
          <Info className="h-3 w-3 text-terminal-amber/60" />
          <span className="text-[9px] font-mono text-terminal-amber/80">Provide liquidity to earn fees</span>
        </div>
        <p className="text-[8px] font-mono text-muted-foreground/40 leading-relaxed">
          Add both assets to an AMM pool. You'll receive LP tokens and earn trading fees proportional to your share.
        </p>
      </div>

      <div>
        <label className="text-[8px] font-mono text-muted-foreground/50 mb-1 block uppercase tracking-wider">XRP Amount</label>
        <Input
          value={amount1}
          onChange={(e) => setAmount1(e.target.value)}
          placeholder="0.00"
          className="h-7 text-[11px] font-mono bg-background/50 border-border/60"
          type="number"
        />
      </div>
      <div>
        <label className="text-[8px] font-mono text-muted-foreground/50 mb-1 block uppercase tracking-wider">USD Amount</label>
        <Input
          value={amount2}
          onChange={(e) => setAmount2(e.target.value)}
          placeholder="0.00"
          className="h-7 text-[11px] font-mono bg-background/50 border-border/60"
          type="number"
        />
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Button
          disabled={!isConnected}
          className="h-7 text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20"
        >
          Add Liquidity
        </Button>
        <Button
          disabled={!isConnected}
          className="h-7 text-[9px] font-mono bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20"
        >
          Remove
        </Button>
      </div>
    </div>
  );
}
