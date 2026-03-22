import { useTier, Tier } from "@/contexts/TierContext";

const tiers: { value: Tier; label: string; color: string }[] = [
  { value: "free", label: "FREE", color: "border-muted-foreground/40 text-muted-foreground" },
  { value: "pro", label: "PRO", color: "border-terminal-cyan/40 text-terminal-cyan" },
  { value: "elite", label: "ELITE", color: "border-terminal-yellow/40 text-terminal-yellow" },
];

export function TierSelector() {
  const { tier, setTier } = useTier();
  return (
    <div className="flex items-center gap-1">
      {tiers.map((t) => (
        <button key={t.value} onClick={() => setTier(t.value)} className={`text-[9px] font-mono font-bold px-2 py-1 rounded border transition-colors ${tier === t.value ? `${t.color} bg-primary/10` : "border-border text-muted-foreground/50 hover:text-muted-foreground"}`}>{t.label}</button>
      ))}
    </div>
  );
}