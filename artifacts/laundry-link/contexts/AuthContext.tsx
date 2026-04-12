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

import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isLoading: boolean;
  isDemo: boolean;
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
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

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
        case "BUSINESS":
          router.replace("/(business)/");
          break;
        case "DISPATCHER":
          router.replace("/(dispatcher)/");
          break;
        case "ADMIN":
          router.replace("/(admin)/");
          break;
        default:
          router.replace("/(customer)/");
          break;
      }
    }
  }, [user, role, segments, isLoading]);
}

function createDemoUser(fullName: string, email: string, role: UserRole): User {
  return {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    email,
    app_metadata: {},
    user_metadata: { full_name: fullName, role },
    aud: "authenticated",
    created_at: new Date().toISOString(),
  } as User;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isDemo = !isSupabaseConfigured;

  useEffect(() => {
    const init = async () => {
      if (!isSupabaseConfigured) {
        const savedRole = await AsyncStorage.getItem("demo_role");
        const savedUser = await AsyncStorage.getItem("demo_user");
        if (savedRole && savedUser) {
          try {
            setUser(JSON.parse(savedUser));
            setRole(savedRole as UserRole);
          } catch {}
        }
        setIsLoading(false);
        return;
      }

      const { data: { session: s } } = await supabase.auth.getSession();
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const userRole =
          (s.user.user_metadata?.role as UserRole) || "CUSTOMER";
        setRole(userRole);
      }
      setIsLoading(false);
    };

    init();

    if (isSupabaseConfigured) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          const userRole =
            (s.user.user_metadata?.role as UserRole) || "CUSTOMER";
          setRole(userRole);
        } else {
          setRole(null);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  useProtectedRoute(user, role, isLoading);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      selectedRole: UserRole,
    ) => {
      if (!isSupabaseConfigured) {
        const demoUser = createDemoUser(fullName, email, selectedRole);
        setUser(demoUser);
        setRole(selectedRole);
        await AsyncStorage.setItem("demo_role", selectedRole);
        await AsyncStorage.setItem("demo_user", JSON.stringify(demoUser));
        return { error: null };
      }

      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: selectedRole,
          },
        },
      });
      if (!error) {
        const { error: updateError, data: updatedData } =
          await supabase.auth.updateUser({
            data: {
              full_name: fullName,
              role: selectedRole,
            },
          });

        if (updatedData.user) {
          setUser(updatedData.user);
        } else if (data.user) {
          setUser(data.user);
        }

        setRole(selectedRole);
        await AsyncStorage.setItem("user_role", selectedRole);

        if (
          updateError &&
          !updateError.message.toLowerCase().includes("session")
        ) {
          return { error: updateError.message };
        }
      }
      return { error: error?.message ?? null };
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isSupabaseConfigured) {
        const savedUser = await AsyncStorage.getItem("demo_user");
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            setUser(parsed);
            const savedRole = (parsed.user_metadata?.role as UserRole) || "CUSTOMER";
            setRole(savedRole);
            return { error: null };
          } catch {}
        }
        const demoUser = createDemoUser("Demo User", email, "CUSTOMER");
        setUser(demoUser);
        setRole("CUSTOMER");
        await AsyncStorage.setItem("demo_role", "CUSTOMER");
        await AsyncStorage.setItem("demo_user", JSON.stringify(demoUser));
        return { error: null };
      }

      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (!error && data.user) {
        const userRole =
          (data.user.user_metadata?.role as UserRole) || "CUSTOMER";
        setRole(userRole);
        await AsyncStorage.setItem("user_role", userRole);
      }
      return { error: error?.message ?? null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      await AsyncStorage.removeItem("demo_role");
      await AsyncStorage.removeItem("demo_user");
      setUser(null);
      setRole(null);
      return;
    }
    await supabase.auth.signOut();
    await AsyncStorage.removeItem("user_role");
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, role, isLoading, isDemo, signUp, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}
