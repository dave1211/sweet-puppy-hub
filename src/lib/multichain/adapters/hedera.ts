import { BaseChainAdapter } from "./base";
import type { ChainBalance, ChainTransaction, ChainTokenMetadata, ChainNetworkStatus, ChainId } from "../types";

export class HederaAdapter extends BaseChainAdapter {
  readonly chainId: ChainId = "hedera";
  private readonly mirror = "https://mainnet-public.mirrornode.hedera.com";

  async getBalances(address: string): Promise<ChainBalance> {
    try {
      const data = await this.safeJsonFetch<{ balance: { balance: number } }>(`${this.mirror}/api/v1/balances?account.id=${address}&limit=1`);
      const tinybars = data?.balance?.balance ?? 0;
      const balance = tinybars / 1e8;

      const priceData = await this.safeJsonFetch<{ "hedera-hashgraph"?: { usd?: number } }>(
        "https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd"
      );
      const hbarPrice = priceData?.["hedera-hashgraph"]?.usd ?? 0;

      return { chainId: this.chainId, nativeBalance: balance, nativeSymbol: "HBAR", nativeValueUSD: balance * hbarPrice, tokens: [], lastUpdated: Date.now() };
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
      const res = await this.safeJsonFetch<{ blocks: { number: number }[] }>(`${this.mirror}/api/v1/blocks?limit=1&order=desc`);
      const latency = Date.now() - start;
      const blockHeight = res?.blocks?.[0]?.number ?? 0;
      return { chainId: this.chainId, connected: blockHeight > 0, blockHeight, latency, lastChecked: Date.now() };
    } catch {
      return this.offlineStatus();
    }
  }
}
