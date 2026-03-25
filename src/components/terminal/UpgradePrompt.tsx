/**
 * Premium upgrade prompt — shows contextual upgrade nudges.
 * Tracks every interaction for war room intelligence.
 */
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Zap, Crown, Crosshair, Shield } from "lucide-react";
import { trackUpgradeFunnel } from "@/services/analyticsTracker";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  feature: string;
  tier?: "pro" | "elite";
  onDismiss?: () => void;
}

const TIER_CONFIG = {
  pro: {
    name: "PRO",
    price: "$9",
    period: "/mo",
    color: "text-terminal-amber",
    borderColor: "border-terminal-amber/30",
    bgColor: "bg-terminal-amber/5",
    icon: Zap,
    perks: [
      "Unlimited sniper signals",
      "Priority alert delivery",
      "Advanced risk breakdowns",
      "Smart wallet tracking",
    ],
  },
  elite: {
    name: "ELITE",
    price: "$29",
    period: "/mo",
    color: "text-terminal-cyan",
    borderColor: "border-terminal-cyan/30",
    bgColor: "bg-terminal-cyan/5",
    icon: Crown,
    perks: [
      "Everything in Pro",
      "Deep signal intelligence",
      "Whale wallet alerts",
      "Priority support",
      "Early feature access",
    ],
  },
};

export function UpgradePrompt({ feature, tier = "pro", onDismiss }: UpgradePromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  // Track that prompt was shown
  useState(() => {
    trackUpgradeFunnel("prompt_shown", tier);
  });

  if (dismissed) return null;

  const handleUpgrade = () => {
    trackUpgradeFunnel("clicked", tier);
    navigate("/pricing");
  };

  const handleDismiss = () => {
    trackUpgradeFunnel("abandoned", tier);
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Card className={`${config.borderColor} ${config.bgColor} border relative`}>
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${config.color}`} />
          <div>
            <Badge variant="outline" className={`${config.borderColor} ${config.color} text-[9px]`}>
              {config.name} REQUIRED
            </Badge>
          </div>
        </div>

        <div>
          <p className="text-xs font-mono text-foreground font-semibold">
            Unlock {feature}
          </p>
          <p className="text-[10px] font-mono text-muted-foreground mt-1">
            Upgrade to {config.name} for full access to premium features.
          </p>
        </div>

        <div className="space-y-1">
          {config.perks.slice(0, 3).map((perk) => (
            <div key={perk} className="flex items-center gap-2">
              <Shield className={`h-3 w-3 ${config.color} shrink-0`} />
              <span className="text-[10px] font-mono text-muted-foreground">{perk}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={handleUpgrade}
          size="sm"
          className="w-full font-mono text-xs"
        >
          <Icon className="h-3.5 w-3.5 mr-1.5" />
          UPGRADE — {config.price}{config.period}
        </Button>
      </CardContent>
    </Card>
  );
}

/**
 * Inline upgrade nudge — smaller, for embedding in feature panels.
 */
export function UpgradeNudge({
  feature,
  tier = "pro",
}: {
  feature: string;
  tier?: "pro" | "elite";
}) {
  const navigate = useNavigate();
  const config = TIER_CONFIG[tier];
  const Icon = config.icon;

  return (
    <button
      onClick={() => {
        trackUpgradeFunnel("clicked", tier);
        navigate("/pricing");
      }}
      className={`flex items-center gap-2 w-full p-2.5 rounded-lg border ${config.borderColor} ${config.bgColor} hover:opacity-90 transition-opacity`}
    >
      <Icon className={`h-4 w-4 ${config.color} shrink-0`} />
      <span className="text-[10px] font-mono text-muted-foreground flex-1 text-left">
        <span className={`${config.color} font-semibold`}>{config.name}</span> — Unlock {feature}
      </span>
      <span className={`text-[10px] font-mono ${config.color} font-bold`}>
        {config.price}
      </span>
    </button>
  );
}
