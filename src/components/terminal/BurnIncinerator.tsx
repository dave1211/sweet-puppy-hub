import { useState } from "react";
import { Flame, AlertTriangle, Check, Zap } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

interface WhitelistedToken {
  address: string;
  symbol: string;
  name: string;
  icon: string;
  rewardMultiplier: number;
  minBurn: number;
  balance: number;
}

const WHITELISTED_TOKENS: WhitelistedToken[] = [
  { address: "TANNER...xxx", symbol: "$TANNER", name: "Tanner Coin", icon: "🐕", rewardMultiplier: 2.5, minBurn: 100, balance: 25_000 },
  { address: "SOL...xxx", symbol: "SOL", name: "Solana", icon: "◎", rewardMultiplier: 1.0, minBurn: 0.01, balance: 2.47 },
  { address: "BONK...xxx", symbol: "BONK", name: "Bonk", icon: "🦴", rewardMultiplier: 1.5, minBurn: 10000, balance: 5_000_000 },
  { address: "WIF...xxx", symbol: "WIF", name: "dogwifhat", icon: "🎩", rewardMultiplier: 1.8, minBurn: 5, balance: 320 },
  { address: "JUP...xxx", symbol: "JUP", name: "Jupiter", icon: "🪐", rewardMultiplier: 1.2, minBurn: 1, balance: 89 },
];

export function BurnIncinerator() {
  const { isConnected } = useWallet();
  const [selectedToken, setSelectedToken] = useState<WhitelistedToken>(WHITELISTED_TOKENS[0]);
  const [burnAmount, setBurnAmount] = useState("");
  const [isBurning, setIsBurning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const totalBurned = 1_284_750;
  const burnReward = burnAmount ? (parseFloat(burnAmount) * selectedToken.rewardMultiplier * 0.001) : 0;

  const handleBurn = () => {
    const amt = parseFloat(burnAmount);
    if (isNaN(amt) || amt < selectedToken.minBurn) {
      toast.error(`Minimum burn: ${selectedToken.minBurn} ${selectedToken.symbol}`);
      return;
    }
    if (amt > selectedToken.balance) {
      toast.error("Insufficient balance");
      return;
    }
    setShowConfirm(true);
  };

  const confirmBurn = () => {
    setShowConfirm(false);
    setIsBurning(true);
    setTimeout(() => {
      setIsBurning(false);
      setBurnAmount("");
      toast.success(
        `🔥 Burned ${parseFloat(burnAmount).toLocaleString()} ${selectedToken.symbol} → +${burnReward.toFixed(4)} SOL reward`,
      );
    }, 2200);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-4 w-4 text-terminal-red" />
        <h3 className="text-xs font-mono font-bold text-foreground tracking-wide">BURN INCINERATOR</h3>
        <span className="ml-auto text-[10px] font-mono text-terminal-red bg-terminal-red/10 px-1.5 py-0.5 rounded">
          🔥 {(totalBurned / 1_000_000).toFixed(2)}M BURNED
        </span>
      </div>

      {/* Token Selector */}
      <div className="text-[10px] font-mono text-muted-foreground mb-1.5">SELECT TOKEN TO BURN</div>
      <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
        {WHITELISTED_TOKENS.map((token) => (
          <button
            key={token.symbol}
            onClick={() => { setSelectedToken(token); setBurnAmount(""); }}
            className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
              selectedToken.symbol === token.symbol
                ? "bg-terminal-red/10 border border-terminal-red/30"
                : "bg-muted/20 border border-transparent hover:bg-muted/40"
            }`}
          >
            <span className="text-sm">{token.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-mono text-foreground">{token.symbol}</span>
              <span className="text-[9px] font-mono text-muted-foreground ml-1">{token.name}</span>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-mono text-muted-foreground">{token.balance.toLocaleString()}</div>
              <div className="text-[9px] font-mono text-terminal-amber">{token.rewardMultiplier}x</div>
            </div>
          </button>
        ))}
      </div>

      {/* Burn Input */}
      <div className="rounded bg-muted/30 border border-border p-2 mb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <input
            type="number"
            value={burnAmount}
            onChange={(e) => setBurnAmount(e.target.value)}
            placeholder={`Min ${selectedToken.minBurn}`}
            className="flex-1 bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            onClick={() => setBurnAmount(String(selectedToken.balance))}
            className="text-[9px] font-mono text-primary hover:text-primary/80 transition-colors"
          >
            MAX
          </button>
        </div>
        {burnAmount && parseFloat(burnAmount) > 0 && (
          <div className="flex items-center justify-between text-[9px] font-mono">
            <span className="text-muted-foreground">Estimated Reward</span>
            <span className="text-primary font-bold">+{burnReward.toFixed(4)} SOL</span>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="rounded bg-terminal-red/5 border border-terminal-red/30 p-2 mb-2">
          <div className="flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3 text-terminal-red" />
            <span className="text-[10px] font-mono font-bold text-terminal-red">IRREVERSIBLE</span>
          </div>
          <p className="text-[9px] font-mono text-muted-foreground mb-2">
            Burn {parseFloat(burnAmount).toLocaleString()} {selectedToken.symbol}? This cannot be undone.
          </p>
          <div className="flex gap-1">
            <button onClick={confirmBurn} className="flex-1 flex items-center justify-center gap-1 rounded bg-terminal-red/20 border border-terminal-red/40 py-1 text-[10px] font-mono text-terminal-red hover:bg-terminal-red/30">
              <Flame className="h-3 w-3" /> CONFIRM BURN
            </button>
            <button onClick={() => setShowConfirm(false)} className="flex-1 rounded bg-muted/30 border border-border py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground">
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Burn Button */}
      {!showConfirm && (
        <button
          onClick={handleBurn}
          disabled={isBurning || !isConnected || !burnAmount}
          className="w-full flex items-center justify-center gap-1.5 rounded bg-terminal-red/15 border border-terminal-red/30 py-2 text-[10px] font-mono text-terminal-red hover:bg-terminal-red/25 transition-colors disabled:opacity-40"
        >
          {isBurning ? (
            <span className="animate-pulse flex items-center gap-1"><Flame className="h-3 w-3 animate-bounce" /> Incinerating…</span>
          ) : (
            <><Flame className="h-3 w-3" /> BURN {selectedToken.symbol}</>
          )}
        </button>
      )}

      {!isConnected && (
        <p className="text-[9px] font-mono text-muted-foreground mt-1.5">Connect wallet to burn tokens</p>
      )}
    </div>
  );
}
