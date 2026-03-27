import { PortfolioPanel } from "@/components/portfolio/PortfolioPanel";
import { PortfolioRiskPanel } from "@/components/portfolio/PortfolioRiskPanel";
import { PnLPanel } from "@/components/portfolio/PnLPanel";
import { TrustLineManager } from "@/components/portfolio/TrustLineManager";
import { TransactionHistory } from "@/components/portfolio/TransactionHistory";
import { OpenOrders } from "@/components/trading/OpenOrders";
import { AlertCenter } from "@/components/alerts/AlertCenter";

const PortfolioPage = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
      <div className="lg:col-span-5 space-y-2">
        <PortfolioPanel />
        <PnLPanel />
      </div>
      <div className="lg:col-span-4 space-y-2">
        <PortfolioRiskPanel />
        <TransactionHistory />
      </div>
      <div className="lg:col-span-3 space-y-2">
        <TrustLineManager />
        <OpenOrders />
        <AlertCenter />
      </div>
    </div>
  );
};

export default PortfolioPage;
