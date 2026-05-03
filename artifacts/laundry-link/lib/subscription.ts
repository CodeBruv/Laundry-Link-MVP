import AsyncStorage from "@react-native-async-storage/async-storage";
import { SubscriptionState, SubscriptionTier } from "@/types";

const STORAGE_KEY = "ll_subscription_v1";

export const TRIAL_DAYS = 7;

export const SUBSCRIPTION_PLANS = [
  {
    id: "STARTER" as SubscriptionTier,
    name: "Starter",
    monthlyPrice: 29,
    features: [
      "Up to 50 orders/month",
      "1 dispatcher account",
      "Basic analytics",
      "Email support",
      "Customer order tracking",
    ],
    maxOrders: 50,
    maxDispatchers: 1,
  },
  {
    id: "PRO" as SubscriptionTier,
    name: "Pro",
    monthlyPrice: 79,
    features: [
      "Up to 250 orders/month",
      "5 dispatcher accounts",
      "Advanced analytics & reports",
      "Priority email support",
      "Live driver tracking",
      "Custom service pricing",
    ],
    maxOrders: 250,
    maxDispatchers: 5,
    recommended: true,
  },
  {
    id: "ENTERPRISE" as SubscriptionTier,
    name: "Enterprise",
    monthlyPrice: 149,
    features: [
      "Unlimited orders",
      "Unlimited dispatchers",
      "Full analytics suite",
      "Dedicated support",
      "Multi-branch support",
      "API access",
      "White-label option",
    ],
    maxOrders: Infinity,
    maxDispatchers: Infinity,
  },
];

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
    // Check trial expiry
    if (state.isTrial && state.trialExpiresAt) {
      const expired = new Date(state.trialExpiresAt) < new Date();
      if (expired) return { ...state, active: false };
    }
    // Check subscription expiry
    if (!state.isTrial && state.expiresAt) {
      const expired = new Date(state.expiresAt) < new Date();
      if (expired) return { ...state, active: false };
    }
    return state;
  } catch {
    return DEFAULT_STATE;
  }
}

export async function startTrial(tier: SubscriptionTier): Promise<SubscriptionState> {
  const trialExpiresAt = new Date(
    Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();
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
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
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
