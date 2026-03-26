import { BaseChainAdapter } from "./base";
import type { ChainBalance, ChainTransaction, ChainTokenMetadata, ChainNetworkStatus } from "../types";

const RPC = "https://api.mainnet-beta.solana.com";

export class SolanaAdapter extends BaseChainAdapter {
  readonly chainId = "solana" as const;

  async getBalances(address: string): Promise<ChainBalance> {
    try {
      const balRes = await this.safeJsonFetch<{ result?: { value?: number } }>(RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] }),
      });

      const lamports = balRes?.result?.value ?? 0;
      const sol = lamports / 1e9;

      // Get SOL price from CoinGecko (safe, no key needed)
      const priceData = await this.safeJsonFetch<{ solana?: { usd?: number } }>(
        "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
      );
      const solPrice = priceData?.solana?.usd ?? 0;

      return {
        chainId: "solana",
        nativeBalance: sol,
        nativeSymbol: "SOL",
        nativeValueUSD: sol * solPrice,
        tokens: [],
        lastUpdated: Date.now(),
      };
    } catch {
      return this.emptyBalance();
    }
  }

  async getTransactions(address: string, limit = 10): Promise<ChainTransaction[]> {
    try {
      const sigRes = await this.safeJsonFetch<{ result?: Array<{ signature: string; blockTime?: number }> }>(RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1,
          method: "getSignaturesForAddress",
          params: [address, { limit }],
        }),
      });

      return (sigRes?.result ?? []).map(sig => ({
        chainId: "solana" as const,
        hash: sig.signature,
        type: "transfer",
        timestamp: (sig.blockTime ?? 0) * 1000,
        from: address,
        to: "",
        amount: 0,
        symbol: "SOL",
        fee: 0,
        status: "confirmed" as const,
      }));
    } catch {
      return [];
    }
  }

  async getTokenMetadata(_tokenAddress: string): Promise<ChainTokenMetadata | null> {
    return null; // Would use Helius/DAS API
  }

  async getNetworkStatus(): Promise<ChainNetworkStatus> {
    try {
      const start = Date.now();
      const res = await this.safeJsonFetch<{ result?: number }>(RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getSlot" }),
      });
      return {
        chainId: "solana",
        connected: !!res?.result,
        blockHeight: res?.result ?? 0,
        latency: Date.now() - start,
        lastChecked: Date.now(),
      };
    } catch {
      return this.offlineStatus();
    }
  }
}
