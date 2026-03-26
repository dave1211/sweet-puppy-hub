import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

const SOLANA_RPC = "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

const KNOWN_TOKENS: Record<string, { symbol: string; name: string; decimals: number; icon: string }> = {
  "So11111111111111111111111111111111111111112": { symbol: "SOL", name: "Wrapped SOL", decimals: 9, icon: "◎" },
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": { symbol: "BONK", name: "Bonk", decimals: 5, icon: "🦴" },
  "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm": { symbol: "WIF", name: "dogwifhat", decimals: 6, icon: "🎩" },
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": { symbol: "JUP", name: "Jupiter", decimals: 6, icon: "🪐" },
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": { symbol: "USDC", name: "USD Coin", decimals: 6, icon: "💲" },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": { symbol: "USDT", name: "Tether", decimals: 6, icon: "💵" },
  "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So": { symbol: "mSOL", name: "Marinade SOL", decimals: 9, icon: "🧊" },
  "7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj": { symbol: "stSOL", name: "Lido SOL", decimals: 9, icon: "🔷" },
  "RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a": { symbol: "RLBB", name: "Rollbit", decimals: 2, icon: "🎰" },
  "HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3": { symbol: "PYTH", name: "Pyth Network", decimals: 6, icon: "🔮" },
  "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL": { symbol: "JTO", name: "Jito", decimals: 9, icon: "⚡" },
  "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn": { symbol: "jitoSOL", name: "Jito SOL", decimals: 9, icon: "⚡" },
  "TNSRxcUxoT9xBG3de7PiJyTDYu7kskLqcpddxnEJAS6": { symbol: "TNSR", name: "Tensor", decimals: 9, icon: "📐" },
  "WENWENvqqNya429ubCdR81ZmD69brwQaaBYY6p91oHk": { symbol: "WEN", name: "WEN", decimals: 5, icon: "📜" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Public data endpoint — no auth required (fetches public on-chain balances only)

    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
      return new Response(
        JSON.stringify({ error: "address query parameter required" }),
        { status: 400, headers: jsonHeaders }
      );
    }

    const [solBalRes, tokenAccountsRes] = await Promise.all([
      fetch(SOLANA_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1, method: "getBalance",
          params: [address],
        }),
      }),
      fetch(SOLANA_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 2, method: "getTokenAccountsByOwner",
          params: [
            address,
            { programId: TOKEN_PROGRAM_ID },
            { encoding: "jsonParsed" },
          ],
        }),
      }),
    ]);

    const solData = await solBalRes.json();
    const tokenData = await tokenAccountsRes.json();

    const solBalance = (solData.result?.value ?? 0) / 1e9;

    interface ParsedTokenAccount {
      account: {
        data: {
          parsed: {
            info: {
              mint: string;
              tokenAmount: {
                uiAmount: number | null;
                decimals: number;
              };
            };
          };
        };
      };
      pubkey: string;
    }

    const tokenAccounts: Array<{
      mint: string;
      balance: number;
      decimals: number;
      symbol: string;
      name: string;
      icon: string;
      tokenAccount: string;
    }> = [];

    if (tokenData.result?.value) {
      for (const acct of tokenData.result.value as ParsedTokenAccount[]) {
        const info = acct.account.data.parsed.info;
        const mint = info.mint;
        const uiAmount = info.tokenAmount.uiAmount ?? 0;

        if (uiAmount <= 0) continue;

        const known = KNOWN_TOKENS[mint];
        tokenAccounts.push({
          mint,
          balance: uiAmount,
          decimals: info.tokenAmount.decimals,
          symbol: known?.symbol ?? mint.slice(0, 4) + "…",
          name: known?.name ?? "Unknown Token",
          icon: known?.icon ?? "🪙",
          tokenAccount: acct.pubkey,
        });
      }
    }

    tokenAccounts.sort((a, b) => b.balance - a.balance);

    return new Response(
      JSON.stringify({ address, solBalance, tokens: tokenAccounts }),
      { headers: jsonHeaders }
    );
  } catch (error: unknown) {
    console.error("Wallet balances error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: jsonHeaders,
    });
  }
});
