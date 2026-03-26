import { BaseChainAdapter } from "./base";
import type { ChainBalance, ChainTransaction, ChainTokenMetadata, ChainNetworkStatus } from "../types";

// QNT is an ERC-20 on Ethereum — uses Ethereum RPC for balance
const ETH_RPC = "https://eth.llamarpc.com";
const QNT_CONTRACT = "0x4a220E6096B25EADb88358cb44068A3248254675";

export class QuantAdapter extends BaseChainAdapter {
  readonly chainId = "quant" as const;

  async getBalances(address: string): Promise<ChainBalance> {
    try {
      // ERC-20 balanceOf call
      const selector = "0x70a08231";
      const paddedAddr = address.toLowerCase().replace("0x", "").padStart(64, "0");
      const callData = selector + paddedAddr;

      const res = await this.safeJsonFetch<{ result?: string }>(ETH_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1,
          method: "eth_call",
          params: [{ to: QNT_CONTRACT, data: callData }, "latest"],
        }),
      });

      const rawBalance = parseInt(res?.result ?? "0", 16);
      const qnt = rawBalance / 1e18;

      const priceData = await this.safeJsonFetch<{ "quant-network"?: { usd?: number } }>(
        "https://api.coingecko.com/api/v3/simple/price?ids=quant-network&vs_currencies=usd"
      );
      const qntPrice = priceData?.["quant-network"]?.usd ?? 0;

      return {
        chainId: "quant",
        nativeBalance: qnt,
        nativeSymbol: "QNT",
        nativeValueUSD: qnt * qntPrice,
        tokens: [],
        lastUpdated: Date.now(),
      };
    } catch {
      return this.emptyBalance();
    }
  }

  async getTransactions(): Promise<ChainTransaction[]> {
    return []; // Would need Etherscan for ERC-20 transfer events
  }

  async getTokenMetadata(): Promise<ChainTokenMetadata | null> {
    return {
      chainId: "quant",
      address: QNT_CONTRACT,
      symbol: "QNT",
      name: "Quant",
      decimals: 18,
      icon: "◆",
      website: "https://quant.network",
      description: "Overledger — blockchain interoperability",
      isCompliance: true,
    };
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
        chainId: "quant",
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
