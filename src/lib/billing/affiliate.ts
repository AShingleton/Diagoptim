/**
 * Status of an affiliate account.
 */
export type AffiliateStatus = "pending" | "active" | "suspended" | "deactivated";

/**
 * Status of a referral tracking record.
 */
export type ReferralStatus = "pending" | "converted" | "expired" | "paid";

/**
 * An affiliate partner account linked to Stripe Connect.
 */
export interface Affiliate {
  /** Unique affiliate ID */
  id: string;
  /** The DiagOptim user ID of the affiliate */
  userId: string;
  /** Unique affiliate referral code */
  code: string;
  /** Stripe Connect account ID */
  stripeConnectAccountId: string;
  /** Commission rate as a decimal (e.g., 0.20 for 20%) */
  commissionRate: number;
  /** Current account status */
  status: AffiliateStatus;
  /** ISO date string when the account was created */
  createdAt: string;
  /** Total earnings in cents (EUR) */
  totalEarnings: number;
  /** Pending (unpaid) earnings in cents (EUR) */
  pendingEarnings: number;
  /** Total number of successful referrals */
  referralCount: number;
}

/**
 * A referral tracking record linking an affiliate to a referred user.
 */
export interface Referral {
  /** Unique referral ID */
  id: string;
  /** The affiliate who made the referral */
  affiliateId: string;
  /** The referred user's DiagOptim ID */
  referredUserId: string;
  /** The affiliate code used */
  affiliateCode: string;
  /** Current referral status */
  status: ReferralStatus;
  /** ISO date string when the referral was recorded */
  createdAt: string;
  /** ISO date string when the referral converted (subscribed), if applicable */
  convertedAt: string | null;
  /** Total commission earned from this referral in cents (EUR) */
  commissionEarned: number;
}

/**
 * Aggregated statistics for an affiliate's performance.
 */
export interface AffiliateStats {
  /** Total number of clicks on affiliate links */
  totalClicks: number;
  /** Number of users who signed up via the affiliate link */
  totalSignups: number;
  /** Number of referrals that converted to paid subscriptions */
  totalConversions: number;
  /** Conversion rate as a decimal (signups to conversions) */
  conversionRate: number;
  /** Total commissions earned in cents (EUR) */
  totalEarnings: number;
  /** Commissions not yet paid out in cents (EUR) */
  pendingEarnings: number;
  /** Commissions already paid out in cents (EUR) */
  paidEarnings: number;
  /** Earnings breakdown by month */
  earningsByMonth: MonthlyEarning[];
  /** Top performing referral sources */
  topReferrals: ReferralSummary[];
}

/**
 * Monthly earnings breakdown entry.
 */
interface MonthlyEarning {
  /** Month in YYYY-MM format */
  month: string;
  /** Earnings in cents (EUR) */
  earnings: number;
  /** Number of conversions that month */
  conversions: number;
}

/**
 * Summary of a single referral for stats display.
 */
interface ReferralSummary {
  /** Referral ID */
  referralId: string;
  /** Plan the referred user subscribed to */
  plan: string;
  /** Commission earned in cents (EUR) */
  commission: number;
  /** ISO date string of conversion */
  convertedAt: string;
}

/** Default commission rate for new affiliates (20%) */
const DEFAULT_COMMISSION_RATE = 0.20;

/** Base URL for affiliate referral links */
const AFFILIATE_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://diagoptim.com";

/**
 * Creates a new affiliate account for a user.
 * Generates a unique referral code and prepares Stripe Connect onboarding.
 *
 * @param userId - The DiagOptim user ID
 * @returns The created Affiliate record
 */
export async function createAffiliateAccount(userId: string): Promise<Affiliate> {
  const code = generateAffiliateCode();

  const affiliate: Affiliate = {
    id: generateAffiliateId(),
    userId,
    code,
    stripeConnectAccountId: "",
    commissionRate: DEFAULT_COMMISSION_RATE,
    status: "pending",
    createdAt: new Date().toISOString(),
    totalEarnings: 0,
    pendingEarnings: 0,
    referralCount: 0,
  };

  // TODO: Create Stripe Connect account
  // const account = await stripe.accounts.create({
  //   type: "express",
  //   country: "FR",
  //   capabilities: { transfers: { requested: true } },
  //   metadata: { userId, affiliateId: affiliate.id },
  // });
  // affiliate.stripeConnectAccountId = account.id;

  // TODO: Persist to Supabase
  // await supabase.from("affiliates").insert(affiliate);

  return affiliate;
}

