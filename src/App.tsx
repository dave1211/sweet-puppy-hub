import { lazy, Suspense, useEffect } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy-loaded pages for code splitting
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
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

function App() {
  usePushNotifications();
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <WalletProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
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
                      <Route path="about" element={<AboutPage />} />
                      <Route path="memes" element={<MemeGeneratorPage />} />
                      <Route path="token/:id" element={<TokenDetailPage />} />
                      <Route path="wallet/:id" element={<WalletDetailPage />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </WalletProvider>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
