import { useState } from "react";
import { Wallet, LogOut, ChevronDown, RefreshCw, Copy, ExternalLink, Loader2 } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function WalletConnectButton() {
  const { isConnected, walletAddress, provider, balanceSOL, isLoading, connect, disconnect, refreshBalance } = useWallet();
  const [open, setOpen] = useState(false);

  const handleConnect = async (providerType: "phantom" | "solflare" | "backpack") => {
    setOpen(false);
    try {
      await connect(providerType);
    } catch {
      // Errors are already surfaced by WalletContext toasts/logs.
    }
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast.success("Address copied");
    }
  };

  const openExplorer = () => {
    if (walletAddress) {
      window.open(`https://solscan.io/account/${walletAddress}`, "_blank");
    }
  };

  if (isConnected && walletAddress) {
    const short = `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-2 py-1 text-[10px] font-mono text-primary hover:bg-primary/10 transition-colors">
            <span className="h-1.5 w-1.5 rounded-full bg-terminal-green animate-pulse" />
            <Wallet className="h-3 w-3" />
            <span>{short}</span>
            {balanceSOL !== null && <span className="text-muted-foreground ml-1">{balanceSOL.toFixed(3)} SOL</span>}
            <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem disabled className="text-[10px] font-mono text-muted-foreground">
            {provider === "phantom" ? "👻" : provider === "backpack" ? "🎒" : "🔆"} {provider?.toUpperCase()}
          </DropdownMenuItem>
          <DropdownMenuItem disabled className="text-[9px] font-mono text-muted-foreground truncate">
            {walletAddress}
          </DropdownMenuItem>
          {balanceSOL !== null && (
            <DropdownMenuItem disabled className="text-[10px] font-mono text-foreground font-bold">
              {balanceSOL.toFixed(4)} SOL
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} className="text-[10px] font-mono">
            <Copy className="h-3 w-3 mr-1.5" />Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openExplorer} className="text-[10px] font-mono">
            <ExternalLink className="h-3 w-3 mr-1.5" />View on Solscan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => refreshBalance()} className="text-[10px] font-mono">
            <RefreshCw className="h-3 w-3 mr-1.5" />Refresh Balance
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnect} className="text-[10px] font-mono text-destructive">
            <LogOut className="h-3 w-3 mr-1.5" />Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded border border-border px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wallet className="h-3 w-3" />}
          {isLoading ? "Connecting…" : "Connect Wallet"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => { void handleConnect("phantom"); }} className="text-[10px] font-mono">
          👻 Phantom
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { void handleConnect("solflare"); }} className="text-[10px] font-mono">
          🔆 Solflare
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => { void handleConnect("backpack"); }} className="text-[10px] font-mono">
          🎒 Backpack
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-[8px] font-mono text-muted-foreground/60">
          Connects to Solana mainnet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
