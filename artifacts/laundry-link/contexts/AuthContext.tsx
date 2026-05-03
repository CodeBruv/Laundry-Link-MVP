import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session, User } from "@supabase/supabase-js";
import { useRouter, useSegments } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  isSupabaseConfigured,
  supabase,
  testSupabaseConnection,
} from "@/lib/supabase";
import { UserRole } from "@/types";

export type ConnectionStatus =
  | "checking"
  | "connected"
  | "unreachable"
  | "unconfigured";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  /** true ONLY when Supabase keys are not configured at all */
  isDemo: boolean;
  connectionStatus: ConnectionStatus;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: UserRole,
  ) => Promise<{ error: string | null }>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  isLoading: true,
  isDemo: false,
  connectionStatus: "checking",
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// ── Route guard ────────────────────────────────────────────────────────────
function useProtectedRoute(
  user: User | null,
  role: UserRole | null,
  isLoading: boolean,
) {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      switch (role) {
        case "BUSINESS":   router.replace("/(business)");   break;
        case "DISPATCHER": router.replace("/(dispatcher)"); break;
        case "ADMIN":      router.replace("/(admin)");      break;
        default:           router.replace("/(customer)");   break;
      }
    }
  }, [user, role, segments, isLoading]);
}

// ── Helpers ────────────────────────────────────────────────────────────────
function makeDemoUser(fullName: string, email: string, role: UserRole): User {
  return {
    id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    email,
    app_metadata: {},
    user_metadata: { full_name: fullName, role },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

// Wraps a Supabase call and logs + re-surfaces the actual error message.
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    console.log("[LaundryLink] Supabase call failed:", msg);
    return fallback;
  }
}

// ── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole]       = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    isSupabaseConfigured ? "checking" : "unconfigured",
  );

  // isDemo is TRUE only when keys are absent — NOT when the probe timed out.
  // This ensures signIn/signUp always attempt real Supabase auth when configured.
  const isDemo = !isSupabaseConfigured;

  useEffect(() => {
    let authSub: { unsubscribe: () => void } | null = null;

    const init = async () => {
      // ── No keys configured → pure demo mode ───────────────────────────
      if (!isSupabaseConfigured) {
        setConnectionStatus("unconfigured");
        const [savedUser, savedRole] = await Promise.all([
          AsyncStorage.getItem("demo_user").catch(() => null),
          AsyncStorage.getItem("demo_role").catch(() => null),
        ]);
        if (savedUser && savedRole) {
          try {
            setUser(JSON.parse(savedUser));
            setRole(savedRole as UserRole);
          } catch {}
        }
        setIsLoading(false);
        return;
      }

      // ── Keys present → restore session immediately (no probe wait) ─────
      // Session is stored in AsyncStorage by the Supabase client itself.
      // We do NOT wait for the probe before restoring — this is what allows
      // instant login on app re-open even with a slow mobile connection.
      const sessionResult = await safe(
        () => supabase.auth.getSession(),
        { data: { session: null }, error: null },
      );
      const s = sessionResult.data.session;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setRole((s.user.user_metadata?.role as UserRole) || "CUSTOMER");
      }

      // Register auth state listener — fires on sign-in, sign-out, token refresh
      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        console.log("[LaundryLink] Auth state changed:", _event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setRole(
          newSession?.user
            ? ((newSession.user.user_metadata?.role as UserRole) || "CUSTOMER")
            : null,
        );
      });
      authSub = data.subscription;

      setIsLoading(false);

      // ── Run connection probe in the background (informational only) ────
      // This sets connectionStatus for the UI banner but does NOT block auth.
      testSupabaseConnection().then((reachable) => {
        setConnectionStatus(reachable ? "connected" : "unreachable");
        console.log(`[LaundryLink] Connection status → ${reachable ? "connected" : "unreachable"}`);
      });
    };

    init();
    return () => { authSub?.unsubscribe(); };
  }, []);

  useProtectedRoute(user, role, isLoading);

  // ── Sign up ────────────────────────────────────────────────────────────
  const signUp = useCallback(async (
    email: string,
    password: string,
    fullName: string,
    selectedRole: UserRole,
  ) => {
    // Pure demo mode — keys not configured
    if (isDemo) {
      const demoUser = makeDemoUser(fullName, email, selectedRole);
      setUser(demoUser);
      setRole(selectedRole);
      await AsyncStorage.setItem("demo_role", selectedRole);
      await AsyncStorage.setItem("demo_user", JSON.stringify(demoUser));
      return { error: null };
    }

    // Always try real Supabase when configured
    const result = await safe(
      () =>
        supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName, role: selectedRole } },
        }),
      {
        data: { user: null, session: null },
        error: { message: "Network request failed — check your internet connection and try again." } as any,
      },
    );
    if (result.error) return { error: result.error.message };

    // Persist role in user metadata
    await safe(
      () => supabase.auth.updateUser({ data: { full_name: fullName, role: selectedRole } }),
      { data: { user: null as any }, error: null },
    );
    const finalUser = result.data.user;
    if (finalUser) setUser(finalUser);
    setRole(selectedRole);
    await AsyncStorage.setItem("user_role", selectedRole);
    return { error: null };
  }, [isDemo]);

  // ── Sign in ────────────────────────────────────────────────────────────
  // CRITICAL: Always tries real Supabase auth when configured.
  // Never silently falls to demo if keys are present — shows the real error instead.
  const signIn = useCallback(async (email: string, password: string) => {
    // Pure demo mode — keys not configured
    if (isDemo) {
      const savedUser = await AsyncStorage.getItem("demo_user").catch(() => null);
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setRole((parsed.user_metadata?.role as UserRole) || "CUSTOMER");
          return { error: null };
        } catch {}
      }
      const demoUser = makeDemoUser("Demo User", email, "CUSTOMER");
      setUser(demoUser);
      setRole("CUSTOMER");
      await AsyncStorage.setItem("demo_role", "CUSTOMER");
      await AsyncStorage.setItem("demo_user", JSON.stringify(demoUser));
      return { error: null };
    }

    // Real Supabase auth — always attempted when keys are configured
    console.log("[LaundryLink] signIn → calling supabase.auth.signInWithPassword");
    let result: { data: { user: User | null; session: Session | null }; error: { message: string } | null };
    try {
      result = await supabase.auth.signInWithPassword({ email, password });
    } catch (e: any) {
      const msg = e?.message ?? "Network request failed — check your internet connection.";
      console.log("[LaundryLink] signIn exception:", msg);
      return { error: msg };
    }

    if (result.error) {
      console.log("[LaundryLink] signIn Supabase error:", result.error.message);
      return { error: result.error.message };
    }

    if (result.data.user) {
      const r = (result.data.user.user_metadata?.role as UserRole) || "CUSTOMER";
      setRole(r);
      await AsyncStorage.setItem("user_role", r);
      console.log("[LaundryLink] signIn success, role:", r);
    }
    return { error: null };
  }, [isDemo]);

  // ── Sign out ───────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await safe(() => supabase.auth.signOut(), undefined);
    }
    await AsyncStorage.multiRemove(["demo_role", "demo_user", "user_role"]).catch(() => {});
    setUser(null);
    setRole(null);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isLoading,
        isDemo,
        connectionStatus,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
