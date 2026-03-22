/**
 * Patches the Supabase client to include x-device-id header on all REST requests.
 * Import this module once in main.tsx before rendering.
 */
import { supabase } from "@/integrations/supabase/client";

const DEVICE_ID_KEY = "tanner_terminal_device_id";

function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const newId = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}

const deviceId = getOrCreateDeviceId();

// Inject x-device-id into all PostgREST requests for RLS policies
try {
  // Access internal REST client headers
  const restClient = (supabase as any).rest;
  if (restClient && restClient.headers) {
    restClient.headers["x-device-id"] = deviceId;
  }
} catch (e) {
  console.warn("Failed to set device-id header on Supabase client:", e);
}

export { deviceId };
