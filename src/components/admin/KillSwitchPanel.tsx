/**
 * Admin kill switch panel — toggle feature flags with audit logging.
 */
import { useState } from "react";
import { useFeatureFlags, type FeatureFlag } from "@/hooks/useFeatureFlags";
import { toggleFeatureFlagAudited } from "@/services/auditService";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function KillSwitchPanel() {
  const { flags, loading } = useFeatureFlags();
  const [toggling, setToggling] = useState<string | null>(null);

  const handleToggle = async (flag: FeatureFlag) => {
    setToggling(flag.key);
    try {
      await toggleFeatureFlagAudited(flag.key, !flag.enabled);
      toast.success(`${flag.key} ${!flag.enabled ? "enabled" : "disabled"}`);
      // Force re-fetch by reloading
      window.location.reload();
    } catch {
      toast.error("Failed to toggle flag");
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const killSwitchFlags = flags.filter((f) => f.metadata?.kill_switch === true);
  const otherFlags = flags.filter((f) => f.metadata?.kill_switch !== true);

  return (
    <div className="space-y-6">
      {/* Kill switches */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-4 w-4 text-terminal-red" />
          <h3 className="font-mono text-sm font-semibold text-foreground">KILL SWITCHES</h3>
        </div>
        <div className="space-y-2">
          {killSwitchFlags.map((flag) => (
            <FlagRow
              key={flag.key}
              flag={flag}
              toggling={toggling === flag.key}
              onToggle={() => handleToggle(flag)}
              isKillSwitch
            />
          ))}
        </div>
      </div>

      {/* Feature flags */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-sm font-semibold text-foreground">FEATURE FLAGS</h3>
        </div>
        <div className="space-y-2">
          {otherFlags.map((flag) => (
            <FlagRow
              key={flag.key}
              flag={flag}
              toggling={toggling === flag.key}
              onToggle={() => handleToggle(flag)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FlagRow({
  flag,
  toggling,
  onToggle,
  isKillSwitch,
}: {
  flag: FeatureFlag;
  toggling: boolean;
  onToggle: () => void;
  isKillSwitch?: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="font-mono text-xs text-foreground">{flag.key}</span>
          {flag.min_tier && flag.min_tier !== "free" && (
            <Badge variant="outline" className="text-[9px] w-fit mt-0.5 border-terminal-amber/30 text-terminal-amber">
              {flag.min_tier}+
            </Badge>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isKillSwitch && !flag.enabled && (
          <Badge variant="destructive" className="text-[9px]">KILLED</Badge>
        )}
        {toggling ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            checked={flag.enabled}
            onCheckedChange={onToggle}
            className={isKillSwitch && !flag.enabled ? "data-[state=unchecked]:bg-terminal-red/30" : ""}
          />
        )}
      </div>
    </div>
  );
}
