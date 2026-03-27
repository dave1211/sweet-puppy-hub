import { WalletsOverviewPanel } from "@/components/portfolio/WalletsOverviewPanel";
import { WalletComparisonTable } from "@/components/portfolio/WalletComparisonTable";
import { PortfolioRiskPanel } from "@/components/portfolio/PortfolioRiskPanel";
import { AlertCenter } from "@/components/alerts/AlertCenter";

const WalletsPage = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
      <div className="lg:col-span-5 space-y-2">
        <WalletsOverviewPanel />
      </div>
      <div className="lg:col-span-4 space-y-2">
        <WalletComparisonTable />
        <PortfolioRiskPanel />
      </div>
      <div className="lg:col-span-3 space-y-2">
        <AlertCenter />
      </div>
    </div>
  );
};

export default WalletsPage;
