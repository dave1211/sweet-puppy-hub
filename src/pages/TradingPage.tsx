import { useEffect } from "react";
import { ChartPanel } from "@/components/trading/ChartPanel";
import { OrderBook } from "@/components/trading/OrderBook";
import { RecentTrades } from "@/components/trading/RecentTrades";
import { TradeForm } from "@/components/trading/TradeForm";
import { OpenOrders } from "@/components/trading/OpenOrders";
import { PortfolioPanel } from "@/components/portfolio/PortfolioPanel";
import { TransactionHistory } from "@/components/portfolio/TransactionHistory";
import { useUIStore } from "@/stores/uiStore";
import { useMarketStore } from "@/stores/marketStore";
import { xrplService } from "@/services/xrplService";
import type { NetworkStatus } from "@/types/xrpl";

const TradingPage = () => {
  const { activeTab } = useUIStore();
  const setNetwork = useMarketStore((s) => s.setNetwork);

  useEffect(() => {
    xrplService.connect().catch(console.error);
    const unsub = xrplService.on("network", (data) => {
      setNetwork(data as Partial<NetworkStatus>);
    });
    return () => { unsub(); };
  }, [setNetwork]);

  if (activeTab === "portfolio") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-full animate-fade-in">
        <div className="lg:col-span-8 space-y-2">
          <PortfolioPanel />
        </div>
        <div className="lg:col-span-4 space-y-2">
          <TransactionHistory />
          <OpenOrders />
        </div>
      </div>
    );
  }

  if (activeTab === "orders") {
    return (
      <div className="space-y-2 animate-fade-in">
        <OpenOrders />
        <TransactionHistory />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 h-full">
      {/* Main area: chart + bottom panels */}
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
        <div className="flex-1 min-h-[200px]">
          <OrderBook />
        </div>
        <TradeForm />
        <div className="min-h-[160px]">
          <RecentTrades />
        </div>
      </div>
    </div>
  );
};

export default TradingPage;
