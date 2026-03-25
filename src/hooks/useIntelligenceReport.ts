import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ReportSection {
  title: string;
  metrics: Record<string, number | string>;
  notes: string[];
}

export interface IntelligenceReport {
  type: string;
  generated_at: string;
  sections: ReportSection[];
}

async function fetchReport(type: "hourly" | "3hour" | "daily"): Promise<IntelligenceReport> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Not authenticated");

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/intelligence-report`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ type }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to fetch report");
  }

  return res.json();
}

export function useHourlyReport() {
  return useQuery({
    queryKey: ["intelligence-report", "hourly"],
    queryFn: () => fetchReport("hourly"),
    refetchInterval: 60 * 60 * 1000, // 1 hour
    staleTime: 5 * 60 * 1000,
  });
}

export function use3HourReport() {
  return useQuery({
    queryKey: ["intelligence-report", "3hour"],
    queryFn: () => fetchReport("3hour"),
    refetchInterval: 3 * 60 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
  });
}

export function useDailyReport() {
  return useQuery({
    queryKey: ["intelligence-report", "daily"],
    queryFn: () => fetchReport("daily"),
    refetchInterval: 24 * 60 * 60 * 1000,
    staleTime: 60 * 60 * 1000,
  });
}
