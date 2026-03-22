import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cache: Record<string, { data: unknown; ts: number }> = {};
const CACHE_TTL = 30_000;

function getCached<T>(key: string): T | null {
  const entry = cache[key];
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data as T;
  return null;
}

function setCache(key: string, data: unknown) {
  cache[key] = { data, ts: Date.now() };
}

const KNOWN_TOKENS: Record<string, string> = {
  "So11111111111111111111111111111112": "solana",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "usd-coin",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "tether",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": "bonk",
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": "jupiter-exchange-solana",
  "hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux": "helium",
  "rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof": "render-token",
  "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R": "raydium",
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": "msol",
};

type PriceSnapshot = {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
};

async function fetchCoinGeckoSolPrice(): Promise<PriceSnapshot | null> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true"
  );
  if (!res.ok) return null;
  const data = await res.json();
  const sol = data.solana;
  if (!sol || typeof sol.usd !== "number") return null;
  return {
    price: sol.usd,
    change24h: sol.usd_24h_change ?? 0,
    volume24h: sol.usd_24h_vol ?? 0,
    marketCap: sol.usd_market_cap ?? 0,
  };
}

async function fetchKrakenSolPrice(previous?: PriceSnapshot): Promise<PriceSnapshot | null> {
  const res = await fetch("https://api.kraken.com/0/public/Ticker?pair=SOLUSD");
  if (!res.ok) return null;
  const data = await res.json();
  if (Array.isArray(data.error) && data.error.length > 0) return null;
  const pair = Object.values(data.result ?? {})[0] as
    | { c?: string[]; p?: string[]; v?: string[] }
    | undefined;
  const price = Number(pair?.c?.[0] ?? 0);
  const vwap24h = Number(pair?.p?.[1] ?? 0);
  const volumeBase24h = Number(pair?.v?.[1] ?? 0);
  if (!Number.isFinite(price) || price <= 0) return null;
  return {
    price,
    change24h: vwap24h > 0 ? ((price - vwap24h) / vwap24h) * 100 : previous?.change24h ?? 0,
    volume24h: Number.isFinite(volumeBase24h) ? volumeBase24h * price : previous?.volume24h ?? 0,
    marketCap: previous?.marketCap ?? 0,
  };
}

async function fetchSolPrice(): Promise<PriceSnapshot> {
  const cached = getCached<PriceSnapshot>("sol-price");
  if (cached) return cached;
  const stale = cache["sol-price"]?.data as PriceSnapshot | undefined;
  const coinGeckoData = await fetchCoinGeckoSolPrice().catch(() => null);
  if (coinGeckoData) { setCache("sol-price", coinGeckoData); return coinGeckoData; }
  const krakenData = await fetchKrakenSolPrice(stale).catch(() => null);
  if (krakenData) { setCache("sol-price", krakenData); return krakenData; }
  if (stale) return stale;
  return { price: 0, change24h: 0, volume24h: 0, marketCap: 0 };
}

async function fetchTokenByAddress(address: string): Promise<{
  name: string; symbol: string; price: number; change24h: number; volume24h: number; marketCap: number;
} | null> {
  const geckoId = KNOWN_TOKENS[address];
  if (geckoId) {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${geckoId}?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return {
      name: data.name,
      symbol: (data.symbol as string).toUpperCase(),
      price: data.market_data?.current_price?.usd ?? 0,
      change24h: data.market_data?.price_change_percentage_24h ?? 0,
      volume24h: data.market_data?.total_volume?.usd ?? 0,
      marketCap: data.market_data?.market_cap?.usd ?? 0,
    };
  }
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/solana/contract/${address}`);
    if (res.ok) {
      const data = await res.json();
      return {
        name: data.name,
        symbol: (data.symbol as string).toUpperCase(),
        price: data.market_data?.current_price?.usd ?? 0,
        change24h: data.market_data?.price_change_percentage_24h ?? 0,
        volume24h: data.market_data?.total_volume?.usd ?? 0,
        marketCap: data.market_data?.market_cap?.usd ?? 0,
      };
    }
  } catch { /* fall through */ }
  return null;
}

async function fetchMultipleTokenPrices(
  addresses: string[]
): Promise<Record<string, { price: number; change24h: number; volume24h?: number }>> {
  const results: Record<string, { price: number; change24h: number; volume24h?: number }> = {};
  const geckoIds: { addr: string; id: string }[] = [];
  const unknownAddrs: string[] = [];

  for (const addr of addresses) {
    const geckoId = KNOWN_TOKENS[addr];
    if (geckoId) geckoIds.push({ addr, id: geckoId });
    else unknownAddrs.push(addr);
  }

  if (geckoIds.length > 0) {
    const ids = [...new Set(geckoIds.map((g) => g.id))].join(",");
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
      );
      if (res.ok) {
        const data = await res.json();
        for (const { addr, id } of geckoIds) {
          if (data[id]) {
            results[addr] = {
              price: data[id].usd ?? 0,
              change24h: data[id].usd_24h_change ?? 0,
              volume24h: data[id].usd_24h_vol ?? 0,
            };
          }
        }
      }
    } catch { /* ignore */ }
  }

  for (const addr of unknownAddrs.slice(0, 3)) {
    try {
      const res = await fetch(`https://api.coingecko.com/api/v3/coins/solana/contract/${addr}`);
      if (res.ok) {
        const data = await res.json();
        results[addr] = {
          price: data.market_data?.current_price?.usd ?? 0,
          change24h: data.market_data?.price_change_percentage_24h ?? 0,
          volume24h: data.market_data?.total_volume?.usd ?? 0,
        };
      }
    } catch { /* ignore */ }
  }

  return results;
}

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";

