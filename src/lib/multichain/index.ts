/**
 * Multi-Chain Registry — single entry point.
 * Lazily instantiates adapters. UI imports only this module.
 */
import type { ChainAdapter, ChainId, ChainBalance, MultiChainPortfolio } from "./types";
import { SolanaAdapter } from "./adapters/solana";
import { BitcoinAdapter } from "./adapters/bitcoin";
import { EthereumAdapter } from "./adapters/ethereum";
import { XRPLAdapter } from "./adapters/xrpl";
import { StellarAdapter } from "./adapters/stellar";
import { QuantAdapter } from "./adapters/quant";
import { XDCAdapter } from "./adapters/xdc";
import { HederaAdapter } from "./adapters/hedera";
import { AlgorandAdapter } from "./adapters/algorand";
import { IOTAAdapter } from "./adapters/iota";

const adapters = new Map<ChainId, ChainAdapter>();

function getOrCreate(chainId: ChainId): ChainAdapter {
  if (!adapters.has(chainId)) {
    switch (chainId) {
      case "solana": adapters.set(chainId, new SolanaAdapter()); break;
      case "bitcoin": adapters.set(chainId, new BitcoinAdapter()); break;
      case "ethereum": adapters.set(chainId, new EthereumAdapter()); break;
      case "xrpl": adapters.set(chainId, new XRPLAdapter()); break;
      case "stellar": adapters.set(chainId, new StellarAdapter()); break;
      case "quant": adapters.set(chainId, new QuantAdapter()); break;
      case "xdc": adapters.set(chainId, new XDCAdapter()); break;
      case "hedera": adapters.set(chainId, new HederaAdapter()); break;
      case "algorand": adapters.set(chainId, new AlgorandAdapter()); break;
      case "iota": adapters.set(chainId, new IOTAAdapter()); break;
    }
  }
  return adapters.get(chainId)!;
}

export function getChainAdapter(chainId: ChainId): ChainAdapter {
  return getOrCreate(chainId);
}

/**
 * Fetch balances from multiple chains in parallel.
 * Each chain fails independently — never blocks others.
 */
export async function getMultiChainPortfolio(
  wallets: Partial<Record<ChainId, string>>
): Promise<MultiChainPortfolio> {
  const entries = Object.entries(wallets) as [ChainId, string][];

  const results = await Promise.allSettled(
    entries.map(async ([chainId, address]) => {
      const adapter = getChainAdapter(chainId);
      return adapter.getBalances(address);
    })
  );

  const chains: ChainBalance[] = results
    .filter((r): r is PromiseFulfilledResult<ChainBalance> => r.status === "fulfilled")
    .map(r => r.value);

  const totalValueUSD = chains.reduce((sum, c) => {
    const tokenValue = c.tokens.reduce((s, t) => s + t.valueUSD, 0);
    return sum + c.nativeValueUSD + tokenValue;
  }, 0);

  return { totalValueUSD, chains, lastUpdated: Date.now() };
}

export { CHAIN_CONFIGS, ACTIVE_CHAINS, COMPLIANCE_CHAINS, getChainConfig } from "./chains";
export type { ChainId, ChainConfig, ChainBalance, ChainTokenBalance, ChainTransaction, ChainNetworkStatus, MultiChainPortfolio, ChainAdapter } from "./types";
