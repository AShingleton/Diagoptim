import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/supabase/server";
import { canManageProject, getProjectDetail } from "@/lib/scoping/service";
import { getStoredSynthesis } from "@/lib/scoping/synthesis";

export const dynamic = "force-dynamic";

const M_LABEL: Record<string, string> = {
  man: "Main d'œuvre", machine: "Machines", method: "Méthodes",
  material: "Matières", measurement: "Mesure", environment: "Milieu",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

export default async function SynthesePage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  if (!(await canManageProject(prisma, id, user.id))) notFound();
  const project = await getProjectDetail(prisma, id);
  const synth = await getStoredSynthesis(prisma, id);
  if (!project || !synth) notFound();
  const { a3, ishikawa, cahierDesCharges: cdc } = synth;

  return (
    <div className="mx-auto max-w-4xl p-6">
      <Link href={`/${locale}/scoping/${id}`} className="text-sm text-muted-foreground hover:underline">&larr; Retour au projet</Link>
      <h1 className="mt-2 text-2xl font-bold">Synthèse — {project.name}</h1>

      <Section title="A3 · Boîte 1 — Contexte"><p>{a3.background}</p></Section>
      <Section title="A3 · Boîte 2 — Problème / état actuel"><p className="whitespace-pre-line">{a3.problemStatement}</p></Section>
      <Section title="A3 · Boîte 3 — Objectif cible"><p>{a3.goal}</p></Section>
      <Section title="A3 · Boîte 4 — Analyse des causes racines"><p className="whitespace-pre-line">{a3.rootCauseAnalysis}</p></Section>

      <Section title={`Ishikawa 6M — ${ishikawa.problem}`}>
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(M_LABEL) as Array<keyof typeof ishikawa.causes>).map((k) => (
            <div key={k} className="rounded-lg border border-border/60 bg-card p-3">
              <div className="text-sm font-medium text-foreground">{M_LABEL[k]}</div>
              <ul className="mt-1 list-disc pl-4">
                {ishikawa.causes[k].length ? ishikawa.causes[k].map((c, i) => <li key={i}>{c}</li>) : <li className="list-none text-muted-foreground/60">—</li>}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-3"><span className="font-medium text-foreground">Cause racine :</span> {ishikawa.rootCause}</p>
      </Section>

      <h2 className="mt-10 border-t border-border/60 pt-6 text-xl font-bold">Cahier des charges — automatisation / agent IA</h2>
      <Section title="Contexte & objectifs"><p>{cdc.contexte}</p></Section>
      <Section title="Périmètre fonctionnel"><p>{cdc.perimetre}</p></Section>
      <Section title="Tâches à automatiser (priorisées)">
        <ul className="grid gap-2">
          {cdc.tachesAAutomatiser.map((t, i) => (
            <li key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2">
              <span className="font-medium text-foreground">{t.tache}</span> — {t.frequence} · priorité {t.priorite}
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Cas d'usage agent IA">
        <ul className="grid gap-2">
          {cdc.casUsageAgentIA.map((c, i) => (
            <li key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2">
              <span className="font-medium text-foreground">{c.processus}</span> : {c.usage}<br />
              <span className="text-xs">Causes traitées : {c.causesTraitees}</span>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Données & intégrations"><p className="whitespace-pre-line">{cdc.donneesEtIntegrations}</p></Section>
      <Section title="Contraintes & risques"><p className="whitespace-pre-line">{cdc.contraintesEtRisques}</p></Section>
      <Section title="Points de vue par rôle">
        <ul className="grid gap-2">
          {cdc.pointsDeVueParRole.map((r, i) => (
            <li key={i}><span className="font-medium text-foreground">{r.role} :</span> {r.synthese}</li>
          ))}
        </ul>
      </Section>
      <Section title="Priorisation & roadmap"><p className="whitespace-pre-line">{cdc.priorisation}</p></Section>
      <Section title="Critères de recette"><p className="whitespace-pre-line">{cdc.criteresDeRecette}</p></Section>
    </div>
  );
}
