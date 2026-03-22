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

  // Connect to XRPL on mount
  useEffect(() => {
    xrplService.connect().catch(console.error);

    const unsub = xrplService.on("network", (data) => {
      setNetwork(data as Partial<NetworkStatus>);
    });

    return () => {
      unsub();
    };
  }, [setNetwork]);

  if (activeTab === "portfolio") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
        <div className="lg:col-span-8 space-y-3">
          <PortfolioPanel />
        </div>
        <div className="lg:col-span-4 space-y-3">
          <TransactionHistory />
          <OpenOrders />
        </div>
      </div>
    );
  }

  if (activeTab === "orders") {
    return (
      <div className="space-y-3">
        <OpenOrders />
        <TransactionHistory />
      </div>
    );
  }

  // Trade view (default)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full">
      {/* Chart + order book area */}
      <div className="lg:col-span-8 flex flex-col gap-3">
        <div className="flex-1 min-h-[350px]">
          <ChartPanel />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <OpenOrders />
          <TransactionHistory />
        </div>
      </div>

      {/* Right column: order book + trade + recent trades */}
      <div className="lg:col-span-4 flex flex-col gap-3">
        <div className="flex-1 min-h-[250px]">
          <OrderBook />
        </div>
        <TradeForm />
        <div className="min-h-[180px]">
          <RecentTrades />
        </div>
      </div>
    </div>
  );
};

export default TradingPage;
