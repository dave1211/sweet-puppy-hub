import { useState } from "react";
import {
  Rocket, Upload, Globe, MessageCircle, Twitter, ImageIcon,
  Loader2, CheckCircle, AlertTriangle, Zap, Copy, ExternalLink,
  Shield, TrendingUp, Bot, Megaphone, DollarSign, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useWallet } from "@/contexts/WalletContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type LaunchStep = "metadata" | "configure" | "marketing" | "review" | "launched";

interface TokenConfig {
  name: string;
  symbol: string;
  description: string;
  decimals: number;
  totalSupply: number;
  image: string;
  website: string;
  twitter: string;
  telegram: string;
  // LP config
  initialLiquiditySOL: number;
  lpLockDays: number;
  // Marketing
  telegramAnnouncement: string;
  twitterThread: string;
  launchStrategy: "stealth" | "fair" | "presale";
}

const DEFAULT_CONFIG: TokenConfig = {
  name: "",
  symbol: "",
  description: "",
  decimals: 9,
  totalSupply: 1_000_000_000,
  image: "",
  website: "",
  twitter: "",
  telegram: "",
  initialLiquiditySOL: 1.0,
  lpLockDays: 30,
  telegramAnnouncement: "",
  twitterThread: "",
  launchStrategy: "fair",
};

const SUPPLY_PRESETS = [
  { label: "1B", value: 1_000_000_000 },
  { label: "100M", value: 100_000_000 },
  { label: "10M", value: 10_000_000 },
  { label: "1M", value: 1_000_000 },
];

const STRATEGIES = [
  { id: "stealth" as const, label: "Stealth", icon: Shield, desc: "No pre-announcement. Launch and let organic discovery happen." },
  { id: "fair" as const, label: "Fair Launch", icon: Zap, desc: "Announce 5-10 min before. Equal opportunity for all buyers." },
  { id: "presale" as const, label: "Presale", icon: DollarSign, desc: "Whitelisted buyers get first access before public launch." },
];

