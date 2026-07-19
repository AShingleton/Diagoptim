import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/supabase/server";
import { canManageProject, getProjectDetail } from "@/lib/scoping/service";
import { AddStakeholderForm } from "./AddStakeholderForm";
import { InviteButton } from "./InviteButton";
import { SynthesisButton } from "./SynthesisButton";
import { addStakeholderAction, inviteStakeholderAction, generateSynthesisAction } from "./actions";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default async function ScopingProjectPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (!(await canManageProject(prisma, id, user.id))) notFound();
  const project = await getProjectDetail(prisma, id);
  if (!project) notFound();

  const { completed, required, ready } = project.completion;
  const pct = required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 0;
  const parents = project.stakeholders.map((s) => ({ id: s.id, fullName: s.fullName }));

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link href={`/${locale}/scoping`} className="text-sm text-muted-foreground hover:underline">&larr; Tous les cadrages</Link>
      <h1 className="mt-2 text-2xl font-bold">{project.name}</h1>

      <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Complétude du panel</span>
          <span className="text-muted-foreground">{completed} / {required} avis recueillis</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
        {ready && <p className="mt-2 text-sm font-medium text-green-600">Prêt pour la synthèse (Ishikawa 6M + cahier des charges) — à venir.</p>}
        <div className="mt-3 flex items-center gap-3">
          {project.completion.completed >= 1 && (
            <SynthesisButton
              action={generateSynthesisAction.bind(null, id, locale)}
              label={project.status === "synthesized" ? "Régénérer la synthèse" : "Générer la synthèse (Ishikawa + cahier des charges)"}
            />
          )}
          {project.status === "synthesized" && (
            <Link href={`/${locale}/scoping/${id}/synthese`} className="text-sm text-primary hover:underline">
              Voir la synthèse
            </Link>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Ajouter une partie prenante</h2>
      <div className="mt-3">
        <AddStakeholderForm action={addStakeholderAction.bind(null, id)} parents={parents} />
      </div>

      <h2 className="mt-8 text-lg font-semibold">Panel ({project.stakeholders.length})</h2>
      {project.stakeholders.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Aucune partie prenante. Ajoutez-en ci-dessus.</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {project.stakeholders.map((s) => (
            <li key={s.id} className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-3">
              <div>
                <div className="font-medium">{s.fullName} <span className="text-xs font-normal text-muted-foreground">· {s.roleLabel}</span></div>
                <div className="text-xs text-muted-foreground">
                  {s.email}
                  {s.hierarchyParent ? ` · sous ${s.hierarchyParent.fullName}` : ""}
                  {` · ${s.diagnostic?.status === "completed" ? "avis recueilli" : s.inviteStatus}`}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {s.diagnosticId && (
                  <Link
                    href={`/${locale}/scoping/respond/${s.diagnosticId}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Ouvrir le dialogue
                  </Link>
                )}
                <InviteButton action={inviteStakeholderAction.bind(null, id, s.id)} status={s.inviteStatus} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
