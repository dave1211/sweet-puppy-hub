import { cn } from "@/lib/utils";

interface ScoreMeterProps {
  value: number;
  max?: number;
  label?: string;
  size?: "sm" | "md";
}

export function ScoreMeter({ value, max = 100, label, size = "sm" }: ScoreMeterProps) {
  const pct = Math.min((value / max) * 100, 100);
  const color = value >= 75 ? "bg-terminal-green" : value >= 40 ? "bg-terminal-amber" : "bg-destructive";

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-[10px] font-mono text-muted-foreground shrink-0">{label}</span>}
      <div className={cn("flex-1 rounded-full bg-muted overflow-hidden", size === "sm" ? "h-1.5" : "h-2.5")}>
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("font-mono font-medium shrink-0", size === "sm" ? "text-[10px]" : "text-xs", value >= 75 ? "text-terminal-green" : value >= 40 ? "text-terminal-amber" : "text-destructive")}>
        {value}
      </span>
    </div>
  );
}
