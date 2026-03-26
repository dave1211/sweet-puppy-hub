import type { ChainAdapter, ChainBalance, ChainTransaction, ChainTokenMetadata, ChainNetworkStatus, ChainId } from "../types";

/**
 * Base adapter with safe error handling.
 * All chain adapters extend this to get consistent error isolation.
 */
export abstract class BaseChainAdapter implements ChainAdapter {
  abstract readonly chainId: ChainId;

  abstract getBalances(address: string): Promise<ChainBalance>;
  abstract getTransactions(address: string, limit?: number): Promise<ChainTransaction[]>;
  abstract getTokenMetadata(tokenAddress: string): Promise<ChainTokenMetadata | null>;
  abstract getNetworkStatus(): Promise<ChainNetworkStatus>;

  /** Create a safe empty balance response */
  protected emptyBalance(): ChainBalance {
    return {
      chainId: this.chainId,
      nativeBalance: 0,
      nativeSymbol: "",
      nativeValueUSD: 0,
      tokens: [],
      lastUpdated: Date.now(),
    };
  }

  /** Create an offline network status */
  protected offlineStatus(): ChainNetworkStatus {
    return {
      chainId: this.chainId,
      connected: false,
      blockHeight: 0,
      latency: -1,
      lastChecked: Date.now(),
    };
  }

  /** Safe fetch with timeout */
  protected async safeFetch(url: string, options?: RequestInit, timeoutMs = 10_000): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Safe JSON fetch — returns null on failure, never throws */
  protected async safeJsonFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
    try {
      const res = await this.safeFetch(url, options);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }
}
