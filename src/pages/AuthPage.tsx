import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { useDeviceId } from "@/hooks/useDeviceId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Wallet, AlertTriangle, RefreshCw, ExternalLink } from "lucide-react";
import bs58 from "@/lib/bs58Shim";

interface WalletWindow extends Window {
  solana?: { isPhantom?: boolean; providers?: Array<{ isPhantom?: boolean }> };
  phantom?: { solana?: { isPhantom?: boolean } };
}

function detectPhantom(): boolean {
  const win = window as unknown as WalletWindow;
  return !!(
    win.phantom?.solana?.isPhantom ||
    win.solana?.isPhantom ||
    win.solana?.providers?.some((p) => p?.isPhantom)
  );
}

function isPreviewHost(): boolean {
  return window.location.hostname.includes("id-preview--");
}

const walletAuthUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-auth`;
const walletAuthKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const publishedUrl = "https://tannersterminal.lovable.app";

interface WalletChallengeSuccess {
  ok: true;
  data: {
    nonce: string;
    challengeToken: string;
    expiresAt: number;
  };
}

interface WalletChallengeFailure {
  ok: false;
  error?: {
    code?: string;
    message?: string;
  };
}

type WalletChallengeResponse = WalletChallengeSuccess | WalletChallengeFailure;

async function requestWalletChallenge(walletAddress: string, deviceId: string): Promise<WalletChallengeSuccess["data"]> {
  if (!walletAuthKey) throw new Error("Auth configuration missing");

  const response = await fetch(walletAuthUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: walletAuthKey,
      authorization: `Bearer ${walletAuthKey}`,
    },
    body: JSON.stringify({
      action: "challenge",
      walletAddress,
      deviceId,
      host: window.location.hostname,
    }),
  });

  let data: WalletChallengeResponse | null = null;
  try {
    data = (await response.json()) as WalletChallengeResponse;
  } catch {
    throw new Error("Auth service returned invalid response");
  }

  if (!response.ok || !data || !data.ok || !data.data?.nonce || !data.data?.challengeToken) {
    const message = data && "error" in data ? data.error?.message : "Failed to get challenge";
    throw new Error(message || "Failed to get challenge");
  }

  return data.data;
}

async function reportBlockedRedirectAttempt(deviceId: string) {
  if (!walletAuthKey) return;
  await fetch(walletAuthUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: walletAuthKey,
      authorization: `Bearer ${walletAuthKey}`,
    },
    body: JSON.stringify({
      action: "blocked_redirect",
      reason: "preview_environment",
      host: window.location.hostname,
      deviceId,
    }),
  }).catch(() => undefined);
}

export default function AuthPage() {
  const { user, isLoading, isGuest, signInWithWallet } = useAuth();
  const { connect, walletAddress, isConnected, provider, getWalletObject } = useWallet();
  const deviceId = useDeviceId();

  const [submitting, setSubmitting] = useState(false);
  const [phantomDetected, setPhantomDetected] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setPhantomDetected(detectPhantom()), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user || isGuest) return <Navigate to="/" replace />;

  const handleWalletAuth = async () => {
    setSubmitting(true);
    setAuthError(null);

    try {
      if (isPreviewHost()) {
        await reportBlockedRedirectAttempt(deviceId);
        throw new Error("Preview mode blocks Phantom native bridge. Open the published Tanner Terminal URL.");
      }

      let address = walletAddress;
      if (!isConnected || !walletAddress || provider !== "phantom") {
        address = await connect("phantom");
      }

      const wallet = getWalletObject();
      if (!address || !wallet?.publicKey) throw new Error("Wallet not connected");
      if (!wallet.signMessage) throw new Error("Phantom does not support message signing in this browser");

      const challenge = await requestWalletChallenge(address, deviceId);
      const message = `Sign in to Tanner Terminal\nWallet: ${address}\nNonce: ${challenge.nonce}\nTimestamp: ${Date.now()}`;
      const messageBytes = new TextEncoder().encode(message);

      const { signature } = await wallet.signMessage(messageBytes);
      const signatureB58 = bs58.encode(signature);

      const { error } = await signInWithWallet(address, signatureB58, message, challenge.challengeToken, deviceId);
      if (error) {
        setAuthError(error.message);
        toast.error(error.message);
        return;
      }

      toast.success("Wallet authenticated");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Wallet authentication failed";
      const normalizedMessage = /rejected|denied/i.test(message)
        ? "Signature was rejected. Retry wallet authentication."
        : message;
      setAuthError(normalizedMessage);
      toast.error(normalizedMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader className="text-center space-y-1">
          <CardTitle className="text-xl font-mono font-bold text-foreground">
            <span className="text-primary">TANNER</span> TERMINAL
          </CardTitle>
          <p className="text-[10px] font-mono text-muted-foreground">
            Wallet-only secure access
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {authError && (
            <div className="rounded border border-destructive/30 bg-destructive/5 p-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono text-destructive">{authError}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => void handleWalletAuth()}
                disabled={submitting}
                className="mt-2 h-7 px-2 text-[10px] font-mono"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Retry
              </Button>
            </div>
          )}

          <Button
            type="button"
            onClick={() => void handleWalletAuth()}
            disabled={submitting}
            className="w-full font-mono text-sm"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
            CONNECT PHANTOM
          </Button>

          {!phantomDetected && (
            <div className="rounded border border-terminal-amber/30 bg-terminal-amber/10 p-2">
              <p className="text-[10px] font-mono text-terminal-amber">
                Phantom wallet not detected. Install Phantom or open Tanner Terminal inside Phantom browser.
              </p>
              <a
                href="https://phantom.app/download"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono text-primary hover:text-primary/80 underline"
              >
                <ExternalLink className="h-2.5 w-2.5" /> Get Phantom
              </a>
            </div>
          )}

          {isPreviewHost() && (
            <div className="rounded border border-terminal-cyan/30 bg-terminal-cyan/10 p-2">
              <p className="text-[10px] font-mono text-terminal-cyan">
                Preview URL is not supported for Phantom authentication. Use the published app.
              </p>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1 text-[9px] font-mono text-primary hover:text-primary/80 underline"
              >
                <ExternalLink className="h-2.5 w-2.5" /> Open Published App
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
