import { useParams, Link } from "react-router-dom";
import { PanelShell } from "@/components/shared/PanelShell";
import { StatusChip } from "@/components/shared/StatusChip";
import { ScoreMeter } from "@/components/shared/ScoreMeter";
import { mockWallets } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { ArrowLeft, Wallet, Copy, TrendingUp, Activity } from "lucide-react";

const RECENT_TRADES = [
  { token: "ALPHA", action: "BUY", amount: "12.5 SOL", price: "$0.034", pnl: "+45.2%", time: "2h ago" },
  { token: "GIGA", action: "BUY", amount: "5.0 SOL", price: "$0.067", pnl: "+23.1%", time: "6h ago" },
  { token: "TURBO", action: "SELL", amount: "8.0 SOL", price: "$0.012", pnl: "+89.4%", time: "1d ago" },
  { token: "WIF", action: "BUY", amount: "3.0 SOL", price: "$1.89", pnl: "+12.3%", time: "2d ago" },
  { token: "PEPE", action: "BUY", amount: "20.0 SOL", price: "$0.0000098", pnl: "+8.7%", time: "3d ago" },
];

export default function WalletDetailPage() {
  const { id } = useParams();
  const wallet = mockWallets.find(w => w.id === id) ?? mockWallets[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/wallet-tracker" className="p-2 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-primary/10"><Wallet className="h-5 w-5 text-primary" /></div>
          <div>
            <h1 className="text-lg font-mono font-bold text-foreground">{wallet.label}</h1>
            <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
              <span>{wallet.address}</span>
              <button className="text-primary"><Copy className="h-3 w-3" /></button>
              <span>·</span>
              <span>{wallet.chain}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Type", value: wallet.type.toUpperCase() },
          { label: "Win Rate", value: `${wallet.winRate}%`, color: wallet.winRate >= 70 ? "text-terminal-green" : "" },
          { label: "Avg Entry", value: `${wallet.avgEntry}x` },
          { label: "7d PnL", value: `${wallet.pnl7d >= 0 ? "+" : ""}${wallet.pnl7d.toFixed(1)}%`, color: wallet.pnl7d >= 0 ? "text-terminal-green" : "text-destructive" },
          { label: "Trust Score", value: String(wallet.trustScore) },
        ].map(s => (
          <div key={s.label} className="terminal-panel p-3">
            <p className="text-[9px] font-mono text-muted-foreground uppercase">{s.label}</p>
            <p className={cn("text-sm font-mono font-bold text-foreground mt-1", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      <ScoreMeter value={wallet.trustScore} label="TRUST SCORE" size="md" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PanelShell title="Recent Trades" noPad>
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left p-3">ACTION</th>
                <th className="text-left p-3">TOKEN</th>
                <th className="text-right p-3">AMOUNT</th>
                <th className="text-right p-3">PNL</th>
                <th className="text-right p-3">TIME</th>
              </tr>
            </thead>
            <tbody>
              {RECENT_TRADES.map((t, i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="p-3"><StatusChip variant={t.action === "BUY" ? "success" : "danger"}>{t.action}</StatusChip></td>
                  <td className="p-3 text-foreground">{t.token}</td>
                  <td className="p-3 text-right text-muted-foreground">{t.amount}</td>
                  <td className="p-3 text-right text-terminal-green">{t.pnl}</td>
                  <td className="p-3 text-right text-muted-foreground">{t.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </PanelShell>

        <PanelShell title="Wallet Profile">
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded bg-muted/30">
                <p className="text-[9px] uppercase text-muted-foreground mb-1">Style</p>
                <p className="text-sm font-mono font-bold text-primary">{wallet.type}</p>
              </div>
              <div className="p-3 rounded bg-muted/30">
                <p className="text-[9px] uppercase text-muted-foreground mb-1">Avg Hold Time</p>
                <p className="text-sm font-mono font-bold text-foreground">4.2h</p>
              </div>
              <div className="p-3 rounded bg-muted/30">
                <p className="text-[9px] uppercase text-muted-foreground mb-1">Frequency</p>
                <p className="text-sm font-mono font-bold text-foreground">12/day</p>
              </div>
              <div className="p-3 rounded bg-muted/30">
                <p className="text-[9px] uppercase text-muted-foreground mb-1">Preferred Chain</p>
                <p className="text-sm font-mono font-bold text-foreground">{wallet.chain}</p>
              </div>
            </div>
            <p className="text-[11px]">
              <span className="text-foreground/60">Recent action: </span>{wallet.recentAction}
            </p>
            <p className="text-[11px]">
              <span className="text-foreground/60">Behavior: </span>Aggressive entries on new launches with quick profit-taking. Tends to accumulate on dips.
            </p>
          </div>
        </PanelShell>
      </div>
    </div>
  );
}
