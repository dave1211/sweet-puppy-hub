import { useState } from "react";
import { Wallet, LogOut, ChevronDown, Loader2 } from "lucide-react";
import { useWalletStore } from "@/stores/walletStore";
import { connectWallet, disconnectWallet } from "@/services/walletService";
import { xrplService } from "@/services/xrplService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { WalletProviderType } from "@/types/xrpl";

export function XRPLWalletButton() {
  const {
    isConnected,
    address,
    provider,
    xrpBalance,
    isConnecting,
    setConnected,
    disconnect,
    setXRPBalance,
    setTokenBalances,
    setError,
    setConnecting,
  } = useWalletStore();
  const [open, setOpen] = useState(false);

  const handleConnect = async (p: WalletProviderType) => {
    setConnecting(true);
    try {
      const result = await connectWallet(p);
      setConnected(result.address, result.provider);
      toast.success(`Connected via ${p}`);

      // Fetch balances
      const balances = await xrplService.getBalances(result.address);
      setXRPBalance(balances.xrpDrops);
      setTokenBalances(balances.tokens);
    } catch (err: any) {
      setError(err?.message ?? "Connection failed");
      toast.error(err?.message ?? "Connection failed");
    }
    setOpen(false);
  };

  const handleDisconnect = () => {
    disconnectWallet();
    disconnect();
    toast.info("Wallet disconnected");
    setOpen(false);
  };

  const xrpDisplay = (Number(xrpBalance) / 1_000_000).toFixed(2);

  if (isConnected && address) {
    const short = `${address.slice(0, 4)}…${address.slice(-4)}`;
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-2.5 py-1.5 text-[10px] font-mono text-primary hover:bg-primary/10 transition-colors">
            <Wallet className="h-3 w-3" />
            <span>{short}</span>
            <span className="text-muted-foreground ml-1">{xrpDisplay} XRP</span>
            <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem disabled className="text-[10px] font-mono text-muted-foreground">
            {provider?.toUpperCase()}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDisconnect}
            className="text-[10px] font-mono text-destructive"
          >
            <LogOut className="h-3 w-3 mr-1.5" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isConnecting}
          className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors disabled:opacity-50"
        >
          {isConnecting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Wallet className="h-3 w-3" />
          )}
          {isConnecting ? "Connecting…" : "Connect Wallet"}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          onClick={() => handleConnect("xaman")}
          className="text-[11px] font-mono"
        >
          🔵 Xaman (XUMM)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleConnect("crossmark")}
          className="text-[11px] font-mono"
        >
          ✖️ Crossmark
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => handleConnect("ledger")}
          className="text-[11px] font-mono text-muted-foreground"
        >
          🔒 Ledger (coming soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
