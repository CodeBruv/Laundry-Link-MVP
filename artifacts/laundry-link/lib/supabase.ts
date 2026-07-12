import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { ENV, IS_SUPABASE_CONFIGURED } from "@/constants/env";

export { IS_SUPABASE_CONFIGURED as isSupabaseConfigured };

// IMPORTANT: Uses AsyncStorage, NOT expo-secure-store.
// SecureStore has a 2 KB per-value limit on iOS that silently fails when
// storing Supabase sessions (token + metadata easily exceeds 2 KB).
// AsyncStorage has no such limit.
export const supabase = createClient(
  IS_SUPABASE_CONFIGURED ? ENV.SUPABASE_URL : "https://placeholder.supabase.co",
  IS_SUPABASE_CONFIGURED
    ? ENV.SUPABASE_ANON_KEY
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
  if (!IS_SUPABASE_CONFIGURED) return false;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(`${ENV.SUPABASE_URL}/rest/v1/`, {
      method: "GET",
      headers: {
        apikey: ENV.SUPABASE_ANON_KEY,
        Authorization: `Bearer ${ENV.SUPABASE_ANON_KEY}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (ENV.IS_DEV) {
      console.log(`[PurePress] Supabase probe → HTTP ${res.status}`);
    }
    return true;
  } catch (e: any) {
    const reason =
      e?.name === "AbortError" ? "timed out after 12 s" : (e?.message ?? "network error");
    if (ENV.IS_DEV) {
      console.warn(`[PurePress] Supabase unreachable: ${reason}`);
    }
    return false;
  }
}
