import AsyncStorage from "@react-native-async-storage/async-storage";
import { SubscriptionState, SubscriptionTier } from "@/types";

const STORAGE_KEY = "ll_subscription_v1";

export const TRIAL_DAYS = 7;

export const SUBSCRIPTION_PLANS = [
  {
    id: "STARTER" as SubscriptionTier,
    name: "Starter",
    monthlyPrice: 10000,
    currency: "NGN",
    displayPrice: "₦10,000",
    features: [
      "Up to 50 orders/month",
      "1 dispatcher account",
      "Basic analytics dashboard",
      "Email support",
      "Customer order tracking",
      "P2P payment confirmations",
    ],
    maxOrders: 50,
    maxDispatchers: 1,
    recommended: false,
  },
  {
    id: "PRO" as SubscriptionTier,
    name: "Pro",
    monthlyPrice: 18000,
    currency: "NGN",
    displayPrice: "₦18,000",
    features: [
      "Up to 250 orders/month",
      "5 dispatcher accounts",
      "Full analytics & reports",
      "Priority support",
      "Live driver tracking",
      "Custom service pricing",
      "SMS notifications",
    ],
    maxOrders: 250,
    maxDispatchers: 5,
    recommended: true,
  },
  {
    id: "ENTERPRISE" as SubscriptionTier,
    name: "Enterprise",
    monthlyPrice: 30000,
    currency: "NGN",
    displayPrice: "₦30,000",
    features: [
      "Unlimited orders",
      "Unlimited dispatchers",
      "Full analytics suite",
      "Dedicated account manager",
      "Multi-branch support",
      "API access",
      "White-label option",
      "SLA guarantee",
    ],
    maxOrders: Infinity,
    maxDispatchers: Infinity,
    recommended: false,
  },
];

export type SubscriptionFeature =
  | "orders"
  | "dispatchers"
  | "reports"
  | "liveTracking"
  | "customPricing"
  | "multiBranch"
  | "apiAccess"
  | "whiteLabel"
  | "prioritySupport"
  | "smsNotifications";

const FEATURE_TIERS: Record<SubscriptionFeature, SubscriptionTier[]> = {
  orders: ["STARTER", "PRO", "ENTERPRISE"],
  dispatchers: ["STARTER", "PRO", "ENTERPRISE"],
  reports: ["PRO", "ENTERPRISE"],
  liveTracking: ["PRO", "ENTERPRISE"],
  customPricing: ["PRO", "ENTERPRISE"],
  smsNotifications: ["PRO", "ENTERPRISE"],
  multiBranch: ["ENTERPRISE"],
  apiAccess: ["ENTERPRISE"],
  whiteLabel: ["ENTERPRISE"],
  prioritySupport: ["PRO", "ENTERPRISE"],
};

export function canAccessFeature(
  feature: SubscriptionFeature,
  tier: SubscriptionTier | null,
  active: boolean,
): boolean {
  if (!active || !tier) return false;
  return FEATURE_TIERS[feature]?.includes(tier) ?? false;
}

export function getPlanLimits(tier: SubscriptionTier | null) {
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === tier);
  return {
    maxOrders: plan?.maxOrders ?? 0,
    maxDispatchers: plan?.maxDispatchers ?? 0,
  };
}

export function getPlanName(tier: SubscriptionTier | null): string {
  return SUBSCRIPTION_PLANS.find((p) => p.id === tier)?.name ?? "Free";
}

const DEFAULT_STATE: SubscriptionState = {
  tier: null,
  active: false,
  isTrial: false,
  trialExpiresAt: null,
  subscribedAt: null,
  expiresAt: null,
};

export async function getSubscription(): Promise<SubscriptionState> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const state = JSON.parse(raw) as SubscriptionState;
    if (state.isTrial && state.trialExpiresAt) {
      if (new Date(state.trialExpiresAt) < new Date()) return { ...state, active: false };
    }
    if (!state.isTrial && state.expiresAt) {
      if (new Date(state.expiresAt) < new Date()) return { ...state, active: false };
    }
    return state;
  } catch {
    return DEFAULT_STATE;
  }
}

export async function startTrial(tier: SubscriptionTier): Promise<SubscriptionState> {
  const trialExpiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const state: SubscriptionState = {
    tier,
    active: true,
    isTrial: true,
    trialExpiresAt,
    subscribedAt: new Date().toISOString(),
    expiresAt: null,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export async function subscribe(tier: SubscriptionTier): Promise<SubscriptionState> {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const state: SubscriptionState = {
    tier,
    active: true,
    isTrial: false,
    trialExpiresAt: null,
    subscribedAt: new Date().toISOString(),
    expiresAt,
  };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

export async function cancelSubscription(): Promise<SubscriptionState> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return DEFAULT_STATE;
}

export function daysLeft(sub: SubscriptionState): number {
  const target = sub.isTrial ? sub.trialExpiresAt : sub.expiresAt;
  if (!target) return 0;
  const ms = new Date(target).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}
