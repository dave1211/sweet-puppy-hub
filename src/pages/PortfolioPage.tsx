import { PortfolioPanel } from "@/components/portfolio/PortfolioPanel";
import { TransactionHistory } from "@/components/portfolio/TransactionHistory";
import { OpenOrders } from "@/components/trading/OpenOrders";

const PortfolioPage = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
      <div className="lg:col-span-8 space-y-3">
        <PortfolioPanel />
      </div>
      <div className="lg:col-span-4 space-y-3">
        <OpenOrders />
        <TransactionHistory />
      </div>
    </div>
  );
};

export default PortfolioPage;
