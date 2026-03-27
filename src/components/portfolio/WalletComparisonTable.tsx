import { Wallet, ArrowLeftRight, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useWalletProfiles } from "@/hooks/useWalletProfiles";
import type { WalletRole } from "@/stores/walletProfileStore";

const ROLE_COLORS: Record<WalletRole, string> = {
  trading: "text-primary",
  treasury: "text-terminal-cyan",
  watch_only: "text-terminal-yellow",
  experimental: "text-terminal-amber",
  unknown: "text-muted-foreground",
};

export function WalletComparisonTable() {
  const { profiles } = useWalletProfiles();

  if (profiles.length < 2) return null;

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-mono">
          <ArrowLeftRight className="h-4 w-4 text-terminal-cyan" />
          WALLET COMPARISON
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-[9px] font-mono">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left py-1.5 text-muted-foreground/50 font-normal">WALLET</th>
                <th className="text-center py-1.5 text-muted-foreground/50 font-normal">CHAIN</th>
                <th className="text-center py-1.5 text-muted-foreground/50 font-normal">ROLE</th>
                <th className="text-center py-1.5 text-muted-foreground/50 font-normal">TYPE</th>
                <th className="text-center py-1.5 text-muted-foreground/50 font-normal">PRIMARY</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(p => (
                <tr key={p.id} className="border-b border-border/15 hover:bg-muted/20 transition-colors">
                  <td className="py-1.5">
                    <div>
                      <span className="text-foreground">{p.label || `${p.address.slice(0,4)}…${p.address.slice(-4)}`}</span>
                      <span className="text-muted-foreground/40 block text-[7px]">{p.address.slice(0,8)}…</span>
                    </div>
                  </td>
                  <td className="text-center py-1.5">
                    <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono">{p.chain.toUpperCase()}</Badge>
                  </td>
                  <td className="text-center py-1.5">
                    <span className={cn("uppercase", ROLE_COLORS[p.role])}>{p.role.replace("_", " ")}</span>
                  </td>
                  <td className="text-center py-1.5">
                    {p.isWatchOnly ? (
                      <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono border-terminal-yellow/30 text-terminal-yellow">WATCH</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono border-primary/30 text-primary">FULL</Badge>
                    )}
                  </td>
                  <td className="text-center py-1.5">
                    {p.isPrimary && <Shield className="h-3 w-3 text-terminal-yellow mx-auto" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
