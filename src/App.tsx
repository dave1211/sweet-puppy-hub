import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { TierProvider } from "@/contexts/TierContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AlphaGate } from "@/components/layout/AlphaGate";
import { AdminRoute } from "@/components/layout/AdminRoute";
import { AppShell } from "@/components/layout/AppShell";
import { AIChatWidget } from "@/components/chat/AIChatWidget";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useWalletAutoRegister } from "@/hooks/useWalletAutoRegister";
import { validateEnv } from "@/lib/envValidation";
import { EnvErrorScreen } from "@/components/shared/EnvErrorScreen";

// Lazy-loaded pages for code splitting
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AuthPage = lazy(() => import("./pages/AuthPage"));
const DashboardHome = lazy(() => import("./pages/DashboardHome"));
const LivePairsPage = lazy(() => import("./pages/LivePairsPage"));
const NewLaunchesPage = lazy(() => import("./pages/NewLaunchesPage"));
const SniperModePage = lazy(() => import("./pages/SniperModePage"));
const WalletTrackerPage = lazy(() => import("./pages/WalletTrackerPage"));
const CopyTradePage = lazy(() => import("./pages/CopyTradePage"));
const AISignalsPage = lazy(() => import("./pages/AISignalsPage"));
const RiskScannerPage = lazy(() => import("./pages/RiskScannerPage"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
const AlertsCenterPage = lazy(() => import("./pages/AlertsCenterPage"));
const PortfolioPageNew = lazy(() => import("./pages/PortfolioPageNew"));
const StrategiesPage = lazy(() => import("./pages/StrategiesPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const TokenDetailPage = lazy(() => import("./pages/TokenDetailPage"));
const WalletDetailPage = lazy(() => import("./pages/WalletDetailPage"));
const LaunchpadPage = lazy(() => import("./pages/LaunchpadPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const MemeGeneratorPage = lazy(() => import("./pages/MemeGeneratorPage"));
const ClaimSolPage = lazy(() => import("./pages/ClaimSolPage"));
const SolBurnPage = lazy(() => import("./pages/SolBurnPage"));
const XRPLPage = lazy(() => import("./pages/XRPLPage"));
const TokenHoldingsPage = lazy(() => import("./pages/TokenHoldingsPage"));
const Pricing = lazy(() => import("./pages/Pricing"));
const WarRoomPage = lazy(() => import("./pages/WarRoomPage"));
const MultiChainHubPage = lazy(() => import("./pages/MultiChainHubPage"));
const ScannerPage = lazy(() => import("./pages/ScannerPage"));
const WalletsPage = lazy(() => import("./pages/WalletsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

// Validate env at module level — runs once at import time
const envResult = validateEnv();

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/** Runs push notification setup inside ErrorBoundary scope */
function PushNotificationInit() {
  try {
    usePushNotifications();
  } catch (e) {
    console.warn("[PushNotifications] Init failed, continuing without push:", e);
  }
  return null;
}

/** Auto-registers connected wallet as a wallet profile */
function WalletAutoRegisterInit() {
  try {
    useWalletAutoRegister();
  } catch (e) {
    console.warn("[WalletAutoRegister] Init failed:", e);
  }
  return null;
}

function AppInner() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WalletProvider>
            <TierProvider>
              <PushNotificationInit />
              <WalletAutoRegisterInit />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/landing" element={<LandingPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/pricing" element={<Pricing />} />

                    {/* Protected app shell */}
                    <Route path="/" element={<ProtectedRoute><AlphaGate><AppShell /></AlphaGate></ProtectedRoute>}>
                      <Route index element={<DashboardHome />} />
                      <Route path="live-pairs" element={<LivePairsPage />} />
                      <Route path="new-launches" element={<NewLaunchesPage />} />
                      <Route path="sniper-mode" element={<SniperModePage />} />
                      <Route path="wallet-tracker" element={<WalletTrackerPage />} />
                      <Route path="copy-trade" element={<CopyTradePage />} />
                      <Route path="ai-signals" element={<AISignalsPage />} />
                      <Route path="risk-scanner" element={<RiskScannerPage />} />
                      <Route path="watchlist" element={<WatchlistPage />} />
                      <Route path="alerts" element={<AlertsCenterPage />} />
                      <Route path="portfolio" element={<PortfolioPageNew />} />
                      <Route path="strategies" element={<StrategiesPage />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route path="launchpad" element={<LaunchpadPage />} />
                      <Route path="claim-sol" element={<ClaimSolPage />} />
                      <Route path="sol-burn" element={<SolBurnPage />} />
                      <Route path="holdings" element={<TokenHoldingsPage />} />
                      <Route path="xrpl" element={<XRPLPage />} />
                      <Route path="multichain" element={<MultiChainHubPage />} />
                      <Route path="scanner" element={<ScannerPage />} />
                      <Route path="wallets" element={<WalletsPage />} />
                      <Route path="about" element={<AboutPage />} />
                      <Route path="memes" element={<MemeGeneratorPage />} />
                      <Route path="token/:id" element={<TokenDetailPage />} />
                      <Route path="wallet/:id" element={<WalletDetailPage />} />

                      {/* Admin-only routes */}
                      <Route path="war-room" element={<AdminRoute><WarRoomPage /></AdminRoute>} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>

                {/* Floating AI chat — visible on all authenticated routes */}
                <AIChatWidget />
              </BrowserRouter>
            </TierProvider>
          </WalletProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  // Fail fast with visible error if env is misconfigured
  if (!envResult.valid) {
    return <EnvErrorScreen missing={envResult.missing} />;
  }

  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

export default App;
