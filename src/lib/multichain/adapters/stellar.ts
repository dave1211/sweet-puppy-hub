import { BaseChainAdapter } from "./base";
import type { ChainBalance, ChainTransaction, ChainTokenMetadata, ChainNetworkStatus, ChainTokenBalance } from "../types";

const HORIZON = "https://horizon.stellar.org";

export class StellarAdapter extends BaseChainAdapter {
  readonly chainId = "stellar" as const;

  async getBalances(address: string): Promise<ChainBalance> {
    try {
      const data = await this.safeJsonFetch<{
        balances?: Array<{
          asset_type: string;
          asset_code?: string;
          asset_issuer?: string;
          balance: string;
        }>;
      }>(`${HORIZON}/accounts/${address}`);

      let xlmBalance = 0;
      const tokens: ChainTokenBalance[] = [];

      for (const bal of data?.balances ?? []) {
        if (bal.asset_type === "native") {
          xlmBalance = parseFloat(bal.balance);
        } else if (bal.asset_code) {
          tokens.push({
            address: bal.asset_issuer ?? "",
            symbol: bal.asset_code,
            name: bal.asset_code,
            balance: parseFloat(bal.balance),
            decimals: 7,
            valueUSD: 0,
            isCompliance: true,
          });
        }
      }

      const priceData = await this.safeJsonFetch<{ stellar?: { usd?: number } }>(
        "https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd"
      );
      const xlmPrice = priceData?.stellar?.usd ?? 0;

      return {
        chainId: "stellar",
        nativeBalance: xlmBalance,
        nativeSymbol: "XLM",
        nativeValueUSD: xlmBalance * xlmPrice,
        tokens,
        lastUpdated: Date.now(),
      };
    } catch {
      return this.emptyBalance();
    }
  }

  async getTransactions(address: string, limit = 10): Promise<ChainTransaction[]> {
    try {
      const data = await this.safeJsonFetch<{
        _embedded?: {
          records?: Array<{
            id: string;
            type: string;
            created_at: string;
            transaction_hash: string;
            from?: string;
            to?: string;
            amount?: string;
            asset_code?: string;
          }>;
        };
      }>(`${HORIZON}/accounts/${address}/operations?limit=${limit}&order=desc`);

      return (data?._embedded?.records ?? []).map(op => ({
        chainId: "stellar" as const,
        hash: op.transaction_hash,
        type: op.type,
        timestamp: new Date(op.created_at).getTime(),
        from: op.from ?? address,
        to: op.to ?? "",
        amount: parseFloat(op.amount ?? "0"),
        symbol: op.asset_code ?? "XLM",
        fee: 0.00001,
        status: "confirmed" as const,
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
      const data = await this.safeJsonFetch<{ history_latest_ledger?: number }>(`${HORIZON}`);
      return {
        chainId: "stellar",
        connected: (data?.history_latest_ledger ?? 0) > 0,
        blockHeight: data?.history_latest_ledger ?? 0,
        latency: Date.now() - start,
        lastChecked: Date.now(),
      };
    } catch {
      return this.offlineStatus();
    }
  }
}
