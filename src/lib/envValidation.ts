/**
 * Boot-time environment validation.
 * Validates required env vars exist before app renders.
 * Returns list of missing vars for error display.
 */

const REQUIRED_VARS = [
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
] as const;

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
}

export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    const value = import.meta.env[key];
    if (!value || typeof value !== "string" || value.trim().length === 0) {
      missing.push(key);
    }
  }

  return { valid: missing.length === 0, missing };
}

/** Validate Supabase URL format */
export function isValidSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
