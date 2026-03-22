export interface BridgeAsset {
  id: string;
  label: string;
  chain: string;
  icon: string;
  price: number;
  decimals: number;
}

export const BRIDGE_CHAINS = {
  solana: { name: "Solana", color: "terminal-green", icon: "◎" },
  xrpl: { name: "XRPL", color: "terminal-blue", icon: "🌐" },
  stellar: { name: "Stellar", color: "terminal-cyan", icon: "⭐" },
  hedera: { name: "Hedera", color: "terminal-amber", icon: "♦️" },
} as const;

export const BRIDGE_ASSETS: BridgeAsset[] = [
  { id: "sol", label: "SOL", chain: "solana", icon: "◎", price: 168.42, decimals: 9 },
  { id: "xrp", label: "XRP", chain: "xrpl", icon: "🌐", price: 2.34, decimals: 6 },
  { id: "xlm", label: "XLM", chain: "stellar", icon: "⭐", price: 0.41, decimals: 7 },
  { id: "hbar", label: "HBAR", chain: "hedera", icon: "♦️", price: 0.28, decimals: 8 },
];

export type BridgeStep = "select" | "confirm" | "processing" | "complete";

export interface BridgeQuote {
  fromAsset: BridgeAsset;
  toAsset: BridgeAsset;
  inputAmount: number;
  outputAmount: number;
  fee: number;
  feePercent: number;
  estimatedTime: string;
  route: string[];
  priceImpact: number;
}

export function calculateBridgeQuote(
  from: BridgeAsset,
  to: BridgeAsset,
  inputAmount: number
): BridgeQuote {
  const feePercent = 0.3;
  const fee = inputAmount * (feePercent / 100);
  const netInput = inputAmount - fee;
  const outputAmount = (netInput * from.price) / to.price;
  const priceImpact = inputAmount > 100 ? 0.15 : inputAmount > 10 ? 0.05 : 0.01;

  const route: string[] = [];
  if (from.chain !== "solana" && to.chain !== "solana") {
    route.push(from.label, "SOL", to.label);
  } else {
    route.push(from.label, to.label);
  }

  const estimatedTime =
    from.chain === "xrpl" || to.chain === "xrpl" ? "~30s" :
    from.chain === "stellar" || to.chain === "stellar" ? "~15s" : "~45s";

  return { fromAsset: from, toAsset: to, inputAmount, outputAmount, fee, feePercent, estimatedTime, route, priceImpact };
}
