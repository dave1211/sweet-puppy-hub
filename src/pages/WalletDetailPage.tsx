import { useParams, Link } from "react-router-dom";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { cn } from "@/lib/utils";
import { ArrowLeft, Wallet, Copy, Loader2 } from "lucide-react";
import { useWalletActivity } from "@/hooks/useWalletActivity";
import { useTrackedWallets } from "@/hooks/useTrackedWallets";
import { timeAgo } from "@/data/mockData";
import { toast } from "sonner";

export default function WalletDetailPage() {
  const { id } = useParams();
  const { wallets } = useTrackedWallets();
  const wallet = wallets.find(w => w.address === id || w.id === id);
  const address = wallet?.address ?? id ?? "";
  const { data: activity, isLoading } = useWalletActivity(address || null);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wallet-tracker" className="p-2 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10"><Wallet className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="text-lg font-mono font-bold text-foreground">{wallet?.label || "Wallet"}</h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <span>{address.slice(0, 12)}…{address.slice(-4)}</span>
              <button onClick={() => { navigator.clipboard.writeText(address); toast.success("Copied!"); }} className="text-primary"><Copy className="h-3 w-3" /></button>
            </div>
          </div>
        </div>
      </div>

      <PanelShell title="Recent Activity" subtitle="On-chain transactions" noPad>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="ml-2 text-xs font-mono text-muted-foreground">Fetching on-chain activity…</span>
          </div>
        ) : !activity || activity.length === 0 ? (
          <p className="text-xs text-muted-foreground py-8 text-center">No recent activity found for this wallet.</p>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3">TYPE</th>
                <th className="text-left p-3">TOKEN</th>
                <th className="text-right p-3 hidden md:table-cell">AMOUNT</th>
                <th className="text-right p-3">TIME</th>
                <th className="text-center p-3">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {activity.map(tx => (
                <tr key={tx.signature} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="p-3">
                    <StatusChip variant={tx.type === "buy" ? "success" : tx.type === "sell" ? "danger" : "muted"}>
                      {tx.type.toUpperCase()}
                    </StatusChip>
                  </td>
                  <td className="p-3 text-foreground">
                    {tx.tokenSymbol ?? (tx.tokenAddress ? `${tx.tokenAddress.slice(0, 6)}…` : "SOL")}
                  </td>
                  <td className="p-3 text-right hidden md:table-cell text-muted-foreground">
                    {tx.amount ? tx.amount.toFixed(4) : "—"}
                  </td>
                  <td className="p-3 text-right text-muted-foreground">
                    {tx.blockTime ? timeAgo(tx.blockTime * 1000) : "—"}
                  </td>
                  <td className="p-3 text-center">
                    <StatusChip variant={tx.err ? "danger" : "success"}>{tx.err ? "FAILED" : "OK"}</StatusChip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PanelShell>
    </div>
  );
}
