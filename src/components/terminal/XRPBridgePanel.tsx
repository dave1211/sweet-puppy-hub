import { useState } from "react";
import { ArrowLeftRight, Globe, Zap, CreditCard, TrendingUp } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { toast } from "sonner";

type BridgeTab = "bridge" | "pay" | "invest";

const BRIDGE_ASSETS = [
  { id: "xrp", label: "XRP", chain: "XRPL", icon: "🌐", price: 2.34 },
  { id: "xlm", label: "XLM", chain: "Stellar", icon: "⭐", price: 0.41 },
  { id: "hbar", label: "HBAR", chain: "Hedera", icon: "♦️", price: 0.28 },
  { id: "qnt", label: "QNT", chain: "Ethereum", icon: "🔗", price: 118.50 },
];

const INVEST_ASSETS = [
  ...BRIDGE_ASSETS,
  { id: "gold", label: "Gold (xAU)", chain: "Tokenized", icon: "🥇", price: 2_950.00 },
  { id: "silver", label: "Silver (xAG)", chain: "Tokenized", icon: "🥈", price: 33.80 },
  { id: "tsla", label: "Tesla (xTSLA)", chain: "Tokenized", icon: "⚡", price: 248.50 },
];

export function XRPBridgePanel() {
  const { isConnected } = useWallet();
  const [tab, setTab] = useState<BridgeTab>("bridge");
  const [fromAsset, setFromAsset] = useState("sol");
  const [toAsset, setToAsset] = useState("xrp");
  const [amount, setAmount] = useState("");
  const [investAsset, setInvestAsset] = useState("xrp");
  const [isProcessing, setIsProcessing] = useState(false);

  const solPrice = 168.42;

  const getConvertedAmount = () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return "0.00";
    const target = [...BRIDGE_ASSETS, ...INVEST_ASSETS].find((a) => a.id === (tab === "invest" ? investAsset : toAsset));
    if (!target) return "0.00";
    return ((amt * solPrice) / target.price).toFixed(4);
  };

  const handleAction = () => {
    if (!isConnected) { toast.error("Connect wallet first"); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast.error("Enter a valid amount"); return; }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setAmount("");
      const targetLabel = tab === "invest"
        ? INVEST_ASSETS.find((a) => a.id === investAsset)?.label
        : BRIDGE_ASSETS.find((a) => a.id === toAsset)?.label;
      if (tab === "bridge") toast.success(`🌉 Bridged ${amt} SOL → ${getConvertedAmount()} ${targetLabel}`);
      else if (tab === "pay") toast.success(`💳 Paid ${amt} SOL via ${targetLabel} network`);
      else toast.success(`📈 Micro-invested ${amt} SOL → ${getConvertedAmount()} ${targetLabel}`);
    }, 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="h-4 w-4 text-terminal-blue" />
        <h3 className="text-xs font-mono font-bold text-foreground tracking-wide">XRP BRIDGE & PAY</h3>
        <span className="ml-auto text-[10px] font-mono text-terminal-blue bg-terminal-blue/10 px-1.5 py-0.5 rounded">CROSS-CHAIN</span>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-3">
        {[
          { key: "bridge" as const, label: "Bridge", icon: ArrowLeftRight },
          { key: "pay" as const, label: "XRP Pay", icon: CreditCard },
          { key: "invest" as const, label: "Micro-Invest", icon: TrendingUp },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1 rounded px-2 py-1.5 text-[10px] font-mono transition-colors ${
              tab === key
                ? "bg-terminal-blue/20 text-terminal-blue border border-terminal-blue/30"
                : "bg-muted/30 text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Bridge Tab */}
      {tab === "bridge" && (
        <div className="space-y-2 mb-3">
          <div className="text-[10px] font-mono text-muted-foreground">BRIDGE SOL → DESTINATION</div>
          <div className="grid grid-cols-2 gap-1">
            {BRIDGE_ASSETS.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setToAsset(asset.id)}
                className={`flex items-center gap-1.5 rounded px-2 py-1.5 text-[10px] font-mono transition-colors ${
                  toAsset === asset.id
                    ? "bg-terminal-blue/15 text-terminal-blue border border-terminal-blue/30"
                    : "bg-muted/20 text-muted-foreground hover:text-foreground border border-transparent"
                }`}
              >
                <span>{asset.icon}</span>
                <div>
                  <div>{asset.label}</div>
                  <div className="text-[8px] text-muted-foreground">{asset.chain}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pay Tab */}
      {tab === "pay" && (
        <div className="space-y-2 mb-3">
          <div className="text-[10px] font-mono text-muted-foreground">PAY WITH XRP NETWORK</div>
          <div className="rounded bg-muted/30 border border-border p-2">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-3 w-3 text-terminal-blue" />
              <span className="text-[10px] font-mono text-foreground">Universal Payment</span>
            </div>
            <p className="text-[9px] font-mono text-muted-foreground">Pay for merch, subscriptions & premium tiers using XRP, XLM, or HBAR cross-chain payments.</p>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {BRIDGE_ASSETS.slice(0, 3).map((asset) => (
              <button
                key={asset.id}
                onClick={() => setToAsset(asset.id)}
                className={`flex flex-col items-center rounded px-1 py-1.5 text-[9px] font-mono transition-colors ${
                  toAsset === asset.id
                    ? "bg-terminal-blue/15 text-terminal-blue border border-terminal-blue/30"
                    : "bg-muted/20 text-muted-foreground border border-transparent"
                }`}
              >
                <span className="text-sm">{asset.icon}</span>
                <span>{asset.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Invest Tab */}
      {tab === "invest" && (
        <div className="space-y-2 mb-3">
          <div className="text-[10px] font-mono text-muted-foreground">MICRO-INVEST SOL INTO</div>
          <div className="grid grid-cols-4 gap-1">
            {INVEST_ASSETS.map((asset) => (
              <button
                key={asset.id}
                onClick={() => setInvestAsset(asset.id)}
                className={`flex flex-col items-center rounded px-1 py-1.5 text-[9px] font-mono transition-colors ${
                  investAsset === asset.id
                    ? "bg-terminal-blue/15 text-terminal-blue border border-terminal-blue/30"
                    : "bg-muted/20 text-muted-foreground border border-transparent"
                }`}
              >
                <span className="text-sm">{asset.icon}</span>
                <span>{asset.id === "gold" || asset.id === "silver" || asset.id === "tsla" ? asset.label.split(" ")[0] : asset.label}</span>
                <span className="text-[8px] text-muted-foreground">${asset.price < 1 ? asset.price.toFixed(2) : asset.price.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Amount Input */}
      <div className="rounded bg-muted/30 border border-border p-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-[9px] font-mono text-muted-foreground mb-0.5">AMOUNT (SOL)</div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              className="w-full bg-transparent text-xs font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
          <div className="text-right">
            <div className="text-[9px] font-mono text-muted-foreground mb-0.5">YOU GET</div>
            <div className="text-xs font-mono text-primary font-bold">{getConvertedAmount()}</div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleAction}
        disabled={isProcessing || !isConnected || !amount}
        className="w-full flex items-center justify-center gap-1.5 rounded bg-terminal-blue/15 border border-terminal-blue/30 py-2 text-[10px] font-mono text-terminal-blue hover:bg-terminal-blue/25 transition-colors disabled:opacity-40"
      >
        {isProcessing ? (
          <span className="animate-pulse">Processing…</span>
        ) : (
          <>
            <Zap className="h-3 w-3" />
            {tab === "bridge" ? "BRIDGE NOW" : tab === "pay" ? "PAY NOW" : "INVEST NOW"}
          </>
        )}
      </button>

      {!isConnected && (
        <p className="text-[9px] font-mono text-muted-foreground mt-1.5">Connect wallet to use bridge</p>
      )}
    </div>
  );
}
