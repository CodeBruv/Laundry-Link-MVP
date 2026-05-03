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
  signInDemo: (fullName: string, role: UserRole) => Promise<void>;
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
  signInDemo: async () => {},
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
    id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    email,
    app_metadata: {},
    user_metadata: { full_name: fullName, role },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

// Wraps a Supabase call — converts any thrown error to { error: string }
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e: any) {
    console.log("[LaundryLink] Supabase error (caught):", e?.message ?? e);
    return fallback;
  }
}

// ── Provider ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [session, setSession]     = useState<Session | null>(null);
  const [role, setRole]           = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    isSupabaseConfigured ? "checking" : "unconfigured",
  );

  // isDemo = anything other than a confirmed live Supabase connection
  const isDemo = connectionStatus !== "connected";

  useEffect(() => {
    let authSub: { unsubscribe: () => void } | null = null;

    const init = async () => {
      // Restore any previously persisted demo session (instant, no network)
      const [savedUser, savedRole] = await Promise.all([
        AsyncStorage.getItem("demo_user").catch(() => null),
        AsyncStorage.getItem("demo_role").catch(() => null),
      ]);

      // ── No keys configured → demo immediately ─────────────────────────
      if (!isSupabaseConfigured) {
        setConnectionStatus("unconfigured");
        if (savedUser && savedRole) {
          try {
            setUser(JSON.parse(savedUser));
            setRole(savedRole as UserRole);
          } catch {}
        }
        setIsLoading(false);
        return;
      }

      // ── Keys present → probe the server before making any auth calls ───
      // testSupabaseConnection() uses plain fetch (not the Supabase client)
      // so no GoTrueClient network requests happen before this resolves.
      const reachable = await testSupabaseConnection();

      if (!reachable) {
        setConnectionStatus("unreachable");
        if (savedUser && savedRole) {
          try {
            setUser(JSON.parse(savedUser));
            setRole(savedRole as UserRole);
          } catch {}
        }
        setIsLoading(false);
        return;
      }

      // ── Server is reachable → activate auto-refresh and restore session ─
      setConnectionStatus("connected");

      // Enable background token refresh now that we know the server is up.
      // This avoids the "multiple GoTrueClient instances" warning because
      // we reuse the single supabase client created in lib/supabase.ts.
      try { supabase.auth.startAutoRefresh(); } catch {}

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

      // Register auth state listener ONLY after connection is confirmed.
      // This prevents Supabase from firing network requests during the
      // connection-check phase.
      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
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
    };

    init();
    return () => { authSub?.unsubscribe(); };
  }, []);

  useProtectedRoute(user, role, isLoading);

  // ── Demo sign-in (role buttons on login screen) ────────────────────────
  const signInDemo = useCallback(async (fullName: string, demoRole: UserRole) => {
    const demoUser = makeDemoUser(
      fullName,
      `${demoRole.toLowerCase()}@demo.local`,
      demoRole,
    );
    setUser(demoUser);
    setRole(demoRole);
    await AsyncStorage.setItem("demo_role", demoRole);
    await AsyncStorage.setItem("demo_user", JSON.stringify(demoUser));
  }, []);

  // ── Sign up ────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (
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
          error: { message: "Network error — please check your connection." } as any,
        },
      );
      if (result.error) return { error: result.error.message };

      const updateResult = await safe(
        () =>
          supabase.auth.updateUser({
            data: { full_name: fullName, role: selectedRole },
          }),
        { data: { user: null as any }, error: null },
      );
      const finalUser = updateResult.data.user ?? result.data.user;
      if (finalUser) setUser(finalUser);
      setRole(selectedRole);
      await AsyncStorage.setItem("user_role", selectedRole);
      return { error: null };
    },
    [isDemo],
  );

  // ── Sign in ────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string) => {
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

      const result = await safe(
        () => supabase.auth.signInWithPassword({ email, password }),
        {
          data: { user: null, session: null },
          error: { message: "Network error — please check your connection." } as any,
        },
      );
      if (result.error) return { error: result.error.message };
      if (result.data.user) {
        const r = (result.data.user.user_metadata?.role as UserRole) || "CUSTOMER";
        setRole(r);
        await AsyncStorage.setItem("user_role", r);
      }
      return { error: null };
    },
    [isDemo],
  );

  // ── Sign out ───────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (!isDemo) {
      await safe(() => supabase.auth.signOut(), undefined);
      try { supabase.auth.stopAutoRefresh(); } catch {}
    }
    await AsyncStorage.multiRemove(["demo_role", "demo_user", "user_role"]).catch(
      () => {},
    );
    setUser(null);
    setRole(null);
    setSession(null);
  }, [isDemo]);

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
        signInDemo,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
