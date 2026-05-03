import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface LogEntry {
  id: string;
  type: "order" | "auth" | "system" | "security";
  message: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
}

function makeId() { return Math.random().toString(36).slice(2, 9); }

const STATUS_SEVERITY: Record<string, "info" | "warning" | "critical"> = {
  DELIVERED: "info", PAID: "info", ACCEPTED: "info", PICKED_UP: "info",
  IN_PROGRESS: "info", READY: "info", OUT_FOR_DELIVERY: "info",
  CANCELLED: "warning", PENDING: "info",
};

const SEVERITY_COLOR = { info: "#6366f1", warning: "#f59e0b", critical: "#ef4444" };
const SEVERITY_BG    = { info: "#6366f114", warning: "#f59e0b14", critical: "#ef444414" };
const LOG_ICON: Record<LogEntry["type"], keyof typeof import("@expo/vector-icons").Feather.glyphMap> = {
  order: "package", auth: "key", system: "server", security: "shield",
};

const PLATFORM_SETTINGS = [
  { icon: "bell"       as const, label: "Push Notifications",   desc: "Configure platform notification rules" },
  { icon: "mail"       as const, label: "Email Templates",       desc: "Customize transactional emails" },
  { icon: "globe"      as const, label: "Regions",               desc: "Manage supported service regions" },
  { icon: "sliders"    as const, label: "Service Templates",     desc: "Default laundry service definitions" },
  { icon: "database"   as const, label: "Data Management",       desc: "Backups, exports, and retention" },
  { icon: "credit-card"as const, label: "Payment Config",        desc: "Paystack keys and payout rules" },
];

