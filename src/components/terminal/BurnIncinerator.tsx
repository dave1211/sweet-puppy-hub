import { useState, useMemo } from "react";
import { Flame, AlertTriangle, History, ExternalLink, Trash2, Coins } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWalletTokens, TokenBalance } from "@/hooks/useWalletTokens";
import { useBurnHistory, insertBurnRecord } from "@/hooks/useBurnHistory";
import { toast } from "sonner";
import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  createBurnInstruction,
  createCloseAccountInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const RENT_EXEMPT_MIN = 0.00203928;

export function BurnIncinerator() {
  const { isConnected, walletAddress, getWalletObject } = useWallet();
  const { user } = useAuth();
  const { data: walletData, isLoading, refetch } = useWalletTokens();
  const { data: burnHistory, refetch: refetchHistory } = useBurnHistory(walletAddress);
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const [burnAmount, setBurnAmount] = useState("");
  const [isBurning, setIsBurning] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [view, setView] = useState<"tokens" | "history" | "bulk">("tokens");

  const burnableTokens: TokenBalance[] = useMemo(() => {
    if (!walletData?.tokens) return [];
    return walletData.tokens.filter((t) => t.balance > 0);
  }, [walletData]);

  // Dust accounts: tokens with near-zero balance (< 0.01 value)
  const dustAccounts = useMemo(() => {
    if (!walletData?.tokens) return [];
    return walletData.tokens.filter((t) => t.balance > 0 && t.balance < 1);
  }, [walletData]);

  const selectedToken =
    burnableTokens.find((t) => t.mint === selectedMint) ?? burnableTokens[0] ?? null;

  const isBurningFullBalance =
    selectedToken && burnAmount && parseFloat(burnAmount) >= selectedToken.balance;

  // Total rent reclaimed from burn history
  const totalRentReclaimed = useMemo(() => {
    if (!burnHistory) return 0;
    return burnHistory.reduce((sum, b) => sum + (b.rent_reclaimed ?? 0), 0);
  }, [burnHistory]);

  const accountsClosed = useMemo(() => {
    if (!burnHistory) return 0;
    return burnHistory.filter((b) => b.account_closed).length;
  }, [burnHistory]);

  const handleBurn = () => {
    if (!selectedToken) return;
    const amt = parseFloat(burnAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > selectedToken.balance) { toast.error("Insufficient balance"); return; }
    setShowConfirm(true);
  };

  const executeBurn = async (
    token: TokenBalance,
    amount: number,
    closeAccount: boolean
  ): Promise<string> => {
    const wallet = getWalletObject();
    if (!wallet || !walletAddress) throw new Error("Wallet not available");

    const connection = new Connection(SOLANA_RPC, "confirmed");
    const rawAmount = BigInt(Math.floor(amount * Math.pow(10, token.decimals)));
    const ownerPubkey = new PublicKey(walletAddress);
    const mintPubkey = new PublicKey(token.mint);
    const tokenAccountPubkey = new PublicKey(token.tokenAccount);

    const tx = new Transaction();
    tx.add(createBurnInstruction(tokenAccountPubkey, mintPubkey, ownerPubkey, rawAmount, [], TOKEN_PROGRAM_ID));
    if (closeAccount) {
      tx.add(createCloseAccountInstruction(tokenAccountPubkey, ownerPubkey, ownerPubkey, [], TOKEN_PROGRAM_ID));
    }

    tx.feePayer = ownerPubkey;
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
    tx.recentBlockhash = blockhash;

    const signed = await wallet.signTransaction(tx);
    const rawTx = (signed as Transaction).serialize();
    const sig = await connection.sendRawTransaction(rawTx, { skipPreflight: false, preflightCommitment: "confirmed" });
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
    return sig;
  };

  const confirmBurn = async () => {
    setShowConfirm(false);
    if (!selectedToken || !walletAddress) return;
    setIsBurning(true);
    try {
      const amt = parseFloat(burnAmount);
      const willClose = amt >= selectedToken.balance;

      toast.info(`🔥 Burning ${amt.toLocaleString()} ${selectedToken.symbol}${willClose ? " + closing account" : ""}…`, { description: "Awaiting wallet signature" });

      const sig = await executeBurn(selectedToken, amt, willClose);
      const rentReclaimed = willClose ? RENT_EXEMPT_MIN : 0;

      toast.success(`🔥 Burned ${amt.toLocaleString()} ${selectedToken.symbol}`, {
        description: willClose ? `Account closed · ~${rentReclaimed} SOL reclaimed` : `TX: ${sig.slice(0, 8)}…${sig.slice(-8)}`,
      });

      await insertBurnRecord({
        user_id: user?.id || "",
        wallet_address: walletAddress,
        token_mint: selectedToken.mint,
        token_symbol: selectedToken.symbol,
        token_name: selectedToken.name,
        amount: amt,
        decimals: selectedToken.decimals,
        signature: sig,
        account_closed: willClose,
        rent_reclaimed: rentReclaimed,
      });

      setBurnAmount("");
      refetch();
      refetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Burn failed";
      if (msg.includes("User rejected")) toast.info("Transaction cancelled");
      else toast.error(msg);
    } finally {
      setIsBurning(false);
    }
  };

  // Bulk burn: burn all dust accounts and close them
  const handleBulkBurn = async () => {
    if (!walletAddress || dustAccounts.length === 0) return;
    const wallet = getWalletObject();
    if (!wallet) { toast.error("Wallet not available"); return; }

    setIsBurning(true);
    try {
      const connection = new Connection(SOLANA_RPC, "confirmed");
      const ownerPubkey = new PublicKey(walletAddress);
      const tx = new Transaction();

      // Solana tx size limit ~1232 bytes, each burn+close is ~2 instructions
      // Safe to batch ~6-8 accounts per tx
      const batch = dustAccounts.slice(0, 7);

      for (const token of batch) {
        const mintPubkey = new PublicKey(token.mint);
        const tokenAccountPubkey = new PublicKey(token.tokenAccount);
        const rawAmount = BigInt(Math.floor(token.balance * Math.pow(10, token.decimals)));

        tx.add(createBurnInstruction(tokenAccountPubkey, mintPubkey, ownerPubkey, rawAmount, [], TOKEN_PROGRAM_ID));
        tx.add(createCloseAccountInstruction(tokenAccountPubkey, ownerPubkey, ownerPubkey, [], TOKEN_PROGRAM_ID));
      }

      tx.feePayer = ownerPubkey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("finalized");
      tx.recentBlockhash = blockhash;

      toast.info(`🔥 Burning ${batch.length} dust accounts…`, { description: "Awaiting wallet signature" });

      const signed = await wallet.signTransaction(tx);
      const rawTx = (signed as Transaction).serialize();
      const sig = await connection.sendRawTransaction(rawTx, { skipPreflight: false, preflightCommitment: "confirmed" });
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");

      const rentReclaimed = batch.length * RENT_EXEMPT_MIN;
      toast.success(`🔥 Closed ${batch.length} dust accounts`, {
        description: `~${rentReclaimed.toFixed(4)} SOL reclaimed · TX: ${sig.slice(0, 8)}…`,
      });

      // Record each burn in DB
      for (const token of batch) {
        await insertBurnRecord({
          wallet_address: walletAddress,
          token_mint: token.mint,
          token_symbol: token.symbol,
          token_name: token.name,
          amount: token.balance,
          decimals: token.decimals,
          signature: sig,
          account_closed: true,
          rent_reclaimed: RENT_EXEMPT_MIN,
        });
      }

      refetch();
      refetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bulk burn failed";
      if (msg.includes("User rejected")) toast.info("Transaction cancelled");
      else toast.error(msg);
    } finally {
      setIsBurning(false);
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Flame className="h-4 w-4 text-terminal-red" />
        <h3 className="text-xs font-mono font-bold text-foreground tracking-wide">BURN INCINERATOR</h3>
        <div className="ml-auto flex items-center gap-1">
          {(["tokens", "bulk", "history"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                view === v ? "bg-terminal-red/15 text-terminal-red" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "tokens" ? "BURN" : v === "bulk" ? "BULK" : "LOG"}
            </button>
          ))}
        </div>
      </div>

      {/* Rent Reclaimed Counter */}
      {burnHistory && burnHistory.length > 0 && (
        <div className="flex items-center gap-3 mb-3 rounded bg-primary/5 border border-primary/20 px-2 py-1.5">
          <Coins className="h-3 w-3 text-primary shrink-0" />
          <div className="flex-1 flex items-center justify-between">
            <span className="text-[9px] font-mono text-muted-foreground">TOTAL RENT RECLAIMED</span>
            <span className="text-[10px] font-mono font-bold text-primary">{totalRentReclaimed.toFixed(4)} SOL</span>
          </div>
          <span className="text-[8px] font-mono text-muted-foreground">{accountsClosed} closed</span>
        </div>
      )}

      {/* ── BULK VIEW ── */}
      {view === "bulk" && (
        <div className="space-y-2">
          <div className="text-[10px] font-mono text-muted-foreground">DUST ACCOUNTS (balance &lt; 1)</div>
          {dustAccounts.length === 0 ? (
            <p className="text-[10px] font-mono text-muted-foreground py-4 text-center">
              {isConnected ? "No dust accounts found" : "Connect wallet to scan"}
            </p>
          ) : (
            <>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {dustAccounts.map((t) => (
                  <div key={t.mint} className="flex items-center gap-2 rounded bg-muted/20 border border-border px-2 py-1.5">
                    <Trash2 className="h-3 w-3 text-terminal-red/50 shrink-0" />
                    <span className="text-[10px] font-mono text-foreground flex-1">{t.symbol}</span>
                    <span className="text-[9px] font-mono text-muted-foreground">
                      {t.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                    </span>
                  </div>
                ))}
              </div>
              <div className="rounded bg-terminal-red/5 border border-terminal-red/20 p-2">
                <p className="text-[9px] font-mono text-muted-foreground mb-1">
                  Close {Math.min(dustAccounts.length, 7)} accounts → reclaim ~{(Math.min(dustAccounts.length, 7) * RENT_EXEMPT_MIN).toFixed(4)} SOL
                </p>
                <button
                  onClick={handleBulkBurn}
                  disabled={isBurning || !isConnected}
                  className="w-full flex items-center justify-center gap-1.5 rounded bg-terminal-red/15 border border-terminal-red/30 py-2 text-[10px] font-mono text-terminal-red hover:bg-terminal-red/25 transition-colors disabled:opacity-40"
                >
                  {isBurning ? (
                    <span className="animate-pulse flex items-center gap-1"><Flame className="h-3 w-3 animate-bounce" /> Incinerating…</span>
                  ) : (
                    <><Flame className="h-3 w-3" /> BULK BURN & CLOSE</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── HISTORY VIEW ── */}
      {view === "history" && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {!burnHistory || burnHistory.length === 0 ? (
            <p className="text-[10px] font-mono text-muted-foreground py-4 text-center">No burn history yet</p>
          ) : (
            burnHistory.map((b) => (
              <div key={b.id} className="flex items-center gap-2 rounded bg-muted/20 border border-border px-2 py-1.5">
                <Flame className="h-3 w-3 text-terminal-red shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-foreground">
                    {b.amount.toLocaleString()} {b.token_symbol}
                  </div>
                  <div className="text-[8px] font-mono text-muted-foreground">
                    {new Date(b.created_at).toLocaleDateString()}{" "}
                    {b.account_closed && <span className="text-primary">+{b.rent_reclaimed} SOL</span>}
                  </div>
                </div>
                <a href={`https://solscan.io/tx/${b.signature}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TOKEN BURN VIEW ── */}
      {view === "tokens" && (
        <>
          <div className="text-[10px] font-mono text-muted-foreground mb-1.5">SELECT TOKEN TO BURN</div>
          {isLoading ? (
            <div className="text-[10px] font-mono text-muted-foreground animate-pulse py-4 text-center">Loading token balances…</div>
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
                  <button onClick={() => setBurnAmount(String(selectedToken.balance))} className="text-[9px] font-mono text-primary hover:text-primary/80 transition-colors">MAX</button>
                </div>
                {isBurningFullBalance && (
                  <p className="text-[9px] font-mono text-primary">✓ Account will be closed · ~{RENT_EXEMPT_MIN} SOL reclaimed</p>
                )}
              </div>

              {showConfirm && (
                <div className="rounded bg-terminal-red/5 border border-terminal-red/30 p-2 mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <AlertTriangle className="h-3 w-3 text-terminal-red" />
                    <span className="text-[10px] font-mono font-bold text-terminal-red">IRREVERSIBLE</span>
                  </div>
                  <p className="text-[9px] font-mono text-muted-foreground mb-2">
                    Burn {parseFloat(burnAmount).toLocaleString()} {selectedToken.symbol}?
                    {isBurningFullBalance && " Account will be closed."} This cannot be undone.
                  </p>
                  <div className="flex gap-1">
                    <button onClick={confirmBurn} className="flex-1 flex items-center justify-center gap-1 rounded bg-terminal-red/20 border border-terminal-red/40 py-1 text-[10px] font-mono text-terminal-red hover:bg-terminal-red/30">
                      <Flame className="h-3 w-3" /> CONFIRM
                    </button>
                    <button onClick={() => setShowConfirm(false)} className="flex-1 rounded bg-muted/30 border border-border py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground">CANCEL</button>
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
        </>
      )}

      {!isConnected && (
        <p className="text-[9px] font-mono text-muted-foreground mt-1.5">Connect wallet to burn tokens</p>
      )}
    </div>
  );
}
