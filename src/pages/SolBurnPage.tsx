import { BurnIncinerator } from "@/components/terminal/BurnIncinerator";
import { useWallet } from "@/contexts/WalletContext";
import { Wallet, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SolBurnPage() {
  const { isConnected, connect } = useWallet();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base sm:text-lg font-mono font-bold text-foreground flex items-center gap-2">
          <Flame className="h-5 w-5 text-terminal-red" />
          SOL BURN
        </h1>
        <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">
          Burn dust tokens, close empty accounts, reclaim SOL rent
        </p>
      </div>

      {!isConnected ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-3">
          <Wallet className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-xs font-mono text-muted-foreground">Connect your wallet to access the Burn Incinerator</p>
          <Button onClick={() => connect("phantom")} className="font-mono text-xs">
            👻 Connect Phantom
          </Button>
        </div>
      ) : (
        <BurnIncinerator />
      )}
    </div>
  );
}