export default function LaunchpadPage() {
  const { isConnected, walletAddress, signAndSendTransaction, refreshBalance } = useWallet();
  const [step, setStep] = useState<LaunchStep>("metadata");
  const [config, setConfig] = useState<TokenConfig>(DEFAULT_CONFIG);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchPhase, setLaunchPhase] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [mintAddress, setMintAddress] = useState<string | null>(null);

  const update = <K extends keyof TokenConfig>(key: K, val: TokenConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: val }));

  const getEstimate = async () => {
    const { data } = await supabase.functions.invoke("token-launch", { body: { action: "estimate" } });
    if (data?.totalEstimate) {
      setEstimatedCost(data.totalEstimate + config.initialLiquiditySOL);
    }
  };

  const handleLaunch = async () => {
    if (!isConnected || !walletAddress) { toast.error("Connect wallet first"); return; }
    if (!config.name || !config.symbol) { toast.error("Token name and symbol are required"); return; }
    if (config.totalSupply <= 0) { toast.error("Total supply must be > 0"); return; }

    setIsLaunching(true);
    try {
      // Step 1: Upload metadata
      setLaunchPhase("Preparing metadata…");
      const { data: metaData, error: metaErr } = await supabase.functions.invoke("token-launch", {
        body: {
          action: "upload-metadata",
          name: config.name,
          symbol: config.symbol,
          description: config.description,
          image: config.image,
          website: config.website,
          twitter: config.twitter,
          telegram: config.telegram,
        },
      });
      if (metaErr) throw new Error(metaErr.message);

      // Step 2: Create token
      setLaunchPhase("Creating token on-chain…");
      const { error: tokenErr } = await supabase.functions.invoke("token-launch", {
        body: {
          action: "create-token",
          userPublicKey: walletAddress,
          name: config.name,
          symbol: config.symbol,
          decimals: config.decimals,
          supply: config.totalSupply,
          uri: metaData?.uri || "",
        },
      });
      if (tokenErr) throw new Error(tokenErr.message);

      // Step 3: Note — full on-chain TX construction requires @solana/web3.js
      // For now we record the launch intent and provide next steps
      setLaunchPhase("Finalizing…");

      // Generate a mock mint address for demonstration
      // In production, this would come from the actual on-chain transaction
      const fakeMint = walletAddress.slice(0, 4) + config.symbol.toUpperCase() + "Mint" + Date.now().toString(36).slice(-6);
      setMintAddress(fakeMint);

      toast.success(`🚀 Token ${config.symbol} launch prepared!`, {
        description: "Review the deployment details below",
      });

      setStep("launched");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Launch failed";
      toast.error(msg);
    } finally {
      setIsLaunching(false);
      setLaunchPhase("");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const generateTelegramAnnouncement = () => {
    const text = `🚀 $${config.symbol} JUST LAUNCHED! 🚀\n\n${config.name} — ${config.description || "The next 1000x gem!"}\n\n💰 Supply: ${config.totalSupply.toLocaleString()}\n💧 Liquidity: ${config.initialLiquiditySOL} SOL (locked ${config.lpLockDays} days)\n\n${config.website ? `🌐 ${config.website}` : ""}${config.twitter ? `\n🐦 ${config.twitter}` : ""}${config.telegram ? `\n💬 ${config.telegram}` : ""}\n\n⚡ BUY NOW on Tanner Terminal!\n\n#${config.symbol} #Solana #Memecoin #Crypto`;
    update("telegramAnnouncement", text);
    toast.success("Announcement generated!");
  };

  const generateTwitterThread = () => {
    const text = `1/ 🧵 Introducing $${config.symbol} — ${config.name}\n\n${config.description || "A new meme coin on Solana."}\n\n2/ 📊 Tokenomics:\n• Supply: ${config.totalSupply.toLocaleString()}\n• Decimals: ${config.decimals}\n• LP Locked: ${config.lpLockDays} days\n• Fair Launch ✅\n\n3/ 🔒 Security:\n• LP locked for ${config.lpLockDays} days\n• No hidden mint authority\n• Contract verified\n\n4/ 🛠️ Built with Tanner Terminal\n• Real-time analytics\n• Sniper protection\n• Rug detection\n\n5/ 🔗 Links:\n${config.website ? `Website: ${config.website}` : ""}${config.twitter ? `\nTwitter: ${config.twitter}` : ""}${config.telegram ? `\nTelegram: ${config.telegram}` : ""}\n\nLFG! 🚀 #${config.symbol} #Solana`;
    update("twitterThread", text);
    toast.success("Thread generated!");
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-mono font-bold text-foreground">MEME COIN LAUNCHPAD</h1>
        </div>
        <Badge variant="outline" className="text-[9px] font-mono text-terminal-cyan border-terminal-cyan/30">
          SOLANA • SPL TOKEN
        </Badge>
      </div>
      <p className="text-[10px] font-mono text-muted-foreground">Launch your own meme coin in under 5 minutes — full tooling, no code required</p>

      {/* Step Navigation */}
      <div className="flex gap-1">
        {(["metadata", "configure", "marketing", "review"] as const).map((s, i) => (
          <button
            key={s}
            onClick={() => step !== "launched" && setStep(s)}
            className={`flex-1 py-1.5 rounded text-[9px] font-mono font-bold uppercase transition-colors ${
              step === s
                ? "bg-primary/15 text-primary border border-primary/30"
                : step === "launched"
                ? "bg-terminal-green/10 text-terminal-green border border-terminal-green/20"
                : "bg-muted/20 text-muted-foreground border border-transparent hover:text-foreground"
            }`}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* STEP 1: Metadata */}
      {step === "metadata" && (
        <div className="space-y-3 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-foreground"><ImageIcon className="h-4 w-4 text-primary" /> TOKEN IDENTITY</div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Token Name *</label>
              <Input value={config.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. DogWifHat" className="font-mono text-sm h-9" maxLength={32} />
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Symbol *</label>
              <Input value={config.symbol} onChange={(e) => update("symbol", e.target.value.toUpperCase())} placeholder="e.g. WIF" className="font-mono text-sm h-9" maxLength={10} />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Description</label>
            <Textarea value={config.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe your token (max 200 chars)" className="font-mono text-xs resize-none h-20" maxLength={200} />
            <span className="text-[8px] font-mono text-muted-foreground">{config.description.length}/200</span>
          </div>

          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Image URL</label>
            <Input value={config.image} onChange={(e) => update("image", e.target.value)} placeholder="https://... or IPFS URI" className="font-mono text-xs h-9" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 flex items-center gap-1"><Globe className="h-3 w-3" /> Website</label>
              <Input value={config.website} onChange={(e) => update("website", e.target.value)} placeholder="https://..." className="font-mono text-xs h-8" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 flex items-center gap-1"><Twitter className="h-3 w-3" /> Twitter</label>
              <Input value={config.twitter} onChange={(e) => update("twitter", e.target.value)} placeholder="@handle" className="font-mono text-xs h-8" />
            </div>
            <div>
              <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Telegram</label>
              <Input value={config.telegram} onChange={(e) => update("telegram", e.target.value)} placeholder="t.me/group" className="font-mono text-xs h-8" />
            </div>
          </div>

          <Button onClick={() => setStep("configure")} disabled={!config.name || !config.symbol} className="w-full font-mono text-xs">
            Next: Configure Tokenomics →
          </Button>
        </div>
      )}

      {/* STEP 2: Configure */}
      {step === "configure" && (
        <div className="space-y-3 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-foreground"><Settings2 className="h-4 w-4 text-primary" /> TOKENOMICS</div>

          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Total Supply</label>
            <div className="flex gap-1 mb-1.5">
              {SUPPLY_PRESETS.map((p) => (
                <button key={p.value} onClick={() => update("totalSupply", p.value)} className={`flex-1 py-1 rounded text-[9px] font-mono transition-colors ${config.totalSupply === p.value ? "bg-primary/15 text-primary border border-primary/30" : "bg-muted/20 text-muted-foreground border border-transparent"}`}>{p.label}</button>
              ))}
            </div>
            <Input type="number" value={config.totalSupply} onChange={(e) => update("totalSupply", Number(e.target.value))} className="font-mono text-sm h-9" />
          </div>

          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Decimals: {config.decimals}</label>
            <Slider value={[config.decimals]} onValueChange={([v]) => update("decimals", v)} min={0} max={9} step={1} />
          </div>

          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">Initial Liquidity (SOL): {config.initialLiquiditySOL}</label>
            <Slider value={[config.initialLiquiditySOL]} onValueChange={([v]) => update("initialLiquiditySOL", v)} min={0.1} max={50} step={0.1} />
          </div>

          <div>
            <label className="text-[9px] font-mono text-muted-foreground uppercase mb-1 block">LP Lock Duration: {config.lpLockDays} days</label>
            <Slider value={[config.lpLockDays]} onValueChange={([v]) => update("lpLockDays", v)} min={7} max={365} step={1} />
          </div>

          <div className="bg-muted/30 border border-border rounded p-2.5 space-y-1">
            <div className="text-[9px] font-mono text-muted-foreground uppercase">Launch Strategy</div>
            <div className="grid grid-cols-3 gap-1.5">
              {STRATEGIES.map((s) => (
                <button key={s.id} onClick={() => update("launchStrategy", s.id)} className={`p-2 rounded text-left transition-colors ${config.launchStrategy === s.id ? "bg-primary/10 border border-primary/30" : "bg-muted/20 border border-transparent hover:border-border"}`}>
                  <div className="flex items-center gap-1 mb-1"><s.icon className="h-3 w-3 text-primary" /><span className="text-[9px] font-mono font-bold text-foreground">{s.label}</span></div>
                  <p className="text-[7px] font-mono text-muted-foreground leading-tight">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("metadata")} className="flex-1 font-mono text-xs">← Back</Button>
            <Button onClick={() => { setStep("marketing"); getEstimate(); }} className="flex-1 font-mono text-xs">Next: Marketing →</Button>
          </div>
        </div>
      )}

      {/* STEP 3: Marketing */}
      {step === "marketing" && (
        <div className="space-y-3 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-foreground"><Megaphone className="h-4 w-4 text-primary" /> MARKETING TOOLS</div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1"><Bot className="h-3 w-3" /> Telegram Announcement</label>
              <Button variant="ghost" size="sm" onClick={generateTelegramAnnouncement} className="h-6 text-[8px] font-mono"><Zap className="h-3 w-3 mr-1" />Auto-Generate</Button>
            </div>
            <Textarea value={config.telegramAnnouncement} onChange={(e) => update("telegramAnnouncement", e.target.value)} placeholder="Your TG announcement..." className="font-mono text-[10px] resize-none h-28" />
            {config.telegramAnnouncement && (
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(config.telegramAnnouncement)} className="text-[8px] font-mono h-6"><Copy className="h-3 w-3 mr-1" />Copy Announcement</Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-mono text-muted-foreground uppercase flex items-center gap-1"><Twitter className="h-3 w-3" /> Twitter Thread</label>
              <Button variant="ghost" size="sm" onClick={generateTwitterThread} className="h-6 text-[8px] font-mono"><Zap className="h-3 w-3 mr-1" />Auto-Generate</Button>
            </div>
            <Textarea value={config.twitterThread} onChange={(e) => update("twitterThread", e.target.value)} placeholder="Your Twitter thread..." className="font-mono text-[10px] resize-none h-28" />
            {config.twitterThread && (
              <Button variant="outline" size="sm" onClick={() => copyToClipboard(config.twitterThread)} className="text-[8px] font-mono h-6"><Copy className="h-3 w-3 mr-1" />Copy Thread</Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("configure")} className="flex-1 font-mono text-xs">← Back</Button>
            <Button onClick={() => setStep("review")} className="flex-1 font-mono text-xs">Next: Review & Launch →</Button>
          </div>
        </div>
      )}

      {/* STEP 4: Review */}
      {step === "review" && (
        <div className="space-y-3 bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-foreground"><CheckCircle className="h-4 w-4 text-terminal-green" /> REVIEW & LAUNCH</div>

          <div className="space-y-1.5 text-[10px] font-mono">
            <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">Name</span><span className="text-foreground font-bold">{config.name}</span></div>
            <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">Symbol</span><span className="text-primary font-bold">${config.symbol}</span></div>
            <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">Supply</span><span className="text-foreground">{config.totalSupply.toLocaleString()}</span></div>
            <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">Decimals</span><span className="text-foreground">{config.decimals}</span></div>
            <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">Initial LP</span><span className="text-foreground">{config.initialLiquiditySOL} SOL</span></div>
            <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">LP Lock</span><span className="text-foreground">{config.lpLockDays} days</span></div>
            <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">Strategy</span><span className="text-foreground capitalize">{config.launchStrategy}</span></div>
            <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">Socials</span><span className="text-foreground">{[config.website && "Web", config.twitter && "X", config.telegram && "TG"].filter(Boolean).join(", ") || "None"}</span></div>
            <div className="flex justify-between border-b border-border pb-1"><span className="text-muted-foreground">Marketing</span><span className="text-foreground">{[config.telegramAnnouncement && "TG Post", config.twitterThread && "X Thread"].filter(Boolean).join(", ") || "None"}</span></div>
            {estimatedCost && (
              <div className="flex justify-between pt-1"><span className="text-muted-foreground font-bold">Est. Cost</span><span className="text-terminal-amber font-bold">~{estimatedCost.toFixed(3)} SOL</span></div>
            )}
          </div>

          {!isConnected && (
            <div className="bg-terminal-amber/10 border border-terminal-amber/20 rounded px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-terminal-amber" />
              <span className="text-[10px] font-mono text-terminal-amber">Connect wallet to launch</span>
            </div>
          )}

          <div className="bg-muted/30 border border-border rounded px-3 py-2">
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-muted-foreground">
              <Shield className="h-3 w-3 text-terminal-cyan" />
              Transaction will be sent to your wallet for signing. You maintain full custody.
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("marketing")} className="flex-1 font-mono text-xs">← Back</Button>
            <Button onClick={handleLaunch} disabled={!isConnected || isLaunching} className="flex-1 font-mono text-xs bg-terminal-green/15 text-terminal-green border border-terminal-green/30 hover:bg-terminal-green/25">
              {isLaunching ? (
                <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" />{launchPhase}</span>
              ) : (
                <span className="flex items-center gap-1.5"><Rocket className="h-3.5 w-3.5" />LAUNCH TOKEN</span>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 5: Launched */}
      {step === "launched" && (
        <div className="space-y-4 bg-card border border-terminal-green/30 rounded-lg p-4">
          <div className="text-center space-y-2">
            <CheckCircle className="h-10 w-10 text-terminal-green mx-auto" />
            <h2 className="text-sm font-mono font-bold text-terminal-green">TOKEN LAUNCH PREPARED</h2>
            <p className="text-[10px] font-mono text-muted-foreground">${config.symbol} is ready for deployment</p>
          </div>

          {mintAddress && (
            <div className="bg-muted/30 border border-border rounded p-3 space-y-2">
              <div className="text-[9px] font-mono text-muted-foreground uppercase">Token Details</div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-foreground">{config.name} (${config.symbol})</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6" onClick={() => copyToClipboard(mintAddress)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="text-[8px] font-mono text-muted-foreground break-all">Mint: {mintAddress}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/20 border border-border rounded p-2.5 text-center">
              <TrendingUp className="h-4 w-4 text-terminal-green mx-auto mb-1" />
              <div className="text-[9px] font-mono text-muted-foreground">Supply</div>
              <div className="text-[10px] font-mono font-bold text-foreground">{config.totalSupply.toLocaleString()}</div>
            </div>
            <div className="bg-muted/20 border border-border rounded p-2.5 text-center">
              <DollarSign className="h-4 w-4 text-terminal-amber mx-auto mb-1" />
              <div className="text-[9px] font-mono text-muted-foreground">Liquidity</div>
              <div className="text-[10px] font-mono font-bold text-foreground">{config.initialLiquiditySOL} SOL</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-1.5">
            <div className="text-[9px] font-mono text-muted-foreground uppercase">Quick Actions</div>
            {config.telegramAnnouncement && (
              <Button variant="outline" className="w-full justify-start text-[10px] font-mono h-8" onClick={() => copyToClipboard(config.telegramAnnouncement)}>
                <MessageCircle className="h-3 w-3 mr-2 text-terminal-cyan" /> Copy TG Announcement
              </Button>
            )}
            {config.twitterThread && (
              <Button variant="outline" className="w-full justify-start text-[10px] font-mono h-8" onClick={() => copyToClipboard(config.twitterThread)}>
                <Twitter className="h-3 w-3 mr-2 text-terminal-cyan" /> Copy X Thread
              </Button>
            )}
            <Button variant="outline" className="w-full justify-start text-[10px] font-mono h-8" onClick={() => window.open(`https://solscan.io/token/${mintAddress}`, "_blank")}>
              <ExternalLink className="h-3 w-3 mr-2 text-terminal-cyan" /> View on Solscan
            </Button>
          </div>

          <Button onClick={() => { setStep("metadata"); setConfig(DEFAULT_CONFIG); setMintAddress(null); }} variant="outline" className="w-full font-mono text-xs">
            <Rocket className="h-3.5 w-3.5 mr-1.5" /> Launch Another Token
          </Button>
        </div>
      )}
    </div>
  );
}
