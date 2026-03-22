/**
 * XRPL wallet connection service.
 * Supports Xaman (xumm) and Crossmark with fallback demo mode.
 * Includes transaction signing helpers for trust lines and payments.
 */

import type { WalletProviderType } from "@/types/xrpl";
import { xrplService } from "@/services/xrplService";

export interface WalletConnectResult {
  address: string;
  provider: WalletProviderType;
}

/* ── Xaman (XUMM) ── */
async function connectXaman(): Promise<WalletConnectResult> {
  const win = window as any;

  if (win?.xumm?.authorize) {
    try {
      const auth = await win.xumm.authorize();
      return { address: auth.me.account, provider: "xaman" };
    } catch {
      throw new Error("Xaman connection rejected");
    }
  }

  // Check for XummPkce SDK
  if (win?.XummPkce) {
    try {
      const xumm = new win.XummPkce();
      const auth = await xumm.authorize();
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
  console.info("[Wallet] Disconnected");
}

/**
 * Sign and submit an XRPL transaction via the connected wallet.
 * Returns the transaction hash on success.
 */
export async function signAndSubmitXRPL(
  provider: WalletProviderType,
  txJson: Record<string, unknown>
): Promise<string> {
  const win = window as any;

  if (provider === "xaman") {
    if (win?.xumm?.payload) {
      const payload = await win.xumm.payload.create({ txjson: txJson });
      const result = await win.xumm.payload.subscribe(payload);
      if (result?.signed) return result.txid ?? "signed";
      throw new Error("Transaction rejected in Xaman");
    }
    // Demo mode
    console.warn("[Wallet] Xaman not available for signing — demo mode");
    return "DEMO_TX_" + Math.random().toString(36).slice(2, 10);
  }

  if (provider === "crossmark") {
    if (win?.crossmark?.sign) {
      const res = await win.crossmark.sign(txJson);
      return res?.response?.data?.txnHash ?? "signed";
    }
    console.warn("[Wallet] Crossmark not available for signing — demo mode");
    return "DEMO_TX_" + Math.random().toString(36).slice(2, 10);
  }

  throw new Error(`Signing not supported for provider: ${provider}`);
}
