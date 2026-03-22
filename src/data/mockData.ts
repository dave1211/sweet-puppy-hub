// Centralized mock data for Tanner Terminal - realistic crypto tokens, wallets, signals, alerts

export interface MockToken {
  id: string;
  name: string;
  symbol: string;
  chain: string;
  price: number;
  change5m: number;
  change1h: number;
  change24h: number;
  volume: number;
  liquidity: number;
  mcap: number;
  pairAge: string;
  buys: number;
  sells: number;
  holders: number;
  riskScore: number;
  signalScore: number;
  status: "active" | "new" | "hot" | "warning" | "rug_risk";
  fdv?: number;
  contractAddress?: string;
}

export interface MockWallet {
  id: string;
  label: string;
  address: string;
  chain: string;
  type: "whale" | "sniper" | "swing" | "degen" | "safe" | "momentum";
  winRate: number;
  avgEntry: number;
  pnl7d: number;
  recentAction: string;
  trustScore: number;
}

export interface MockSignal {
  id: string;
  token: string;
  symbol: string;
  type: string;
  confidence: number;
  timestamp: string;
  reason: string;
  metrics: string;
  riskContext: string;
}

export interface MockAlert {
  id: string;
  type: string;
  token: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  timestamp: string;
  read: boolean;
}

export interface MockHolding {
  id: string;
  token: string;
  symbol: string;
  amount: number;
  avgEntry: number;
  currentPrice: number;
  unrealizedPnl: number;
  realizedPnl: number;
  allocation: number;
  riskProfile: string;
}

export interface MockStrategy {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused" | "draft";
  filters: string[];
  scoreThreshold: number;
  riskCap: number;
  recentPerformance: number;
  linkedWatchlist: string;
}

