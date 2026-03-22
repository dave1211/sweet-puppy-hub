import { useState, useCallback } from "react";
import { Shield, Power, AlertOctagon, Settings2, Zap, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveModeConfirmModal } from "./LiveModeConfirmModal";
import { useWallet } from "@/contexts/WalletContext";
import { getSafeguards, updateSafeguards, triggerEmergencyStop, resetSafeguards, getDailyTradeCount, getExecutionLogs, ExecutionSafeguards } from "@/lib/executionEngine";

export function ExecutionControlsPanel() {
  const { isConnected } = useWallet();
  const [safeguards, setSafeguards] = useState<ExecutionSafeguards>(getSafeguards);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dailyCount] = useState(getDailyTradeCount);
  const recentLogs = getExecutionLogs().slice(0, 5);
  const sync = (updates: Partial<ExecutionSafeguards>) => { const updated = updateSafeguards(updates); setSafeguards(updated); };
  const handleLiveToggle = useCallback((checked: boolean) => { if (checked) { if (!isConnected) return; setShowConfirm(true); } else { sync({ liveEnabled: false, userConfirmed: false }); } }, [isConnected]);
  const handleConfirmLive = () => { sync({ liveEnabled: true, userConfirmed: true, walletConnected: isConnected }); setShowConfirm(false); };
  const handleEmergencyStop = () => { triggerEmergencyStop(); setSafeguards(getSafeguards()); };
  const handleReset = () => { resetSafeguards(); setSafeguards(getSafeguards()); };
  const isLive = safeguards.liveEnabled && safeguards.userConfirmed && !safeguards.emergencyStop;

  return (
    <>
      <LiveModeConfirmModal open={showConfirm} onConfirm={handleConfirmLive} onCancel={() => setShowConfirm(false)} />
      <Card className={`border-border bg-card ${isLive ? "ring-1 ring-terminal-red/40" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-mono">
            <Zap className="h-4 w-4 text-terminal-yellow" />EXECUTION ENGINE
            {isLive ? <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono border-terminal-red/40 text-terminal-red animate-pulse">LIVE</Badge> : <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 font-mono border-terminal-yellow/40 text-terminal-yellow">SIM</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {safeguards.emergencyStop && (<div className="rounded border border-terminal-red/40 bg-terminal-red/10 px-3 py-2 flex items-center justify-between"><div className="flex items-center gap-2"><AlertOctagon className="h-4 w-4 text-terminal-red" /><span className="text-[10px] font-mono font-bold text-terminal-red">EMERGENCY STOP ACTIVE</span></div><Button variant="outline" size="sm" onClick={handleReset} className="h-6 text-[9px] font-mono">Reset</Button></div>)}
          <div className="flex items-center justify-between rounded border border-border bg-muted/30 px-3 py-2"><div className="flex items-center gap-2"><Power className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[10px] font-mono text-foreground">Live Mode</span></div><div className="flex items-center gap-2">{!isConnected && <span className="text-[8px] font-mono text-terminal-yellow">Connect wallet first</span>}<Switch checked={safeguards.liveEnabled} onCheckedChange={handleLiveToggle} disabled={!isConnected || safeguards.emergencyStop} /></div></div>
          <div className="space-y-2"><p className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Settings2 className="h-3 w-3" />Safeguards</p><div className="space-y-1.5"><div className="flex items-center justify-between"><span className="text-[9px] font-mono text-muted-foreground">Max Trade Size</span><span className="text-[9px] font-mono text-foreground font-bold">{safeguards.maxTradeSOL} SOL</span></div><Slider value={[safeguards.maxTradeSOL]} onValueChange={([v]) => sync({ maxTradeSOL: +v.toFixed(2) })} min={0.01} max={5} step={0.01} className="w-full" /></div><div className="space-y-1.5"><div className="flex items-center justify-between"><span className="text-[9px] font-mono text-muted-foreground">Max Daily Trades</span><span className="text-[9px] font-mono text-foreground font-bold">{safeguards.maxDailyTrades} ({dailyCount} used)</span></div><Slider value={[safeguards.maxDailyTrades]} onValueChange={([v]) => sync({ maxDailyTrades: Math.round(v) })} min={1} max={50} step={1} className="w-full" /></div></div>
          {!safeguards.emergencyStop && <Button variant="outline" onClick={handleEmergencyStop} className="w-full h-8 text-[10px] font-mono border-terminal-red/30 text-terminal-red hover:bg-terminal-red/10 hover:text-terminal-red"><AlertOctagon className="h-3.5 w-3.5 mr-1.5" />EMERGENCY STOP</Button>}
          <p className="text-[7px] text-muted-foreground/50 font-mono text-center">{isLive ? "⚠️ Live trades use real SOL" : "Simulation mode · no real funds used"}</p>
        </CardContent>
      </Card>
    </>
  );
}