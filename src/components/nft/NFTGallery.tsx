import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useWalletStore } from "@/stores/walletStore";
import { Image, Send, ExternalLink, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { XRPLNft } from "@/types/xrpl";

function generateMockNFTs(): XRPLNft[] {
  return [
    { nftokenId: "000800000A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B", issuer: "rNFTIssuer1234abcdef", uri: "", taxon: 1, serial: 42, flags: 8, name: "XRPL Punk #042", description: "Rare collectible on XRPL", collection: "XRPL Punks", imageUrl: "" },
    { nftokenId: "000800001B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C", issuer: "rNFTIssuer5678ghijkl", uri: "", taxon: 2, serial: 7, flags: 8, name: "Sologenic Art #007", collection: "Sologenic Gallery", imageUrl: "" },
    { nftokenId: "000800002C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D", issuer: "rNFTIssuer9012mnopqr", uri: "", taxon: 1, serial: 156, flags: 9, transferFee: 500, name: "XRP Army Badge", collection: "XRP Community", imageUrl: "" },
  ];
}

export function NFTGallery() {
  const { isConnected } = useWalletStore();
  const nfts = useMemo(() => generateMockNFTs(), []);
  const [selectedNft, setSelectedNft] = useState<XRPLNft | null>(null);

  if (!isConnected) {
    return (
      <div className="terminal-panel p-6 text-center">
        <Image className="h-6 w-6 text-muted-foreground/10 mx-auto mb-2" />
        <p className="text-[9px] font-mono text-muted-foreground/30">Connect wallet to view NFTs</p>
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
        <span className="terminal-panel-subtitle">{nfts.length} items</span>
      </div>

      <div className="p-2 grid grid-cols-2 gap-1.5">
        {nfts.map((nft) => (
          <button
            key={nft.nftokenId}
            onClick={() => setSelectedNft(nft)}
            className="rounded bg-muted/20 border border-border/30 p-2 hover:bg-muted/30 hover:border-border/50 transition-all text-left group"
          >
            {/* Placeholder image */}
            <div className="aspect-square rounded bg-gradient-to-br from-primary/10 to-terminal-cyan/10 flex items-center justify-center mb-1.5">
              <Image className="h-6 w-6 text-muted-foreground/15" />
            </div>
            <p className="text-[9px] font-mono text-foreground/70 font-medium truncate">{nft.name ?? "Unnamed"}</p>
            <p className="text-[7px] font-mono text-muted-foreground/30 truncate">{nft.collection ?? "—"}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function NFTDetail({ nft, onBack }: { nft: XRPLNft; onBack: () => void }) {
  const handleTransfer = () => toast.info("NFT transfer flow (simulated)");

  return (
    <div className="terminal-panel">
      <div className="terminal-panel-header">
        <button onClick={onBack} className="text-[9px] font-mono text-primary/60 hover:text-primary">← Back</button>
        <span className="terminal-panel-subtitle">#{nft.serial}</span>
      </div>

      <div className="p-3 space-y-3">
        {/* Image */}
        <div className="aspect-square rounded bg-gradient-to-br from-primary/10 via-terminal-cyan/5 to-terminal-blue/10 flex items-center justify-center">
          <Image className="h-10 w-10 text-muted-foreground/15" />
        </div>

        {/* Details */}
        <div>
          <h3 className="text-sm font-mono font-bold text-foreground">{nft.name ?? "Unnamed NFT"}</h3>
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
          <Button onClick={handleTransfer} className="h-7 text-[9px] font-mono bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">
            <Send className="h-3 w-3 mr-1" /> Transfer
          </Button>
          <Button className="h-7 text-[9px] font-mono bg-muted/30 text-foreground/50 border border-border/40">
            <ExternalLink className="h-3 w-3 mr-1" /> Explorer
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
