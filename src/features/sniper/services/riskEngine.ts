// Risk Engine — Rug detection and danger analysis
import type { DetectedToken, RiskBreakdown, RiskFlag, RiskCategory } from "../types";
import { getRiskBand } from "../types";

export function analyzeRisk(token: DetectedToken): RiskBreakdown {
  const flags: RiskFlag[] = [];
  const ageMin = (Date.now() - token.pairCreatedAt) / 60_000;

  // 1. LIQUIDITY RISK (0–20)
  let liqRisk = 0;
  if (token.liquidity < 1_000) {
    liqRisk = 20;
    flags.push({ id: "crit-liq", category: "liquidity", label: "Critically Low Liquidity", detail: `$${token.liquidity.toFixed(0)} — near zero`, severity: "critical", weight: 20 });
  } else if (token.liquidity < 5_000) {
    liqRisk = 14;
    flags.push({ id: "low-liq", category: "liquidity", label: "Very Low Liquidity", detail: `$${token.liquidity.toLocaleString()}`, severity: "danger", weight: 14 });
  } else if (token.liquidity < 10_000) {
    liqRisk = 8;
    flags.push({ id: "weak-liq", category: "liquidity", label: "Weak Liquidity", detail: `$${token.liquidity.toLocaleString()}`, severity: "warning", weight: 8 });
  }

  if (token.lpLocked === false) {
    liqRisk = Math.min(20, liqRisk + 8);
    flags.push({ id: "lp-unlocked", category: "liquidity", label: "LP Not Locked", detail: "Liquidity can be removed at any time", severity: "danger", weight: 8 });
  }

  // unstable liq: volume > 5x liquidity suggests wash
  if (token.liquidity > 0 && token.volume24h / token.liquidity > 5) {
    liqRisk = Math.min(20, liqRisk + 4);
    flags.push({ id: "unstable-liq", category: "liquidity", label: "Unstable Liquidity Ratio", detail: `Volume/Liq ratio: ${(token.volume24h / token.liquidity).toFixed(1)}x`, severity: "warning", weight: 4 });
  }

  // 2. HOLDER CONCENTRATION RISK (0–20)
  let holderRisk = 0;
  if (token.topHolderPct > 60) {
    holderRisk = 20;
    flags.push({ id: "extreme-conc", category: "holder_concentration", label: "Extreme Concentration", detail: `Top holder: ${token.topHolderPct.toFixed(1)}%`, severity: "critical", weight: 20 });
  } else if (token.topHolderPct > 40) {
    holderRisk = 14;
    flags.push({ id: "high-conc", category: "holder_concentration", label: "High Concentration", detail: `Top holder: ${token.topHolderPct.toFixed(1)}%`, severity: "danger", weight: 14 });
  } else if (token.topHolderPct > 25) {
    holderRisk = 8;
    flags.push({ id: "mod-conc", category: "holder_concentration", label: "Moderate Concentration", detail: `Top holder: ${token.topHolderPct.toFixed(1)}%`, severity: "warning", weight: 8 });
  }

  if (token.holderCount < 10) {
    holderRisk = Math.min(20, holderRisk + 6);
    flags.push({ id: "few-holders", category: "holder_concentration", label: "Very Few Holders", detail: `Only ${token.holderCount} holders`, severity: "danger", weight: 6 });
  }

  // 3. DEPLOYER RISK (0–20)
  let deployerRisk = 0;
  // simulated deployer analysis — in production would check on-chain
  if (!token.deployerAddress) {
    deployerRisk = 4;
    flags.push({ id: "unknown-deployer", category: "deployer", label: "Unknown Deployer", detail: "Cannot verify deployer history", severity: "warning", weight: 4 });
  }
  // fast funding pattern check
  if (ageMin < 5 && token.volume24h > 50_000) {
    deployerRisk = Math.min(20, deployerRisk + 6);
    flags.push({ id: "fast-fund", category: "deployer", label: "Rapid Launch Pattern", detail: `${ageMin.toFixed(0)}min old with $${(token.volume24h / 1000).toFixed(0)}K volume`, severity: "warning", weight: 6 });
  }

  // 4. TRADE PATTERN RISK (0–15)
  let tradeRisk = 0;
  const buyRatio = token.buyCount / Math.max(1, token.buyCount + token.sellCount);
  if (buyRatio > 0.95 && token.txCount > 20) {
    tradeRisk = 10;
    flags.push({ id: "fake-vol", category: "trade_pattern", label: "Suspicious Buy Pattern", detail: `${(buyRatio * 100).toFixed(0)}% buys — possible fake volume`, severity: "danger", weight: 10 });
  }
  if (token.sellCount > token.buyCount * 2 && ageMin < 30) {
    tradeRisk = Math.min(15, tradeRisk + 8);
    flags.push({ id: "dump-pattern", category: "trade_pattern", label: "Dump Pattern Detected", detail: `${token.sellCount} sells vs ${token.buyCount} buys`, severity: "danger", weight: 8 });
  }
  if (token.change24h < -70) {
    tradeRisk = Math.min(15, tradeRisk + 6);
    flags.push({ id: "crash", category: "trade_pattern", label: "Price Crashed", detail: `${token.change24h.toFixed(1)}% change`, severity: "critical", weight: 6 });
  }

  // 5. TOKEN STRUCTURE RISK (0–10)
  let structRisk = 0;
  if (!token.metadata.hasCompleteMeta) {
    structRisk += 4;
    flags.push({ id: "incomplete-meta", category: "token_structure", label: "Incomplete Metadata", detail: "Missing website, socials, or description", severity: "warning", weight: 4 });
  }
  // scam naming detection
  const scamPatterns = /elon|doge.*inu|safe.*moon|100x|1000x|pepe.*inu|rug/i;
  if (scamPatterns.test(token.name) || scamPatterns.test(token.symbol)) {
    structRisk = Math.min(10, structRisk + 4);
    flags.push({ id: "scam-name", category: "token_structure", label: "Suspicious Name Pattern", detail: `"${token.symbol}" matches scam patterns`, severity: "warning", weight: 4 });
  }

  // 6. BEHAVIORAL RISK (0–15)
  let behavRisk = 0;
  // early dump detection
  if (ageMin < 15 && token.change24h < -30) {
    behavRisk = 12;
    flags.push({ id: "early-dump", category: "behavioral", label: "Early Dump Behavior", detail: `${token.change24h.toFixed(1)}% in ${ageMin.toFixed(0)}min`, severity: "critical", weight: 12 });
  }
  // no organic growth
  if (ageMin > 30 && token.holderCount < 15) {
    behavRisk = Math.min(15, behavRisk + 6);
    flags.push({ id: "no-growth", category: "behavioral", label: "No Organic Growth", detail: `Only ${token.holderCount} holders after ${ageMin.toFixed(0)}min`, severity: "warning", weight: 6 });
  }
  // volume collapse
  if (token.volume24h < 500 && ageMin > 60) {
    behavRisk = Math.min(15, behavRisk + 5);
    flags.push({ id: "vol-collapse", category: "behavioral", label: "Volume Collapsed", detail: `$${token.volume24h.toFixed(0)} volume`, severity: "warning", weight: 5 });
  }

  const total = Math.min(100, liqRisk + holderRisk + deployerRisk + tradeRisk + structRisk + behavRisk);

  return {
    liquidity: liqRisk,
    holderConcentration: holderRisk,
    deployer: deployerRisk,
    tradePattern: tradeRisk,
    tokenStructure: structRisk,
    behavioral: behavRisk,
    total,
    band: getRiskBand(total),
    flags,
    blockRecommended: total >= 75 || flags.some((f) => f.severity === "critical" && f.weight >= 15),
  };
}