export const mockTokens: MockToken[] = [
  { id: "1", name: "Pepe Classic", symbol: "PEPE", chain: "ETH", price: 0.00001234, change5m: 2.4, change1h: 8.7, change24h: 34.2, volume: 45_200_000, liquidity: 12_400_000, mcap: 5_200_000_000, pairAge: "289d", buys: 14520, sells: 8340, holders: 234000, riskScore: 22, signalScore: 87, status: "hot", fdv: 5_200_000_000, contractAddress: "0x6982...a3ef" },
  { id: "2", name: "Dogwifhat", symbol: "WIF", chain: "SOL", price: 2.34, change5m: -0.8, change1h: 3.2, change24h: 12.1, volume: 89_000_000, liquidity: 34_000_000, mcap: 2_340_000_000, pairAge: "145d", buys: 23400, sells: 15200, holders: 189000, riskScore: 18, signalScore: 82, status: "active", fdv: 2_340_000_000, contractAddress: "EKpQ...7wNd" },
  { id: "3", name: "BonkInu", symbol: "BONK", chain: "SOL", price: 0.0000234, change5m: 5.1, change1h: -2.3, change24h: -5.4, volume: 23_000_000, liquidity: 8_900_000, mcap: 1_560_000_000, pairAge: "412d", buys: 8900, sells: 12300, holders: 567000, riskScore: 15, signalScore: 65, status: "active", fdv: 1_560_000_000, contractAddress: "DezX...qK9R" },
  { id: "4", name: "TurboToken", symbol: "TURBO", chain: "ETH", price: 0.00892, change5m: 12.3, change1h: 45.6, change24h: 234.5, volume: 12_000_000, liquidity: 2_300_000, mcap: 89_000_000, pairAge: "3d", buys: 5600, sells: 1200, holders: 4500, riskScore: 65, signalScore: 91, status: "new", fdv: 89_000_000, contractAddress: "0x72af...b12c" },
  { id: "5", name: "Moon Rocket", symbol: "MOON", chain: "SOL", price: 0.000567, change5m: -15.2, change1h: -32.4, change24h: -67.8, volume: 890_000, liquidity: 120_000, mcap: 560_000, pairAge: "12h", buys: 340, sells: 2100, holders: 890, riskScore: 92, signalScore: 12, status: "rug_risk", fdv: 560_000, contractAddress: "7xKm...pR3j" },
  { id: "6", name: "SafeYield", symbol: "SAFE", chain: "ETH", price: 1.23, change5m: 0.1, change1h: 0.3, change24h: 2.1, volume: 5_600_000, liquidity: 45_000_000, mcap: 123_000_000, pairAge: "890d", buys: 1200, sells: 980, holders: 45000, riskScore: 5, signalScore: 55, status: "active", fdv: 123_000_000, contractAddress: "0x9f12...e4a1" },
  { id: "7", name: "AlphaDAO", symbol: "ALPHA", chain: "SOL", price: 0.0456, change5m: 8.9, change1h: 22.3, change24h: 89.1, volume: 34_000_000, liquidity: 5_600_000, mcap: 45_600_000, pairAge: "7d", buys: 8900, sells: 3400, holders: 12000, riskScore: 38, signalScore: 88, status: "hot", fdv: 45_600_000, contractAddress: "Bx4m...wK2n" },
  { id: "8", name: "DarkPool", symbol: "DARK", chain: "ETH", price: 0.00234, change5m: -3.2, change1h: 1.2, change24h: -12.3, volume: 1_200_000, liquidity: 890_000, mcap: 2_340_000, pairAge: "45d", buys: 560, sells: 780, holders: 3400, riskScore: 55, signalScore: 42, status: "warning", fdv: 2_340_000, contractAddress: "0x3e7a...c8f2" },
  { id: "9", name: "GigaChad", symbol: "GIGA", chain: "SOL", price: 0.0789, change5m: 3.4, change1h: 15.6, change24h: 56.7, volume: 67_000_000, liquidity: 12_300_000, mcap: 78_900_000, pairAge: "21d", buys: 15600, sells: 7800, holders: 34000, riskScore: 28, signalScore: 79, status: "hot", fdv: 78_900_000, contractAddress: "4Kp7...xN9f" },
  { id: "10", name: "ShadowFi", symbol: "SHADOW", chain: "ETH", price: 0.456, change5m: -1.2, change1h: 5.6, change24h: 23.4, volume: 8_900_000, liquidity: 6_700_000, mcap: 45_600_000, pairAge: "56d", buys: 3400, sells: 2100, holders: 8900, riskScore: 32, signalScore: 71, status: "active", fdv: 45_600_000, contractAddress: "0x8b3d...a7e5" },
  { id: "11", name: "NeonSwap", symbol: "NEON", chain: "SOL", price: 0.00123, change5m: 25.6, change1h: 67.8, change24h: 345.2, volume: 5_600_000, liquidity: 450_000, mcap: 1_230_000, pairAge: "4h", buys: 2300, sells: 340, holders: 1200, riskScore: 72, signalScore: 93, status: "new", fdv: 1_230_000, contractAddress: "Nx8p...dR4m" },
  { id: "12", name: "VaultX", symbol: "VLTX", chain: "ETH", price: 3.45, change5m: 0.5, change1h: -1.2, change24h: 5.6, volume: 12_300_000, liquidity: 56_000_000, mcap: 345_000_000, pairAge: "234d", buys: 4500, sells: 3800, holders: 67000, riskScore: 8, signalScore: 62, status: "active", fdv: 345_000_000, contractAddress: "0x1c4f...b9d3" },
];

export const mockWallets: MockWallet[] = [
  { id: "w1", label: "Alpha Hunter", address: "7xKm...pR3j", chain: "SOL", type: "sniper", winRate: 78, avgEntry: 0.82, pnl7d: 234.5, recentAction: "Bought ALPHA 2m ago", trustScore: 92 },
  { id: "w2", label: "Whale_0x92", address: "0x92af...12bc", chain: "ETH", type: "whale", winRate: 65, avgEntry: 1.2, pnl7d: -12.3, recentAction: "Sold PEPE 15m ago", trustScore: 78 },
  { id: "w3", label: "DegenKing", address: "Bx4m...wK2n", chain: "SOL", type: "degen", winRate: 42, avgEntry: 0.45, pnl7d: 567.8, recentAction: "Bought NEON 5m ago", trustScore: 45 },
  { id: "w4", label: "SafeOps", address: "0x3e7a...c8f2", chain: "ETH", type: "safe", winRate: 89, avgEntry: 2.1, pnl7d: 23.4, recentAction: "Bought VLTX 2h ago", trustScore: 95 },
  { id: "w5", label: "MomentumBot", address: "4Kp7...xN9f", chain: "SOL", type: "momentum", winRate: 71, avgEntry: 0.67, pnl7d: 145.2, recentAction: "Bought GIGA 30m ago", trustScore: 82 },
  { id: "w6", label: "SwingTrader", address: "0x8b3d...a7e5", chain: "ETH", type: "swing", winRate: 74, avgEntry: 1.8, pnl7d: 89.1, recentAction: "Sold SHADOW 1h ago", trustScore: 88 },
  { id: "w7", label: "Sniper_Sol", address: "Nx8p...dR4m", chain: "SOL", type: "sniper", winRate: 82, avgEntry: 0.34, pnl7d: 412.3, recentAction: "Bought TURBO 1m ago", trustScore: 90 },
  { id: "w8", label: "CryptoWhale", address: "0x1c4f...b9d3", chain: "ETH", type: "whale", winRate: 58, avgEntry: 3.4, pnl7d: -45.6, recentAction: "Accumulating SAFE", trustScore: 72 },
];

