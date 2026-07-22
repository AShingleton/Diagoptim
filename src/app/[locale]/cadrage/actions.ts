"use server";

import { captureLead, type LeadResult } from "@/lib/leads/capture";

export type { LeadResult };

export async function submitLead(formData: FormData): Promise<LeadResult> {
  return captureLead({
    name: String(formData.get("name") ?? ""),
    company: String(formData.get("company") ?? ""),
    email: String(formData.get("email") ?? ""),
    message: String(formData.get("message") ?? ""),
    score: String(formData.get("score") ?? ""),
    tier: String(formData.get("tier") ?? ""),
    source: "landing-cadrage-app",
  });
}
