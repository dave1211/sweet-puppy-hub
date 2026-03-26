import { BaseChainAdapter } from "./base";
import type { ChainBalance, ChainTransaction, ChainTokenMetadata, ChainNetworkStatus } from "../types";

const BLOCKSTREAM_API = "https://blockstream.info/api";

export class BitcoinAdapter extends BaseChainAdapter {
  readonly chainId = "bitcoin" as const;

  async getBalances(address: string): Promise<ChainBalance> {
    try {
      const data = await this.safeJsonFetch<{
        chain_stats?: { funded_txo_sum?: number; spent_txo_sum?: number };
      }>(`${BLOCKSTREAM_API}/address/${address}`);

      const funded = data?.chain_stats?.funded_txo_sum ?? 0;
      const spent = data?.chain_stats?.spent_txo_sum ?? 0;
      const btc = (funded - spent) / 1e8;

      const priceData = await this.safeJsonFetch<{ bitcoin?: { usd?: number } }>(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
      );
      const btcPrice = priceData?.bitcoin?.usd ?? 0;

      return {
        chainId: "bitcoin",
        nativeBalance: btc,
        nativeSymbol: "BTC",
        nativeValueUSD: btc * btcPrice,
        tokens: [], // Bitcoin has no ERC-20 style tokens
        lastUpdated: Date.now(),
      };
    } catch {
      return this.emptyBalance();
    }
  }

  async getTransactions(address: string, limit = 10): Promise<ChainTransaction[]> {
    try {
      const data = await this.safeJsonFetch<Array<{
        txid: string;
        status?: { block_time?: number; confirmed?: boolean };
        fee?: number;
      }>>(`${BLOCKSTREAM_API}/address/${address}/txs`);

      return (data ?? []).slice(0, limit).map(tx => ({
        chainId: "bitcoin" as const,
        hash: tx.txid,
        type: "transfer",
        timestamp: (tx.status?.block_time ?? 0) * 1000,
        from: address,
        to: "",
        amount: 0,
        symbol: "BTC",
        fee: (tx.fee ?? 0) / 1e8,
        status: tx.status?.confirmed ? "confirmed" as const : "pending" as const,
      }));
    } catch {
      return [];
    }
  }

  async getTokenMetadata(): Promise<ChainTokenMetadata | null> {
    return null;
  }

  async getNetworkStatus(): Promise<ChainNetworkStatus> {
    try {
      const start = Date.now();
      const height = await this.safeJsonFetch<number>(`${BLOCKSTREAM_API}/blocks/tip/height`);
      return {
        chainId: "bitcoin",
        connected: height !== null,
        blockHeight: height ?? 0,
        latency: Date.now() - start,
        lastChecked: Date.now(),
      };
    } catch {
      return this.offlineStatus();
    }
  }
}
