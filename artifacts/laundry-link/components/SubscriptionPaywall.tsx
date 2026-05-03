import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSubscription } from "@/contexts/SubscriptionContext";
import { useColors } from "@/hooks/useColors";
import { SUBSCRIPTION_PLANS, daysLeft } from "@/lib/subscription";
import { SubscriptionTier } from "@/types";

interface Props {
  onClose?: () => void;
  onSuccess?: () => void;
}

export function SubscriptionPaywall({ onClose, onSuccess }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { subscription, isSubscribed, beginTrial, purchasePlan, cancel } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>("PRO");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"trial" | "pay">("trial");

  const handleTrial = async () => {
    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await beginTrial(selectedTier);
    setLoading(false);
    onSuccess?.();
  };

  const handleSubscribe = async () => {
    setLoading(true);
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await purchasePlan(selectedTier);
    setLoading(false);
    onSuccess?.();
  };

  const handleCancel = async () => {
    setLoading(true);
    await cancel();
    setLoading(false);
  };

  const selectedPlan = SUBSCRIPTION_PLANS.find((p) => p.id === selectedTier)!;

  // Active subscription view
  if (isSubscribed) {
    const days = daysLeft(subscription);
    const plan = SUBSCRIPTION_PLANS.find((p) => p.id === subscription.tier);
    return (
      <ScrollView
        contentContainerStyle={[styles.activeContainer, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.activeBadge, { backgroundColor: "#05966912", borderRadius: colors.radius }]}>
          <Feather name="check-circle" size={36} color="#059669" />
          <Text style={[styles.activeTitle, { color: "#059669" }]}>
            {subscription.isTrial ? "Free Trial Active" : "Subscription Active"}
          </Text>
          <Text style={[styles.activePlan, { color: colors.primary }]}>{plan?.name} Plan</Text>
          <View style={[styles.daysChip, { backgroundColor: colors.primary + "18" }]}>
            <Feather name="clock" size={13} color={colors.primary} />
            <Text style={[styles.daysText, { color: colors.primary }]}>
              {days} day{days !== 1 ? "s" : ""} remaining
            </Text>
          </View>
        </View>

        {/* Upgrade options (if on trial or Starter) */}
        {(subscription.isTrial || subscription.tier === "STARTER") && (
          <View style={[styles.upgradeCard, { backgroundColor: colors.primary + "0c", borderRadius: colors.radius, borderColor: colors.primary + "20" }]}>
            <Text style={[styles.upgradeTitle, { color: colors.foreground }]}>Upgrade your plan</Text>
            {SUBSCRIPTION_PLANS.filter((p) => p.id !== "STARTER").map((plan) => (
              <Pressable
                key={plan.id}
                onPress={() => setSelectedTier(plan.id as SubscriptionTier)}
                style={[styles.upgradePlanRow, { borderColor: selectedTier === plan.id ? colors.primary : colors.border }]}
              >
                <View style={styles.upgradePlanInfo}>
                  <Text style={[styles.upgradePlanName, { color: colors.foreground }]}>{plan.name}</Text>
                  <Text style={[styles.upgradePlanPrice, { color: colors.primary }]}>{plan.displayPrice}/mo</Text>
                </View>
                {selectedTier === plan.id && <Feather name="check-circle" size={18} color={colors.primary} />}
              </Pressable>
            ))}
            <Pressable
              onPress={handleSubscribe}
              disabled={loading}
              style={[styles.upgradeBtn, { backgroundColor: colors.primary, borderRadius: colors.radius }]}
            >
              {loading ? <ActivityIndicator color={colors.primaryForeground} /> : (
                <Text style={[styles.upgradeBtnText, { color: colors.primaryForeground }]}>
                  Upgrade to {SUBSCRIPTION_PLANS.find((p) => p.id === selectedTier)?.name}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        <View style={[styles.featureCard, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Your plan features</Text>
          {(plan?.features ?? []).map((f) => (
            <View key={f} style={styles.featureRow}>
              <Feather name="check" size={13} color="#059669" />
              <Text style={[styles.featureText, { color: colors.foreground }]}>{f}</Text>
            </View>
          ))}
        </View>

        <Pressable
          onPress={handleCancel}
          disabled={loading}
          style={[styles.cancelBtn, { borderColor: colors.destructive, borderRadius: colors.radius }]}
        >
          {loading ? (
            <ActivityIndicator color={colors.destructive} />
          ) : (
            <Text style={[styles.cancelBtnText, { color: colors.destructive }]}>Cancel subscription</Text>
          )}
        </Pressable>
        {onClose && (
          <Pressable onPress={onClose} style={styles.maybeBtn}>
            <Text style={[styles.maybeBtnText, { color: colors.mutedForeground }]}>Close</Text>
          </Pressable>
        )}
      </ScrollView>
    );
  }

  // Paywall / plan selection view
  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingBottom: insets.bottom + 32 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primary }]}>
          <Feather name="zap" size={28} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.headline, { color: colors.foreground }]}>
          Grow your laundry business
        </Text>
        <Text style={[styles.subheadline, { color: colors.mutedForeground }]}>
          Flat monthly fee in Naira · No commissions · Keep 100% of your revenue
        </Text>
      </View>

      {/* Trial / Pay toggle */}
      <View style={[styles.modeRow, { backgroundColor: colors.muted, borderRadius: colors.radius }]}>
        {(["trial", "pay"] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[
              styles.modeBtn,
              mode === m && { backgroundColor: colors.card, borderRadius: colors.radius - 2 },
            ]}
          >
            <Text style={[styles.modeBtnText, { color: mode === m ? colors.primary : colors.mutedForeground }]}>
              {m === "trial" ? "7-Day Free Trial" : "Subscribe Now"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Plan cards */}
      {SUBSCRIPTION_PLANS.map((plan) => {
        const isSelected = selectedTier === plan.id;
        return (
          <Pressable
            key={plan.id}
            onPress={() => setSelectedTier(plan.id as SubscriptionTier)}
            style={[
              styles.planCard,
              {
                backgroundColor: isSelected ? colors.primary : colors.card,
                borderRadius: colors.radius,
                borderWidth: plan.recommended ? 2 : 1,
                borderColor: isSelected
                  ? colors.primary
                  : plan.recommended
                    ? colors.accent
                    : colors.border,
              },
            ]}
          >
            {plan.recommended && !isSelected && (
              <View style={[styles.recommendedBadge, { backgroundColor: colors.accent }]}>
                <Text style={styles.recommendedText}>Most Popular</Text>
              </View>
            )}
            <View style={styles.planHeaderRow}>
              <Text style={[styles.planName, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                {plan.name}
              </Text>
              <View style={styles.priceRow}>
                <Text style={[styles.planPrice, { color: isSelected ? colors.primaryForeground : colors.primary }]}>
                  {plan.displayPrice}
                </Text>
                <Text style={[styles.planPer, { color: isSelected ? colors.primaryForeground + "aa" : colors.mutedForeground }]}>
                  /mo
                </Text>
              </View>
            </View>
            <View style={styles.featureList}>
              {plan.features.map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Feather name="check" size={12} color={isSelected ? colors.primaryForeground : "#059669"} />
                  <Text style={[styles.featureText, { color: isSelected ? colors.primaryForeground + "dd" : colors.foreground }]}>
                    {f}
                  </Text>
                </View>
              ))}
            </View>
          </Pressable>
        );
      })}

      {/* CTA */}
      <Pressable
        onPress={mode === "trial" ? handleTrial : handleSubscribe}
        disabled={loading}
        style={[styles.ctaBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: loading ? 0.7 : 1 }]}
      >
        {loading ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <>
            <Feather name={mode === "trial" ? "gift" : "arrow-right"} size={18} color={colors.primaryForeground} />
            <Text style={[styles.ctaText, { color: colors.primaryForeground }]}>
              {mode === "trial"
                ? `Start 7-Day Free Trial — ${selectedPlan.name}`
                : `Subscribe — ${selectedPlan.name} · ${selectedPlan.displayPrice}/mo`}
            </Text>
          </>
        )}
      </Pressable>

      {mode === "trial" && (
        <Text style={[styles.legalText, { color: colors.mutedForeground }]}>
          No card required during trial. Prices in Nigerian Naira. Cancel anytime.
        </Text>
      )}

      {onClose && (
        <Pressable onPress={onClose} style={styles.maybeBtn}>
          <Text style={[styles.maybeBtnText, { color: colors.mutedForeground }]}>Maybe Later</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  activeContainer: { padding: 20, gap: 16 },
  header: { alignItems: "center", gap: 10, marginBottom: 4 },
  iconWrap: { width: 64, height: 64, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headline: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  subheadline: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  modeRow: { flexDirection: "row", padding: 4, gap: 4 },
  modeBtn: { flex: 1, paddingVertical: 10, alignItems: "center" },
  modeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  planCard: { padding: 16, gap: 12, overflow: "hidden" },
  planHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  planName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  planPrice: { fontSize: 22, fontFamily: "Inter_700Bold" },
  planPer: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 3 },
  featureList: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  featureText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  recommendedBadge: { position: "absolute", top: 12, right: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  recommendedText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#ffffff" },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 17, marginTop: 4 },
  ctaText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  legalText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  activeBadge: { alignItems: "center", gap: 8, paddingVertical: 28 },
  activeTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  activePlan: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  daysChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 4 },
  daysText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  upgradeCard: { padding: 16, gap: 12, borderWidth: 1 },
  upgradeTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  upgradePlanRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, padding: 12 },
  upgradePlanInfo: { flex: 1 },
  upgradePlanName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  upgradePlanPrice: { fontSize: 13, fontFamily: "Inter_700Bold", marginTop: 2 },
  upgradeBtn: { paddingVertical: 14, alignItems: "center" },
  upgradeBtnText: { fontSize: 14, fontFamily: "Inter_700Bold" },
  featureCard: { padding: 16, gap: 10 },
  sectionLabel: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  cancelBtn: { borderWidth: 1.5, paddingVertical: 14, alignItems: "center" },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  maybeBtn: { alignItems: "center", paddingVertical: 12 },
  maybeBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
