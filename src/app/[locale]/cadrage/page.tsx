import type { Metadata } from "next";
import { EMBRACEIA_LOGO_DATAURI } from "@/lib/scoping/brand";
import { LeadSection } from "./LeadSection";

export const metadata: Metadata = {
  title: "Diagnostic de cadrage IA pour PME — EmbraceIA",
  description:
    "Vous savez que l'IA peut vous aider, mais pas par où commencer ? En une séance guidée, on identifie quoi automatiser, comment, et on repart avec un cahier des charges + une roadmap.",
};

const ORANGE = "#F06020";

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto w-full max-w-5xl px-6 ${className}`}>{children}</section>;
}

const STEPS = [
  { n: "1", t: "On dialogue avec vos équipes", d: "Un questionnaire guidé interroge les bonnes personnes (dirigeant, encadrement, terrain) — chacun sur ce qu'il connaît, sans jargon." },
  { n: "2", t: "On analyse avec méthode", d: "A3, Ishikawa 6M, 5W2H, gaspillages Lean : vos points de douleur sont croisés et remontés jusqu'aux causes racines." },
  { n: "3", t: "Vous repartez avec un plan", d: "Cahier des charges, roadmap, matrice des tâches à automatiser et cas d'usage IA — en PDF et PowerPoint." },
];

const DELIVERABLES = [
  { t: "Cahier des charges", d: "Ce qu'il faut automatiser, avec quel agent IA, et les critères de succès." },
  { t: "Matrice d'automatisabilité", d: "Chaque tâche notée (volume × standardisation) : par où commencer, en toute sécurité." },
  { t: "Analyse A3 + Ishikawa", d: "Le vrai problème et ses causes racines, visuellement, pas des généralités." },
  { t: "Roadmap priorisée", d: "Un séquencement en phases, avec les gains attendus." },
  { t: "Cadrage stratégique", d: "Contexte STEEPLE, alignement Hoshin, positionnement — quand l'enjeu est stratégique." },
  { t: "Livrables prêts à présenter", d: "PDF + PowerPoint à la charte, à partager avec vos associés ou votre comité." },
];

export default function CadrageLanding() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Hero */}
      <div style={{ background: `linear-gradient(160deg, ${ORANGE} 0%, #C74E17 100%)` }} className="text-white">
        <Section className="py-16 md:py-24">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={EMBRACEIA_LOGO_DATAURI} alt="EmbraceIA" className="h-full w-full object-contain" />
            </span>
            <span className="text-lg font-semibold tracking-tight">EmbraceIA</span>
          </div>
          <h1 className="mt-8 max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
            L'IA peut vous faire gagner du temps. Encore faut-il savoir par où commencer.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-white/90">
            Le <strong>Diagnostic de cadrage IA</strong> d'EmbraceIA : une séance guidée qui transforme « on devrait s'y mettre »
            en un plan clair — quoi automatiser, comment, et dans quel ordre.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#demander" className="rounded-lg bg-white px-6 py-3 font-semibold" style={{ color: ORANGE }}>
              Demander mon diagnostic
            </a>
            <a href="#comment" className="rounded-lg border border-white/50 px-6 py-3 font-semibold text-white">
              Comment ça marche
            </a>
          </div>
        </Section>
      </div>

      {/* Problème → agitation */}
      <Section className="py-16">
        <h2 className="text-2xl font-bold md:text-3xl">Vous n'avez pas un problème d'IA. Vous avez un problème de cadrage.</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["« Je ne sais pas quoi automatiser »", "Les idées ne manquent pas, mais lesquelles rapportent vraiment, et par où commencer sans risque ?"],
            ["« J'ai peur de mal investir »", "Un outil mal choisi, c'est du temps et de l'argent perdus — et une équipe qui décroche."],
            ["« Tout le monde a un avis différent »", "Dirigeant, encadrement, terrain : sans méthode pour croiser les points de vue, ça tourne en rond."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="font-semibold text-slate-900">{t}</div>
              <p className="mt-2 text-sm text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Comment ça marche */}
      <div id="comment" className="bg-slate-50">
        <Section className="py-16">
          <h2 className="text-2xl font-bold md:text-3xl">Une méthode, trois étapes</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white" style={{ background: ORANGE }}>{s.n}</div>
                <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.d}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Livrables */}
      <Section className="py-16">
        <h2 className="text-2xl font-bold md:text-3xl">Ce que vous repartez avec</h2>
        <p className="mt-2 max-w-2xl text-slate-600">Pas une note d'intention. Des livrables concrets, prêts à décider et à agir.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DELIVERABLES.map((d) => (
            <div key={d.t} className="rounded-xl border border-slate-200 p-5">
              <div className="h-1 w-10 rounded-full" style={{ background: ORANGE }} />
              <div className="mt-3 font-semibold text-slate-900">{d.t}</div>
              <p className="mt-1 text-sm text-slate-600">{d.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Méthode / crédibilité */}
      <div style={{ background: "#FFF7F2" }}>
        <Section className="py-14">
          <div className="grid items-center gap-8 md:grid-cols-[1.2fr_1fr]">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl">Une méthode éprouvée, pas un gadget</h2>
              <p className="mt-3 text-slate-700">
                Le diagnostic s'appuie sur les mêmes cadres que l'excellence opérationnelle — <strong>Lean, Six Sigma, A3, Ishikawa</strong> —
                orchestrés par l'IA et traduits en langage clair. L'IA transforme et propose ; vous décidez.
              </p>
            </div>
            <ul className="grid gap-3">
              {["Multi-parties prenantes : les bonnes questions aux bonnes personnes", "Analyse jusqu'aux causes racines, pas aux symptômes", "Chiffrage du ROI et priorisation par la valeur", "Confidentialité et RGPD respectés"].map((li) => (
                <li key={li} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full" style={{ background: ORANGE }} />{li}
                </li>
              ))}
            </ul>
          </div>
        </Section>
      </div>

      {/* Quiz + lead form */}
      <Section className="py-16" >
        <div id="demander" className="scroll-mt-8">
          <h2 className="text-2xl font-bold md:text-3xl">Testez votre maturité, puis demandez votre diagnostic</h2>
          <p className="mt-2 max-w-2xl text-slate-600">30 secondes pour situer votre point de départ. Le diagnostic complet fait le reste.</p>
          <div className="mt-8">
            <LeadSection />
          </div>
        </div>
      </Section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        EmbraceIA — Excellence opérationnelle &amp; IA · <a href="https://www.embraceia.com" className="underline">embraceIA.com</a>
      </footer>
    </main>
  );
}
