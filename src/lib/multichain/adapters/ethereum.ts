import { BaseChainAdapter } from "./base";
import type { ChainBalance, ChainTransaction, ChainTokenMetadata, ChainNetworkStatus } from "../types";

// Public Ethereum RPC (rate limited but no key needed)
const ETH_RPC = "https://eth.llamarpc.com";

export class EthereumAdapter extends BaseChainAdapter {
  readonly chainId = "ethereum" as const;

  async getBalances(address: string): Promise<ChainBalance> {
    try {
      const res = await this.safeJsonFetch<{ result?: string }>(ETH_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
      });

      const wei = parseInt(res?.result ?? "0", 16);
      const eth = wei / 1e18;

      const priceData = await this.safeJsonFetch<{ ethereum?: { usd?: number } }>(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const ethPrice = priceData?.ethereum?.usd ?? 0;

      return {
        chainId: "ethereum",
        nativeBalance: eth,
        nativeSymbol: "ETH",
        nativeValueUSD: eth * ethPrice,
        tokens: [],
        lastUpdated: Date.now(),
      };
    } catch {
      return this.emptyBalance();
    }
  }

  async getTransactions(_address: string, _limit = 10): Promise<ChainTransaction[]> {
    // Would need Etherscan/Alchemy API for tx history
    return [];
  }

  async getTokenMetadata(_tokenAddress: string): Promise<ChainTokenMetadata | null> {
    return null;
  }

  async getNetworkStatus(): Promise<ChainNetworkStatus> {
    try {
      const start = Date.now();
      const res = await this.safeJsonFetch<{ result?: string }>(ETH_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
      });
      const block = parseInt(res?.result ?? "0", 16);
      return {
        chainId: "ethereum",
        connected: block > 0,
        blockHeight: block,
        latency: Date.now() - start,
        lastChecked: Date.now(),
      };
    } catch {
      return this.offlineStatus();
    }
  }
}
