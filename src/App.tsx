import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TierProvider } from "@/contexts/TierContext";
import { WalletProvider } from "@/contexts/WalletContext";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Watchlist from "./pages/Watchlist";
import Alerts from "./pages/Alerts";
import Token from "./pages/Token";
import Pricing from "./pages/Pricing";
import Rewards from "./pages/Rewards";
import MerchStore from "./pages/MerchStore";
import MerchProduct from "./pages/MerchProduct";
import MerchAdmin from "./pages/MerchAdmin";
import TerminalLayout from "./pages/TerminalLayout";
import TradingPage from "./pages/TradingPage";
import PortfolioPage from "./pages/PortfolioPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TierProvider>
        <WalletProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Solana Terminal — primary */}
              <Route path="/" element={<Index />}>
                <Route index element={<Dashboard />} />
                <Route path="watchlist" element={<Watchlist />} />
                <Route path="alerts" element={<Alerts />} />
                <Route path="token" element={<Token />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="rewards" element={<Rewards />} />
                <Route path="merch" element={<MerchStore />} />
                <Route path="merch/:id" element={<MerchProduct />} />
                <Route path="merch/admin" element={<MerchAdmin />} />
              </Route>
              {/* XRPL Trading — secondary */}
              <Route path="/xrpl" element={<TerminalLayout />}>
                <Route index element={<TradingPage />} />
                <Route path="portfolio" element={<PortfolioPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WalletProvider>
      </TierProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
