import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Platform } from "react-native";

const PROBE_URL = "https://clients3.google.com/generate_204";
const PROBE_INTERVAL = 15_000;

async function checkConnectivity(): Promise<boolean> {
  if (Platform.OS === "web") {
    return navigator.onLine;
  }
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(PROBE_URL, { method: "HEAD", signal: ctrl.signal, cache: "no-store" });
    clearTimeout(id);
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const probe = useCallback(async () => {
    setIsChecking(true);
    const online = await checkConnectivity();
    setIsOnline(online);
    setIsChecking(false);
  }, []);

  useEffect(() => {
    probe();

    timerRef.current = setInterval(probe, PROBE_INTERVAL);

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") probe();
    });

    if (Platform.OS === "web") {
      const goOnline = () => setIsOnline(true);
      const goOffline = () => setIsOnline(false);
      window.addEventListener("online", goOnline);
      window.addEventListener("offline", goOffline);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        sub.remove();
        window.removeEventListener("online", goOnline);
        window.removeEventListener("offline", goOffline);
      };
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      sub.remove();
    };
  }, [probe]);

  return { isOnline, isChecking };
}
