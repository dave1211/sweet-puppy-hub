import type { ChainConfig, ChainId } from "./types";

export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  solana: {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    icon: "◎",
    color: "hsl(var(--terminal-green))",
    decimals: 9,
    explorerUrl: "https://solscan.io",
    isCompliance: false,
    status: "active",
  },
  bitcoin: {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    icon: "₿",
    color: "hsl(38, 92%, 50%)",
    decimals: 8,
    explorerUrl: "https://mempool.space",
    isCompliance: true,
    status: "active",
  },
  ethereum: {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    icon: "Ξ",
    color: "hsl(228, 65%, 60%)",
    decimals: 18,
    explorerUrl: "https://etherscan.io",
    isCompliance: false,
    status: "active",
  },
  xrpl: {
    id: "xrpl",
    name: "XRP Ledger",
    symbol: "XRP",
    icon: "✕",
    color: "hsl(var(--terminal-blue))",
    decimals: 6,
    explorerUrl: "https://xrpscan.com",
    isCompliance: true,
    status: "active",
  },
  stellar: {
    id: "stellar",
    name: "Stellar",
    symbol: "XLM",
    icon: "✦",
    color: "hsl(var(--terminal-cyan))",
    decimals: 7,
    explorerUrl: "https://stellar.expert",
    isCompliance: true,
    status: "active",
  },
  quant: {
    id: "quant",
    name: "Quant",
    symbol: "QNT",
    icon: "◆",
    color: "hsl(263, 60%, 55%)",
    decimals: 18,
    explorerUrl: "https://etherscan.io/token/0x4a220E6096B25EADb88358cb44068A3248254675",
    isCompliance: true,
    status: "active",
  },
};

export const ACTIVE_CHAINS = Object.values(CHAIN_CONFIGS).filter(c => c.status === "active");
export const COMPLIANCE_CHAINS = ACTIVE_CHAINS.filter(c => c.isCompliance);

export function getChainConfig(chainId: ChainId): ChainConfig {
  return CHAIN_CONFIGS[chainId];
}