export const mockSignals: MockSignal[] = [
  { id: "s1", token: "AlphaDAO", symbol: "ALPHA", type: "Whale Buy", confidence: 92, timestamp: "2m ago", reason: "3 tracked wallets bought within 5 minutes", metrics: "Vol +340%, Liq stable", riskContext: "Moderate — new pair, low holder count" },
  { id: "s2", token: "NeonSwap", symbol: "NEON", type: "Fresh Launch", confidence: 88, timestamp: "4m ago", reason: "Contract verified, initial liq locked 6mo", metrics: "Vol $5.6M in 4h, 1200 holders", riskContext: "High — very new, concentrated holders" },
  { id: "s3", token: "GigaChad", symbol: "GIGA", type: "Breakout Forming", confidence: 85, timestamp: "12m ago", reason: "Breaking resistance at $0.075 with volume confirmation", metrics: "Vol +180%, RSI 72", riskContext: "Low-Medium — established pair" },
  { id: "s4", token: "TurboToken", symbol: "TURBO", type: "Volume Spike", confidence: 79, timestamp: "8m ago", reason: "Volume 12x average with sustained buying pressure", metrics: "Vol $12M, B/S ratio 4.6:1", riskContext: "Moderate — 3d pair age" },
  { id: "s5", token: "Moon Rocket", symbol: "MOON", type: "Rug Warning", confidence: 95, timestamp: "1m ago", reason: "Dev wallet sold 45% of supply in 2 transactions", metrics: "Liq -67%, Price -68%", riskContext: "Critical — exit immediately" },
  { id: "s6", token: "Pepe Classic", symbol: "PEPE", type: "Smart Money Entry", confidence: 76, timestamp: "25m ago", reason: "5 high-trust wallets accumulated $2.3M position", metrics: "Vol +45%, stable price", riskContext: "Low — high liquidity, established" },
  { id: "s7", token: "ShadowFi", symbol: "SHADOW", type: "Momentum Continuation", confidence: 73, timestamp: "18m ago", reason: "Consistent uptrend with increasing volume", metrics: "Price +23% 24h, healthy pullbacks", riskContext: "Low-Medium — good structure" },
  { id: "s8", token: "DarkPool", symbol: "DARK", type: "Contract Concern", confidence: 81, timestamp: "5m ago", reason: "Unusual transfer function detected in contract", metrics: "Holders declining, sells increasing", riskContext: "High — proceed with caution" },
];

export const mockAlerts: MockAlert[] = [
  { id: "a1", type: "whale_buy", token: "ALPHA", severity: "high", message: "Alpha Hunter bought 45 SOL of ALPHA", timestamp: "2m ago", read: false },
  { id: "a2", type: "rug_warning", token: "MOON", severity: "critical", message: "Dev wallet dumped 45% — possible rug pull", timestamp: "1m ago", read: false },
  { id: "a3", type: "price_threshold", token: "GIGA", severity: "medium", message: "GIGA crossed $0.075 resistance level", timestamp: "12m ago", read: false },
  { id: "a4", type: "volume_spike", token: "TURBO", severity: "medium", message: "Volume spike 12x on TURBO", timestamp: "8m ago", read: true },
  { id: "a5", type: "new_launch", token: "NEON", severity: "low", message: "New launch detected: NeonSwap (NEON)", timestamp: "4m ago", read: true },
  { id: "a6", type: "ai_signal", token: "PEPE", severity: "medium", message: "Smart money accumulation detected on PEPE", timestamp: "25m ago", read: true },
  { id: "a7", type: "risk_change", token: "DARK", severity: "high", message: "Risk score increased to 55 for DARK", timestamp: "5m ago", read: false },
  { id: "a8", type: "wallet_movement", token: "SAFE", severity: "low", message: "CryptoWhale accumulating SAFE positions", timestamp: "1h ago", read: true },
];

