/**
 * XRPL wallet connection service.
 * Supports Xaman (xumm) and Crossmark wallet providers.
 * Includes transaction signing helpers for trust lines and payments.
 */

import type { WalletProviderType } from "@/types/xrpl";

export interface WalletConnectResult {
  address: string;
  provider: WalletProviderType;
}

interface XamanWallet {
  authorize?: () => Promise<{ me: { account: string } }>;
  payload?: {
    create: (params: { txjson: Record<string, unknown> }) => Promise<unknown>;
    subscribe: (payload: unknown) => Promise<{ signed?: boolean; txid?: string } | null>;
  };
}

interface XummPkceConstructor {
  new (): { authorize: () => Promise<{ me: { account: string } }> };
}

interface CrossmarkWallet {
  signIn?: () => Promise<{ response: { data: { address: string } } }>;
  sign?: (txJson: Record<string, unknown>) => Promise<{ response?: { data?: { txnHash?: string } } } | null>;
}

interface WalletWindow extends Window {
  xumm?: XamanWallet;
  XummPkce?: XummPkceConstructor;
  crossmark?: CrossmarkWallet;
}

/* ── Xaman (XUMM) ── */
async function connectXaman(): Promise<WalletConnectResult> {
  const win = window as unknown as WalletWindow;

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

  throw new Error("Xaman wallet provider not detected");
}

/* ── Crossmark ── */
async function connectCrossmark(): Promise<WalletConnectResult> {
  const win = window as unknown as WalletWindow;

  if (win?.crossmark?.signIn) {
    try {
      const res = await win.crossmark.signIn();
      return { address: res.response.data.address, provider: "crossmark" };
    } catch {
      throw new Error("Crossmark connection rejected");
    }
  }

  throw new Error("Crossmark wallet provider not detected");
}

/* ── Ledger (placeholder) ── */
async function connectLedger(): Promise<WalletConnectResult> {
  throw new Error("Ledger wallet integration is not available yet");
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
  const win = window as unknown as WalletWindow;

  if (provider === "xaman") {
    if (win?.xumm?.payload) {
      const payload = await win.xumm.payload.create({ txjson: txJson });
      const result = await win.xumm.payload.subscribe(payload);
      if (result?.signed) return result.txid ?? "signed";
      throw new Error("Transaction rejected in Xaman");
    }
    throw new Error("Xaman wallet payload API unavailable for signing");
  }

  if (provider === "crossmark") {
    if (win?.crossmark?.sign) {
      const res = await win.crossmark.sign(txJson);
      return res?.response?.data?.txnHash ?? "signed";
    }
    throw new Error("Crossmark wallet signing API unavailable");
  }

  throw new Error(`Signing not supported for provider: ${provider}`);
}
