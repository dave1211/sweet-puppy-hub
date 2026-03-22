import { Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Tier } from "@/contexts/TierContext";

const tierColors: Record<Tier, string> = { free: "", pro: "text-terminal-cyan", elite: "text-terminal-yellow" };

const FOMO_MESSAGES: Record<string, string> = {
  "Sniper Mode": "Sniper caught +87% in 4 min — you missed it",
  "Smart Money": "A whale just entered a new token — upgrade to see it",
  "Wallet Tracker": "3 smart wallets moved in the last hour",
  "Copy Trading": "Top trader just opened a position — copy it live",
  "Auto Sniper": "Auto Sniper hit 5 wins today — let it trade for you",
  "Advanced Signals": "12 high-score signals detected — unlock the feed",
};

interface UpgradeOverlayProps { requiredTier: Tier; featureLabel?: string; }

export function UpgradeOverlay({ requiredTier, featureLabel }: UpgradeOverlayProps) {
  const fomo = FOMO_MESSAGES[featureLabel || ""] || `${featureLabel || "This feature"} is locked`;
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded backdrop-blur-sm bg-background/70">
      <Lock className="h-5 w-5 text-muted-foreground mb-2" />
      <p className="text-xs font-mono text-foreground/80 font-semibold text-center px-4">{fomo}</p>
      <p className="text-[10px] font-mono text-muted-foreground mt-1">
        Upgrade to <span className={`font-bold uppercase ${tierColors[requiredTier]}`}>{requiredTier}</span> to unlock
      </p>
      <Link to="/pricing" className="mt-3 px-3 py-1.5 rounded border border-primary/40 bg-primary/10 text-primary text-[10px] font-mono font-semibold hover:bg-primary/20 transition-colors">Upgrade Now →</Link>
    </div>
  );
}