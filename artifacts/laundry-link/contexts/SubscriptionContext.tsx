import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  SubscriptionFeature,
  canAccessFeature,
  cancelSubscription,
  getSubscription,
  startTrial,
  subscribe,
} from "@/lib/subscription";
import { SubscriptionState, SubscriptionTier } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT: SubscriptionState = {
  tier: null,
  active: false,
  isTrial: false,
  trialExpiresAt: null,
  subscribedAt: null,
  expiresAt: null,
};

interface SubscriptionContextType {
  subscription: SubscriptionState;
  isLoading: boolean;
  isSubscribed: boolean;
  canAccess: (feature: SubscriptionFeature) => boolean;
  refresh: () => Promise<void>;
  beginTrial: (tier: SubscriptionTier) => Promise<void>;
  purchasePlan: (tier: SubscriptionTier) => Promise<void>;
  cancel: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: DEFAULT,
  isLoading: true,
  isSubscribed: false,
  canAccess: () => false,
  refresh: async () => {},
  beginTrial: async () => {},
  purchasePlan: async () => {},
  cancel: async () => {},
});

export function useSubscription() {
  return useContext(SubscriptionContext);
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>(DEFAULT);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const state = await getSubscription();
      setSubscription(state);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, role]);

  const beginTrial = useCallback(async (tier: SubscriptionTier) => {
    const state = await startTrial(tier);
    setSubscription(state);
  }, []);

  const purchasePlan = useCallback(async (tier: SubscriptionTier) => {
    const state = await subscribe(tier);
    setSubscription(state);
  }, []);

  const cancel = useCallback(async () => {
    const state = await cancelSubscription();
    setSubscription(state);
  }, []);

  const isSubscribed = subscription.active && !!subscription.tier;

  const canAccess = useCallback(
    (feature: SubscriptionFeature) =>
      canAccessFeature(feature, subscription.tier, subscription.active),
    [subscription.tier, subscription.active],
  );

  const value = useMemo(
    () => ({
      subscription,
      isLoading,
      isSubscribed,
      canAccess,
      refresh,
      beginTrial,
      purchasePlan,
      cancel,
    }),
    [subscription, isLoading, isSubscribed, canAccess, refresh, beginTrial, purchasePlan, cancel],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}
