import { Share2 } from "lucide-react";
import { toast } from "sonner";

interface ShareSignalButtonProps { symbol: string; score: number; change24h: number; address: string; price?: number; volume24h?: number; liquidity?: number; }

export function ShareSignalButton({ symbol, score, change24h, address, price, volume24h, liquidity }: ShareSignalButtonProps) {
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const lines = [`🎯 ${symbol} Signal — Score ${score}/100`, `📈 ${change24h >= 0 ? "+" : ""}${change24h.toFixed(1)}% (24h)`];
    if (price != null) lines.push(`💰 Price: $${price < 0.01 ? price.toFixed(6) : price.toFixed(4)}`);
    if (volume24h != null && volume24h > 0) lines.push(`📊 Vol: ${volume24h >= 1e6 ? `$${(volume24h / 1e6).toFixed(1)}M` : volume24h >= 1e3 ? `$${(volume24h / 1e3).toFixed(0)}K` : `$${volume24h.toFixed(0)}`}`);
    if (liquidity != null && liquidity > 0) lines.push(`🔒 Liq: ${liquidity >= 1e6 ? `$${(liquidity / 1e6).toFixed(1)}M` : liquidity >= 1e3 ? `$${(liquidity / 1e3).toFixed(0)}K` : `$${liquidity.toFixed(0)}`}`);
    lines.push(`⏰ ${now}`, "", "Spotted on Tanner Terminal 🟢");
    const text = lines.join("\n");
    const url = `${window.location.origin}?token=${address}`;
    if (navigator.share) { navigator.share({ title: `${symbol} Signal`, text, url }).catch(() => {}); }
    else { navigator.clipboard.writeText(`${text}\n${url}`); toast.success("Signal copied to clipboard"); }
  };
  return (
    <button onClick={handleShare} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Share signal">
      <Share2 className="h-3 w-3" />
    </button>
  );
}