import { Activity, TrendingUp, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const FEED = [
  { icon: TrendingUp, text: "ALPHA +22.3% in 15m", color: "text-terminal-green" },
  { icon: Zap, text: "Whale bought 120 SOL of GIGA", color: "text-primary" },
  { icon: AlertTriangle, text: "MOON risk score → 92", color: "text-destructive" },
  { icon: Activity, text: "New launch: NeonSwap (NEON)", color: "text-terminal-amber" },
  { icon: TrendingUp, text: "TURBO vol spike 12x", color: "text-terminal-cyan" },
];

export function BottomStrip() {
  return (
    <footer className="border-t border-border/40 px-4 py-1 shrink-0 bg-card/30 overflow-hidden">
      <div className="flex items-center gap-6 text-[9px] font-mono tracking-wider animate-marquee">
        {FEED.map((item, i) => (
          <div key={i} className="flex items-center gap-1.5 shrink-0">
            <item.icon className={cn("h-2.5 w-2.5", item.color)} />
            <span className="text-muted-foreground">{item.text}</span>
          </div>
        ))}
        {FEED.map((item, i) => (
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
