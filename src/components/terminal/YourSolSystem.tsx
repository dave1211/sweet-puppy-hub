import { useState } from "react";
import { Coins, Wallet, TrendingUp, Lock, ArrowRight, Flame } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

type ClaimOption = "wallet" | "stake" | "micro-invest";

const MICRO_INVEST_ASSETS = [
  { id: "xrp", label: "XRP", icon: "🌐", color: "text-blue-400" },
  { id: "xlm", label: "XLM", icon: "⭐", color: "text-cyan-400" },
  { id: "hbar", label: "HBAR", icon: "♦️", color: "text-purple-400" },
  { id: "qnt", label: "QNT", icon: "🔗", color: "text-orange-400" },
  { id: "gold", label: "Gold", icon: "🥇", color: "text-yellow-400" },
  { id: "silver", label: "Silver", icon: "🥈", color: "text-gray-300" },
  { id: "tsla", label: "Tesla", icon: "⚡", color: "text-red-400" },
];

export function YourSolSystem() {
  const { isConnected } = useWallet();
  const [claimOption, setClaimOption] = useState<ClaimOption>("wallet");
  const [selectedAsset, setSelectedAsset] = useState("xrp");
  const [claimAmount, setClaimAmount] = useState("0.05");
  const [isProcessing, setIsProcessing] = useState(false);

  // Simulated claimable balance
  const claimableSOL = 0.247;
  const stakedTanner = 12_500;
  const totalEarned = 1.83;

  const handleClaim = () => {
    if (!isConnected) {
      toast.error("Connect wallet first");
      return;
    }
    const amt = parseFloat(claimAmount);
    if (isNaN(amt) || amt <= 0 || amt > claimableSOL) {
      toast.error("Invalid amount");
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (claimOption === "wallet") {
        toast.success(`${amt} SOL claimed to wallet`);
      } else if (claimOption === "stake") {
        toast.success(`${amt} SOL converted to staked $TANNER`);
      } else {
        const asset = MICRO_INVEST_ASSETS.find((a) => a.id === selectedAsset);
        toast.success(`${amt} SOL micro-invested into ${asset?.label}`);
      }
    }, 1800);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-3">
        <Coins className="h-4 w-4 text-primary" />
        <h3 className="text-xs font-mono font-bold text-foreground tracking-wide">YOUR SOL SYSTEM</h3>
        <span className="ml-auto text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">LIVE</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded bg-muted/50 p-2 text-center">
          <div className="text-[10px] font-mono text-muted-foreground">CLAIMABLE</div>
          <div className="text-sm font-mono font-bold text-primary">{claimableSOL} SOL</div>
        </div>
        <div className="rounded bg-muted/50 p-2 text-center">
          <div className="text-[10px] font-mono text-muted-foreground">STAKED</div>
          <div className="text-sm font-mono font-bold text-terminal-amber">{stakedTanner.toLocaleString()} $T</div>
        </div>
        <div className="rounded bg-muted/50 p-2 text-center">
          <div className="text-[10px] font-mono text-muted-foreground">TOTAL EARNED</div>
          <div className="text-sm font-mono font-bold text-terminal-green">{totalEarned} SOL</div>
        </div>
      </div>

      {/* Claim Options */}
      <div className="flex gap-1 mb-3">
        {[
          { key: "wallet" as const, label: "Claim SOL", icon: Wallet },
          { key: "stake" as const, label: "Stake $TANNER", icon: Lock },
          { key: "micro-invest" as const, label: "Micro-Invest", icon: TrendingUp },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setClaimOption(key)}
            className={`flex-1 flex items-center justify-center gap-1 rounded px-2 py-1.5 text-[10px] font-mono transition-colors ${
              claimOption === key
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Micro-invest asset selector */}
      {claimOption === "micro-invest" && (
        <div className="mb-3">
          <div className="text-[10px] font-mono text-muted-foreground mb-1.5">SELECT ASSET</div>
          <div className="grid grid-cols-4 gap-1">
            {MICRO_INVEST_ASSETS.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setSelectedAsset(asset.id)}
                className={`flex flex-col items-center rounded px-1 py-1.5 text-[9px] font-mono transition-colors ${
                  selectedAsset === asset.id
                    ? "bg-primary/15 text-primary border border-primary/30"
                    : "bg-muted/20 text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                <span className="text-sm">{asset.icon}</span>
                <span className={asset.color}>{asset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Amount + Action */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="number"
            value={claimAmount}
            onChange={(e) => setClaimAmount(e.target.value)}
            step="0.01"
            min="0"
            max={claimableSOL}
            className="w-full rounded bg-muted/50 border border-border px-2 py-1.5 text-xs font-mono text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
            placeholder="Amount SOL"
          />
        </div>
        <button
          onClick={handleClaim}
          disabled={isProcessing || !isConnected}
          className="flex items-center gap-1 rounded bg-primary/20 border border-primary/30 px-3 py-1.5 text-[10px] font-mono text-primary hover:bg-primary/30 transition-colors disabled:opacity-40"
        >
          {isProcessing ? (
            <span className="animate-pulse">Processing…</span>
          ) : (
            <>
              <ArrowRight className="h-3 w-3" />
              {claimOption === "wallet" ? "CLAIM" : claimOption === "stake" ? "STAKE" : "INVEST"}
            </>
          )}
        </button>
      </div>
      {!isConnected && (
        <p className="text-[9px] font-mono text-muted-foreground mt-1.5">Connect wallet to claim</p>
      )}
    </div>
  );
}
