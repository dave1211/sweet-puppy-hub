export function detectSniperActivity(walletCount: number, lastSeen: number): "sniper" | "early" | null {
  if (!lastSeen) return null;
  const now = Date.now() / 1000;
  const secondsAgo = now - lastSeen;
  if (walletCount >= 3 && secondsAgo < 120) return "sniper";
  if (walletCount >= 2 && secondsAgo < 300) return "early";
  return null;
}
