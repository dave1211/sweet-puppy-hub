export interface WalletProfile {
  address: string;
  label: string;
  totalInteractions: number;
  uniqueTokens: number;
  latestActivity: number;
}
export type WhaleClass = "whale" | "active" | null;
export function classifyWallet(profile: WalletProfile): WhaleClass {
  const { totalInteractions, uniqueTokens, latestActivity } = profile;
  const nowSec = Date.now() / 1000;
  const isRecent = latestActivity > 0 && nowSec - latestActivity < 3600;
  if (totalInteractions >= 6 && uniqueTokens >= 3 && isRecent) return "whale";
  if (totalInteractions >= 8 && uniqueTokens >= 2) return "whale";
  if (totalInteractions >= 5 && uniqueTokens >= 4) return "whale";
  if (totalInteractions >= 3 && isRecent) return "active";
  return null;
}
