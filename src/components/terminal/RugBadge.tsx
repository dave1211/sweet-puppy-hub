import { forwardRef } from "react";
import { assessRug, riskColors, type RugAssessment } from "@/hooks/useRugDetection";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RugBadgeProps { assessment: RugAssessment; compact?: boolean; }

export const RugBadge = forwardRef<HTMLSpanElement, RugBadgeProps>(
  function RugBadge({ assessment, compact = false }, ref) {
    if (assessment.level === "low" && compact) return null;
    const colorClass = riskColors[assessment.level];
    const shortReason = assessment.flags.length > 0 ? assessment.flags.slice(0, 2).map(f => f.label).join(" · ") : null;
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span ref={ref} className={`text-[8px] font-mono px-1 py-0.5 rounded border cursor-default select-none inline-flex items-center gap-1 shrink-0 max-w-[120px] ${colorClass}`}>
              {compact ? (assessment.level === "high" ? "⚠ RUG" : "⚠") : assessment.label}
              {compact && shortReason && <span className="text-[7px] opacity-70 truncate">{shortReason}</span>}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] bg-popover border-border">
            <p className="text-[10px] font-mono font-bold mb-1">{assessment.label}</p>
            {assessment.flags.length > 0 ? (
              <ul className="space-y-0.5">{assessment.flags.map((f) => <li key={f.id} className="text-[9px] font-mono text-muted-foreground">• {f.label}</li>)}</ul>
            ) : <p className="text-[9px] font-mono text-muted-foreground">No flags detected</p>}
            <p className="text-[8px] font-mono text-muted-foreground/60 mt-1 italic">Heuristic only — not financial advice</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

export { assessRug };