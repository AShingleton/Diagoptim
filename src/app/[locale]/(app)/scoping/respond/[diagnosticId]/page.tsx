import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/scoping/bootstrap";
import { canAccessDiagnostic } from "@/lib/diagnostic/access";
import { QuestionEngine } from "@/lib/diagnostic/question-engine";
import { AnswerForm } from "./AnswerForm";
import { submitScopingAnswer } from "./actions";

export const dynamic = "force-dynamic";

export default async function RespondPage({
  params,
}: {
  params: Promise<{ locale: string; diagnosticId: string }>;
}) {
  const { locale, diagnosticId } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  await ensureUser(prisma, user);
  if (!(await canAccessDiagnostic(prisma, diagnosticId, user.id))) redirect(`/${locale}/scoping`);

  const engine = new QuestionEngine(prisma);
  const next = await engine.getNextQuestion(diagnosticId);

  if (next.isComplete || !next.question) {
    return (
      <div className="mx-auto max-w-2xl p-6 text-center">
        <h1 className="text-2xl font-bold">Merci !</h1>
        <p className="mt-3 text-muted-foreground">
          Votre point de vue a bien été enregistré. Il alimentera l&apos;analyse (Ishikawa 6M) et le cahier des charges du projet. Vous pouvez fermer cette page.
        </p>
      </div>
    );
  }

  const q = next.question;
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Cadrage automatisation — votre avis</span>
          <span>{next.progressPercent}%</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${next.progressPercent}%` }} />
        </div>
      </div>
      <h1 className="text-xl font-semibold">{q.textFr}</h1>
      {q.hintFr && <p className="mt-1 text-sm text-muted-foreground">{q.hintFr}</p>}
      <AnswerForm action={submitScopingAnswer.bind(null, diagnosticId, q.id)} />
    </div>
  );
}
