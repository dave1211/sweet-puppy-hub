import { BaseChainAdapter } from "./base";
import type { ChainBalance, ChainTransaction, ChainTokenMetadata, ChainNetworkStatus, ChainId } from "../types";

export class AlgorandAdapter extends BaseChainAdapter {
  readonly chainId: ChainId = "algorand";
  private readonly indexer = "https://mainnet-idx.algonode.cloud";
  private readonly node = "https://mainnet-api.algonode.cloud";

  async getBalances(address: string): Promise<ChainBalance> {
    try {
      const data = await this.safeJsonFetch<{ account: { amount: number } }>(`${this.indexer}/v2/accounts/${address}`);
      const microAlgos = data?.account?.amount ?? 0;
      const balance = microAlgos / 1e6;
      return { chainId: this.chainId, nativeBalance: balance, nativeSymbol: "ALGO", nativeValueUSD: 0, tokens: [], lastUpdated: Date.now() };
    } catch {
      return this.emptyBalance();
    }
  }

  async getTransactions(_address: string, _limit?: number): Promise<ChainTransaction[]> {
    return [];
  }

  async getTokenMetadata(_tokenAddress: string): Promise<ChainTokenMetadata | null> {
    return null;
  }

  async getNetworkStatus(): Promise<ChainNetworkStatus> {
    try {
      const start = Date.now();
      const res = await this.safeJsonFetch<{ "last-round": number }>(`${this.node}/v2/status`);
      const latency = Date.now() - start;
      const blockHeight = res?.["last-round"] ?? 0;
      return { chainId: this.chainId, connected: blockHeight > 0, blockHeight, latency, lastChecked: Date.now() };
    } catch {
      return this.offlineStatus();
    }
  }
}
