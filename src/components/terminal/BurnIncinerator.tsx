import { useState, useMemo } from "react";
import { Flame, AlertTriangle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useWalletTokens, TokenBalance } from "@/hooks/useWalletTokens";
import { toast } from "sonner";
import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { createBurnInstruction, TOKEN_PROGRAM_ID } from "@solana/spl-token";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

export function BurnIncinerator() {
  const { isConnected, walletAddress, getWalletObject } = useWallet();
  const { data: walletData, isLoading, refetch } = useWalletTokens();
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const [burnAmount, setBurnAmount] = useState("");
  const [isBurning, setIsBurning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const burnableTokens: TokenBalance[] = useMemo(() => {
    if (!walletData?.tokens) return [];
    return walletData.tokens.filter((t) => t.balance > 0);
  }, [walletData]);

  const selectedToken =
    burnableTokens.find((t) => t.mint === selectedMint) ?? burnableTokens[0] ?? null;

  const handleBurn = () => {
    if (!selectedToken) return;
    const amt = parseFloat(burnAmount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (amt > selectedToken.balance) {
      toast.error("Insufficient balance");
      return;
    }
    setShowConfirm(true);
  };

  const confirmBurn = async () => {
    setShowConfirm(false);
    if (!selectedToken || !walletAddress) return;

    const wallet = getWalletObject();
    if (!wallet) {
      toast.error("Wallet not available for signing");
      return;
    }

    setIsBurning(true);
    try {
      const connection = new Connection(SOLANA_RPC, "confirmed");
      const amt = parseFloat(burnAmount);
      const rawAmount = BigInt(Math.floor(amt * Math.pow(10, selectedToken.decimals)));

      const ownerPubkey = new PublicKey(walletAddress);
      const mintPubkey = new PublicKey(selectedToken.mint);
      const tokenAccountPubkey = new PublicKey(selectedToken.tokenAccount);

      // Build SPL Token burn instruction
      const burnIx = createBurnInstruction(
        tokenAccountPubkey, // token account
        mintPubkey,         // mint
        ownerPubkey,        // owner / authority
        rawAmount,          // amount in raw units
        [],                 // multi-signers (none)
        TOKEN_PROGRAM_ID
      );

      const tx = new Transaction().add(burnIx);
      tx.feePayer = ownerPubkey;

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("finalized");
      tx.recentBlockhash = blockhash;

      toast.info(`🔥 Burning ${amt.toLocaleString()} ${selectedToken.symbol}…`, {
        description: "Awaiting wallet signature",
      });

      // Sign and send via the connected wallet extension
      const signed = await wallet.signTransaction(tx);
      const rawTx = (signed as Transaction).serialize();
      const sig = await connection.sendRawTransaction(rawTx, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      // Wait for confirmation
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      toast.success(`🔥 Burned ${amt.toLocaleString()} ${selectedToken.symbol}`, {
        description: `TX: ${sig.slice(0, 8)}…${sig.slice(-8)}`,
      });

      setBurnAmount("");
      refetch();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Burn failed";
      if (msg.includes("User rejected")) {
        toast.info("Transaction cancelled");
      } else {
        toast.error(msg);
      }
    } finally {
      setIsBurning(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-4 w-4 text-terminal-red" />
        <h3 className="text-xs font-mono font-bold text-foreground tracking-wide">BURN INCINERATOR</h3>
        <span className="ml-auto text-[10px] font-mono text-terminal-red bg-terminal-red/10 px-1.5 py-0.5 rounded">
          {isConnected ? `${burnableTokens.length} TOKENS` : "OFFLINE"}
        </span>
      </div>

      <div className="text-[10px] font-mono text-muted-foreground mb-1.5">SELECT TOKEN TO BURN</div>
      {isLoading ? (
        <div className="text-[10px] font-mono text-muted-foreground animate-pulse py-4 text-center">
          Loading token balances…
        </div>
      ) : burnableTokens.length === 0 ? (
        <div className="text-[10px] font-mono text-muted-foreground py-4 text-center">
          {isConnected ? "No SPL tokens found in wallet" : "Connect wallet to view tokens"}
        </div>
      ) : (
        <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
          {burnableTokens.map((token) => (
            <button
              key={token.mint}
              onClick={() => { setSelectedMint(token.mint); setBurnAmount(""); }}
              className={`w-full flex items-center gap-2 rounded px-2 py-1.5 text-left transition-colors ${
                selectedToken?.mint === token.mint
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
                <div className="text-[10px] font-mono text-muted-foreground">
                  {token.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedToken && (
        <>
          <div className="rounded bg-muted/30 border border-border p-2 mb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <input
                type="number"
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                placeholder={`Amount ${selectedToken.symbol}`}
                className="flex-1 bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              <button
                onClick={() => setBurnAmount(String(selectedToken.balance))}
                className="text-[9px] font-mono text-primary hover:text-primary/80 transition-colors"
              >
                MAX
              </button>
            </div>
          </div>

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
        </>
      )}

      {!isConnected && (
        <p className="text-[9px] font-mono text-muted-foreground mt-1.5">Connect wallet to burn tokens</p>
      )}
    </div>
  );
}
