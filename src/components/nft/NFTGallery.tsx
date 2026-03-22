import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/stores/walletStore";
import { xrplService } from "@/services/xrplService";
import { Image, Send, ExternalLink, Grid3X3, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { XRPLNft } from "@/types/xrpl";

export function NFTGallery() {
  const { isConnected, address } = useWalletStore();
  const [nfts, setNfts] = useState<XRPLNft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNft, setSelectedNft] = useState<XRPLNft | null>(null);

  const fetchNFTs = async () => {
    if (!address) return;
    setIsLoading(true);
    try {
      const results = await xrplService.getAccountNFTs(address);
      setNfts(results);
    } catch {
      toast.error("Failed to fetch NFTs");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isConnected && address) {
      fetchNFTs();
    } else {
      setNfts([]);
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <div className="terminal-panel p-6 text-center">
        <Image className="h-6 w-6 text-muted-foreground/10 mx-auto mb-2" />
        <p className="text-[9px] font-mono text-muted-foreground/30">Connect XRPL wallet to view NFTs</p>
      </div>
    );
  }

  if (selectedNft) {
    return <NFTDetail nft={selectedNft} onBack={() => setSelectedNft(null)} />;
  }

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <div className="flex items-center gap-1.5">
          <Grid3X3 className="h-3 w-3 text-muted-foreground/50" />
          <span className="terminal-panel-title">NFT Collection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="terminal-panel-subtitle">{isLoading ? "Loading…" : `${nfts.length} items`}</span>
          <button onClick={fetchNFTs} disabled={isLoading} className="p-0.5 hover:bg-muted/30 rounded">
            <RefreshCw className={cn("h-2.5 w-2.5 text-muted-foreground/40", isLoading && "animate-spin")} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8 gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-[9px] font-mono text-muted-foreground">Fetching NFTs from XRPL…</span>
        </div>
      ) : nfts.length === 0 ? (
        <div className="py-8 text-center">
          <Image className="h-6 w-6 text-muted-foreground/10 mx-auto mb-2" />
          <p className="text-[9px] font-mono text-muted-foreground/30">No NFTs found on this account</p>
        </div>
      ) : (
        <div className="p-2 grid grid-cols-2 gap-1.5">
          {nfts.map((nft) => (
            <button
              key={nft.nftokenId}
              onClick={() => setSelectedNft(nft)}
              className="rounded bg-muted/20 border border-border/30 p-2 hover:bg-muted/30 hover:border-border/50 transition-all text-left group"
            >
              {nft.imageUrl ? (
                <div className="aspect-square rounded overflow-hidden mb-1.5 bg-muted/30">
                  <img
                    src={nft.imageUrl}
                    alt={nft.name ?? "NFT"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              ) : (
                <div className="aspect-square rounded bg-gradient-to-br from-primary/10 to-terminal-cyan/10 flex items-center justify-center mb-1.5">
                  <Image className="h-6 w-6 text-muted-foreground/15" />
                </div>
              )}
              <p className="text-[9px] font-mono text-foreground/70 font-medium truncate">
                {nft.name ?? `NFT #${nft.serial}`}
              </p>
              <p className="text-[7px] font-mono text-muted-foreground/30 truncate">
                {nft.collection ?? nft.issuer.slice(0, 12) + "…"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function NFTDetail({ nft, onBack }: { nft: XRPLNft; onBack: () => void }) {
  const explorerUrl = `https://xrpl.org/resources/dev-tools/xrp-ledger-explorer?nft=${nft.nftokenId}`;

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <button onClick={onBack} className="text-[9px] font-mono text-primary/60 hover:text-primary">← Back</button>
        <span className="terminal-panel-subtitle">#{nft.serial}</span>
      </div>

      <div className="p-3 space-y-3">
        {nft.imageUrl ? (
          <div className="aspect-square rounded overflow-hidden bg-muted/30">
            <img src={nft.imageUrl} alt={nft.name ?? "NFT"} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="aspect-square rounded bg-gradient-to-br from-primary/10 via-terminal-cyan/5 to-terminal-blue/10 flex items-center justify-center">
            <Image className="h-10 w-10 text-muted-foreground/15" />
          </div>
        )}

        <div>
          <h3 className="text-sm font-mono font-bold text-foreground">{nft.name ?? `NFT #${nft.serial}`}</h3>
          <p className="text-[9px] font-mono text-muted-foreground/50 mt-0.5">{nft.collection ?? "Unknown collection"}</p>
        </div>

        {nft.description && (
          <p className="text-[9px] font-mono text-muted-foreground/40 leading-relaxed">{nft.description}</p>
        )}

        <div className="space-y-1 text-[9px] font-mono">
          <DetailRow label="Token ID" value={nft.nftokenId.slice(0, 16) + "…"} />
          <DetailRow label="Issuer" value={nft.issuer.slice(0, 12) + "…"} />
          <DetailRow label="Taxon" value={String(nft.taxon)} />
          <DetailRow label="Serial" value={String(nft.serial)} />
          {nft.transferFee !== undefined && (
            <DetailRow label="Transfer Fee" value={`${(nft.transferFee / 1000).toFixed(1)}%`} />
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <Button onClick={() => toast.info("NFT transfer requires wallet signing")} className="h-7 text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
            <Send className="h-3 w-3 mr-1" /> Transfer
          </Button>
          <Button asChild className="h-7 text-[9px] font-mono bg-muted/30 text-foreground/50 border border-border/40">
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" /> Explorer
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground/40">{label}</span>
      <span className="text-foreground/60 tabular-nums">{value}</span>
    </div>
  );
}
