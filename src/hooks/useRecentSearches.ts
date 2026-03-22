import { useState, useCallback } from "react";

const RECENT_SEARCHES_KEY = "tanner_recent_searches";
const MAX_RECENT = 5;

export interface RecentSearch { address: string; symbol: string; name: string; timestamp: number; }

function loadRecent(): RecentSearch[] { try { const raw = localStorage.getItem(RECENT_SEARCHES_KEY); return raw ? JSON.parse(raw) : []; } catch { return []; } }
function saveRecent(items: RecentSearch[]) { localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items.slice(0, MAX_RECENT))); }

export function useRecentSearches() {
  const [recent, setRecent] = useState<RecentSearch[]>(loadRecent);
  const addRecent = useCallback((item: Omit<RecentSearch, "timestamp">) => {
    setRecent((prev) => { const filtered = prev.filter((r) => r.address !== item.address); const next = [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, MAX_RECENT); saveRecent(next); return next; });
  }, []);
  const clearRecent = useCallback(() => { localStorage.removeItem(RECENT_SEARCHES_KEY); setRecent([]); }, []);
  return { recent, addRecent, clearRecent };
}