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
import {
  OWNER_DISPLAY,
  OWNER_EMAIL,
  OWNER_SESSION_KEY,
  OWNER_SESSION_VAL,
  isOwnerEmail,
  verifyOwnerPassword,
} from "@/lib/ownerAuth";
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
  signInDemo: (fullName: string, role: UserRole) => Promise<void>;
  /** Hidden quick-access: activates the owner Super Admin session. */
  signInAsOwner: () => Promise<void>;
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
  signInAsOwner: async () => {},
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

/**
 * Creates the owner User object.
 * Includes admin_tier: "SUPER" so useAdminAccess() recognises full access
 * without requiring the passphrase to be entered again.
 */
function makeOwnerUser(): User {
  return {
    id: "owner_codebruv",
    email: OWNER_EMAIL,
    app_metadata: { provider: "local" },
    user_metadata: {
      full_name: OWNER_DISPLAY,
      role: "ADMIN" as UserRole,
      admin_tier: "SUPER",
    },
    aud: "authenticated",
    created_at: "2024-01-01T00:00:00.000Z",
  } as User;
}

async function persistOwnerSession() {
  const ownerUser = makeOwnerUser();
  await Promise.all([
    AsyncStorage.setItem("demo_user", JSON.stringify(ownerUser)),
    AsyncStorage.setItem("demo_role", "ADMIN"),
    // Mark Super Admin active for useAdminAccess()
    AsyncStorage.setItem(OWNER_SESSION_KEY, OWNER_SESSION_VAL),
    AsyncStorage.setItem("admin_super_session", "1"),
  ]);
  return ownerUser;
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

  const isDemo = !isSupabaseConfigured;

  useEffect(() => {
    let authSub: { unsubscribe: () => void } | null = null;

    const init = async () => {
      // ── Check for persisted owner session first (highest priority) ─────
      const ownerActive = await AsyncStorage.getItem(OWNER_SESSION_KEY).catch(() => null);
      if (ownerActive === OWNER_SESSION_VAL) {
        const ownerUser = makeOwnerUser();
        setUser(ownerUser);
        setRole("ADMIN");
        setIsLoading(false);
        // Still run probe for banner status
        if (isSupabaseConfigured) {
          testSupabaseConnection().then((ok) => {
            setConnectionStatus(ok ? "connected" : "unreachable");
          });
        } else {
          setConnectionStatus("unconfigured");
        }
        return;
      }

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

      // ── Keys present → restore Supabase session immediately ───────────
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

      testSupabaseConnection().then((reachable) => {
        setConnectionStatus(reachable ? "connected" : "unreachable");
        console.log(`[LaundryLink] Connection status → ${reachable ? "connected" : "unreachable"}`);
      });
    };

    init();
    return () => { authSub?.unsubscribe(); };
  }, []);

  useProtectedRoute(user, role, isLoading);

  // ── Demo sign-in ───────────────────────────────────────────────────────
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

  // ── Owner quick-access (hidden trigger — no password path) ─────────────
  // This is the long-press activation path. It bypasses password entry
  // because the trigger itself (gesture + location) is the auth factor.
  // The owner session is persisted so it survives app restarts.
  const signInAsOwner = useCallback(async () => {
    console.log("[LaundryLink] Owner session activated");
    const ownerUser = await persistOwnerSession();
    setUser(ownerUser);
    setRole("ADMIN");
  }, []);

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
    await AsyncStorage.setItem("user_role", selectedRole);
    return { error: null };
  }, [isDemo]);

  // ── Sign in ────────────────────────────────────────────────────────────
  const signIn = useCallback(async (email: string, password: string) => {
    // ── Owner account intercept ─────────────────────────────────────────
    // The owner email uses a non-existent domain so Supabase will never
    // have this account. We validate against the stored digest instead.
    if (isOwnerEmail(email)) {
      const valid = await verifyOwnerPassword(password);
      if (!valid) {
        console.log("[LaundryLink] Owner login: invalid credentials");
        return { error: "Invalid email or password." };
      }
      console.log("[LaundryLink] Owner login: credentials verified ✓");
      const ownerUser = await persistOwnerSession();
      setUser(ownerUser);
      setRole("ADMIN");
      return { error: null };
    }

    // ── Pure demo mode ─────────────────────────────────────────────────
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

    // ── Real Supabase auth ─────────────────────────────────────────────
    console.log("[LaundryLink] signIn → supabase.auth.signInWithPassword");
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
    // Clear owner session markers first
    await AsyncStorage.multiRemove([
      OWNER_SESSION_KEY,
      "admin_super_session",
    ]).catch(() => {});

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
        signInDemo,
        signInAsOwner,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
