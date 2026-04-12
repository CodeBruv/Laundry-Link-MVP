import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { SubscriptionPlan, SubscriptionTier } from "@/types";

const PLANS: SubscriptionPlan[] = [
  {
    id: "STARTER",
    name: "Starter",
    price: 29,
    features: [
      "Up to 50 orders/month",
      "1 staff account",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    id: "PRO",
    name: "Pro",
    price: 79,
    recommended: true,
    features: [
      "Unlimited orders",
      "5 staff accounts",
      "Advanced analytics",
      "Priority support",
      "Custom branding",
    ],
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: 149,
    features: [
      "Everything in Pro",
      "Unlimited staff",
      "API access",
      "Dedicated support",
      "Multi-location",
      "White-label options",
    ],
  },
];

interface SubscriptionPaywallProps {
  onClose?: () => void;
}

export function SubscriptionPaywall({ onClose }: SubscriptionPaywallProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<SubscriptionTier>("PRO");
  const [isLoading, setIsLoading] = useState(false);
  const [activePlan, setActivePlan] = useState<SubscriptionTier | null>(null);

  const handleSubscribe = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setActivePlan(selected);
      setIsLoading(false);
    }, 900);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: insets.bottom + 20 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Business Subscription
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Pick a SaaS plan for your laundromat. No commissions, no wallets, no payouts.
        </Text>
      </View>

      {activePlan && (
        <View
          style={[
            styles.successBox,
            {
              backgroundColor: (colors.success ?? colors.accent) + "16",
              borderColor: colors.success ?? colors.accent,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Feather
            name="check-circle"
            size={18}
            color={colors.success ?? colors.accent}
          />
          <Text
            style={[
              styles.successText,
              { color: colors.success ?? colors.accent },
            ]}
          >
            Trial started for {PLANS.find((plan) => plan.id === activePlan)?.name}. RevenueCat purchase flow will connect here.
          </Text>
        </View>
      )}

      <View style={styles.plans}>
        {PLANS.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <Pressable
              key={plan.id}
              onPress={() => setSelected(plan.id)}
              style={[
                styles.planCard,
                {
                  backgroundColor: colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                  borderWidth: isSelected ? 2 : 1,
                },
              ]}
            >
              {plan.recommended && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: colors.accent,
                      borderRadius: colors.radius / 2,
                    },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.accentForeground }]}>
                    Most Popular
                  </Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: colors.foreground }]}>
                  {plan.name}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: colors.foreground }]}>
                    ${plan.price}
                  </Text>
                  <Text style={[styles.period, { color: colors.mutedForeground }]}>
                    /month
                  </Text>
                </View>
              </View>

              <View style={styles.features}>
                {plan.features.map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Feather
                      name="check"
                      size={14}
                      color={colors.success ?? colors.accent}
                    />
                    <Text
                      style={[styles.featureText, { color: colors.foreground }]}
                    >
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>

              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Feather name="check-circle" size={20} color={colors.primary} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleSubscribe}
        disabled={isLoading}
        style={[
          styles.subscribeBtn,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius,
            opacity: isLoading ? 0.7 : 1,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text style={[styles.subscribeBtnText, { color: colors.primaryForeground }]}>
            Start 7-Day Free Trial
          </Text>
        )}
      </Pressable>

      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
        Payment processed via App Store / Google Play. You won't be charged during the
        trial period. Subscription auto-renews monthly.
      </Text>

      {onClose && (
        <Pressable onPress={onClose} style={styles.closeBtn}>
          <Text style={[styles.closeBtnText, { color: colors.mutedForeground }]}>
            Maybe Later
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  plans: {
    gap: 14,
    marginBottom: 24,
  },
  successBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 17,
  },
  planCard: {
    padding: 18,
    position: "relative",
    overflow: "hidden",
  },
  badge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  planHeader: {
    marginBottom: 14,
  },
  planName: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  price: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  period: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginLeft: 4,
  },
  features: {
    gap: 8,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  selectedIndicator: {
    position: "absolute",
    top: 14,
    left: 14,
  },
  subscribeBtn: {
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 12,
  },
  subscribeBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 12,
  },
  closeBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  closeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
