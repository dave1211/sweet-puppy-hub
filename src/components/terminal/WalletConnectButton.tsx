import { useState } from "react";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function WalletConnectButton() {
  const { isConnected, walletAddress, provider, balanceSOL, connect, disconnect } = useWallet();
  const [open, setOpen] = useState(false);

  if (isConnected && walletAddress) {
    const short = `${walletAddress.slice(0, 4)}…${walletAddress.slice(-4)}`;
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-2 py-1 text-[10px] font-mono text-primary hover:bg-primary/10 transition-colors">
            <Wallet className="h-3 w-3" /><span>{short}</span>
            {balanceSOL !== null && <span className="text-muted-foreground ml-1">{balanceSOL.toFixed(2)} SOL</span>}
            <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem disabled className="text-[10px] font-mono text-muted-foreground">{provider?.toUpperCase()}</DropdownMenuItem>
          <DropdownMenuItem onClick={disconnect} className="text-[10px] font-mono text-destructive"><LogOut className="h-3 w-3 mr-1.5" />Disconnect</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded border border-border px-2 py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors">
          <Wallet className="h-3 w-3" />Connect
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => { connect("phantom"); setOpen(false); }} className="text-[10px] font-mono">👻 Phantom</DropdownMenuItem>
        <DropdownMenuItem onClick={() => { connect("solflare"); setOpen(false); }} className="text-[10px] font-mono">🔆 Solflare</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}