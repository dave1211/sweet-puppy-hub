// Snipe Recorder — History of all snipe calls with success/fail tracking
import { History, TrendingUp, TrendingDown, X, Trash2 } from "lucide-react";
import { useAutoSniperStore, getStats } from "../stores/autoSniperStore";
import type { SnipeRecord } from "../stores/autoSniperStore";

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function RecordRow({ record }: { record: SnipeRecord }) {
  const statusColors: Record<string, string> = {
    active: "text-terminal-cyan bg-terminal-cyan/10 border-terminal-cyan/30",
    profit: "text-terminal-green bg-terminal-green/10 border-terminal-green/30",
    loss: "text-terminal-red bg-terminal-red/10 border-terminal-red/30",
    manual_exit: "text-terminal-amber bg-terminal-amber/10 border-terminal-amber/30",
  };

  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-foreground">{record.tokenSymbol}</span>
          <span className={`text-[7px] font-mono px-1 py-0.5 rounded border ${statusColors[record.status]}`}>
            {record.status.toUpperCase().replace("_", " ")}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[8px] font-mono text-muted-foreground mt-0.5">
          <span>{record.amountSOL} SOL</span>
          <span>S:{record.score}</span>
          <span>R:{record.risk}</span>
          <span>{formatTime(record.entryTime)}</span>
        </div>
      </div>
      <div className="text-right">
        {record.pnlPercent !== null ? (
          <div className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${record.pnlPercent >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>
            {record.pnlPercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {record.pnlPercent >= 0 ? "+" : ""}{record.pnlPercent.toFixed(1)}%
          </div>
        ) : (
          <span className="text-[9px] font-mono text-terminal-cyan animate-pulse">LIVE</span>
        )}
      </div>
    </div>
  );
}

export function SnipeRecorder() {
  const { records, clearHistory } = useAutoSniperStore();
  const stats = getStats(records);

  return (
    <div className="bg-muted/20 border border-border rounded p-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-terminal-amber" />
          <span className="text-[10px] font-mono font-bold text-foreground">SNIPE LOG</span>
          <span className="text-[8px] font-mono text-muted-foreground">({records.length})</span>
        </div>
        {records.length > 0 && (
          <button onClick={clearHistory} className="text-muted-foreground hover:text-foreground transition-colors">
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Stats Bar */}
      {records.length > 0 && (
        <div className="grid grid-cols-4 gap-1 text-[8px] font-mono">
          <div className="bg-muted/30 rounded px-1.5 py-1">
            <span className="text-muted-foreground block">TOTAL</span>
            <span className="text-foreground font-bold">{stats.total}</span>
          </div>
          <div className="bg-muted/30 rounded px-1.5 py-1">
            <span className="text-muted-foreground block">WIN %</span>
            <span className={`font-bold ${stats.winRate >= 50 ? "text-terminal-green" : "text-terminal-red"}`}>
              {stats.winRate.toFixed(0)}%
            </span>
          </div>
          <div className="bg-muted/30 rounded px-1.5 py-1">
            <span className="text-muted-foreground block">P&L</span>
            <span className={`font-bold ${stats.totalPnl >= 0 ? "text-terminal-green" : "text-terminal-red"}`}>
              {stats.totalPnl >= 0 ? "+" : ""}{stats.totalPnl.toFixed(1)}%
            </span>
          </div>
          <div className="bg-muted/30 rounded px-1.5 py-1">
            <span className="text-muted-foreground block">ACTIVE</span>
            <span className="text-terminal-cyan font-bold">{stats.activeCount}</span>
          </div>
        </div>
      )}

      {/* Records List */}
      <div className="max-h-48 overflow-y-auto">
        {records.length === 0 ? (
          <div className="text-center py-4 text-[9px] font-mono text-muted-foreground">
            No snipes recorded yet
          </div>
        ) : (
          records.slice(0, 20).map((record) => (
            <RecordRow key={record.id} record={record} />
          ))
        )}
      </div>
    </div>
  );
}
