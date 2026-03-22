import type { SupportPackType } from "@/types/billing";
import { SUPPORT_PACKS } from "./plans";

/**
 * Status of a purchased support pack.
 */
export type SupportPackStatus = "active" | "expired" | "fully_used";

/**
 * A purchased support pack instance.
 */
export interface SupportPack {
  /** Unique pack instance ID */
  id: string;
  /** The user who purchased this pack */
  userId: string;
  /** Type of support pack */
  packType: SupportPackType;
  /** Total hours included in the pack */
  hoursTotal: number;
  /** Hours consumed so far */
  hoursUsed: number;
  /** Current pack status */
  status: SupportPackStatus;
  /** ISO date string when the pack was purchased */
  purchasedAt: string;
  /** ISO date string when the pack expires */
  expiresAt: string;
  /** Stripe payment intent or checkout session ID */
  stripePaymentId: string;
}

/**
 * A recorded session of support pack usage.
 */
export interface SupportSession {
  /** Unique session ID */
  id: string;
  /** The pack this session is charged against */
  packId: string;
  /** Hours consumed in this session */
  hours: number;
  /** Description of what was covered */
  notes: string;
  /** ISO date string when the session occurred */
  sessionDate: string;
  /** Consultant who provided the support */
  consultantId: string;
}

/**
 * Balance summary for a support pack.
 */
export interface PackBalance {
  /** Total hours included in the pack */
  hoursTotal: number;
  /** Hours used so far */
  hoursUsed: number;
  /** Remaining available hours */
  hoursRemaining: number;
}

/**
 * Purchases a support pack for a user.
 * Creates the pack record after successful payment verification.
 *
 * @param userId - The DiagOptim user ID
 * @param packType - The type of support pack to purchase
 * @returns The created SupportPack record
 * @throws Error if the pack type is unknown
 */
export async function purchasePack(
  userId: string,
  packType: SupportPackType
): Promise<SupportPack> {
  const packDef = SUPPORT_PACKS[packType];
  if (!packDef) {
    throw new Error(`Unknown pack type: ${packType}`);
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + packDef.validityDays);

  const pack: SupportPack = {
    id: generatePackId(),
    userId,
    packType,
    hoursTotal: packDef.hours,
    hoursUsed: 0,
    status: "active",
    purchasedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    stripePaymentId: "",
  };

  // TODO: Persist to Supabase
  // await supabase.from("support_packs").insert(pack);

  return pack;
}

/**
 * Records usage of support pack hours for a session.
 *
 * @param packId - The support pack ID to charge against
 * @param hours - Number of hours consumed
 * @param notes - Description of the session content
 * @returns The created SupportSession record
 * @throws Error if the pack has insufficient hours or is expired
 */
export async function usePackHours(
  packId: string,
  hours: number,
  notes: string
): Promise<SupportSession> {
  if (hours <= 0) {
    throw new Error("Hours must be a positive number");
  }

  // TODO: Fetch pack from Supabase
  // const pack = await supabase.from("support_packs").select().eq("id", packId).single();
  // For now, we validate the logic and throw appropriate errors

  const isExpired = await checkPackExpiry(packId);
  if (isExpired) {
    throw new Error("Support pack has expired");
  }

  const balance = await getPackBalance(packId);
  if (hours > balance.hoursRemaining) {
    throw new Error(
      `Insufficient hours: ${balance.hoursRemaining}h remaining, ${hours}h requested`
    );
  }

  const session: SupportSession = {
    id: generateSessionId(),
    packId,
    hours,
    notes,
    sessionDate: new Date().toISOString(),
    consultantId: "",
  };

  // TODO: Persist session and update pack hours in Supabase
  // await supabase.from("support_sessions").insert(session);
  // await supabase.from("support_packs").update({
  //   hoursUsed: balance.hoursUsed + hours,
  //   status: balance.hoursUsed + hours >= balance.hoursTotal ? "fully_used" : "active",
  // }).eq("id", packId);

  return session;
}

/**
 * Returns the current hour balance for a support pack.
 *
 * @param packId - The support pack ID
 * @returns The pack balance with total, used, and remaining hours
 */
export async function getPackBalance(packId: string): Promise<PackBalance> {
  // TODO: Fetch from Supabase
  // const pack = await supabase.from("support_packs").select().eq("id", packId).single();
  // const { hoursTotal, hoursUsed } = pack.data;

  // Placeholder until Supabase integration
  void packId;
  const hoursTotal = 0;
  const hoursUsed = 0;

  return {
    hoursTotal,
    hoursUsed,
    hoursRemaining: Math.max(0, hoursTotal - hoursUsed),
  };
}

/**
 * Checks whether a support pack has expired based on its expiry date.
 *
 * @param packId - The support pack ID to check
 * @returns True if the pack has expired, false otherwise
 */
export async function checkPackExpiry(packId: string): Promise<boolean> {
  // TODO: Fetch from Supabase
  // const pack = await supabase.from("support_packs").select("expiresAt, status").eq("id", packId).single();
  // const expiresAt = new Date(pack.data.expiresAt);

  // Placeholder until Supabase integration
  void packId;
  const expiresAt = new Date();

  const now = new Date();
  const isExpired = now > expiresAt;

  // TODO: Update status in DB if expired
  // if (isExpired && pack.data.status === "active") {
  //   await supabase.from("support_packs").update({ status: "expired" }).eq("id", packId);
  // }

  return isExpired;
}

/**
 * Generates a unique pack ID with a recognizable prefix.
 */
function generatePackId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `pack_${timestamp}_${random}`;
}

/**
 * Generates a unique session ID with a recognizable prefix.
 */
function generateSessionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `sess_${timestamp}_${random}`;
}
