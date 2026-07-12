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
import { ENV } from "@/constants/env";
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

/**
 * DEMO MODE — active only when Supabase env vars are absent.
 *
 * Demo mode allows the app to run for local development without a Supabase
 * project. It is NOT a production fallback. If Supabase keys are set but
 * Supabase is unreachable, the real auth error is surfaced to the user.
 *
 * To disable demo mode: set EXPO_PUBLIC_SUPABASE_URL and
 * EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.
 */
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

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    if (ENV.IS_DEV) {
      console.warn("[PurePress] Supabase call failed:", e?.message ?? String(e));
    }
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

  const isDemo = !isSupabaseConfigured;

  useEffect(() => {
    let authSub: { unsubscribe: () => void } | null = null;

    const init = async () => {
      // ── Demo mode — no Supabase keys configured ────────────────────────
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

      // ── Supabase configured — restore session immediately ──────────────
      // Session lives in AsyncStorage (set by the Supabase client).
      // We restore without waiting for the probe so re-opens are instant.
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

      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        if (ENV.IS_DEV) {
          console.log("[PurePress] Auth state changed:", _event);
        }
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

      // Connection probe runs in the background — informational only.
      testSupabaseConnection().then((reachable) => {
        setConnectionStatus(reachable ? "connected" : "unreachable");
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
    if (isDemo) {
      const demoUser = makeDemoUser(fullName, email, selectedRole);
      setUser(demoUser);
      setRole(selectedRole);
      await AsyncStorage.setItem("demo_role", selectedRole);
      await AsyncStorage.setItem("demo_user", JSON.stringify(demoUser));
      return { error: null };
    }

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

    await safe(
      () => supabase.auth.updateUser({ data: { full_name: fullName, role: selectedRole } }),
      { data: { user: null as any }, error: null },
    );
    const finalUser = result.data.user;
    if (finalUser) setUser(finalUser);
    setRole(selectedRole);
    return { error: null };
  }, [isDemo]);

  // ── Sign in ────────────────────────────────────────────────────────────
  // Always tries real Supabase auth when configured.
  // Never silently falls to demo if keys are present.
  const signIn = useCallback(async (email: string, password: string) => {
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

    let result: { data: { user: User | null; session: Session | null }; error: { message: string } | null };
    try {
      result = await supabase.auth.signInWithPassword({ email, password });
    } catch (e: any) {
      const msg = e?.message ?? "Network request failed — check your internet connection.";
      if (ENV.IS_DEV) console.warn("[PurePress] signIn exception:", msg);
      return { error: msg };
    }

    if (result.error) {
      if (ENV.IS_DEV) console.warn("[PurePress] signIn error:", result.error.message);
      return { error: result.error.message };
    }

    if (result.data.user) {
      const r = (result.data.user.user_metadata?.role as UserRole) || "CUSTOMER";
      setRole(r);
    }
    return { error: null };
  }, [isDemo]);

  // ── Sign out ───────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (isSupabaseConfigured) {
      await safe(() => supabase.auth.signOut(), undefined);
    }
    await AsyncStorage.multiRemove(["demo_role", "demo_user"]).catch(() => {});
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
