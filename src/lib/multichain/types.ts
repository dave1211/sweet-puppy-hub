/**
 * Multi-Chain Abstraction Layer — Core Types
 * All chain-specific logic MUST go through these interfaces.
 * UI components NEVER import chain SDKs directly.
 */

export type ChainId = "solana" | "bitcoin" | "ethereum" | "xrpl" | "stellar" | "quant" | "xdc" | "hedera" | "algorand" | "iota";

export interface ChainCapabilities {
  supportsTokens: boolean;
  supportsTransfers: boolean;
  supportsHistory: boolean;
  supportsComplianceView: boolean;
}

export interface ChainConfig {
  id: ChainId;
  name: string;
  symbol: string;
  icon: string;
  color: string;
  decimals: number;
  explorerUrl: string;
  explorerAddressPath: string;
  explorerTxPath: string;
  isCompliance: boolean;
  status: "active" | "coming_soon";
  capabilities: ChainCapabilities;
}

export interface ChainBalance {
  chainId: ChainId;
  nativeBalance: number;
  nativeSymbol: string;
  nativeValueUSD: number;
  tokens: ChainTokenBalance[];
  lastUpdated: number;
}

export interface ChainTokenBalance {
  address: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  valueUSD: number;
  icon?: string;
  isCompliance?: boolean;
}

export interface ChainTransaction {
  chainId: ChainId;
  hash: string;
  type: string;
  timestamp: number;
  from: string;
  to: string;
  amount: number;
  symbol: string;
  fee: number;
  status: "confirmed" | "pending" | "failed";
}

export interface ChainTokenMetadata {
  chainId: ChainId;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  totalSupply?: number;
  icon?: string;
  website?: string;
  description?: string;
  isCompliance?: boolean;
}

export interface ChainNetworkStatus {
  chainId: ChainId;
  connected: boolean;
  blockHeight: number;
  latency: number;
  lastChecked: number;
}

export interface ChainWalletState {
  chainId: ChainId;
  connected: boolean;
  address: string | null;
  provider: string | null;
}

/**
 * Chain Adapter Interface — each chain implements this.
 * All methods must handle their own errors and never throw fatally.
 */
export interface ChainAdapter {
  readonly chainId: ChainId;
  
  /** Fetch native + token balances for an address */
  getBalances(address: string): Promise<ChainBalance>;
  
  /** Fetch recent transactions */
  getTransactions(address: string, limit?: number): Promise<ChainTransaction[]>;
  
  /** Get token metadata */
  getTokenMetadata(tokenAddress: string): Promise<ChainTokenMetadata | null>;
  
  /** Check network connectivity */
  getNetworkStatus(): Promise<ChainNetworkStatus>;
}

/** Unified portfolio across all chains */
export interface MultiChainPortfolio {
  totalValueUSD: number;
  chains: ChainBalance[];
  lastUpdated: number;
}
