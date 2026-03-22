export type SubscriptionTier = "free" | "starter" | "pro" | "expert";
export type BillingInterval = "monthly" | "annual";

export interface PricingPlan {
  id: SubscriptionTier;
  nameKey: string;
  price: { monthly: number; annual: number };
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

export type SupportPackType = "coup_de_pouce" | "acceleration" | "transformation";

export interface SupportPack {
  id: SupportPackType;
  nameKey: string;
  price: number;
  hours: number;
  features: string[];
}

export interface Subscription {
  tier: SubscriptionTier;
  interval: BillingInterval;
  stripeCustomerId?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}
