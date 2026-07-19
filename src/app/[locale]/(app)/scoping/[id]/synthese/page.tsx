import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/supabase/server";
import { canManageProject, getProjectDetail } from "@/lib/scoping/service";
import { getStoredSynthesis } from "@/lib/scoping/synthesis";
import { fishbonePngDataUri } from "@/lib/scoping/fishbone-image";
import { Prose } from "@/components/scoping/Prose";

export const dynamic = "force-dynamic";

const M_LABEL: Record<string, string> = {
  man: "Main d'œuvre", machine: "Machines", method: "Méthodes",
  material: "Matières", measurement: "Mesure", environment: "Milieu",
};

function Card({ label, children, accent }: { label: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${accent ? "border-primary/40" : "border-border/60"}`}>
      <div className="text-sm font-semibold text-foreground">{label}</div>
      <div className="mt-2 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
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
    <div className="mx-auto max-w-5xl p-6">
      <Link href={`/${locale}/scoping/${id}`} className="text-sm text-muted-foreground hover:underline">&larr; Retour au projet</Link>
      <h1 className="mt-2 text-2xl font-bold">Synthèse — {project.name}</h1>
      <div className="mt-3 flex flex-wrap gap-3">
        <a href={`/${locale}/scoping/${id}/export/pdf`} className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-sm text-primary hover:border-primary">↓ PDF</a>
        <a href={`/${locale}/scoping/${id}/export/pptx`} className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-sm text-primary hover:border-primary">↓ PowerPoint</a>
      </div>

      {/* A3 boxes 1-4 as a grid of cards */}
      <h2 className="mt-8 text-xl font-bold">Analyse A3</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Card label="Boîte 1 · Contexte"><Prose text={a3.background} /></Card>
        <Card label="Boîte 2 · Problème / état actuel"><Prose text={a3.problemStatement} /></Card>
        <Card label="Boîte 3 · Objectif cible"><Prose text={a3.goal} /></Card>
        <Card label="Boîte 4 · Causes racines" accent><Prose text={a3.rootCauseAnalysis} /></Card>
      </div>

      {/* Ishikawa as a fishbone diagram + 6M detail */}
      <h2 className="mt-10 text-xl font-bold">Ishikawa 6M</h2>
      <p className="mt-1 text-sm text-muted-foreground">{ishikawa.problem}</p>
      <div className="mt-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={fishbonePngDataUri(ishikawa)}
          alt="Diagramme d'Ishikawa 6M"
          className="w-full rounded-xl border border-border/60 bg-white"
        />
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">Détail des causes par catégorie</summary>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(M_LABEL) as Array<keyof typeof ishikawa.causes>).map((k) => (
            <div key={k} className="rounded-lg border border-border/60 bg-card p-3">
              <div className="text-sm font-medium text-foreground">{M_LABEL[k]}</div>
              <ul className="mt-1 list-disc pl-4 text-sm text-muted-foreground">
                {ishikawa.causes[k].length ? ishikawa.causes[k].map((c, i) => <li key={i}>{c}</li>) : <li className="list-none text-muted-foreground/60">—</li>}
              </ul>
            </div>
          ))}
        </div>
      </details>

      {/* Cahier des charges */}
      <h2 className="mt-10 border-t border-border/60 pt-6 text-xl font-bold">Cahier des charges — automatisation / agent IA</h2>
      <Block title="Contexte & objectifs"><Prose text={cdc.contexte} /></Block>
      <Block title="Périmètre fonctionnel"><Prose text={cdc.perimetre} /></Block>
      <Block title="Tâches à automatiser (priorisées)">
        <ul className="grid gap-2">
          {cdc.tachesAAutomatiser.map((t, i) => (
            <li key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2">
              <span className="font-medium text-foreground">{t.tache}</span>
              <span className="text-xs"> — {t.frequence} · priorité {t.priorite}</span>
            </li>
          ))}
        </ul>
      </Block>
      <Block title="Cas d'usage agent IA">
        <ul className="grid gap-2">
          {cdc.casUsageAgentIA.map((c, i) => (
            <li key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2">
              <span className="font-medium text-foreground">{c.processus}</span> : {c.usage}
              <div className="mt-0.5 text-xs">Causes traitées : {c.causesTraitees}</div>
            </li>
          ))}
        </ul>
      </Block>
      <Block title="Données & intégrations"><Prose text={cdc.donneesEtIntegrations} /></Block>
      <Block title="Contraintes & risques"><Prose text={cdc.contraintesEtRisques} /></Block>
      <Block title="Points de vue par rôle">
        <ul className="grid gap-2">
          {cdc.pointsDeVueParRole.map((r, i) => (
            <li key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2">
              <span className="font-medium text-foreground">{r.role}</span> : {r.synthese}
            </li>
          ))}
        </ul>
      </Block>
      <Block title="Priorisation & roadmap"><Prose text={cdc.priorisation} /></Block>
      <Block title="Critères de recette"><Prose text={cdc.criteresDeRecette} /></Block>
    </div>
  );
}
