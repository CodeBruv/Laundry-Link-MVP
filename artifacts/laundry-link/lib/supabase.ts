import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// ── Storage adapter ────────────────────────────────────────────────────────
const ExpoSecureStoreAdapter = {
  getItem: (key: string): string | null | Promise<string | null> => {
    if (Platform.OS === "web") {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string): void | Promise<void> => {
    if (Platform.OS === "web") {
      try { localStorage.setItem(key, value); } catch {}
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string): void | Promise<void> => {
    if (Platform.OS === "web") {
      try { localStorage.removeItem(key); } catch {}
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// ── Env vars ───────────────────────────────────────────────────────────────
const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? "").trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

// Masked diagnostic log — shown on every app start, never exposes real values
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
// autoRefreshToken is set to false initially. AuthContext will call
// supabase.auth.startAutoRefresh() once reachability is confirmed so that
// only ONE client instance exists and no background requests fire before
// we know the server is up.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder.supabase.co",
  isSupabaseConfigured
    ? supabaseAnonKey
    : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.ZodGD1M_I9HmQvavErp5mvFT-bNfJcfEKWbhkUArdF4",
  {
    auth: {
      storage: ExpoSecureStoreAdapter as any,
      autoRefreshToken: false,   // enabled manually after connection test passes
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// ── Connection probe ───────────────────────────────────────────────────────
// Uses a plain fetch (not the Supabase client) so no GoTrueClient instances
// are involved. Any HTTP response (including 4xx) = server is reachable.
export async function testSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.log("[LaundryLink] Skipping connection test (not configured)");
    return false;
  }

  try {
    console.log("[LaundryLink] Testing Supabase connection…");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    console.log(`[LaundryLink] Supabase probe → HTTP ${res.status} (${res.status >= 200 ? "reachable ✓" : "?"})`);
    return true; // any HTTP response means server is alive
  } catch (e: any) {
    const reason =
      e?.name === "AbortError" ? "timed out after 6 s" : (e?.message ?? "network error");
    console.log(`[LaundryLink] Supabase unreachable: ${reason}`);
    return false;
  }
}
