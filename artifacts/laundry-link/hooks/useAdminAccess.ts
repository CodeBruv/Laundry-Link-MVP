import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/contexts/AuthContext";

const SUPER_PASSPHRASE = "MAFIA CODE BRUV";
const SUPER_SESSION_KEY = "admin_super_session";

// Emails that are always Super Admin regardless of session code
const HARDCODED_SUPER_EMAILS: string[] = [];

export type AdminTier = "SUPER" | "STAFF";

export interface AdminAccess {
  isSuperAdmin: boolean;
  adminTier: AdminTier;
  /** Attempt to unlock Super Admin via passphrase. Returns true on success. */
  unlockSuper: (passphrase: string) => Promise<boolean>;
  /** Revoke the current Super Admin session. */
  revokeSuper: () => Promise<void>;
}

export function useAdminAccess(): AdminAccess {
  const { user } = useAuth();
  const [sessionSuper, setSessionSuper] = useState(false);

  // Restore persisted super-session on mount
  useEffect(() => {
    AsyncStorage.getItem(SUPER_SESSION_KEY)
      .then((val) => { if (val === "1") setSessionSuper(true); })
      .catch(() => {});
  }, []);

  const isMetaSuper = user?.user_metadata?.admin_tier === "SUPER";
  const isEmailSuper = HARDCODED_SUPER_EMAILS.includes(user?.email ?? "");
  const isSuperAdmin = isMetaSuper || isEmailSuper || sessionSuper;

  const unlockSuper = useCallback(async (passphrase: string): Promise<boolean> => {
    if (passphrase.trim().toUpperCase() === SUPER_PASSPHRASE) {
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
