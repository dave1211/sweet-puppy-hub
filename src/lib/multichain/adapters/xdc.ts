import { BaseChainAdapter } from "./base";
import type { ChainBalance, ChainTransaction, ChainTokenMetadata, ChainNetworkStatus, ChainId } from "../types";

export class XDCAdapter extends BaseChainAdapter {
  readonly chainId: ChainId = "xdc";
  private readonly rpc = "https://rpc.xinfin.network";

  async getBalances(address: string): Promise<ChainBalance> {
    try {
      const xdcAddr = address.startsWith("0x") ? address : `0x${address.replace(/^xdc/i, "")}`;
      const res = await this.safeJsonFetch<{ result: string }>(this.rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [xdcAddr, "latest"] }),
      });
      const wei = res?.result ? parseInt(res.result, 16) : 0;
      const balance = wei / 1e18;

      const priceData = await this.safeJsonFetch<{ "xdce-crowd-sale"?: { usd?: number } }>(
        "https://api.coingecko.com/api/v3/simple/price?ids=xdce-crowd-sale&vs_currencies=usd"
      );
      const xdcPrice = priceData?.["xdce-crowd-sale"]?.usd ?? 0;

      return { chainId: this.chainId, nativeBalance: balance, nativeSymbol: "XDC", nativeValueUSD: balance * xdcPrice, tokens: [], lastUpdated: Date.now() };
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
      const res = await this.safeJsonFetch<{ result: string }>(this.rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] }),
      });
      const latency = Date.now() - start;
      const blockHeight = res?.result ? parseInt(res.result, 16) : 0;
      return { chainId: this.chainId, connected: blockHeight > 0, blockHeight, latency, lastChecked: Date.now() };
    } catch {
      return this.offlineStatus();
    }
  }
}