interface WalletTransaction {
  signature: string;
  blockTime: number | null;
  slot: number;
  err: unknown;
  memo: string | null;
  tokenAddress: string | null;
  type: "buy" | "sell" | "transfer" | "unknown";
  amount: number | null;
  tokenSymbol: string | null;
}

async function fetchTransactionDetails(
  signatures: string[],
  walletAddress: string
): Promise<Record<string, { tokenAddress: string | null; type: string; amount: number | null; tokenSymbol: string | null }>> {
  const details: Record<string, { tokenAddress: string | null; type: string; amount: number | null; tokenSymbol: string | null }> = {};
  const toFetch = signatures.slice(0, 5);

  const results = await Promise.allSettled(
    toFetch.map(async (sig) => {
      const res = await fetch(SOLANA_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: [sig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
        }),
      });
      if (!res.ok) return { sig, detail: null };
      const data = await res.json();
      return { sig, detail: data.result };
    })
  );

  for (const result of results) {
    if (result.status !== "fulfilled" || !result.value.detail) continue;
    const { sig, detail } = result.value;

    try {
      const preBalances = detail.meta?.preTokenBalances ?? [];
      const postBalances = detail.meta?.postTokenBalances ?? [];
      const accountKeys = detail.transaction?.message?.accountKeys ?? [];
      const walletIndex = accountKeys.findIndex(
        (k: { pubkey?: string }) =>
          (typeof k === "string" ? k : k.pubkey) === walletAddress
      );

      let tokenAddress: string | null = null;
      let type: "buy" | "sell" | "transfer" | "unknown" = "unknown";
      let amount: number | null = null;
      let tokenSymbol: string | null = null;

      for (const post of postBalances) {
        const pre = preBalances.find(
          (p: { accountIndex: number; mint: string }) =>
            p.accountIndex === post.accountIndex && p.mint === post.mint
        );
        const postAmount = parseFloat(post.uiTokenAmount?.uiAmountString ?? "0");
        const preAmount = pre ? parseFloat(pre.uiTokenAmount?.uiAmountString ?? "0") : 0;
        const diff = postAmount - preAmount;

        if (Math.abs(diff) > 0) {
          tokenAddress = post.mint ?? null;
          const isOwner = post.owner === walletAddress;
          const preOwner = pre?.owner === walletAddress;
          if (isOwner && diff > 0) { type = "buy"; amount = diff; }
          else if ((preOwner || isOwner) && diff < 0) { type = "sell"; amount = Math.abs(diff); }
          else if (isOwner || preOwner) { type = "transfer"; amount = Math.abs(diff); }
          tokenSymbol = null;
          break;
        }
      }

      if (!tokenAddress && detail.meta && walletIndex !== -1) {
        const preSol = detail.meta.preBalances?.[walletIndex] ?? 0;
        const postSol = detail.meta.postBalances?.[walletIndex] ?? 0;
        const solDiff = (postSol - preSol) / 1e9;
        if (Math.abs(solDiff) > 0.001) {
          tokenAddress = "So11111111111111111111111111111112";
          tokenSymbol = "SOL";
          amount = Math.abs(solDiff);
          type = solDiff > 0 ? "buy" : "sell";
        }
      }

      details[sig] = { tokenAddress, type, amount, tokenSymbol };
    } catch {
      details[sig] = { tokenAddress: null, type: "unknown", amount: null, tokenSymbol: null };
    }
  }

  return details;
}

