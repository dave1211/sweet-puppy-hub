import { useEffect } from "react";
import { ChartPanel } from "@/components/trading/ChartPanel";
import { OrderBook } from "@/components/trading/OrderBook";
import { RecentTrades } from "@/components/trading/RecentTrades";
import { TradeForm } from "@/components/trading/TradeForm";
import { OpenOrders } from "@/components/trading/OpenOrders";
import { AMMPanel } from "@/components/trading/AMMPanel";
import { PairSearch } from "@/components/trading/PairSearch";
import { PortfolioPanel } from "@/components/portfolio/PortfolioPanel";
import { TrustLineManager } from "@/components/portfolio/TrustLineManager";
import { TransactionHistory } from "@/components/portfolio/TransactionHistory";
import { AlertCenter } from "@/components/alerts/AlertCenter";
import { NFTGallery } from "@/components/nft/NFTGallery";
import { useMarketStore } from "@/stores/marketStore";
import { xrplService } from "@/services/xrplService";
import type { NetworkStatus } from "@/types/xrpl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function XRPLPage() {
  const setNetwork = useMarketStore((s) => s.setNetwork);

  useEffect(() => {
    xrplService.connect().catch(console.error);
    const unsub = xrplService.on("network", (data) => {
      setNetwork(data as Partial<NetworkStatus>);
    });
    return () => { unsub(); };
  }, [setNetwork]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-base sm:text-lg font-mono font-bold text-foreground">XRPL LEDGER</h1>
        <p className="text-[10px] sm:text-xs font-mono text-muted-foreground">
          XRP Ledger trading, portfolio, and NFT management
        </p>
      </div>

      <Tabs defaultValue="trade" className="w-full">
        <TabsList className="bg-card border border-border w-full justify-start">
          <TabsTrigger value="trade" className="text-[10px] font-mono">TRADE</TabsTrigger>
          <TabsTrigger value="portfolio" className="text-[10px] font-mono">PORTFOLIO</TabsTrigger>
          <TabsTrigger value="nft" className="text-[10px] font-mono">NFT</TabsTrigger>
          <TabsTrigger value="alerts" className="text-[10px] font-mono">ALERTS</TabsTrigger>
        </TabsList>

        <TabsContent value="trade" className="mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
            <div className="lg:col-span-8 flex flex-col gap-2 min-h-0">
              <div className="min-h-[300px]"><ChartPanel /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <OpenOrders />
                <TransactionHistory />
              </div>
            </div>
            <div className="lg:col-span-4 flex flex-col gap-2 min-h-0">
              <PairSearch />
              <OrderBook />
              <TradeForm />
              <AMMPanel />
              <RecentTrades />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <PortfolioPanel />
            <TrustLineManager />
          </div>
        </TabsContent>

        <TabsContent value="nft" className="mt-3">
          <NFTGallery />
        </TabsContent>

        <TabsContent value="alerts" className="mt-3">
          <AlertCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
}
