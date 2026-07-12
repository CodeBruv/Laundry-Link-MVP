import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";
import { ENV, IS_DEVELOPMENT } from "@/constants/env";

const SUPER_SESSION_KEY = "admin_super_session";

/**
 * Super Admin passphrase source priority:
 *   1. EXPO_PUBLIC_ADMIN_PASSPHRASE environment variable (production)
 *   2. Disabled — returns empty string if env var is not set
 *
 * In production, passphrase-based elevation should be REPLACED by setting
 * `user_metadata.admin_tier = "SUPER"` directly in the Supabase dashboard.
 *
 * See: TASK-SEC-01 in laundry-link-v1-backlog.md
 */
function resolvePassphrase(): string {
  if (ENV.ADMIN_PASSPHRASE) return ENV.ADMIN_PASSPHRASE;
  if (IS_DEVELOPMENT) {
    console.warn(
      "[PurePress] EXPO_PUBLIC_ADMIN_PASSPHRASE is not set. " +
        "Passphrase-based Super Admin unlock is disabled. " +
        "Set user_metadata.admin_tier = \"SUPER\" in Supabase dashboard instead.",
    );
  }
  return "";
}

export type AdminTier = "SUPER" | "STAFF";

export interface AdminAccess {
  isSuperAdmin: boolean;
  adminTier: AdminTier;
  unlockSuper: (passphrase: string) => Promise<boolean>;
  revokeSuper: () => Promise<void>;
}

export function useAdminAccess(): AdminAccess {
  const { user } = useAuth();
  const [sessionSuper, setSessionSuper] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SUPER_SESSION_KEY)
      .then((val) => {
        if (val === "1") setSessionSuper(true);
      })
      .catch(() => {});
  }, []);

  const isMetaSuper = user?.user_metadata?.admin_tier === "SUPER";
  const isSuperAdmin = isMetaSuper || sessionSuper;

  const unlockSuper = useCallback(async (passphrase: string): Promise<boolean> => {
    const expected = resolvePassphrase();
    if (!expected) return false;
    if (passphrase.trim().toUpperCase() === expected.trim().toUpperCase()) {
      await AsyncStorage.setItem(SUPER_SESSION_KEY, "1");
      setSessionSuper(true);
      return true;
    }
    return false;
  }, []);

  const revokeSuper = useCallback(async () => {
    await AsyncStorage.removeItem(SUPER_SESSION_KEY);
    setSessionSuper(false);
  }, []);

  return {
    isSuperAdmin,
    adminTier: isSuperAdmin ? "SUPER" : "STAFF",
    unlockSuper,
    revokeSuper,
  };
}