async function fetchWalletActivity(address: string, limit = 10): Promise<WalletTransaction[]> {
  const cacheKey = `wallet-${address}`;
  const cached = getCached<WalletTransaction[]>(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(SOLANA_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [address, { limit }],
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const rawSigs = data.result ?? [];
    const signatures = rawSigs.map((s: Record<string, unknown>) => s.signature as string);
    const txDetails = await fetchTransactionDetails(signatures, address);

    const sigs: WalletTransaction[] = rawSigs.map((s: Record<string, unknown>) => {
      const sig = s.signature as string;
      const detail = txDetails[sig];
      return {
        signature: sig,
        blockTime: s.blockTime as number | null,
        slot: s.slot as number,
        err: s.err,
        memo: s.memo as string | null,
        tokenAddress: detail?.tokenAddress ?? null,
        type: (detail?.type as WalletTransaction["type"]) ?? "unknown",
        amount: detail?.amount ?? null,
        tokenSymbol: detail?.tokenSymbol ?? null,
      };
    });

    setCache(cacheKey, sigs);
    return sigs;
  } catch {
    return [];
  }
}

interface NewLaunchToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  pairCreatedAt: number;
  dexId: string;
  url: string;
}

async function fetchPumpFunLatest(): Promise<NewLaunchToken[]> {
  try {
    const res = await fetch("https://frontend-api-v3.pump.fun/coins/latest?limit=10&includeNsfw=false", {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.slice(0, 8).map((coin: Record<string, unknown>) => ({
      address: coin.mint as string,
      symbol: (coin.symbol as string) ?? "???",
      name: (coin.name as string) ?? "Unknown",
      price: Number(coin.usd_market_cap ?? 0) > 0 && Number(coin.total_supply ?? 0) > 0
        ? Number(coin.usd_market_cap) / Number(coin.total_supply) : 0,
      change24h: 0,
      volume24h: 0,
      liquidity: 0,
      pairCreatedAt: Number(coin.created_timestamp ?? Date.now()),
      dexId: "pump.fun",
      url: `https://pump.fun/coin/${coin.mint as string}`,
    }));
  } catch { return []; }
}

async function fetchBonkFunLatest(): Promise<NewLaunchToken[]> {
  try {
    const res = await fetch("https://api.bonk.fun/tokens/latest?limit=8", {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const tokens = Array.isArray(data) ? data : (data.tokens ?? []);
    if (!Array.isArray(tokens)) return [];
    return tokens.slice(0, 6).map((coin: Record<string, unknown>) => ({
      address: (coin.mint ?? coin.address ?? coin.tokenAddress) as string,
      symbol: (coin.symbol as string) ?? "???",
      name: (coin.name as string) ?? "Unknown",
      price: Number(coin.price ?? 0),
      change24h: Number(coin.priceChange24h ?? coin.change24h ?? 0),
      volume24h: Number(coin.volume24h ?? coin.volume ?? 0),
      liquidity: Number(coin.liquidity ?? 0),
      pairCreatedAt: Number(coin.createdAt ?? coin.created_timestamp ?? Date.now()),
      dexId: "bonk.fun",
      url: `https://bonk.fun/token/${(coin.mint ?? coin.address ?? coin.tokenAddress) as string}`,
    }));
  } catch { return []; }
}

async function fetchDexScreenerPairs(addresses: string[]): Promise<NewLaunchToken[]> {
  if (addresses.length === 0) return [];
  const batch = addresses.slice(0, 20).join(",");
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${batch}`);
    if (!res.ok) return [];
    const data = await res.json();
    const pairs = data.pairs ?? [];
    const seen = new Set<string>();
    const results: NewLaunchToken[] = [];
    for (const pair of pairs) {
      if (pair.chainId !== "solana") continue;
      const addr = pair.baseToken?.address;
      if (!addr || seen.has(addr)) continue;
      seen.add(addr);
      results.push({
        address: addr,
        symbol: pair.baseToken?.symbol ?? "???",
        name: pair.baseToken?.name ?? "Unknown",
        price: parseFloat(pair.priceUsd ?? "0") || 0,
        change24h: pair.priceChange?.h24 ?? 0,
        volume24h: pair.volume?.h24 ?? 0,
        liquidity: pair.liquidity?.usd ?? 0,
        pairCreatedAt: pair.pairCreatedAt ?? Date.now(),
        dexId: pair.dexId ?? "unknown",
        url: pair.url ?? `https://dexscreener.com/solana/${addr}`,
      });
    }
    return results.slice(0, 15);
  } catch { return []; }
}

