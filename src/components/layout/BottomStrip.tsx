import { Activity, TrendingUp, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnifiedSignals } from "@/hooks/useUnifiedSignals";
import { useSolPrice } from "@/hooks/useSolPrice";
import { useMemo } from "react";

export function BottomStrip() {
  const { tokens } = useUnifiedSignals();
  const { data: solPrice } = useSolPrice();

  const feed = useMemo(() => {
    const items: { icon: typeof TrendingUp; text: string; color: string }[] = [];

    if (solPrice) {
      items.push({
        icon: TrendingUp,
        text: `SOL $${solPrice.price.toFixed(2)} ${solPrice.change24h >= 0 ? "+" : ""}${solPrice.change24h.toFixed(1)}%`,
        color: solPrice.change24h >= 0 ? "text-terminal-green" : "text-destructive",
      });
    }

    for (const t of tokens.slice(0, 6)) {
      items.push({
        icon: t.label === "HIGH SIGNAL" ? Zap : Activity,
        text: `${t.symbol} ${t.change24h >= 0 ? "+" : ""}${t.change24h.toFixed(1)}% · Score ${t.score}`,
        color: t.change24h >= 0 ? "text-terminal-green" : "text-destructive",
      });
    }

    if (items.length === 0) {
      items.push({ icon: Loader2, text: "Loading live data…", color: "text-muted-foreground" });
    }

    return items;
  }, [tokens, solPrice]);

  return (
    <footer className="border-t border-border/40 px-4 py-1 shrink-0 bg-card/30 overflow-hidden">
      <div className="flex items-center gap-6 text-[9px] font-mono tracking-wider animate-marquee">
        {feed.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 shrink-0">
            <item.icon className={cn("h-2.5 w-2.5", item.color)} />
            <span className="text-muted-foreground">{item.text}</span>
          </div>
        ))}
        {feed.map((item, i) => (
          <div key={`dup-${i}`} className="flex items-center gap-1.5 shrink-0">
            <item.icon className={cn("h-2.5 w-2.5", item.color)} />
            <span className="text-muted-foreground">{item.text}</span>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: flex; animation: marquee 30s linear infinite; width: max-content; }
      `}</style>
    </footer>
  );
}
