import { ReactNode } from "react";
import { useTier, TierGates } from "@/contexts/TierContext";
import { UpgradeOverlay } from "./UpgradeOverlay";

interface GatedPanelProps {
  gate: keyof TierGates;
  featureLabel: string;
  children: ReactNode;
}

export function GatedPanel({ gate, featureLabel, children }: GatedPanelProps) {
  const { gates, requiredTier } = useTier();
  if (gates[gate]) return <>{children}</>;
  return (
    <div className="relative">
      {children}
      <UpgradeOverlay requiredTier={requiredTier(gate)} featureLabel={featureLabel} />
    </div>
  );
}