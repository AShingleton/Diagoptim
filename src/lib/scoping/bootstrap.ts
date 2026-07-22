import type { PrismaClient } from "@prisma/client";
import type { SessionUser } from "@/lib/supabase/server";

/**
 * Ensures a `public.users` row exists for the authenticated Supabase user.
 * The Prisma User id is set to the Supabase auth uid so relations line up.
 */
export async function ensureUser(prisma: PrismaClient, user: SessionUser) {
  return prisma.user.upsert({
    where: { id: user.id },
    update: {},
    create: { id: user.id, email: user.email, name: user.name || "Utilisateur" },
  });
}

export interface CreateProjectWithCompanyInput {
  userId: string;
  companyName: string;
  projectName: string;
  ownerType: "consultant" | "client_lead";
  requiredRespondents: number;
  altitude: "tache" | "processus" | "modele_operatoire" | "strategique";
}

/**
 * Creates the client Company (with safe placeholder defaults for the diagnostic
 * fields we don't need at scoping time) plus a draft scoping project on it.
 */
export async function createProjectWithCompany(
  prisma: PrismaClient,
  input: CreateProjectWithCompanyInput,
) {
  const company = await prisma.company.create({
    data: {
      userId: input.userId,
      name: input.companyName,
      siret: "",
      sector: "",
      subsector: "",
      productsDescription: "",
      location: "",
      employeeCount: 0,
      annualRevenue: 0,
      clientCount: 0,
      competitors: [],
    },
  });
  return prisma.scopingProject.create({
    data: {
      companyId: company.id,
      name: input.projectName,
      ownerType: input.ownerType,
      createdByUserId: input.userId,
      requiredRespondents: input.requiredRespondents,
      status: "draft",
      altitude: input.altitude,
    },
  });
}
