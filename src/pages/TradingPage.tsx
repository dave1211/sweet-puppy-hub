import { useEffect } from "react";
import { ChartPanel } from "@/components/trading/ChartPanel";
import { OrderBook } from "@/components/trading/OrderBook";
import { RecentTrades } from "@/components/trading/RecentTrades";
import { TradeForm } from "@/components/trading/TradeForm";
import { OpenOrders } from "@/components/trading/OpenOrders";
import { OrderHistory } from "@/components/trading/OrderHistory";
import { AMMPanel } from "@/components/trading/AMMPanel";
import { PairSearch } from "@/components/trading/PairSearch";
import { PortfolioPanel } from "@/components/portfolio/PortfolioPanel";
import { PnLPanel } from "@/components/portfolio/PnLPanel";
import { TrustLineManager } from "@/components/portfolio/TrustLineManager";
import { TransactionHistory } from "@/components/portfolio/TransactionHistory";
import { AlertCenter } from "@/components/alerts/AlertCenter";
import { NFTGallery } from "@/components/nft/NFTGallery";
import { useUIStore } from "@/stores/uiStore";
import { useMarketStore } from "@/stores/marketStore";
import { useAlertStore } from "@/stores/alertStore";
import { xrplService } from "@/services/xrplService";
import type { NetworkStatus } from "@/types/xrpl";

const TradingPage = () => {
  const { activeTab } = useUIStore();
  const setNetwork = useMarketStore((s) => s.setNetwork);
  const addAlert = useAlertStore((s) => s.addAlert);

  useEffect(() => {
    xrplService.connect().catch(console.error);
    const unsub = xrplService.on("network", (data) => {
      setNetwork(data as Partial<NetworkStatus>);
    });

    // Simulate some alerts for demo
    const timer = setTimeout(() => {
      addAlert({ type: "price_above", severity: "info", title: "XRP Price Alert", message: "XRP crossed $2.35 — up 2.4% in last hour" });
      addAlert({ type: "large_trade", severity: "warning", title: "Whale Alert", message: "500K XRP sold on DEX — possible large exit" });
      addAlert({ type: "execution_complete", severity: "info", title: "Order Filled", message: "Your limit buy for 1000 XRP @ 2.3490 was filled" });
    }, 2000);

    return () => { unsub(); clearTimeout(timer); };
  }, [setNetwork, addAlert]);

  if (activeTab === "portfolio") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-full animate-fade-in">
        <div className="lg:col-span-5 space-y-2">
          <PortfolioPanel />
          <PnLPanel />
        </div>
        <div className="lg:col-span-4 space-y-2">
          <TrustLineManager />
          <TransactionHistory />
        </div>
        <div className="lg:col-span-3 space-y-2">
          <OpenOrders />
          <AlertCenter />
        </div>
      </div>
    );
  }

  if (activeTab === "orders") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-full animate-fade-in">
        <div className="lg:col-span-8">
          <OrderHistory />
        </div>
        <div className="lg:col-span-4 space-y-2">
          <OpenOrders />
          <TransactionHistory />
        </div>
      </div>
    );
  }

  if (activeTab === "alerts") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-full animate-fade-in">
        <div className="lg:col-span-8">
          <AlertCenter />
        </div>
        <div className="lg:col-span-4 space-y-2">
          <PairSearch />
        </div>
      </div>
    );
  }

  if (activeTab === "nft") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-full animate-fade-in">
        <div className="lg:col-span-8">
          <NFTGallery />
        </div>
        <div className="lg:col-span-4 space-y-2">
          <TransactionHistory />
        </div>
      </div>
    );
  }

  // Trade view (default)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-full">
      {/* Main: chart + bottom */}
      <div className="lg:col-span-8 flex flex-col gap-2 min-h-0">
        <div className="flex-1 min-h-[300px]">
          <ChartPanel />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 shrink-0">
          <OpenOrders />
          <TransactionHistory />
        </div>
      </div>

      {/* Right column */}
      <div className="lg:col-span-4 flex flex-col gap-2 min-h-0">
        <div className="flex-1 min-h-[180px]">
          <OrderBook />
        </div>
        <TradeForm />
        <AMMPanel />
        <div className="min-h-[140px]">
          <RecentTrades />
        </div>
      </div>
    </div>
  );
};

export default TradingPage;
