import { cn } from "@/lib/utils";
import { AlertTriangle, Shield, ShieldAlert, Info } from "lucide-react";
import type { RiskLevel, RiskWarning } from "@/types/xrpl";

interface RiskBadgeProps {
  level: RiskLevel;
  compact?: boolean;
}

const config: Record<RiskLevel, { icon: typeof Shield; color: string; bg: string; label: string }> = {
  low: { icon: Shield, color: "text-primary/70", bg: "bg-primary/8", label: "Low Risk" },
  medium: { icon: Info, color: "text-terminal-amber/70", bg: "bg-terminal-amber/8", label: "Medium" },
  high: { icon: AlertTriangle, color: "text-terminal-amber", bg: "bg-terminal-amber/10", label: "High Risk" },
  critical: { icon: ShieldAlert, color: "text-destructive", bg: "bg-destructive/10", label: "Critical" },
};

export function RiskBadge({ level, compact }: RiskBadgeProps) {
  const c = config[level];
  const Icon = c.icon;

  if (compact) {
    return (
      <div className={cn("flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-mono font-medium", c.bg, c.color)} title={c.label}>
        <Icon className="h-2 w-2" />
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono font-medium", c.bg, c.color)}>
      <Icon className="h-2.5 w-2.5" />
      {c.label}
    </div>
  );
}

export function RiskWarningList({ warnings }: { warnings: RiskWarning[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-1">
      {warnings.map((w, i) => {
        const severityColor = w.severity === "critical" ? "text-destructive" : w.severity === "warning" ? "text-terminal-amber" : "text-terminal-blue/60";
        return (
          <div key={i} className="flex items-start gap-1.5 px-2 py-1 rounded bg-muted/10 border border-border/20">
            <AlertTriangle className={cn("h-2.5 w-2.5 mt-0.5 shrink-0", severityColor)} />
            <p className={cn("text-[8px] font-mono leading-relaxed", severityColor + "/80")}>{w.message}</p>
          </div>
        );
      })}
    </div>
  );
}
