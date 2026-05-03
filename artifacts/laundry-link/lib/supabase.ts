import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// ── Env vars ───────────────────────────────────────────────────────────────
const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

// Masked diagnostic log — safe to appear in production logs
const urlMasked = supabaseUrl
  ? supabaseUrl.replace(/https:\/\/([^.]{3})[^.]+/, "https://$1***")
  : "(not set)";
const keyMasked = supabaseAnonKey
  ? `${supabaseAnonKey.slice(0, 12)}…${supabaseAnonKey.slice(-4)}`
  : "(not set)";
console.log(`[LaundryLink] EXPO_PUBLIC_SUPABASE_URL  = ${urlMasked}`);
console.log(`[LaundryLink] EXPO_PUBLIC_SUPABASE_ANON_KEY = ${keyMasked}`);

const isPlaceholder =
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes("your_supabase") ||
  supabaseUrl.includes("placeholder") ||
  supabaseAnonKey.includes("your_supabase") ||
  supabaseAnonKey.includes("placeholder");

export const isSupabaseConfigured = !isPlaceholder;
console.log(`[LaundryLink] isSupabaseConfigured = ${isSupabaseConfigured}`);

// ── Single Supabase client ─────────────────────────────────────────────────
// IMPORTANT: Uses AsyncStorage, NOT expo-secure-store.
// SecureStore has a 2 KB per-value limit on iOS which silently fails when
// storing Supabase sessions (access_token + refresh_token + user metadata
// easily exceeds 2 KB). AsyncStorage has no such limit.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured
    ? supabaseAnonKey
    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZodGD1M_I9HmQvavErp5mvFT-bNfJcfEKWbhkUArdF4",
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// ── Connection probe ───────────────────────────────────────────────────────
// Purely INFORMATIONAL — used to show a warning banner, NOT to gate auth.
// Any HTTP response (including 4xx/5xx) = server is reachable.
export async function testSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.log("[LaundryLink] Skipping connection test — not configured");
    return false;
  }

  try {
    console.log("[LaundryLink] Testing Supabase reachability…");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000); // 12 s for slow mobile

    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    console.log(`[LaundryLink] Supabase probe → HTTP ${res.status} ✓`);
    return true;
  } catch (e: any) {
    const reason =
      e?.name === "AbortError" ? "timed out after 12 s" : (e?.message ?? "network error");
    console.log(`[LaundryLink] Supabase unreachable: ${reason}`);
    return false;
  }
}
