import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { useDeviceId } from "@/hooks/useDeviceId";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Wallet, AlertTriangle, RefreshCw } from "lucide-react";
import bs58 from "@/lib/bs58Shim";

const walletAuthUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-auth`;
const walletAuthKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface WalletChallengeSuccess {
  ok: true;
  data: { nonce: string; challengeToken: string; issuedAt: number; expiresAt: number };
}
interface WalletChallengeFailure {
  ok: false;
  error?: { code?: string; message?: string };
}
type WalletChallengeResponse = WalletChallengeSuccess | WalletChallengeFailure;

type WalletAuthError = Error & { code?: string };

type AuthFlowState =
  | "wallet_not_detected"
  | "wallet_detected"
  | "connecting_wallet"
  | "wallet_connected"
  | "awaiting_signature"
  | "verifying_signature"
  | "assigning_access"
  | "session_restoring"
  | "authorized"
  | "rejected_by_user"
  | "signature_expired"
  | "wallet_auth_failed"
  | "role_assignment_failed"
  | "session_restore_failed"
  | "app_boot_failed";

const BUSY_STATES: AuthFlowState[] = [
  "connecting_wallet",
  "awaiting_signature",
  "verifying_signature",
  "assigning_access",
  "session_restoring",
];

const FAILURE_STATES: AuthFlowState[] = [
  "rejected_by_user",
  "signature_expired",
  "wallet_auth_failed",
  "role_assignment_failed",
  "session_restore_failed",
  "app_boot_failed",
];

const TELEMETRY_EVENTS = new Set<string>([
  "provider_detected",
  "connect_started",
  "connect_success",
  "challenge_created",
  "sign_requested",
  "sign_success",
  "verify_success",
  "role_assign_success",
  "session_ready",
  "app_boot_ready",
  "wallet_not_detected",
  "rejected_by_user",
  "signature_expired",
  "wallet_auth_failed",
  "role_assignment_failed",
  "session_restore_failed",
  "app_boot_failed",
]);

function createWalletAuthError(message: string, code?: string): WalletAuthError {
  const error = new Error(message) as WalletAuthError;
  if (code) error.code = code;
  return error;
}

function isBusyState(status: AuthFlowState): boolean {
  return BUSY_STATES.includes(status);
}

function isFailureState(status: AuthFlowState): boolean {
  return FAILURE_STATES.includes(status);
}

function isRetryableChallengeError(message: string): boolean {
  return /signed message expired|message expired|challenge token expired|invalid challenge/i.test(message);
}

async function requestWalletChallenge(walletAddress: string, deviceId: string, signal?: AbortSignal): Promise<WalletChallengeSuccess["data"]> {
  if (!walletAuthKey) throw new Error("Auth configuration missing");
  const response = await fetch(walletAuthUrl, {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      apikey: walletAuthKey,
      authorization: `Bearer ${walletAuthKey}`,
    },
    body: JSON.stringify({ action: "challenge", walletAddress, deviceId, host: window.location.hostname }),
  });
  let data: WalletChallengeResponse | null = null;
  try {
    data = (await response.json()) as WalletChallengeResponse;
  } catch {
    throw createWalletAuthError("Auth service returned invalid response", "INVALID_RESPONSE");
  }

  if (!response.ok || !data || !data.ok || !data.data?.nonce || !data.data?.challengeToken || !data.data?.issuedAt) {
    const message = data && "error" in data ? data.error?.message : "Failed to get challenge";
    const code = data && "error" in data ? data.error?.code : "CHALLENGE_FAILED";
    throw createWalletAuthError(message || "Failed to get challenge", code);
  }
  return data.data;
}

type WalletType = "phantom" | "solflare" | "backpack";

const ALL_WALLET_OPTIONS: { type: WalletType; label: string; icon: string }[] = [
  { type: "phantom", label: "Phantom", icon: "👻" },
  { type: "solflare", label: "Solflare", icon: "🔆" },
  { type: "backpack", label: "Backpack", icon: "🎒" },
];

function getAvailableWallets() {
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  if (!isMobile) return ALL_WALLET_OPTIONS;

  // On mobile, only show wallets that are actually injected in this browser
  const win = window as unknown as Record<string, unknown>;
  const available = ALL_WALLET_OPTIONS.filter(({ type }) => {
    if (type === "phantom") {
      return !!(win.phantom as Record<string, unknown>)?.solana || (win.solana as Record<string, unknown>)?.isPhantom;
    }
    if (type === "solflare") {
      return !!win.solflare || (win.solana as Record<string, unknown>)?.isSolflare;
    }
    if (type === "backpack") return !!win.backpack;
    return false;
  });

  return available.length > 0 ? available : ALL_WALLET_OPTIONS;
}

interface AuthMachineState {
  status: AuthFlowState;
  activeWallet: WalletType | null;
  errorMessage: string | null;
  errorCode: string | null;
}

type AuthAction =
  | { type: "SET_STATUS"; status: AuthFlowState; activeWallet?: WalletType | null }
  | { type: "FAIL"; status: AuthFlowState; message: string; code?: string; activeWallet?: WalletType | null };

function authReducer(state: AuthMachineState, action: AuthAction): AuthMachineState {
  switch (action.type) {
    case "SET_STATUS":
      return {
        ...state,
        status: action.status,
        activeWallet: action.activeWallet ?? state.activeWallet,
        errorMessage: isFailureState(action.status) ? state.errorMessage : null,
        errorCode: isFailureState(action.status) ? state.errorCode : null,
      };
    case "FAIL":
      return {
        ...state,
        status: action.status,
        activeWallet: action.activeWallet ?? state.activeWallet,
        errorMessage: action.message,
        errorCode: action.code ?? "WALLET_AUTH_FAILED",
      };
    default:
      return state;
  }
}

function normalizeAuthFailure(error: unknown): { state: AuthFlowState; message: string; code: string } {
  const walletError = (error instanceof Error ? error : new Error("Wallet authentication failed")) as WalletAuthError;
  const message = walletError.message || "Wallet authentication failed";
  const code = walletError.code ?? "WALLET_AUTH_FAILED";

  if (code === "REQUEST_ABORTED") {
    return { state: "wallet_detected", message, code };
  }

  if (code === "ROLE_ASSIGN_FAILED") {
    return {
      state: "role_assignment_failed",
      message: "Failed to assign wallet role. Retry access assignment or refresh session.",
      code,
    };
  }

  if (["EXPIRED_CHALLENGE", "MESSAGE_EXPIRED", "INVALID_CHALLENGE", "CHALLENGE_ALREADY_USED"].includes(code)) {
    return {
      state: "signature_expired",
      message: "Signature challenge expired. We’ll request a fresh one on retry.",
      code,
    };
  }

  if (["SESSION_SET_FAILED", "AUTH_FAILED", "NO_SESSION", "SESSION_RESTORE_FAILED"].includes(code)) {
    return {
      state: "session_restore_failed",
      message: "Session restore failed. Refresh your session and retry.",
      code,
    };
  }

  if (/rejected|denied|cancel|4001/i.test(message) || ["USER_REJECTED_CONNECT", "USER_REJECTED_SIGNATURE"].includes(code)) {
    return {
      state: "rejected_by_user",
      message: "You rejected the wallet request. Approve connect + sign to continue.",
      code,
    };
  }

  if (/not authorized|permission missing|wallet locked|unlock/i.test(message) || ["WALLET_PERMISSION_MISSING", "WALLET_LOCKED"].includes(code)) {
    return {
      state: "wallet_auth_failed",
      message: "Wallet permission is missing or wallet is locked. Open Phantom and approve access.",
      code,
    };
  }

  return { state: "wallet_auth_failed", message, code };
}

function statusCopy(status: AuthFlowState): { title: string; description: string } {
  switch (status) {
    case "wallet_not_detected":
      return {
        title: "Wallet not detected",
        description: "Open Tanner Terminal inside Phantom mobile browser and retry.",
      };
    case "wallet_detected":
      return {
        title: "Wallet detected",
        description: "Choose Phantom to connect and sign in.",
      };
    case "connecting_wallet":
      return {
        title: "Connecting wallet",
        description: "Approve account access in Phantom.",
      };
    case "wallet_connected":
      return {
        title: "Wallet connected",
        description: "Preparing secure signature challenge.",
      };
    case "awaiting_signature":
      return {
        title: "Awaiting signature",
        description: "Approve the sign-in message in Phantom.",
      };
    case "verifying_signature":
      return {
        title: "Verifying signature",
        description: "Validating wallet proof with backend.",
      };
    case "assigning_access":
      return {
        title: "Assigning access",
        description: "Finalizing your Tanner Terminal access.",
      };
    case "session_restoring":
      return {
        title: "Restoring session",
        description: "Preparing your dashboard session.",
      };
    case "authorized":
      return {
        title: "Authorized",
        description: "Entering Tanner Terminal…",
      };
    case "rejected_by_user":
      return {
        title: "Request rejected",
        description: "Approve connect and signature to continue.",
      };
    case "signature_expired":
      return {
        title: "Signature expired",
        description: "Request a fresh challenge and sign again.",
      };
    case "wallet_auth_failed":
      return {
        title: "Wallet authentication failed",
        description: "Reconnect wallet and retry authentication.",
      };
    case "role_assignment_failed":
      return {
        title: "Access assignment failed",
        description: "Use recovery actions to repair wallet access.",
      };
    case "session_restore_failed":
      return {
        title: "Session restore failed",
        description: "Refresh session or reconnect wallet.",
      };
    case "app_boot_failed":
      return {
        title: "App boot failed",
        description: "Session is valid but app boot did not complete.",
      };
    default:
      return {
        title: "Wallet authentication",
        description: "Connect your wallet to continue.",
      };
  }
}

export default function AuthPage() {
  const { user, isLoading, isGuest, signInWithWallet, signOut } = useAuth();
  const { connect, disconnect, walletAddress, isConnected, provider, getWalletObject } = useWallet();
  const deviceId = useDeviceId();

  const initialWallets = useMemo(() => getAvailableWallets(), []);
  const [availableWallets, setAvailableWallets] = useState(initialWallets);
  const [machine, dispatch] = useReducer(authReducer, {
    status: initialWallets.length ? "wallet_detected" : "wallet_not_detected",
    activeWallet: null,
    errorMessage: null,
    errorCode: null,
  });

  // Block external redirects during wallet auth (prevents Google/Lovable OAuth intercepts)
  useEffect(() => {
    const blockExternalNav = (e: BeforeUnloadEvent) => {
      if (isBusyState(machine.status)) {
        e.preventDefault();
        console.warn("[AuthPage] Blocked external navigation during wallet auth", { status: machine.status });
      }
    };
    window.addEventListener("beforeunload", blockExternalNav);
    return () => window.removeEventListener("beforeunload", blockExternalNav);
  }, [machine.status]);

  const attemptRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  const emitTelemetry = useCallback(
    (event: string, metadata: Record<string, unknown> = {}) => {
      if (!TELEMETRY_EVENTS.has(event)) return;

      console.info("[WalletAuthTelemetry]", event, metadata);

      if (!walletAuthKey) return;
      void fetch(walletAuthUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: walletAuthKey,
          authorization: `Bearer ${walletAuthKey}`,
        },
        body: JSON.stringify({
          action: "telemetry",
          event,
          deviceId,
          host: window.location.hostname,
          walletAddress: metadata.walletAddress ?? walletAddress,
          metadata,
        }),
      });
    },
    [deviceId, walletAddress]
  );

  const refreshWalletDetection = useCallback(() => {
    const wallets = getAvailableWallets();
    setAvailableWallets(wallets);
    emitTelemetry(wallets.length ? "provider_detected" : "wallet_not_detected", {
      wallets: wallets.map((wallet) => wallet.type),
    });
  }, [emitTelemetry]);

  useEffect(() => {
    refreshWalletDetection();
    window.addEventListener("focus", refreshWalletDetection);
    document.addEventListener("visibilitychange", refreshWalletDetection);
    return () => {
      window.removeEventListener("focus", refreshWalletDetection);
      document.removeEventListener("visibilitychange", refreshWalletDetection);
    };
  }, [refreshWalletDetection]);

  useEffect(() => {
    if (!["wallet_detected", "wallet_not_detected"].includes(machine.status)) return;
    dispatch({
      type: "SET_STATUS",
      status: availableWallets.length ? "wallet_detected" : "wallet_not_detected",
    });
  }, [availableWallets.length, machine.status]);

  useEffect(() => {
    if (machine.status !== "session_restoring") return;
    const timeout = window.setTimeout(() => {
      if (!user) {
        dispatch({
          type: "FAIL",
          status: "session_restore_failed",
          message: "Session restore timed out. Refresh session and retry.",
          code: "SESSION_RESTORE_TIMEOUT",
        });
        emitTelemetry("session_restore_failed", { code: "SESSION_RESTORE_TIMEOUT" });
      }
    }, 4500);
    return () => window.clearTimeout(timeout);
  }, [machine.status, user, emitTelemetry]);

  useEffect(() => {
    if (!user || machine.status === "authorized") return;
    dispatch({ type: "SET_STATUS", status: "authorized" });
    emitTelemetry("app_boot_ready", { userId: user.id });
  }, [user, machine.status, emitTelemetry]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const submitting = isBusyState(machine.status);

  const handleWalletAuth = useCallback(
    async (walletType: WalletType, reason: "primary" | "retry" | "reconnect" | "reassign" = "primary") => {
      if (isBusyState(machine.status)) return;

      attemptRef.current += 1;
      const attemptId = attemptRef.current;

      abortRef.current?.abort();
      const abortController = new AbortController();
      abortRef.current = abortController;

      const isCurrentAttempt = () => attemptRef.current === attemptId;

      dispatch({ type: "SET_STATUS", status: "connecting_wallet", activeWallet: walletType });
      emitTelemetry("connect_started", { walletType, reason, attemptId });

      try {
        let address = walletAddress;

        if (!isConnected || !walletAddress || provider !== walletType) {
          address = await connect(walletType, { suppressToast: true });
        }

        if (!isCurrentAttempt()) return;

        let wallet = getWalletObject(walletType);
        if (!wallet && provider === walletType) {
          wallet = getWalletObject();
        }

        if (!address || !wallet?.publicKey) {
          throw createWalletAuthError(
            "Wallet permission missing. Approve account access in Phantom and retry.",
            "WALLET_PERMISSION_MISSING"
          );
        }

        dispatch({ type: "SET_STATUS", status: "wallet_connected", activeWallet: walletType });
        emitTelemetry("connect_success", { walletType, walletAddress: address, attemptId });

        if (!wallet.signMessage) {
          throw createWalletAuthError(`${walletType} wallet does not support message signing in this browser`, "SIGNATURE_UNSUPPORTED");
        }

        const verifyWithFreshChallenge = async (allowRetry: boolean): Promise<WalletAuthError | null> => {
          const challenge = await requestWalletChallenge(address, deviceId, abortController.signal);
          emitTelemetry("challenge_created", { walletType, walletAddress: address, attemptId, retry: !allowRetry });

          const message = `Sign in to Tanner Terminal\nWallet: ${address}\nNonce: ${challenge.nonce}\nTimestamp: ${challenge.issuedAt}`;
          const messageBytes = new TextEncoder().encode(message);

          dispatch({ type: "SET_STATUS", status: "awaiting_signature", activeWallet: walletType });
          emitTelemetry("sign_requested", { walletType, walletAddress: address, attemptId });

          let signed: Uint8Array | { signature: Uint8Array };
          try {
            signed = await wallet.signMessage!(messageBytes);
          } catch (signError: unknown) {
            const signMessage = signError instanceof Error ? signError.message : "Signature request failed";
            if (/rejected|denied|cancel|4001/i.test(signMessage)) {
              throw createWalletAuthError("You rejected the signature request in Phantom.", "USER_REJECTED_SIGNATURE");
            }
            if (/not authorized|permission/i.test(signMessage)) {
              throw createWalletAuthError("Wallet permission missing. Reconnect wallet and approve access.", "WALLET_PERMISSION_MISSING");
            }
            if (/locked/i.test(signMessage)) {
              throw createWalletAuthError("Wallet is locked. Unlock Phantom and retry.", "WALLET_LOCKED");
            }
            throw createWalletAuthError(signMessage, "SIGNATURE_REQUEST_FAILED");
          }

          if (!isCurrentAttempt()) {
            return createWalletAuthError("Authentication attempt superseded", "REQUEST_ABORTED");
          }

          const signatureBytes = signed instanceof Uint8Array ? signed : signed?.signature;
          if (!signatureBytes?.length) {
            throw createWalletAuthError("Wallet did not return a valid signature", "INVALID_SIGNATURE");
          }

          dispatch({ type: "SET_STATUS", status: "verifying_signature", activeWallet: walletType });
          emitTelemetry("sign_success", { walletType, walletAddress: address, attemptId });

          const signatureB58 = bs58.encode(signatureBytes);
          const { error } = await signInWithWallet(
            address,
            signatureB58,
            message,
            challenge.challengeToken,
            deviceId,
            { signal: abortController.signal }
          );

          if (error && isRetryableChallengeError(error.message) && allowRetry) {
            return verifyWithFreshChallenge(false);
          }

          if (!error) {
            emitTelemetry("verify_success", { walletType, walletAddress: address, attemptId });
          }

          return error;
        };

        const error = await verifyWithFreshChallenge(true);
        if (!isCurrentAttempt()) return;
        if (error) throw error;

        dispatch({ type: "SET_STATUS", status: "assigning_access", activeWallet: walletType });
        emitTelemetry("role_assign_success", { walletType, walletAddress: address, attemptId });

        dispatch({ type: "SET_STATUS", status: "session_restoring", activeWallet: walletType });
        emitTelemetry("session_ready", { walletType, walletAddress: address, attemptId });
      } catch (error) {
        if (!isCurrentAttempt()) return;

        const normalized = normalizeAuthFailure(error);
        if (normalized.code === "REQUEST_ABORTED") return;

        dispatch({
          type: "FAIL",
          status: normalized.state,
          message: normalized.message,
          code: normalized.code,
          activeWallet: walletType,
        });

        emitTelemetry(normalized.state, {
          walletType,
          attemptId,
          code: normalized.code,
          message: normalized.message,
        });

        if (normalized.state !== "rejected_by_user") {
          disconnect();
        }
      } finally {
        if (isCurrentAttempt()) {
          abortRef.current = null;
        }
      }
    },
    [
      machine.status,
      walletAddress,
      isConnected,
      provider,
      connect,
      getWalletObject,
      deviceId,
      signInWithWallet,
      emitTelemetry,
      disconnect,
    ]
  );

  const handleRefreshSession = useCallback(async () => {
    dispatch({ type: "SET_STATUS", status: "session_restoring", activeWallet: machine.activeWallet });
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      dispatch({
        type: "FAIL",
        status: "session_restore_failed",
        message: "Session refresh failed. Reconnect wallet and retry.",
        code: "SESSION_RESTORE_FAILED",
        activeWallet: machine.activeWallet,
      });
      emitTelemetry("session_restore_failed", { code: "SESSION_RESTORE_FAILED", message: error.message });
      return;
    }
    emitTelemetry("session_ready", { action: "refresh_session" });
  }, [machine.activeWallet, emitTelemetry]);

  const handleReconnectWallet = useCallback(async () => {
    disconnect();
    await handleWalletAuth(machine.activeWallet ?? "phantom", "reconnect");
  }, [disconnect, handleWalletAuth, machine.activeWallet]);

  const handleFullResetFlow = useCallback(async () => {
    attemptRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    disconnect();
    await signOut();
    localStorage.removeItem("tanner_wallet_provider");
    sessionStorage.removeItem("tanner-wallet");
    window.location.href = "/auth";
  }, [disconnect, signOut]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user || isGuest) return <Navigate to="/" replace />;

  const copy = statusCopy(machine.status);
  const visibleWallets = availableWallets.length ? availableWallets : ALL_WALLET_OPTIONS;

  const renderRecoveryActions = () => {
    if (!isFailureState(machine.status)) return null;

    if (machine.status === "role_assignment_failed") {
      return (
        <div className="grid grid-cols-2 gap-2 mt-3">
          <Button
            type="button"
            onClick={() => void handleWalletAuth(machine.activeWallet ?? "phantom", "reassign")}
            className="h-8 px-2 text-[10px] font-mono"
          >
            Retry access assignment
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleRefreshSession()} className="h-8 px-2 text-[10px] font-mono">
            Refresh session
          </Button>
          <Button type="button" variant="outline" onClick={() => void handleReconnectWallet()} className="h-8 px-2 text-[10px] font-mono">
            Reconnect wallet
          </Button>
          <Button type="button" variant="ghost" onClick={() => void handleFullResetFlow()} className="h-8 px-2 text-[10px] font-mono">
            Full reset flow
          </Button>
        </div>
      );
    }

    const primaryAction = () => {
      if (machine.status === "wallet_not_detected") {
        refreshWalletDetection();
        return;
      }
      if (machine.status === "session_restore_failed" || machine.status === "app_boot_failed") {
        void handleRefreshSession();
        return;
      }
      void handleWalletAuth(machine.activeWallet ?? "phantom", "retry");
    };

    const primaryLabel =
      machine.status === "wallet_not_detected"
        ? "Detect wallet"
        : machine.status === "session_restore_failed" || machine.status === "app_boot_failed"
          ? "Refresh session"
          : "Retry";

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
        <Button type="button" onClick={primaryAction} className="h-8 px-2 text-[10px] font-mono">
          <RefreshCw className="h-3 w-3 mr-1" /> {primaryLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => void handleFullResetFlow()} className="h-8 px-2 text-[10px] font-mono">
          Full reset flow
        </Button>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-xl font-mono font-bold text-foreground">
            <span className="text-primary">TANNER</span> TERMINAL
          </CardTitle>
          <p className="text-[10px] font-mono text-muted-foreground">
            Connect your Solana wallet to enter
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="rounded border border-border bg-muted/20 p-2.5">
            <div className="flex items-start gap-2">
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5 animate-spin" />
              ) : isFailureState(machine.status) ? (
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              ) : (
                <Wallet className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <p className="text-[10px] font-mono text-foreground">{copy.title}</p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {machine.errorMessage ?? copy.description}
                </p>
                {machine.errorCode && isFailureState(machine.status) ? (
                  <p className="text-[9px] font-mono text-muted-foreground/80">Code: {machine.errorCode}</p>
                ) : null}
              </div>
            </div>
            {renderRecoveryActions()}
          </div>

          {isFailureState(machine.status) && (
            <div className="rounded border border-destructive/30 bg-destructive/5 p-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono text-destructive">
                  {machine.errorMessage ?? "Wallet authentication failed"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => dispatch({ type: "SET_STATUS", status: availableWallets.length ? "wallet_detected" : "wallet_not_detected" })}
                disabled={submitting}
                className="mt-2 h-7 px-2 text-[10px] font-mono"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Dismiss
              </Button>
            </div>
          )}

          {/* Wallet buttons */}
          {visibleWallets.map(({ type, label, icon }) => (
            <Button
              key={type}
              type="button"
              onClick={() => void handleWalletAuth(type, "primary")}
              disabled={submitting}
              variant={type === "phantom" ? "default" : "outline"}
              className="w-full font-mono text-sm justify-start gap-2"
            >
              {submitting && machine.activeWallet === type ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-base">{icon}</span>
              )}
              {label}
            </Button>
          ))}

          <p className="text-[8px] font-mono text-muted-foreground text-center pt-2">
            No data leaves Tanner Terminal. All auth is internal.
          </p>

          {/* Auth diagnostics panel — visible in dev/debug */}
          <details className="mt-3 text-[8px] font-mono text-muted-foreground/60">
            <summary className="cursor-pointer hover:text-muted-foreground">Auth diagnostics</summary>
            <div className="mt-1 space-y-0.5 bg-muted/10 rounded p-2 border border-border/30">
              <p>Route: {window.location.pathname}</p>
              <p>Origin: {window.location.origin}</p>
              <p>State: <span className="text-foreground">{machine.status}</span></p>
              <p>Active wallet: {machine.activeWallet ?? "none"}</p>
              <p>Provider detected: {availableWallets.map(w => w.type).join(", ") || "none"}</p>
              <p>Wallet connected: {isConnected ? "yes" : "no"}</p>
              <p>Wallet address: {walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "none"}</p>
              <p>Supabase user: {user ? "yes" : "no"}</p>
              <p>Guest mode: {isGuest ? "yes" : "no"}</p>
              <p>Error code: {machine.errorCode ?? "none"}</p>
              <p>Error: {machine.errorMessage ?? "none"}</p>
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
