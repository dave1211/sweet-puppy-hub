import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/contexts/WalletContext";
import { useDeviceId } from "@/hooks/useDeviceId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Wallet, AlertTriangle, RefreshCw } from "lucide-react";
import bs58 from "@/lib/bs58Shim";

const walletAuthUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/wallet-auth`;
const walletAuthKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface WalletChallengeSuccess {
  ok: true;
  data: { nonce: string; challengeToken: string; expiresAt: number };
}
interface WalletChallengeFailure {
  ok: false;
  error?: { code?: string; message?: string };
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
    body: JSON.stringify({ action: "challenge", walletAddress, deviceId, host: window.location.hostname }),
  });
  let data: WalletChallengeResponse | null = null;
  try { data = (await response.json()) as WalletChallengeResponse; } catch { throw new Error("Auth service returned invalid response"); }
  if (!response.ok || !data || !data.ok || !data.data?.nonce || !data.data?.challengeToken) {
    const message = data && "error" in data ? data.error?.message : "Failed to get challenge";
    throw new Error(message || "Failed to get challenge");
  }
  return data.data;
}

type WalletType = "phantom" | "solflare" | "backpack";

const WALLET_OPTIONS: { type: WalletType; label: string; icon: string }[] = [
  { type: "phantom", label: "Phantom", icon: "👻" },
  { type: "solflare", label: "Solflare", icon: "🔆" },
  { type: "backpack", label: "Backpack", icon: "🎒" },
];

export default function AuthPage() {
  const { user, isLoading, isGuest, signInWithWallet } = useAuth();
  const { connect, walletAddress, isConnected, provider, getWalletObject } = useWallet();
  const deviceId = useDeviceId();

  const [submitting, setSubmitting] = useState(false);
  const [activeWallet, setActiveWallet] = useState<WalletType | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user || isGuest) return <Navigate to="/" replace />;

  const handleWalletAuth = async (walletType: WalletType) => {
    setSubmitting(true);
    setActiveWallet(walletType);
    setAuthError(null);

    try {
      let address = walletAddress;
      if (!isConnected || !walletAddress || provider !== walletType) {
        address = await connect(walletType);
      }

      const wallet = getWalletObject();
      if (!address || !wallet?.publicKey) throw new Error("Wallet not connected");
      if (!wallet.signMessage) throw new Error(`${walletType} does not support message signing in this browser`);

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
      setActiveWallet(null);
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
            Connect your Solana wallet to enter
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          {authError && (
            <div className="rounded border border-destructive/30 bg-destructive/5 p-2.5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <p className="text-[10px] font-mono text-destructive">{authError}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAuthError(null)}
                disabled={submitting}
                className="mt-2 h-7 px-2 text-[10px] font-mono"
              >
                <RefreshCw className="h-3 w-3 mr-1" /> Dismiss
              </Button>
            </div>
          )}

          {/* Wallet buttons */}
          {WALLET_OPTIONS.map(({ type, label, icon }) => (
            <Button
              key={type}
              type="button"
              onClick={() => void handleWalletAuth(type)}
              disabled={submitting}
              variant={type === "phantom" ? "default" : "outline"}
              className="w-full font-mono text-sm justify-start gap-2"
            >
              {submitting && activeWallet === type ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-base">{icon}</span>
              )}
              {label}
            </Button>
          ))}

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase">
              <span className="bg-card px-2 text-muted-foreground font-mono">or sign in with</span>
            </div>
          </div>

          {/* Google & Apple — direct Supabase OAuth, no Lovable */}
          <div className="grid grid-cols-2 gap-2">
            <GoogleAppleButton provider="google" />
            <GoogleAppleButton provider="apple" />
          </div>

          <p className="text-[8px] font-mono text-muted-foreground text-center pt-2">
            No data leaves Tanner Terminal. All auth is internal.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function GoogleAppleButton({ provider }: { provider: "google" | "apple" }) {
  const { signInWithOAuthProvider } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { error } = await signInWithOAuthProvider(provider);
      if (error) {
        toast.error(error.message);
      }
    } catch {
      toast.error(`${provider} sign-in failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => void handleClick()}
      disabled={loading}
      className="font-mono text-xs"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin mr-1" />
      ) : (
        <span className="mr-1">{provider === "google" ? "🔵" : "🍎"}</span>
      )}
      {provider === "google" ? "Google" : "Apple"}
    </Button>
  );
}
