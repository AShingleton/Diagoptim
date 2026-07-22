"use server";

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/supabase/server";
import { ensureUser, createProjectWithCompany } from "@/lib/scoping/bootstrap";
import { revalidatePath } from "next/cache";

export async function createProjectAction(formData: FormData): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifie");
  await ensureUser(prisma, user);

  const companyName = String(formData.get("companyName") ?? "").trim();
  const projectName = String(formData.get("projectName") ?? "").trim();
  const ownerType =
    String(formData.get("ownerType") ?? "consultant") === "client_lead"
      ? "client_lead"
      : "consultant";
  const requiredRespondents = Math.max(
    1,
    Math.min(20, parseInt(String(formData.get("requiredRespondents") ?? "1"), 10) || 1),
  );
  const ALTITUDES = ["tache", "processus", "modele_operatoire", "strategique"] as const;
  const rawAltitude = String(formData.get("altitude") ?? "tache");
  const altitude = (ALTITUDES as readonly string[]).includes(rawAltitude)
    ? (rawAltitude as (typeof ALTITUDES)[number])
    : "tache";
  if (!companyName || !projectName) throw new Error("Champs requis manquants");

  await createProjectWithCompany(prisma, {
    userId: user.id,
    companyName,
    projectName,
    ownerType,
    requiredRespondents,
    altitude,
  });
  revalidatePath("/fr/scoping");
  revalidatePath("/en/scoping");
}
