import { useState, useEffect, useCallback, useRef } from "react";
import { ScoredToken } from "./useUnifiedSignals";

export type ProofSource = "SNIPER" | "SMART MONEY" | "SIGNAL" | "AUTO";

export interface ProofEntry { id: string; address: string; symbol: string; source: ProofSource; entryPrice: number; entryTime: number; currentPrice: number | null; changePercent: number | null; checkedAt: number | null; isWin: boolean; elapsed: string; }

const STORAGE_KEY = "tanner-proof-captures";
const WIN_THRESHOLD = 20;
const CHECK_DELAYS_MS = [5 * 60_000, 15 * 60_000, 60 * 60_000];
const MAX_ENTRIES = 50;

function loadEntries(): ProofEntry[] { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function saveEntries(entries: ProofEntry[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES))); }
function formatElapsed(ms: number): string { const mins = Math.round(ms / 60_000); if (mins < 60) return `${mins}m`; const hours = Math.floor(mins / 60); const rem = mins % 60; return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`; }
function deriveSource(token: ScoredToken): ProofSource { if (token.sniperType === "sniper") return "SNIPER"; if (token.walletCount >= 2) return "SMART MONEY"; if (token.score >= 60) return "SIGNAL"; return "AUTO"; }

export function useProofCapture() {
  const [entries, setEntries] = useState<ProofEntry[]>(loadEntries);
  const capturedRef = useRef<Set<string>>(new Set(entries.map((e) => e.id)));
  useEffect(() => { saveEntries(entries); }, [entries]);

  const capture = useCallback((token: ScoredToken, source?: ProofSource) => {
    if (capturedRef.current.has(token.address)) return;
    capturedRef.current.add(token.address);
    const entry: ProofEntry = { id: `${token.address}-${Date.now()}`, address: token.address, symbol: token.symbol, source: source ?? deriveSource(token), entryPrice: token.price, entryTime: Date.now(), currentPrice: null, changePercent: null, checkedAt: null, isWin: false, elapsed: "0m" };
    setEntries((prev) => [entry, ...prev].slice(0, MAX_ENTRIES));
  }, []);

  const updateEntry = useCallback((address: string, currentPrice: number) => {
    setEntries((prev) => prev.map((e) => {
      if (e.address !== address || e.isWin) return e;
      const changePercent = e.entryPrice > 0 ? ((currentPrice - e.entryPrice) / e.entryPrice) * 100 : 0;
      return { ...e, currentPrice, changePercent: Math.round(changePercent * 10) / 10, checkedAt: Date.now(), isWin: changePercent >= WIN_THRESHOLD, elapsed: formatElapsed(Date.now() - e.entryTime) };
    }));
  }, []);

  const getPendingChecks = useCallback((): string[] => {
    const now = Date.now();
    const pending: string[] = [];
    for (const entry of entries) {
      if (entry.isWin) continue;
      const age = now - entry.entryTime;
      if (age > 2 * 60 * 60_000) continue;
      const lastCheck = entry.checkedAt ?? entry.entryTime;
      const sinceLastCheck = now - lastCheck;
      const shouldCheck = CHECK_DELAYS_MS.some((d) => age >= d && sinceLastCheck >= 60_000) || (age >= 5 * 60_000 && sinceLastCheck >= 5 * 60_000);
      if (shouldCheck) pending.push(entry.address);
    }
    return [...new Set(pending)];
  }, [entries]);

  const wins = entries.filter((e) => e.isWin);
  const winRate = entries.length > 0 ? Math.round((wins.length / entries.length) * 100) : 0;
  const bestWin = wins.length > 0 ? wins.reduce((best, e) => (e.changePercent ?? 0) > (best.changePercent ?? 0) ? e : best, wins[0]) : null;
  const clearHistory = useCallback(() => { setEntries([]); capturedRef.current.clear(); localStorage.removeItem(STORAGE_KEY); }, []);

  return { entries, wins, winRate, bestWin, capture, updateEntry, getPendingChecks, clearHistory };
}