async function fetchDexScreenerLaunches(): Promise<NewLaunchToken[]> {
  try {
    const res = await fetch("https://api.dexscreener.com/token-profiles/latest/v1", {
      headers: { "Accept": "application/json" },
    });
    if (!res.ok) {
      const boostRes = await fetch("https://api.dexscreener.com/token-boosts/latest/v1");
      if (!boostRes.ok) return [];
      const boostData = await boostRes.json();
      const solanaTokens = (Array.isArray(boostData) ? boostData : [])
        .filter((t: Record<string, unknown>) => t.chainId === "solana").slice(0, 12);
      return fetchDexScreenerPairs(solanaTokens.map((t: Record<string, unknown>) => t.tokenAddress as string));
    }
    const profileData = await res.json();
    const solanaProfiles = (Array.isArray(profileData) ? profileData : [])
      .filter((t: Record<string, unknown>) => t.chainId === "solana").slice(0, 12);
    return fetchDexScreenerPairs(solanaProfiles.map((t: Record<string, unknown>) => t.tokenAddress as string));
  } catch { return []; }
}

async function fetchNewLaunches(): Promise<NewLaunchToken[]> {
  const cacheKey = "new-launches";
  const cached = getCached<NewLaunchToken[]>(cacheKey);
  if (cached) return cached;
  try {
    const [dexScreenerTokens, pumpFunTokens, bonkFunTokens] = await Promise.all([
      fetchDexScreenerLaunches(), fetchPumpFunLatest(), fetchBonkFunLatest(),
    ]);
    const seen = new Set<string>();
    const merged: NewLaunchToken[] = [];
    for (const token of [...pumpFunTokens, ...dexScreenerTokens, ...bonkFunTokens]) {
      if (!token.address || seen.has(token.address)) continue;
      seen.add(token.address);
      merged.push(token);
    }
    const results = merged.slice(0, 15);
    cache[cacheKey] = { data: results, ts: Date.now() };
    return results;
  } catch {
    return cache[cacheKey]?.data as NewLaunchToken[] ?? [];
  }
}

async function fetchTrendingSignals(): Promise<NewLaunchToken[]> {
  const cacheKey = "trending-signals";
  const cached = getCached<NewLaunchToken[]>(cacheKey);
  if (cached) return cached;
  try {
    const boostRes = await fetch("https://api.dexscreener.com/token-boosts/top/v1");
    if (!boostRes.ok) return cache[cacheKey]?.data as NewLaunchToken[] ?? [];
    const boostData = await boostRes.json();
    const solanaTokens = (Array.isArray(boostData) ? boostData : [])
      .filter((t: Record<string, unknown>) => t.chainId === "solana").slice(0, 10);
    const results = await fetchDexScreenerPairs(solanaTokens.map((t: Record<string, unknown>) => t.tokenAddress as string));
    cache[cacheKey] = { data: results, ts: Date.now() };
    return results;
  } catch {
    return cache[cacheKey]?.data as NewLaunchToken[] ?? [];
  }
}

interface TokenSearchResult {
  address: string;
  symbol: string;
  name: string;
  price: number;
}

async function searchTokens(query: string): Promise<TokenSearchResult[]> {
  const cacheKey = `search-${query.toLowerCase()}`;
  const cached = getCached<TokenSearchResult[]>(cacheKey);
  if (cached) return cached;
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return [];
    const data = await res.json();
    const pairs = data.pairs ?? [];
    const seen = new Set<string>();
    const results: TokenSearchResult[] = [];
    for (const pair of pairs) {
      if (pair.chainId !== "solana") continue;
      const addr = pair.baseToken?.address;
      if (!addr || seen.has(addr)) continue;
      seen.add(addr);
      results.push({
        address: addr,
        symbol: pair.baseToken?.symbol ?? "???",
        name: pair.baseToken?.name ?? "Unknown",
        price: parseFloat(pair.priceUsd ?? "0") || 0,
      });
      if (results.length >= 8) break;
    }
    setCache(cacheKey, results);
    return results;
  } catch { return []; }
}

// ── Token Enrichment ──
// Returns full on-chain data from DexScreener pair detail + token profile
interface EnrichedTokenData {
  address: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  liquidity: number;
  pairCreatedAt: number;
  dexId: string;
  url: string;
  // Enriched fields
  holderCount: number;
  txCount: number;
  buyCount: number;
  sellCount: number;
  topHolderPct: number;
  lpLocked: boolean | null;
  deployerAddress: string | null;
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  description: string | null;
  imageUrl: string | null;
  hasCompleteMeta: boolean;
}

