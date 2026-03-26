import { BaseChainAdapter } from "./base";
import type { ChainBalance, ChainTransaction, ChainTokenMetadata, ChainNetworkStatus, ChainTokenBalance } from "../types";

const XRPL_RPC = "https://s1.ripple.com:51234";

export class XRPLAdapter extends BaseChainAdapter {
  readonly chainId = "xrpl" as const;

  async getBalances(address: string): Promise<ChainBalance> {
    try {
      const res = await this.safeJsonFetch<{
        result?: {
          account_data?: { Balance?: string };
          lines?: Array<{ currency: string; balance: string; account: string }>;
        };
      }>(XRPL_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "account_info", params: [{ account: address, ledger_index: "validated" }] }),
      });

      const drops = parseInt(res?.result?.account_data?.Balance ?? "0", 10);
      const xrp = drops / 1e6;

      // Get trust lines for tokens
      const linesRes = await this.safeJsonFetch<{
        result?: { lines?: Array<{ currency: string; balance: string; account: string }> };
      }>(XRPL_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "account_lines", params: [{ account: address, ledger_index: "validated" }] }),
      });

      const priceData = await this.safeJsonFetch<{ ripple?: { usd?: number } }>(
        "https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd"
      );
      const xrpPrice = priceData?.ripple?.usd ?? 0;

      const tokens: ChainTokenBalance[] = (linesRes?.result?.lines ?? [])
        .filter(l => parseFloat(l.balance) > 0)
        .map(l => ({
          address: l.account,
          symbol: l.currency.length > 3 ? Buffer.from(l.currency, "hex").toString("utf-8").replace(/\0/g, "") : l.currency,
          name: l.currency,
          balance: parseFloat(l.balance),
          decimals: 6,
          valueUSD: 0,
          isCompliance: true,
        }));

      return {
        chainId: "xrpl",
        nativeBalance: xrp,
        nativeSymbol: "XRP",
        nativeValueUSD: xrp * xrpPrice,
        tokens,
        lastUpdated: Date.now(),
      };
    } catch {
      return this.emptyBalance();
    }
  }

  async getTransactions(address: string, limit = 10): Promise<ChainTransaction[]> {
    try {
      const res = await this.safeJsonFetch<{
        result?: { transactions?: Array<{ tx?: { hash: string; TransactionType: string; date?: number; Fee?: string } }> };
      }>(XRPL_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "account_tx",
          params: [{ account: address, limit, ledger_index_min: -1, ledger_index_max: -1 }],
        }),
      });

      return (res?.result?.transactions ?? []).map(t => ({
        chainId: "xrpl" as const,
        hash: t.tx?.hash ?? "",
        type: t.tx?.TransactionType ?? "unknown",
        timestamp: ((t.tx?.date ?? 0) + 946684800) * 1000,
        from: address,
        to: "",
        amount: 0,
        symbol: "XRP",
        fee: parseInt(t.tx?.Fee ?? "0", 10) / 1e6,
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
      const res = await this.safeJsonFetch<{
        result?: { info?: { validated_ledger?: { seq?: number } } };
      }>(XRPL_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "server_info", params: [{}] }),
      });
      const seq = res?.result?.info?.validated_ledger?.seq ?? 0;
      return {
        chainId: "xrpl",
        connected: seq > 0,
        blockHeight: seq,
        latency: Date.now() - start,
        lastChecked: Date.now(),
      };
    } catch {
      return this.offlineStatus();
    }
  }
}