export const mockHoldings: MockHolding[] = [
  { id: "h1", token: "Pepe Classic", symbol: "PEPE", amount: 125_000_000, avgEntry: 0.00000987, currentPrice: 0.00001234, unrealizedPnl: 25.02, realizedPnl: 12.3, allocation: 28, riskProfile: "low" },
  { id: "h2", token: "Dogwifhat", symbol: "WIF", amount: 1250, avgEntry: 1.89, currentPrice: 2.34, unrealizedPnl: 23.8, realizedPnl: 45.2, allocation: 22, riskProfile: "low" },
  { id: "h3", token: "AlphaDAO", symbol: "ALPHA", amount: 45000, avgEntry: 0.0234, currentPrice: 0.0456, unrealizedPnl: 94.8, realizedPnl: 0, allocation: 18, riskProfile: "medium" },
  { id: "h4", token: "GigaChad", symbol: "GIGA", amount: 8900, avgEntry: 0.0456, currentPrice: 0.0789, unrealizedPnl: 73.0, realizedPnl: 34.5, allocation: 15, riskProfile: "medium" },
  { id: "h5", token: "VaultX", symbol: "VLTX", amount: 890, avgEntry: 2.89, currentPrice: 3.45, unrealizedPnl: 19.3, realizedPnl: 8.9, allocation: 12, riskProfile: "low" },
  { id: "h6", token: "ShadowFi", symbol: "SHADOW", amount: 2300, avgEntry: 0.345, currentPrice: 0.456, unrealizedPnl: 32.1, realizedPnl: 0, allocation: 5, riskProfile: "medium" },
];

export const mockStrategies: MockStrategy[] = [
  { id: "st1", name: "Fresh Launch Hunter", description: "Targets new launches under 1h with locked liquidity and verified contracts", status: "active", filters: ["age < 1h", "liq locked", "contract verified"], scoreThreshold: 80, riskCap: 40, recentPerformance: 67.8, linkedWatchlist: "New Launches" },
  { id: "st2", name: "Safe Momentum", description: "Follows established tokens showing momentum with low risk profiles", status: "active", filters: ["risk < 25", "momentum > 60", "liq > $5M"], scoreThreshold: 70, riskCap: 25, recentPerformance: 34.2, linkedWatchlist: "Blue Chips" },
  { id: "st3", name: "Whale Mirror", description: "Mirrors high-trust whale wallets with consistent win rates above 70%", status: "active", filters: ["trust > 80", "win rate > 70%", "recent buy"], scoreThreshold: 75, riskCap: 35, recentPerformance: 89.1, linkedWatchlist: "Whale Targets" },
  { id: "st4", name: "Breakout Tracker", description: "Detects tokens breaking key resistance levels with volume confirmation", status: "paused", filters: ["resistance break", "vol > 3x avg", "buy pressure"], scoreThreshold: 85, riskCap: 45, recentPerformance: 52.3, linkedWatchlist: "Watchlist" },
  { id: "st5", name: "Rug Avoidance Mode", description: "Conservative strategy that strictly avoids high-risk tokens", status: "active", filters: ["risk < 15", "liq locked", "holders > 5000", "age > 30d"], scoreThreshold: 60, riskCap: 15, recentPerformance: 12.1, linkedWatchlist: "Safe Picks" },
  { id: "st6", name: "Alpha Rotation", description: "Rotates between high-signal tokens for short-term alpha capture", status: "draft", filters: ["signal > 85", "vol spike", "smart money"], scoreThreshold: 90, riskCap: 50, recentPerformance: 0, linkedWatchlist: "Alpha Picks" },
];

export function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.001) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(8)}`;
}

export function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(1)}K`;
  return `$${vol.toFixed(0)}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toFixed(0);
}
