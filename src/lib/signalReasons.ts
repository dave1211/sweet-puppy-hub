export function formatVol(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
export function buildSignalReason(token: { change24h: number; volume24h: number; liquidity: number; pairCreatedAt?: number; }, walletCount?: number, sniperType?: "sniper" | "early" | null): string {
  const parts: string[] = [];
  if (token.volume24h > 0) parts.push(`Vol ${formatVol(token.volume24h)}`);
  if (token.liquidity > 0) parts.push(`Liq ${formatVol(token.liquidity)}`);
  if (Math.abs(token.change24h) >= 1) parts.push(`${token.change24h >= 0 ? "+" : ""}${token.change24h.toFixed(0)}%`);
  if (token.pairCreatedAt) {
    const ageHours = (Date.now() - token.pairCreatedAt) / (1000 * 60 * 60);
    if (ageHours < 1) parts.push("Very new");
    else if (ageHours < 6) parts.push("Recent launch");
    else if (ageHours < 24) parts.push("New today");
  }
  if (walletCount && walletCount >= 2) parts.push(`🔥 ${walletCount} wallets`);
  else if (walletCount && walletCount === 1) parts.push(`1 wallet active`);
  if (sniperType === "sniper") parts.unshift("🎯 Sniper");
  else if (sniperType === "early") parts.unshift("⚡ Early wallets");
  return parts.slice(0, 4).join(" · ");
}
