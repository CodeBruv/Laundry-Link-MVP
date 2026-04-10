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

  const handleSubscribe = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
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
          Choose Your Plan
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Start with a 7-day free trial. Cancel anytime.
        </Text>
      </View>

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
                  borderColor: isSelected ? colors.accent : colors.border,
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
                  <Feather name="check-circle" size={20} color={colors.accent} />
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
            backgroundColor: colors.accent,
            borderRadius: colors.radius,
            opacity: isLoading ? 0.7 : 1,
          },
        ]}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.accentForeground} />
        ) : (
          <Text style={[styles.subscribeBtnText, { color: colors.accentForeground }]}>
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
