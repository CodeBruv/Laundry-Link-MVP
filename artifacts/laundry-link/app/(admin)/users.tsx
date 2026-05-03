import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useOrders } from "@/contexts/OrdersContext";
import { useColors } from "@/hooks/useColors";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { UserRole } from "@/types";

const ROLE_COLOR: Record<string, string> = {
  CUSTOMER:   "#6366f1",
  DISPATCHER: "#10b981",
  BUSINESS:   "#8b5cf6",
  ADMIN:      "#ef4444",
};
const ROLE_ICON: Record<string, keyof typeof import("@expo/vector-icons").Feather.glyphMap> = {
  CUSTOMER:   "user",
  DISPATCHER: "truck",
  BUSINESS:   "briefcase",
  ADMIN:      "shield",
};

interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orderCount: number;
  lastOrderAt: string | null;
  suspended: boolean;
}

const FILTER_ROLES = ["ALL", "CUSTOMER", "DISPATCHER", "BUSINESS"] as const;
type FilterRole = typeof FILTER_ROLES[number];

export default function AdminUsers() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { orders, isLoading } = useOrders();
  const { isSuperAdmin } = useAdminAccess();

  const [filterRole, setFilterRole] = useState<FilterRole>("ALL");
  const [search, setSearch] = useState("");
  const [suspended, setSuspended] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("CUSTOMER");
  const [addLoading, setAddLoading] = useState(false);
  const [localUsers, setLocalUsers] = useState<UserSummary[]>([]);

  const derivedUsers = useMemo<UserSummary[]>(() => {
    const map = new Map<string, UserSummary>();
    for (const o of orders) {
      if (!map.has(o.customerId)) {
        map.set(o.customerId, {
          id: o.customerId,
          name: o.customerName,
          email: o.customerEmail ?? "—",
          role: "CUSTOMER",
          orderCount: 0,
          lastOrderAt: null,
          suspended: false,
        });
      }
      const u = map.get(o.customerId)!;
      u.orderCount++;
      if (!u.lastOrderAt || o.createdAt > u.lastOrderAt) u.lastOrderAt = o.createdAt;

      if (o.dispatcherId && o.assignedDriverName && !map.has(o.dispatcherId)) {
        map.set(o.dispatcherId, {
          id: o.dispatcherId,
          name: o.assignedDriverName,
          email: "rider@laundrylink.app",
          role: "DISPATCHER",
          orderCount: 0,
          lastOrderAt: null,
          suspended: false,
        });
      }
      if (o.dispatcherId && map.has(o.dispatcherId)) {
        const d = map.get(o.dispatcherId)!;
        d.orderCount++;
        if (!d.lastOrderAt || o.createdAt > d.lastOrderAt) d.lastOrderAt = o.createdAt;
      }
    }
    return Array.from(map.values());
  }, [orders]);

  const allUsers: UserSummary[] = useMemo(() => {
    const combined = [...derivedUsers, ...localUsers];
    return combined.map((u) => ({ ...u, suspended: suspended.has(u.id) }));
  }, [derivedUsers, localUsers, suspended]);

  const filtered = useMemo(() => {
    return allUsers.filter((u) => {
      if (filterRole !== "ALL" && u.role !== filterRole) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allUsers, filterRole, search]);

  const shadow = { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 };

  const toggleSuspend = (userId: string, name: string, isSuspended: boolean) => {
    const action = isSuspended ? "Unsuspend" : "Suspend";
    if (Platform.OS === "web") {
      setSuspended((prev) => {
        const next = new Set(prev);
        isSuspended ? next.delete(userId) : next.add(userId);
        return next;
      });
      return;
    }
    Alert.alert(`${action} User`, `Are you sure you want to ${action.toLowerCase()} ${name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: action,
        style: isSuspended ? "default" : "destructive",
        onPress: () => setSuspended((prev) => {
          const next = new Set(prev);
          isSuspended ? next.delete(userId) : next.add(userId);
          return next;
        }),
      },
    ]);
  };

  const handleDelete = (userId: string, name: string) => {
    if (Platform.OS === "web") {
      setLocalUsers((prev) => prev.filter((u) => u.id !== userId));
      return;
    }
    Alert.alert("Delete User", `Permanently delete ${name}? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => setLocalUsers((prev) => prev.filter((u) => u.id !== userId)),
      },
    ]);
  };

  const handleAddUser = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    setAddLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setLocalUsers((prev) => [...prev, {
      id: `local_${Date.now()}`,
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      orderCount: 0,
      lastOrderAt: null,
      suspended: false,
    }]);
    setNewName(""); setNewEmail(""); setNewRole("CUSTOMER");
    setAddLoading(false);
    setShowAddModal(false);
  };

  const counts = useMemo(() => ({
    total: allUsers.length,
    customers: allUsers.filter((u) => u.role === "CUSTOMER").length,
    dispatchers: allUsers.filter((u) => u.role === "DISPATCHER").length,
    suspended: allUsers.filter((u) => suspended.has(u.id)).length,
  }), [allUsers, suspended]);

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Platform Users</Text>
              <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
                {counts.total} total · {counts.customers} customers · {counts.dispatchers} dispatchers
                {counts.suspended > 0 ? ` · ${counts.suspended} suspended` : ""}
              </Text>
            </View>
            {isSuperAdmin && (
              <Pressable
                onPress={() => setShowAddModal(true)}
                style={[styles.addBtn, { backgroundColor: colors.accent, borderRadius: colors.radius }]}
              >
                <Feather name="user-plus" size={15} color="#ffffff" />
                <Text style={styles.addBtnText}>Add User</Text>
              </Pressable>
            )}
          </View>

          {/* Search */}
          <View style={[styles.searchWrap, { borderColor: colors.input, borderRadius: colors.radius }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or email…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          {/* Filter chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {FILTER_ROLES.map((r) => (
              <Pressable
                key={r}
                onPress={() => setFilterRole(r)}
                style={[
                  styles.chip,
                  filterRole === r
                    ? { backgroundColor: colors.primary, borderColor: colors.primary }
                    : { backgroundColor: "transparent", borderColor: colors.border },
                ]}
              >
                <Text style={[styles.chipText, { color: filterRole === r ? "#ffffff" : colors.mutedForeground }]}>
                  {r === "ALL" ? `All (${counts.total})` : r}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={{ padding: 16, gap: 10 }}>
          {isLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
          ) : filtered.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
              <Feather name="users" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Users Found</Text>
              <Text style={[styles.emptyMsg, { color: colors.mutedForeground }]}>
                {search ? "Try a different search term." : "Users who place or fulfill orders appear here."}
              </Text>
            </View>
          ) : (
            filtered.map((u) => {
              const roleColor = ROLE_COLOR[u.role] ?? colors.primary;
              const isSusp = u.suspended;
              return (
                <View
                  key={u.id}
                  style={[styles.userCard, { backgroundColor: colors.card, borderRadius: colors.radius, opacity: isSusp ? 0.65 : 1 }, shadow]}
                >
                  <View style={styles.cardTop}>
                    <View style={[styles.avatar, { backgroundColor: roleColor + "18" }]}>
                      <Feather name={ROLE_ICON[u.role] ?? "user"} size={20} color={roleColor} />
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.userName, { color: colors.foreground }]}>{u.name}</Text>
                        {isSusp && (
                          <View style={styles.suspBadge}>
                            <Text style={styles.suspText}>SUSPENDED</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{u.email}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: roleColor + "14" }]}>
                      <Text style={[styles.roleText, { color: roleColor }]}>{u.role}</Text>
                    </View>
                  </View>

                  <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                    <View style={styles.metaItem}>
                      <Feather name="package" size={12} color={colors.mutedForeground} />
                      <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{u.orderCount} orders</Text>
                    </View>
                    {u.lastOrderAt && (
                      <View style={styles.metaItem}>
                        <Feather name="clock" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                          {new Date(u.lastOrderAt).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    {/* Actions — super admin only */}
                    {isSuperAdmin && (
                      <View style={styles.actions}>
                        <Pressable
                          onPress={() => toggleSuspend(u.id, u.name, isSusp)}
                          style={[styles.actionBtn, { backgroundColor: isSusp ? "#05966914" : "#f59e0b14" }]}
                        >
                          <Feather name={isSusp ? "user-check" : "user-x"} size={13} color={isSusp ? "#059669" : "#f59e0b"} />
                          <Text style={[styles.actionText, { color: isSusp ? "#059669" : "#f59e0b" }]}>
                            {isSusp ? "Unsuspend" : "Suspend"}
                          </Text>
                        </Pressable>
                        {u.id.startsWith("local_") && (
                          <Pressable
                            onPress={() => handleDelete(u.id, u.name)}
                            style={[styles.actionBtn, { backgroundColor: "#ef444414" }]}
                          >
                            <Feather name="trash-2" size={13} color="#ef4444" />
                            <Text style={[styles.actionText, { color: "#ef4444" }]}>Delete</Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add User Modal */}
      {isSuperAdmin && (
        <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowAddModal(false)}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Add New User</Text>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={12}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Full Name</Text>
                <View style={[styles.inputWrap, { borderColor: colors.input, borderRadius: colors.radius }]}>
                  <Feather name="user" size={16} color={colors.mutedForeground} />
                  <TextInput
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Enter full name"
                    placeholderTextColor={colors.mutedForeground}
                    style={[styles.input, { color: colors.foreground }]}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Email Address</Text>
                <View style={[styles.inputWrap, { borderColor: colors.input, borderRadius: colors.radius }]}>
                  <Feather name="mail" size={16} color={colors.mutedForeground} />
                  <TextInput
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="user@example.com"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={[styles.input, { color: colors.foreground }]}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.foreground }]}>Role</Text>
                <View style={styles.roleGrid}>
                  {(["CUSTOMER","DISPATCHER","BUSINESS","ADMIN"] as UserRole[]).map((r) => (
                    <Pressable
                      key={r}
                      onPress={() => setNewRole(r)}
                      style={[
                        styles.roleOption,
                        {
                          borderRadius: colors.radius,
                          borderColor: newRole === r ? (ROLE_COLOR[r] ?? colors.primary) : colors.border,
                          backgroundColor: newRole === r ? (ROLE_COLOR[r] ?? colors.primary) + "12" : "transparent",
                        },
                      ]}
                    >
                      <Feather name={ROLE_ICON[r] ?? "user"} size={16} color={newRole === r ? (ROLE_COLOR[r] ?? colors.primary) : colors.mutedForeground} />
                      <Text style={[styles.roleOptionText, { color: newRole === r ? (ROLE_COLOR[r] ?? colors.primary) : colors.mutedForeground }]}>
                        {r}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable
                onPress={handleAddUser}
                disabled={addLoading || !newName.trim() || !newEmail.trim()}
                style={[styles.submitBtn, { backgroundColor: colors.accent, borderRadius: colors.radius, opacity: (!newName.trim() || !newEmail.trim()) ? 0.5 : 1 }]}
              >
                {addLoading ? <ActivityIndicator color="#ffffff" /> : (
                  <>
                    <Feather name="user-plus" size={16} color="#ffffff" />
                    <Text style={styles.submitText}>Create User</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12, borderBottomWidth: 1 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  pageTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 3 },
  pageSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 10 },
  addBtnText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#ffffff" },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  chips: { flexGrow: 0 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  emptyCard: { alignItems: "center", padding: 48, gap: 12, margin: 4 },
  emptyTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyMsg: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  userCard: { overflow: "hidden" },
  cardTop: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  userName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  suspBadge: { backgroundColor: "#ef444418", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  suspText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#ef4444" },
  userEmail: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  roleText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  cardFooter: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderTopWidth: 1 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", gap: 8, marginLeft: "auto" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  actionText: { fontSize: 11, fontFamily: "Inter_700Bold" },
  sheet: { flex: 1 },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontFamily: "Inter_500Medium" },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  roleOption: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, minWidth: "46%" },
  roleOptionText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15, marginTop: 8 },
  submitText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#ffffff" },
});
