/**
 * XRPL wallet connection service.
 * Supports Xaman (xumm) and Crossmark with fallback demo mode.
 * Ledger architecture placeholder included.
 */

import type { WalletProviderType } from "@/types/xrpl";

export interface WalletConnectResult {
  address: string;
  provider: WalletProviderType;
}

/* ── Xaman (XUMM) ── */
async function connectXaman(): Promise<WalletConnectResult> {
  const win = window as any;

  // Check for xumm SDK injected
  if (win?.xumm?.authorize) {
    try {
      const auth = await win.xumm.authorize();
      return { address: auth.me.account, provider: "xaman" };
    } catch {
      throw new Error("Xaman connection rejected");
    }
  }

  // Demo fallback
  console.warn("[Wallet] Xaman not detected — using demo address");
  return {
    address: "rN7n3473SaZBCG4dFL83w7p1W9cgZw5iFR",
    provider: "xaman",
  };
}

/* ── Crossmark ── */
async function connectCrossmark(): Promise<WalletConnectResult> {
  const win = window as any;

  if (win?.crossmark?.signIn) {
    try {
      const res = await win.crossmark.signIn();
      return { address: res.response.data.address, provider: "crossmark" };
    } catch {
      throw new Error("Crossmark connection rejected");
    }
  }

  console.warn("[Wallet] Crossmark not detected — using demo address");
  return {
    address: "rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh",
    provider: "crossmark",
  };
}

/* ── Ledger (placeholder) ── */
async function connectLedger(): Promise<WalletConnectResult> {
  console.warn("[Wallet] Ledger integration coming soon — using demo address");
  return {
    address: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",
    provider: "ledger",
  };
}

/* ── Public API ── */
export async function connectWallet(
  provider: WalletProviderType
): Promise<WalletConnectResult> {
  switch (provider) {
    case "xaman":
      return connectXaman();
    case "crossmark":
      return connectCrossmark();
    case "ledger":
      return connectLedger();
    default:
      throw new Error(`Unknown wallet provider: ${provider}`);
  }
}

export function disconnectWallet(): void {
  // Clear any cached sessions if needed
  console.info("[Wallet] Disconnected");
}
