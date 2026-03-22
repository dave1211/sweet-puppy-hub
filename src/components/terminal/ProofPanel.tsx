import { Trophy } from "lucide-react";

export function ProofPanel() {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3"><Trophy className="h-4 w-4 text-terminal-yellow" /><h3 className="font-mono text-sm font-bold text-foreground">PROOF / WINS</h3></div>
      <div className="text-center py-6 text-xs font-mono text-muted-foreground">
        <Trophy className="h-5 w-5 mx-auto mb-2 text-muted-foreground/30" />
        Waiting for high-score signals to capture…
        <br /><span className="text-[10px] text-muted-foreground/50">Tokens scoring 70+ are automatically tracked</span>
      </div>
    </div>
  );
}