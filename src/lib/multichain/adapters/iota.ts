import { BaseChainAdapter } from "./base";
import type { ChainBalance, ChainTransaction, ChainTokenMetadata, ChainNetworkStatus, ChainId } from "../types";

export class IOTAAdapter extends BaseChainAdapter {
  readonly chainId: ChainId = "iota";
  private readonly rpc = "https://json-rpc.evm.iotaledger.net";

  async getBalances(address: string): Promise<ChainBalance> {
    try {
      const res = await this.safeJsonFetch<{ result: string }>(this.rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
      });
      const wei = res?.result ? parseInt(res.result, 16) : 0;
      const balance = wei / 1e18;
      return { chainId: this.chainId, nativeBalance: balance, nativeSymbol: "IOTA", nativeValueUSD: 0, tokens: [], lastUpdated: Date.now() };
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
