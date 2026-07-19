"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/supabase/server";
import { canManageProject, addStakeholder } from "@/lib/scoping/service";
import { inviteStakeholder } from "@/lib/scoping/invite";
import { runSynthesis } from "@/lib/scoping/synthesis";
import { sendEmail } from "@/lib/notifications/email";

async function assertManager(projectId: string): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifie");
  if (!(await canManageProject(prisma, projectId, user.id))) throw new Error("Acces refuse");
}

export async function addStakeholderAction(projectId: string, formData: FormData): Promise<void> {
  await assertManager(projectId);
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const roleLabel = String(formData.get("roleLabel") ?? "").trim();
  const hp = String(formData.get("hierarchyParentId") ?? "").trim();
  if (!fullName || !email || !roleLabel) throw new Error("Champs requis manquants");
  await addStakeholder(prisma, { projectId, fullName, email, roleLabel, hierarchyParentId: hp || null });
  revalidatePath(`/fr/scoping/${projectId}`);
  revalidatePath(`/en/scoping/${projectId}`);
}

export async function generateSynthesisAction(projectId: string, locale: string): Promise<void> {
  await assertManager(projectId);
  await runSynthesis(prisma, projectId);
  revalidatePath(`/${locale}/scoping/${projectId}`);
  revalidatePath(`/${locale}/scoping/${projectId}/synthese`);
  redirect(`/${locale}/scoping/${projectId}/synthese`);
}

async function createOrGetUser(email: string): Promise<{ id: string; tempPassword: string | null }> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const headers = {
    apikey: svc,
    Authorization: `Bearer ${svc}`,
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0",
  };
  const tempPassword = randomUUID().slice(0, 16) + "!aA1";
  const res = await fetch(`${base}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, password: tempPassword, email_confirm: true }),
  });
  if (res.ok) {
    const d = (await res.json()) as { id: string };
    return { id: d.id, tempPassword };
  }
  const list = await fetch(`${base}/auth/v1/admin/users?per_page=200`, { headers });
  const data = (await list.json()) as { users?: Array<{ id: string; email: string }> } | Array<{ id: string; email: string }>;
  const users = Array.isArray(data) ? data : data.users ?? [];
  const found = users.find((u) => u.email === email);
  if (found) return { id: found.id, tempPassword: null };
  throw new Error("Impossible de creer ou retrouver le compte invite");
}

export async function inviteStakeholderAction(projectId: string, stakeholderId: string): Promise<void> {
  await assertManager(projectId);
  await inviteStakeholder(
    {
      prisma,
      createOrGetUser,
      sendEmail: (p) => sendEmail(p as Parameters<typeof sendEmail>[0]),
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://diagnostic.embraceia.com",
    },
    stakeholderId,
  );
  revalidatePath(`/fr/scoping/${projectId}`);
  revalidatePath(`/en/scoping/${projectId}`);
}
