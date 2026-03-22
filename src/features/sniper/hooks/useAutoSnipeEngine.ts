// useAutoSnipeEngine — Monitors token feed and auto-executes snipes
import { useEffect, useRef } from "react";
import { useAutoSniperStore, type SnipeRecord } from "../stores/autoSniperStore";
import { useSniperStore } from "../stores/sniperStore";
import { useWallet } from "@/contexts/WalletContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { SniperToken } from "../types";

function createRecordFromToken(token: SniperToken, amountSOL: number): SnipeRecord {
  return {
    id: crypto.randomUUID(),
    tokenAddress: token.token.address,
    tokenSymbol: token.token.symbol,
    tokenName: token.token.name,
    entryPrice: token.token.price,
    entryTime: Date.now(),
    amountSOL,
    score: token.score.total,
    risk: token.risk.total,
    state: token.state,
    exitPrice: null,
    exitTime: null,
    pnlPercent: null,
    status: "active",
  };
}

async function persistRecord(record: SnipeRecord, userId: string) {
  await supabase.from("snipe_history").insert({
    id: record.id,
    user_id: userId,
    device_id: userId,
    token_address: record.tokenAddress,
    token_symbol: record.tokenSymbol,
    token_name: record.tokenName,
    entry_price: record.entryPrice,
    entry_time: new Date(record.entryTime).toISOString(),
    amount_sol: record.amountSOL,
    score: record.score,
    risk: record.risk,
    state: record.state,
    status: record.status,
  } as any);
}

async function updateRecordInDb(id: string, partial: Partial<SnipeRecord>) {
  const updates: Record<string, unknown> = {};
  if (partial.exitPrice !== undefined) updates.exit_price = partial.exitPrice;
  if (partial.exitTime !== undefined) updates.exit_time = partial.exitTime ? new Date(partial.exitTime).toISOString() : null;
  if (partial.pnlPercent !== undefined) updates.pnl_percent = partial.pnlPercent;
  if (partial.status !== undefined) updates.status = partial.status;
  if (Object.keys(updates).length > 0) {
    await supabase.from("snipe_history").update(updates).eq("id", id);
  }
}

export function useAutoSnipeEngine() {
  const { user } = useAuth();
  const userId = user?.id;
  const { isConnected } = useWallet();
  const { config, records, addRecord, updateRecord, isOnCooldown, setCooldown } = useAutoSniperStore();
  const tokens = useSniperStore((s) => s.tokens);
  const lastCheck = useRef(0);

  // Load history from DB on mount
  useEffect(() => {
    if (!userId) return;
    async function loadHistory() {
      const { data } = await supabase
        .from("snipe_history")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);

      if (data && data.length > 0) {
        const store = useAutoSniperStore.getState();
        if (store.records.length === 0) {
          data.forEach((row) => {
            store.addRecord({
              id: row.id,
              tokenAddress: row.token_address,
              tokenSymbol: row.token_symbol,
              tokenName: row.token_name,
              entryPrice: Number(row.entry_price),
              entryTime: new Date(row.entry_time).getTime(),
              amountSOL: Number(row.amount_sol),
              score: row.score,
              risk: row.risk,
              state: row.state,
              exitPrice: row.exit_price ? Number(row.exit_price) : null,
              exitTime: row.exit_time ? new Date(row.exit_time).getTime() : null,
              pnlPercent: row.pnl_percent ? Number(row.pnl_percent) : null,
              status: row.status as SnipeRecord["status"],
            });
          });
        }
      }
    }
    loadHistory();
  }, [userId]);

  // Auto-snipe engine loop
  useEffect(() => {
    if (!config.enabled || !isConnected || !userId) return;

    const now = Date.now();
    if (now - lastCheck.current < 3000) return;
    lastCheck.current = now;

    const activeCount = records.filter((r) => r.status === "active").length;
    if (activeCount >= config.maxConcurrent) return;

    const candidates = tokens.filter((t) => {
      if (!config.statesAllowed.includes(t.state)) return false;
      if (t.score.total < config.minScore) return false;
      if (t.risk.total > config.maxRisk) return false;
      if (isOnCooldown(t.token.address)) return false;
      if (records.some((r) => r.tokenAddress === t.token.address && r.status === "active")) return false;
      return true;
    });

    const best = candidates.sort((a, b) => b.score.total - a.score.total)[0];
    if (!best) return;

    const record = createRecordFromToken(best, config.amountSOL);
    addRecord(record);
    setCooldown(best.token.address);
    persistRecord(record, userId);

    toast.success(`🤖 Auto-sniped ${best.token.symbol} — ${config.amountSOL} SOL (Score: ${best.score.total})`, {
      description: `Risk: ${best.risk.total} | State: ${best.state}`,
    });
  }, [config, tokens, isConnected, records, addRecord, setCooldown, isOnCooldown, userId]);

  // Simulate price movement for active records
  useEffect(() => {
    const activeRecords = records.filter((r) => r.status === "active");
    if (activeRecords.length === 0) return;

    const interval = setInterval(() => {
      activeRecords.forEach((record) => {
        const token = tokens.find((t) => t.token.address === record.tokenAddress);
        if (!token) return;

        const currentPrice = token.token.price;
        if (currentPrice <= 0 || record.entryPrice <= 0) return;

        const pnl = ((currentPrice - record.entryPrice) / record.entryPrice) * 100;

        if (pnl >= 50 || pnl <= -30) {
          const status = pnl >= 0 ? "profit" as const : "loss" as const;
          const update = {
            exitPrice: currentPrice,
            exitTime: Date.now(),
            pnlPercent: Math.round(pnl * 10) / 10,
            status,
          };
          updateRecord(record.id, update);
          updateRecordInDb(record.id, update);
          toast[status === "profit" ? "success" : "error"](
            `${status === "profit" ? "💰" : "📉"} Auto-exit ${record.tokenSymbol}: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(1)}%`
          );
        }
      });
    }, 10_000);

    return () => clearInterval(interval);
  }, [records, tokens, updateRecord]);

  return { activeCount: records.filter((r) => r.status === "active").length };
}