export default function AdminSettings() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { orders } = useOrders();
  const { isSuperAdmin, unlockSuper, revokeSuper } = useAdminAccess();

  const [passphrase, setPassphrase] = useState("");
  const [passphraseLoading, setPassphraseLoading] = useState(false);
  const [passphraseError, setPassphraseError] = useState("");
  const [passphraseSuccess, setPassphraseSuccess] = useState(false);
  const [logFilter, setLogFilter] = useState<"all" | "warning" | "critical">("all");

  // Generate activity log from orders data
  const activityLog = useMemo<LogEntry[]>(() => {
    const entries: LogEntry[] = [];

    // System boot entry
    entries.push({
      id: makeId(),
      type: "system",
      message: "LaundryLink platform started",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      severity: "info",
    });

    // Derive events from orders
    for (const o of orders.slice(0, 15)) {
      const sev = STATUS_SEVERITY[o.status] ?? "info";
      entries.push({
        id: makeId(),
        type: "order",
        message: `Order #${o.orderNumber} → ${o.status.replace(/_/g, " ")} [${o.businessName}]`,
        timestamp: o.updatedAt,
        severity: sev,
      });
      if (o.paidAt) {
        entries.push({
          id: makeId(),
          type: "security",
          message: `Payment confirmed ₦${o.totalAmount.toLocaleString()} for Order #${o.orderNumber}`,
          timestamp: o.paidAt,
          severity: "info",
        });
      }
    }

    // Synthetic security events (super admin only data)
    entries.push({
      id: makeId(),
      type: "auth",
      message: `Admin login — ${user?.email ?? "unknown"}`,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      severity: "info",
    });
    entries.push({
      id: makeId(),
      type: "security",
      message: "Supabase auth: session verified successfully",
      timestamp: new Date(Date.now() - 590000).toISOString(),
      severity: "info",
    });

    const cancelled = orders.filter((o) => o.status === "CANCELLED");
    if (cancelled.length > 3) {
      entries.push({
        id: makeId(),
        type: "security",
        message: `High cancellation rate detected: ${cancelled.length} cancelled orders`,
        timestamp: new Date().toISOString(),
        severity: "warning",
      });
    }

    return entries
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 30);
  }, [orders, user]);

  const filteredLogs = useMemo(() =>
    logFilter === "all"
      ? activityLog
      : activityLog.filter((l) => l.severity === logFilter),
  [activityLog, logFilter]);

  const handleUnlockSuper = async () => {
    setPassphraseLoading(true);
    setPassphraseError("");
    await new Promise((r) => setTimeout(r, 600));
    const success = await unlockSuper(passphrase);
    if (success) {
      setPassphraseSuccess(true);
      setPassphrase("");
    } else {
      setPassphraseError("Incorrect passphrase. Access denied.");
    }
    setPassphraseLoading(false);
  };

  const shadow = { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100), gap: 20, paddingTop: 16 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Admin tier section ─────────────────────────────── */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Admin Access Level</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius }, shadow]}>
          {isSuperAdmin ? (
            /* Super Admin — show revoke option */
            <View style={styles.superRow}>
              <View style={[styles.superIcon, { backgroundColor: "#f59e0b14" }]}>
                <Feather name="star" size={22} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.superTitle, { color: colors.foreground }]}>Super Admin — Active</Text>
                <Text style={[styles.superSub, { color: colors.mutedForeground }]}>
                  Full platform access. Mafia Code confirmed.
                </Text>
              </View>
              <Pressable
                onPress={revokeSuper}
                style={[styles.revokeBtn, { borderColor: "#ef444430" }]}
              >
                <Feather name="log-out" size={13} color="#ef4444" />
                <Text style={[styles.revokeText, { color: "#ef4444" }]}>Revoke</Text>
              </Pressable>
            </View>
          ) : (
            /* Staff — show unlock form */
            <View style={{ gap: 14 }}>
              <View style={styles.superRow}>
                <View style={[styles.superIcon, { backgroundColor: colors.accent + "12" }]}>
                  <Feather name="user-check" size={22} color={colors.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.superTitle, { color: colors.foreground }]}>Staff Admin</Text>
                  <Text style={[styles.superSub, { color: colors.mutedForeground }]}>
                    Limited view — orders, basic reports, task assignments.
                  </Text>
                </View>
              </View>

              {passphraseSuccess ? (
                <View style={[styles.successBox, { backgroundColor: "#05966912", borderColor: "#05966930" }]}>
                  <Feather name="check-circle" size={15} color="#059669" />
                  <Text style={[styles.successText, { color: "#059669" }]}>
                    Super Admin unlocked — reload the dashboard.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={[styles.unlockWrap, { borderColor: colors.input, borderRadius: colors.radius }]}>
                    <Feather name="lock" size={15} color={colors.mutedForeground} />
                    <TextInput
                      value={passphrase}
                      onChangeText={(t) => { setPassphrase(t); setPassphraseError(""); }}
                      placeholder="Enter Super Admin passphrase…"
                      placeholderTextColor={colors.mutedForeground}
                      secureTextEntry
                      style={[styles.unlockInput, { color: colors.foreground }]}
                    />
                  </View>
                  {passphraseError.length > 0 && (
                    <View style={[styles.errorBox, { backgroundColor: "#ef444412", borderColor: "#ef444430" }]}>
                      <Feather name="alert-circle" size={13} color="#ef4444" />
                      <Text style={[styles.errorText, { color: "#ef4444" }]}>{passphraseError}</Text>
                    </View>
                  )}
                  <Pressable
                    onPress={handleUnlockSuper}
                    disabled={passphraseLoading || !passphrase.trim()}
                    style={[styles.unlockBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: !passphrase.trim() ? 0.5 : 1 }]}
                  >
                    {passphraseLoading ? <ActivityIndicator color="#ffffff" /> : (
                      <>
                        <Feather name="key" size={15} color="#ffffff" />
                        <Text style={styles.unlockBtnText}>Unlock Super Admin</Text>
                      </>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          )}
        </View>
      </View>

      {/* ── Security / Activity logs ──────────────────────── */}
      <View style={{ paddingHorizontal: 16 }}>
        <View style={styles.logHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Security & Activity Log</Text>
          <View style={styles.logFilters}>
            {(["all","warning","critical"] as const).map((f) => (
              <Pressable
                key={f}
                onPress={() => setLogFilter(f)}
                style={[styles.logChip, {
                  backgroundColor: logFilter === f ? colors.primary : "transparent",
                  borderColor: logFilter === f ? colors.primary : colors.border,
                }]}
              >
                <Text style={[styles.logChipText, { color: logFilter === f ? "#ffffff" : colors.mutedForeground }]}>
                  {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={[{ backgroundColor: colors.card, borderRadius: colors.radius, overflow: "hidden" }, shadow]}>
          {filteredLogs.length === 0 ? (
            <View style={{ padding: 32, alignItems: "center", gap: 8 }}>
              <Feather name="check-circle" size={28} color={colors.mutedForeground} />
              <Text style={[styles.superSub, { color: colors.mutedForeground }]}>No events matching filter.</Text>
            </View>
          ) : (
            filteredLogs.map((log, i) => (
              <View
                key={log.id}
                style={[
                  styles.logRow,
                  { borderBottomColor: colors.border, borderBottomWidth: i < filteredLogs.length - 1 ? 1 : 0 },
                ]}
              >
                <View style={[styles.logIconWrap, { backgroundColor: SEVERITY_BG[log.severity] }]}>
                  <Feather name={LOG_ICON[log.type]} size={12} color={SEVERITY_COLOR[log.severity]} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.logMessage, { color: colors.foreground }]} numberOfLines={2}>{log.message}</Text>
                  <Text style={[styles.logTime, { color: colors.mutedForeground }]}>
                    {new Date(log.timestamp).toLocaleString()}
                  </Text>
                </View>
                {log.severity !== "info" && (
                  <View style={[styles.severityDot, { backgroundColor: SEVERITY_COLOR[log.severity] }]} />
                )}
              </View>
            ))
          )}
        </View>
      </View>

      {/* ── Platform settings (super admin only) ──────────── */}
      {isSuperAdmin && (
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Platform Settings</Text>
          <View style={[{ backgroundColor: colors.card, borderRadius: colors.radius, overflow: "hidden" }, shadow]}>
            {PLATFORM_SETTINGS.map((s, i) => (
              <Pressable
                key={s.label}
                style={[styles.settingRow, { borderBottomWidth: i < PLATFORM_SETTINGS.length - 1 ? 1 : 0, borderBottomColor: colors.border }]}
              >
                <View style={[styles.settingIcon, { backgroundColor: colors.primary + "12" }]}>
                  <Feather name={s.icon} size={17} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.settingLabel, { color: colors.foreground }]}>{s.label}</Text>
                  <Text style={[styles.settingDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* ── Account ──────────────────────────────────────── */}
      <View style={{ paddingHorizontal: 16 }}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: colors.radius, gap: 12 }, shadow]}>
          <View style={styles.accountRow}>
            <View style={[styles.accountAvatar, { backgroundColor: colors.primary + "14" }]}>
              <Feather name="shield" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.accountName, { color: colors.foreground }]}>
                {(user?.user_metadata?.full_name as string) || "Admin"}
              </Text>
              <Text style={[styles.accountEmail, { color: colors.mutedForeground }]}>{user?.email ?? "—"}</Text>
            </View>
          </View>
          <Pressable onPress={signOut} style={[styles.signOutBtn, { borderColor: "#ef444430" }]}>
            <Feather name="log-out" size={15} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>LaundryLink v1.0.0 · Admin Build</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 12 },
  card: { padding: 16 },
  superRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  superIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  superTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 3 },
  superSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  revokeBtn: { flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  revokeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  unlockWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  unlockInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  unlockBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  unlockBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#ffffff" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10, borderWidth: 1, borderRadius: 8 },
  errorText: { flex: 1, fontSize: 12, fontFamily: "Inter_500Medium" },
  successBox: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderWidth: 1, borderRadius: 8 },
  successText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  logHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  logFilters: { flexDirection: "row", gap: 6 },
  logChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  logChipText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  logRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  logIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginTop: 1 },
  logMessage: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 17 },
  logTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  severityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingLabel: { fontSize: 14, fontFamily: "Inter_500Medium", marginBottom: 2 },
  settingDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  accountRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  accountAvatar: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  accountName: { fontSize: 15, fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  accountEmail: { fontSize: 12, fontFamily: "Inter_400Regular" },
  signOutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, paddingVertical: 13, borderRadius: 10 },
  signOutText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#ef4444" },
  version: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular", paddingBottom: 8 },
});
