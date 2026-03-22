import { forwardRef } from "react";

type SourceKey = "pump.fun" | "bonk.fun" | "dex";

const SOURCE_MAP: { key: SourceKey; label: string; match: (d: string) => boolean; color: string }[] = [
  { key: "pump.fun", label: "pump.fun", match: (d) => d === "pump.fun" || d === "pumpfun" || d === "pumpswap", color: "bg-terminal-green/15 text-terminal-green border-terminal-green/40" },
  { key: "bonk.fun", label: "bonk.fun", match: (d) => d === "bonk.fun", color: "bg-terminal-amber/15 text-terminal-amber border-terminal-amber/40" },
  { key: "dex", label: "DEX", match: () => true, color: "bg-terminal-cyan/15 text-terminal-cyan border-terminal-cyan/40" },
];

export function getSourceInfo(dexId?: string) {
  const d = dexId ?? "";
  return SOURCE_MAP.find((s) => s.match(d)) ?? SOURCE_MAP[2];
}

export const SourceBadge = forwardRef<HTMLSpanElement, { dexId?: string }>(
  function SourceBadge({ dexId }, ref) {
    const src = getSourceInfo(dexId);
    return <span ref={ref} className={`text-[7px] font-mono px-1 py-0.5 rounded border shrink-0 ${src.color}`}>{src.label}</span>;
  }
);