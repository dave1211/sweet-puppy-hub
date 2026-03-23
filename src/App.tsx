import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/contexts/WalletContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import AuthPage from "./pages/AuthPage";
import DashboardHome from "./pages/DashboardHome";
import LivePairsPage from "./pages/LivePairsPage";
import NewLaunchesPage from "./pages/NewLaunchesPage";
import SniperModePage from "./pages/SniperModePage";
import WalletTrackerPage from "./pages/WalletTrackerPage";
import CopyTradePage from "./pages/CopyTradePage";
import AISignalsPage from "./pages/AISignalsPage";
import RiskScannerPage from "./pages/RiskScannerPage";
import WatchlistPage from "./pages/WatchlistPage";
import AlertsCenterPage from "./pages/AlertsCenterPage";
import PortfolioPageNew from "./pages/PortfolioPageNew";
import StrategiesPage from "./pages/StrategiesPage";
import SettingsPage from "./pages/SettingsPage";
import TokenDetailPage from "./pages/TokenDetailPage";
import WalletDetailPage from "./pages/WalletDetailPage";
import LaunchpadPage from "./pages/LaunchpadPage";
import AboutPage from "./pages/AboutPage";
import MemeGeneratorPage from "./pages/MemeGeneratorPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WalletProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
                  <Route path="about" element={<AboutPage />} />
                  <Route path="memes" element={<MemeGeneratorPage />} />
                  <Route path="token/:id" element={<TokenDetailPage />} />
                  <Route path="wallet/:id" element={<WalletDetailPage />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </WalletProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