/**
 * Generates a full affiliate referral URL from a referral code.
 *
 * @param code - The affiliate's unique referral code
 * @returns The complete referral URL
 */
export function generateAffiliateLink(code: string): string {
  return `${AFFILIATE_BASE_URL}/ref/${encodeURIComponent(code)}`;
}

/**
 * Records a referral when a new user signs up via an affiliate link.
 *
 * @param affiliateCode - The referral code used during signup
 * @param referredUserId - The new user's DiagOptim ID
 * @returns The created Referral record
 * @throws Error if the affiliate code is invalid or the affiliate is not active
 */
export async function trackReferral(
  affiliateCode: string,
  referredUserId: string
): Promise<Referral> {
  // TODO: Look up affiliate by code from Supabase
  // const affiliate = await supabase.from("affiliates")
  //   .select()
  //   .eq("code", affiliateCode)
  //   .eq("status", "active")
  //   .single();
  // if (!affiliate.data) throw new Error("Invalid or inactive affiliate code");

  void affiliateCode;

  const referral: Referral = {
    id: generateReferralId(),
    affiliateId: "",
    referredUserId,
    affiliateCode,
    status: "pending",
    createdAt: new Date().toISOString(),
    convertedAt: null,
    commissionEarned: 0,
  };

  // TODO: Persist to Supabase
  // await supabase.from("referrals").insert(referral);

  return referral;
}

/**
 * Processes a commission payment for a successful referral conversion.
 * Calculates the commission amount and initiates a Stripe Connect transfer.
 *
 * @param referralId - The referral that triggered the commission
 * @param amount - The subscription payment amount in cents (EUR)
 * @throws Error if the referral is not found or already paid
 */
export async function processCommission(
  referralId: string,
  amount: number
): Promise<void> {
  // TODO: Fetch referral and affiliate from Supabase
  // const referral = await supabase.from("referrals").select().eq("id", referralId).single();
  // if (!referral.data) throw new Error("Referral not found");
  // if (referral.data.status === "paid") throw new Error("Commission already paid");
  //
  // const affiliate = await supabase.from("affiliates").select().eq("id", referral.data.affiliateId).single();
  // const commissionAmount = Math.floor(amount * affiliate.data.commissionRate);

  void referralId;
  void amount;

  // TODO: Create Stripe Connect transfer
  // await stripe.transfers.create({
  //   amount: commissionAmount,
  //   currency: "eur",
  //   destination: affiliate.data.stripeConnectAccountId,
  //   metadata: {
  //     referralId,
  //     affiliateId: affiliate.data.id,
  //   },
  // });

  // TODO: Update referral and affiliate records in Supabase
  // await supabase.from("referrals").update({
  //   status: "paid",
  //   commissionEarned: commissionAmount,
  // }).eq("id", referralId);
  //
  // await supabase.from("affiliates").update({
  //   totalEarnings: affiliate.data.totalEarnings + commissionAmount,
  //   pendingEarnings: affiliate.data.pendingEarnings - commissionAmount,
  // }).eq("id", affiliate.data.id);
}

/**
 * Retrieves aggregated performance statistics for an affiliate.
 *
 * @param affiliateId - The affiliate account ID
 * @returns Aggregated stats including earnings, conversions, and monthly breakdown
 */
export async function getAffiliateStats(affiliateId: string): Promise<AffiliateStats> {
  // TODO: Aggregate from Supabase
  // const referrals = await supabase.from("referrals")
  //   .select()
  //   .eq("affiliateId", affiliateId);
  //
  // const clicks = await supabase.from("affiliate_clicks")
  //   .select("count")
  //   .eq("affiliateId", affiliateId);

  void affiliateId;

  // Placeholder until Supabase integration
  return {
    totalClicks: 0,
    totalSignups: 0,
    totalConversions: 0,
    conversionRate: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
    earningsByMonth: [],
    topReferrals: [],
  };
}

/**
 * Generates a unique, URL-safe affiliate code.
 * Format: 8-character alphanumeric string.
 */
function generateAffiliateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generates a unique affiliate account ID.
 */
function generateAffiliateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `aff_${timestamp}_${random}`;
}

/**
 * Generates a unique referral ID.
 */
function generateReferralId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `ref_${timestamp}_${random}`;
}