async function enrichTokens(addresses: string[]): Promise<EnrichedTokenData[]> {
  const cacheKey = `enrich-${addresses.sort().join(",")}`;
  const cached = getCached<EnrichedTokenData[]>(cacheKey);
  if (cached) return cached;

  if (addresses.length === 0) return [];
  const batch = addresses.slice(0, 20).join(",");

  try {
    // Fetch pair data from DexScreener (gives volume, liquidity, buys, sells, socials)
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${batch}`);
    if (!res.ok) return [];
    const data = await res.json();
    const pairs = data.pairs ?? [];

    const seen = new Set<string>();
    const results: EnrichedTokenData[] = [];

    for (const pair of pairs) {
      if (pair.chainId !== "solana") continue;
      const addr = pair.baseToken?.address;
      if (!addr || seen.has(addr)) continue;
      seen.add(addr);

      // DexScreener provides txns data with buys/sells counts
      const txns = pair.txns ?? {};
      const h24 = txns.h24 ?? {};
      const h6 = txns.h6 ?? {};
      const h1 = txns.h1 ?? {};
      const m5 = txns.m5 ?? {};

      const buyCount = (h24.buys ?? 0) || (h6.buys ?? 0) * 4 || (h1.buys ?? 0) * 24;
      const sellCount = (h24.sells ?? 0) || (h6.sells ?? 0) * 4 || (h1.sells ?? 0) * 24;
      const txCount = buyCount + sellCount;

      // DexScreener provides info.socials and info.websites
      const info = pair.info ?? {};
      const socials = info.socials ?? [];
      const websites = info.websites ?? [];

      const twitter = socials.find((s: { type: string; url: string }) => s.type === "twitter")?.url ?? null;
      const telegram = socials.find((s: { type: string; url: string }) => s.type === "telegram")?.url ?? null;
      const website = websites.length > 0 ? websites[0]?.url ?? null : null;
      const imageUrl = info.imageUrl ?? pair.info?.imageUrl ?? null;
      const description = info.description ?? null;

      // DexScreener provides liquidity lock info in some pairs
      const locks = pair.locks ?? [];
      let lpLocked: boolean | null = null;
      if (locks.length > 0) {
        lpLocked = true;
      } else if (pair.liquidity?.usd > 0) {
        // If no lock data but has liquidity, we don't know
        lpLocked = null;
      }

      // Maker count can approximate holder activity
      const makers = pair.makers?.h24 ?? pair.makers?.h6 ?? 0;

      results.push({
        address: addr,
        symbol: pair.baseToken?.symbol ?? "???",
        name: pair.baseToken?.name ?? "Unknown",
        price: parseFloat(pair.priceUsd ?? "0") || 0,
        change24h: pair.priceChange?.h24 ?? 0,
        volume24h: pair.volume?.h24 ?? 0,
        liquidity: pair.liquidity?.usd ?? 0,
        pairCreatedAt: pair.pairCreatedAt ?? Date.now(),
        dexId: pair.dexId ?? "unknown",
        url: pair.url ?? `https://dexscreener.com/solana/${addr}`,
        holderCount: makers > 0 ? makers : Math.max(buyCount, 5),
        txCount,
        buyCount,
        sellCount,
        topHolderPct: 0, // DexScreener doesn't provide this directly
        lpLocked,
        deployerAddress: pair.pairCreatedBy ?? null,
        website,
        twitter,
        telegram,
        description,
        imageUrl,
        hasCompleteMeta: !!(website && (twitter || telegram)),
      });
    }

    setCache(cacheKey, results);
    return results;
  } catch {
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "sol-price") {
      const data = await fetchSolPrice();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "token-info") {
      const address = url.searchParams.get("address");
      if (!address) {
        return new Response(JSON.stringify({ error: "address required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await fetchTokenByAddress(address);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "batch-prices") {
      const body = await req.json();
      const addresses: string[] = body.addresses ?? [];
      if (addresses.length === 0) {
        return new Response(JSON.stringify({}), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await fetchMultipleTokenPrices(addresses);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "wallet-activity") {
      const address = url.searchParams.get("address");
      if (!address) {
        return new Response(JSON.stringify({ error: "address required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10"), 20);
      const data = await fetchWalletActivity(address, limit);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "new-launches") {
      const data = await fetchNewLaunches();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "trending-signals") {
      const data = await fetchTrendingSignals();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "token-search") {
      const query = url.searchParams.get("q");
      if (!query || query.length < 2) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await searchTokens(query);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "token-enrich") {
      const body = await req.json().catch(() => ({ addresses: [] }));
      const addresses: string[] = body.addresses ?? [];
      if (addresses.length === 0) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await enrichTokens(addresses);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
