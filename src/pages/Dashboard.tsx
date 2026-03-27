import { DashboardStats } from "@/components/terminal/DashboardStats";
import { WatchlistPanel } from "@/components/terminal/WatchlistPanel";
import { AlertsPanel } from "@/components/terminal/AlertsPanel";
import { TokenDetailPanel } from "@/components/terminal/TokenDetailPanel";
import { ActivityFeed } from "@/components/terminal/ActivityFeed";
import { NewLaunchesPanel } from "@/components/terminal/NewLaunchesPanel";
import { SignalPanel } from "@/components/terminal/SignalPanel";
import { TradingPanel } from "@/components/terminal/TradingPanel";
import { AutoSniperPanel } from "@/components/terminal/AutoSniperPanel";
import { SniperModePanel } from "@/components/terminal/SniperModePanel";
import { WalletPanel } from "@/components/terminal/WalletPanel";
import { SmartMoneyPanel } from "@/components/terminal/SmartMoneyPanel";
import { TopSignalsPanel } from "@/components/terminal/TopSignalsPanel";
import { CopyTradingPanel } from "@/components/terminal/CopyTradingPanel";
import { AdaptiveWeightsPanel } from "@/components/terminal/AdaptiveWeightsPanel";
import { GrowthPanel } from "@/components/terminal/GrowthPanel";
import { DailyPerformancePanel } from "@/components/terminal/DailyPerformancePanel";
import { GatedPanel } from "@/components/terminal/GatedPanel";
import { ExecutionControlsPanel } from "@/components/terminal/ExecutionControlsPanel";
import { RugGuardPanel } from "@/components/terminal/RugGuardPanel";
import { ProofPanel } from "@/components/terminal/ProofPanel";
import { EnhancedRugPanel } from "@/components/terminal/EnhancedRugPanel";
import { YourSolSystem } from "@/components/terminal/YourSolSystem";
import { BurnIncinerator } from "@/components/terminal/BurnIncinerator";
import { XRPBridgePanel } from "@/components/bridge/XRPBridgePanel";
import { SelectedTokenProvider } from "@/contexts/SelectedTokenContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useAlerts } from "@/hooks/useAlerts";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import { useAlertPoller } from "@/hooks/useAlertPoller";
import { useSmartMoneyAlerts } from "@/hooks/useSmartMoneyAlerts";

const Dashboard = () => {
  const { items } = useWatchlist();
  const { alerts } = useAlerts();
  const activeAlerts = alerts.filter((a) => a.enabled).length;
  const allAddresses = [...new Set([...items.map((i) => i.address), ...alerts.filter((a) => a.enabled).map((a) => a.address)])];
  const { data: tokenPrices } = useTokenPrices(allAddresses);
  useAlertPoller(tokenPrices ?? {});
  useSmartMoneyAlerts();

  return (
    <SelectedTokenProvider>
      <div className="space-y-4 max-w-[1600px] mx-auto">
        {/* Stats bar */}
        <DashboardStats watchlistCount={items.length} alertsCount={activeAlerts} />

        {/* Section: Market Intelligence */}
        <div className="section-divider"><span>Market Intelligence</span></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left — Watchlist & Alerts */}
          <div className="lg:col-span-3 space-y-4">
            <WatchlistPanel />
            <AlertsPanel />
            <YourSolSystem />
            <DailyPerformancePanel />
          </div>

          {/* Center — Token Detail & Signals */}
          <div className="lg:col-span-5 space-y-4">
            <TokenDetailPanel />
            <RugGuardPanel />
            <TopSignalsPanel />
            <GatedPanel gate="canUseAdvancedSignals" featureLabel="Advanced Signals">
              <SignalPanel />
            </GatedPanel>
            <AdaptiveWeightsPanel />
            <ActivityFeed />
          </div>

          {/* Right — Trading & Tools */}
          <div className="lg:col-span-4 space-y-4">
            <WalletPanel />
            <GatedPanel gate="canUseAutoSniper" featureLabel="Auto Sniper">
              <AutoSniperPanel />
            </GatedPanel>
            <GatedPanel gate="canUseSniper" featureLabel="Sniper Mode">
              <SniperModePanel />
            </GatedPanel>
            <NewLaunchesPanel />
            <EnhancedRugPanel />
            <GatedPanel gate="canUseCopyTrading" featureLabel="Copy Trading">
              <CopyTradingPanel />
            </GatedPanel>
            <GatedPanel gate="canUseSmartMoney" featureLabel="Smart Money">
              <SmartMoneyPanel />
            </GatedPanel>
            <ExecutionControlsPanel />
            <TradingPanel />
          </div>
        </div>

        {/* Section: Extended Tools */}
        <div className="section-divider"><span>Extended Tools</span></div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-4">
            <XRPBridgePanel />
          </div>
          <div className="lg:col-span-4">
            <BurnIncinerator />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <ProofPanel />
            <GrowthPanel />
          </div>
        </div>
      </div>
    </SelectedTokenProvider>
  );
};

export default Dashboard;
