import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function DashboardStatCard({ icon: Icon, label, value, change, changeType = "neutral", className }: DashboardStatCardProps) {
  return (
    <div className={cn("terminal-panel p-4 flex items-start gap-3", className)}>
      <div className="p-2 rounded-lg bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-lg font-mono font-bold text-foreground mt-0.5">{value}</p>
        {change && (
          <p className={cn("text-[10px] font-mono mt-0.5", changeType === "positive" ? "text-terminal-green" : changeType === "negative" ? "text-destructive" : "text-muted-foreground")}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
}
