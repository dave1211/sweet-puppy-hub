// Score Breakdown — Visual score display
import { SCORE_COLORS, type ScoreBreakdown as ScoreBreakdownType } from "../types";

const CATEGORIES = [
  { key: "liquidity" as const, label: "LIQUIDITY", max: 20, color: "bg-terminal-blue" },
  { key: "momentum" as const, label: "MOMENTUM", max: 20, color: "bg-terminal-cyan" },
  { key: "holderQuality" as const, label: "HOLDERS", max: 20, color: "bg-terminal-green" },
  { key: "smartMoney" as const, label: "SMART $", max: 20, color: "bg-terminal-amber" },
  { key: "safety" as const, label: "SAFETY", max: 15, color: "bg-primary" },
  { key: "socialMeta" as const, label: "META", max: 5, color: "bg-muted-foreground" },
];

export function ScoreBreakdown({ score }: { score: ScoreBreakdownType }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground">SNIPER SCORE</span>
        <div className="flex items-center gap-1.5">
          <span className={`text-lg font-mono font-bold ${SCORE_COLORS[score.band]}`}>{score.total}</span>
          <span className={`text-[9px] font-mono ${SCORE_COLORS[score.band]}`}>{score.band}</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {CATEGORIES.map(({ key, label, max, color }) => {
          const val = score[key];
          const pct = (val / max) * 100;
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[8px] font-mono text-muted-foreground w-14 shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <span className="text-[8px] font-mono text-foreground w-8 text-right">{val}/{max}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="text-[8px] font-mono text-muted-foreground">CONFIDENCE</span>
        <div className="flex-1 h-1 bg-muted/30 rounded-full overflow-hidden">
          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${score.confidence}%` }} />
        </div>
        <span className="text-[8px] font-mono text-foreground">{score.confidence}%</span>
      </div>

      {score.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {score.tags.slice(0, 6).map((tag) => (
            <span key={tag} className="text-[7px] font-mono bg-primary/10 text-primary px-1 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
