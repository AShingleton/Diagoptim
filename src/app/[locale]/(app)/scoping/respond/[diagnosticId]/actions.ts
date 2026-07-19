"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/scoping/bootstrap";
import { canAccessDiagnostic } from "@/lib/diagnostic/access";
import { QuestionEngine } from "@/lib/diagnostic/question-engine";

export async function submitScopingAnswer(
  diagnosticId: string,
  questionKey: string,
  formData: FormData,
): Promise<void> {
  const user = await getSessionUser();
  if (!user) throw new Error("Non authentifie");
  await ensureUser(prisma, user);
  if (!(await canAccessDiagnostic(prisma, diagnosticId, user.id))) throw new Error("Acces refuse");
  const answer = String(formData.get("answer") ?? "").trim();
  if (!answer) return;
  const engine = new QuestionEngine(prisma);
  await engine.submitAnswer(diagnosticId, questionKey, answer);
  revalidatePath(`/fr/scoping/respond/${diagnosticId}`);
  revalidatePath(`/en/scoping/respond/${diagnosticId}`);
}
