import { useState } from "react";
import { AlertTriangle, Shield } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface LiveModeConfirmModalProps { open: boolean; onConfirm: () => void; onCancel: () => void; }

export function LiveModeConfirmModal({ open, onConfirm, onCancel }: LiveModeConfirmModalProps) {
  const [accepted, setAccepted] = useState(false);
  const handleConfirm = () => { if (!accepted) return; setAccepted(false); onConfirm(); };
  const handleCancel = () => { setAccepted(false); onCancel(); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono text-base"><AlertTriangle className="h-5 w-5 text-terminal-red" />ENABLE LIVE TRADING</DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <div className="rounded border border-terminal-red/30 bg-terminal-red/5 p-3 space-y-2">
              <p className="text-xs font-mono font-bold text-terminal-red">⚠️ REAL FUNDS WILL BE USED</p>
              <p className="text-[10px] font-mono text-muted-foreground">Live mode will execute real trades on Solana using your connected wallet. Losses are permanent and irreversible.</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5"><Shield className="h-3 w-3 text-terminal-yellow shrink-0" />Safeguards remain active (max trade size, daily limits, emergency stop)</p>
              <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5"><Shield className="h-3 w-3 text-terminal-yellow shrink-0" />You can disable live mode at any time</p>
              <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1.5"><Shield className="h-3 w-3 text-terminal-yellow shrink-0" />Emergency stop instantly halts all trading</p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-2 rounded border border-border bg-muted/50 px-3 py-2.5">
          <Checkbox id="accept-risk" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
          <label htmlFor="accept-risk" className="text-[10px] font-mono text-foreground cursor-pointer">I understand that real SOL will be spent and I accept all risks associated with live trading.</label>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} className="text-xs font-mono">Cancel</Button>
          <Button onClick={handleConfirm} disabled={!accepted} className="text-xs font-mono bg-terminal-red hover:bg-terminal-red/90 text-white">Enable Live Mode</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}