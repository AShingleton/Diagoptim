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

const TRUE_NORTH_LABEL: Record<string, string> = { human: "Développement humain", quality: "Qualité", delivery: "Ponctualité", cost: "Coût" };
const VALUE_STREAM_LABEL: Record<string, string> = { demand: "Demand", delivery: "Delivery", development: "Development", support: "Support" };
const STEEPLE_ROWS: Array<[string, keyof NonNullable<NonNullable<import("@/lib/ai/engine").ScopingSynthesis["strategic"]>["steeple"]>]> = [
  ["Société", "social"], ["Technologie", "technological"], ["Économie", "economic"],
  ["Environnement", "environmental"], ["Politique", "political"], ["Légal", "legal"], ["Éthique", "ethical"],
];

function Pill({ label, on }: { label: string; on: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-center text-sm ${on ? "border-primary bg-primary text-primary-foreground font-semibold" : "border-border/60 bg-card text-muted-foreground"}`}>
      {label}
    </div>
  );
}

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
  const strat = synth.strategic;
  const om = synth.operatingModel;
  const NIVEAU_STYLE: Record<string, string> = { faible: "bg-red-500/15 text-red-600", moyen: "bg-amber-500/15 text-amber-600", eleve: "bg-emerald-500/15 text-emerald-600" };
  const NIVEAU_LBL: Record<string, string> = { faible: "Faible", moyen: "Moyen", eleve: "Élevé" };
  const VS_STYLE: Record<string, string> = { VA: "bg-emerald-500/20 text-emerald-700", NVA: "bg-red-500/20 text-red-700", NVA_necessaire: "bg-amber-500/20 text-amber-700" };
  const VS_LBL: Record<string, string> = { VA: "Valeur ajoutée", NVA: "Gaspillage", NVA_necessaire: "Non-valeur nécessaire" };
  const auto = synth.automatisation;
  const MODE_STYLE: Record<string, string> = {
    automatisable: "bg-primary/15 text-primary",
    assiste: "bg-amber-500/15 text-amber-600",
    humain: "bg-sky-500/15 text-sky-600",
  };
  const MODE_LBL: Record<string, string> = { automatisable: "Automatisable", assiste: "Assisté par IA", humain: "Humain dans la boucle" };

  return (
    <div className="mx-auto max-w-5xl p-6">
      <Link href={`/${locale}/scoping/${id}`} className="text-sm text-muted-foreground hover:underline">&larr; Retour au projet</Link>
      <h1 className="mt-2 text-2xl font-bold">Synthèse — {project.name}</h1>
      <div className="mt-3 flex flex-wrap gap-3">
        <a href={`/${locale}/scoping/${id}/export/pdf`} className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-sm text-primary hover:border-primary">↓ PDF</a>
        <a href={`/${locale}/scoping/${id}/export/pptx`} className="rounded-lg border border-border/60 bg-card px-3 py-1.5 text-sm text-primary hover:border-primary">↓ PowerPoint</a>
      </div>

      {/* Strategic layer — rendered only when a direction respondent supplied it */}
      {strat && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Cadrage stratégique</h2>

          {strat.hoshin && (
            <div className="mt-3 rounded-xl border border-primary/40 bg-card p-4">
              <div className="text-sm font-semibold text-primary">Alignement stratégique (Hoshin)</div>
              <div className="mt-2 text-sm">
                <span className="font-medium text-foreground">Objectif (12-18 mois) :</span>{" "}
                <span className="text-muted-foreground">{strat.hoshin.objective}</span>
              </div>
              {strat.hoshin.trueNorth && (
                <div className="mt-1 text-sm">
                  <span className="font-medium text-foreground">Indicateur True North :</span>{" "}
                  <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-primary">{TRUE_NORTH_LABEL[strat.hoshin.trueNorth] ?? strat.hoshin.trueNorth}</span>
                </div>
              )}
              {strat.hoshin.breakthroughs?.length ? (
                <div className="mt-2">
                  <div className="text-sm font-medium text-foreground">Percées prioritaires</div>
                  <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                    {strat.hoshin.breakthroughs.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              ) : null}
              {strat.hoshin.alignment && (
                <p className="mt-2 text-xs italic text-muted-foreground">Lien projet ↔ stratégie : {strat.hoshin.alignment}</p>
              )}
            </div>
          )}

          {strat.steeple && (
            <div className="mt-3">
              <h3 className="text-base font-semibold text-foreground">Contexte STEEPLE</h3>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {STEEPLE_ROWS.map(([label, key]) =>
                  strat.steeple![key] ? (
                    <div key={key} className="rounded-lg border border-border/60 bg-card p-3 text-sm">
                      <span className="font-medium text-foreground">{label}</span>
                      <span className="text-muted-foreground"> — {strat.steeple![key]}</span>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}

          {strat.swot && (
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">SWOT / TOWS</h3>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {([
                  ["Forces", strat.swot.strengths, "border-emerald-500/50"],
                  ["Faiblesses", strat.swot.weaknesses, "border-orange-500/50"],
                  ["Opportunités", strat.swot.opportunities, "border-sky-500/50"],
                  ["Menaces", strat.swot.threats, "border-red-500/50"],
                ] as Array<[string, string[], string]>).map(([label, arr, border]) => (
                  <div key={label} className={`rounded-xl border-2 bg-card p-3 ${border}`}>
                    <div className="text-sm font-semibold text-foreground">{label}</div>
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {(arr?.length ? arr : ["—"]).map((it, i) => <li key={i}>{it}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {strat.sbs && (
            <div className="mt-4 rounded-xl border border-border/60 bg-card p-4">
              <h3 className="text-base font-semibold text-foreground">Positionnement SBS</h3>
              <div className="mt-2 text-xs font-medium uppercase tracking-wide text-primary">True North</div>
              <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["human", "quality", "delivery", "cost"] as const).map((k) => (
                  <Pill key={k} label={TRUE_NORTH_LABEL[k]} on={k === strat.hoshin?.trueNorth} />
                ))}
              </div>
              <div className="mt-3 text-xs font-medium uppercase tracking-wide text-primary">Chaîne de valeur du projet</div>
              <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(["demand", "delivery", "development", "support"] as const).map((k) => (
                  <Pill key={k} label={VALUE_STREAM_LABEL[k]} on={k === strat.sbs!.valueStream} />
                ))}
              </div>
              {strat.sbs.rationale && <p className="mt-3 text-sm text-muted-foreground"><span className="font-medium text-foreground">Pourquoi :</span> {strat.sbs.rationale}</p>}
            </div>
          )}
        </section>
      )}

      {/* Operating-model layer — rendered only when collected (modele_operatoire+) */}
      {om && (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Modèle opératoire</h2>
          {om.reviewMaturity?.length ? (
            <div className="mt-3">
              <h3 className="text-base font-semibold text-foreground">État actuel — matrice de maturité (reView)</h3>
              <div className="mt-2 grid gap-2">
                {om.reviewMaturity.map((r, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2">
                    <span className="min-w-40 font-medium text-foreground">{r.dimension}</span>
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${NIVEAU_STYLE[r.niveau] ?? "bg-muted"}`}>{NIVEAU_LBL[r.niveau] ?? r.niveau}</span>
                    <span className="flex-1 text-sm text-muted-foreground">{r.soWhat}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {om.sipoc && (
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">SIPOC</h3>
              <div className="mt-2 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {([["Suppliers", om.sipoc.suppliers], ["Inputs", om.sipoc.inputs], ["Process", om.sipoc.process], ["Outputs", om.sipoc.outputs], ["Customers", om.sipoc.customers]] as Array<[string, string[]]>).map(([h, arr]) => (
                  <div key={h} className="rounded-lg border border-border/60 bg-card p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-primary">{h}</div>
                    <ul className="mt-1 list-disc pl-4 text-sm text-muted-foreground">
                      {(arr?.length ? arr : ["—"]).map((it, i) => <li key={i}>{it}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
          {om.valueStream?.steps?.length ? (
            <div className="mt-4">
              <h3 className="text-base font-semibold text-foreground">Chaîne de valeur — flux &amp; goulot</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {om.valueStream.steps.map((st, i) => (
                  <span key={i} className={`rounded-lg px-3 py-2 text-sm font-medium ${VS_STYLE[st.type] ?? "bg-muted"}`}>{st.nom}</span>
                ))}
              </div>
              {om.valueStream.bottleneck && <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Goulot :</span> {om.valueStream.bottleneck}</p>}
              {om.valueStream.leadTimeNote && <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">Délai vs temps utile :</span> {om.valueStream.leadTimeNote}</p>}
            </div>
          ) : null}
        </section>
      )}

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
      {auto?.taches?.length ? (
        <Block title="Automatisabilité des tâches">
          <ul className="grid gap-2">
            {auto.taches.map((t, i) => (
              <li key={i} className="rounded-lg border border-border/60 bg-card px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-foreground">{t.tache}</span>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${MODE_STYLE[t.mode] ?? "bg-muted text-muted-foreground"}`}>{MODE_LBL[t.mode] ?? t.mode}</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>volume {t.volume}</span>·<span>standardisation {t.standardisation}</span>·<span>{t.nature}</span>
                  <span className="ml-auto flex items-center gap-1">
                    <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, t.score))}%` }} /></span>
                    <span className="tabular-nums">{t.score}/100</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {auto.dataReadiness && <p className="mt-2 text-sm text-muted-foreground"><span className="font-medium text-foreground">Disponibilité des données :</span> {auto.dataReadiness}</p>}
          {auto.synthese && <p className="mt-1 text-sm text-muted-foreground"><span className="font-medium text-foreground">Par où commencer :</span> {auto.synthese}</p>}
        </Block>
      ) : null}
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
