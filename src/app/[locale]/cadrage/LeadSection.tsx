"use client";

import { useMemo, useState, useTransition } from "react";
import { submitLead } from "./actions";

const ORANGE = "#F06020";

const QUESTIONS: Array<{ q: string; opts: Array<{ label: string; pts: number }> }> = [
  { q: "Avez-vous identifié les tâches à automatiser en priorité ?", opts: [
    { label: "Pas encore", pts: 0 }, { label: "En partie", pts: 1 }, { label: "Oui, clairement", pts: 2 } ] },
  { q: "Vos données sont-elles centralisées et exploitables ?", opts: [
    { label: "Dispersées (papier, fichiers, outils)", pts: 0 }, { label: "Partiellement", pts: 1 }, { label: "Centralisées et propres", pts: 2 } ] },
  { q: "Votre équipe est-elle à l'aise avec les outils numériques ?", opts: [
    { label: "Peu", pts: 0 }, { label: "Moyennement", pts: 1 }, { label: "Très à l'aise", pts: 2 } ] },
  { q: "Avez-vous une feuille de route IA / automatisation ?", opts: [
    { label: "Aucune", pts: 0 }, { label: "Une intention, rien de formalisé", pts: 1 }, { label: "Oui, formalisée", pts: 2 } ] },
];

function tierFor(score: number): { name: string; blurb: string } {
  if (score <= 2) return { name: "Exploration", blurb: "Vous démarrez. Le cadrage vous évite de partir dans tous les sens et sécurise votre premier investissement IA." };
  if (score <= 5) return { name: "En marche", blurb: "Des briques sont en place. Le cadrage priorise, chiffre le ROI et transforme l'intention en plan d'action." };
  return { name: "Accélération", blurb: "Vous êtes mûr. Le cadrage transforme votre ambition en roadmap actionnable, avec les tâches à automatiser et par où commencer." };
}

export function LeadSection() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = Object.keys(answers).length;
  const score = useMemo(() => Object.values(answers).reduce((a, b) => a + b, 0), [answers]);
  const tier = tierFor(score);
  const quizComplete = answered === QUESTIONS.length;

  function onSubmit(fd: FormData) {
    setError(null);
    fd.set("score", String(score));
    fd.set("tier", tier.name);
    start(async () => {
      const r = await submitLead(fd);
      if (r.ok) setDone(true);
      else setError(r.error ?? "Une erreur est survenue.");
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border-2 p-8 text-center" style={{ borderColor: ORANGE, background: "#FFF7F2" }}>
        <div className="text-2xl font-bold" style={{ color: ORANGE }}>Merci !</div>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Votre demande est enregistrée. Anthony vous recontacte sous 48 h ouvrées pour caler votre diagnostic de cadrage IA.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Quiz */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-wide" style={{ color: ORANGE }}>Test express — 30 secondes</div>
        <h3 className="mt-1 text-xl font-bold text-slate-900">Quelle est votre maturité IA ?</h3>
        <div className="mt-5 grid gap-5">
          {QUESTIONS.map((item, qi) => (
            <div key={qi}>
              <div className="text-sm font-medium text-slate-800">{qi + 1}. {item.q}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.opts.map((o, oi) => {
                  const on = answers[qi] === o.pts && (answers[qi] !== undefined);
                  const selected = answers[qi] !== undefined && item.opts.findIndex((x) => x.pts === answers[qi]) === oi;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => setAnswers((a) => ({ ...a, [qi]: o.pts }))}
                      className="rounded-full border px-3 py-1.5 text-sm transition"
                      style={selected ? { background: ORANGE, borderColor: ORANGE, color: "white" } : { borderColor: "#e2e8f0", color: "#334155" }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {quizComplete && (
          <div className="mt-5 rounded-xl p-4" style={{ background: "#FFF7F2" }}>
            <div className="text-sm text-slate-500">Votre niveau</div>
            <div className="text-lg font-bold" style={{ color: ORANGE }}>{tier.name} · {score}/8</div>
            <p className="mt-1 text-sm text-slate-600">{tier.blurb}</p>
          </div>
        )}
      </div>

      {/* Lead form */}
      <div className="rounded-2xl border-2 p-6" style={{ borderColor: ORANGE, background: "white" }}>
        <h3 className="text-xl font-bold text-slate-900">Demander mon diagnostic de cadrage</h3>
        <p className="mt-1 text-sm text-slate-600">On revient vers vous sous 48 h. Sans engagement.</p>
        <form action={onSubmit} className="mt-4 grid gap-3">
          <input name="name" required placeholder="Nom complet" className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-[color:var(--o)]" style={{ ["--o" as string]: ORANGE }} />
          <input name="company" required placeholder="Entreprise" className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none" />
          <input name="email" type="email" required placeholder="Email professionnel" className="h-11 rounded-lg border border-slate-300 px-3 text-sm outline-none" />
          <textarea name="message" rows={3} placeholder="En une phrase, ce que vous aimeriez automatiser ou améliorer (optionnel)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={pending} className="mt-1 h-11 rounded-lg font-semibold text-white transition disabled:opacity-60" style={{ background: ORANGE }}>
            {pending ? "Envoi…" : "Demander mon diagnostic"}
          </button>
          <p className="text-xs text-slate-400">Vos données servent uniquement à vous recontacter (RGPD). Aucune revente.</p>
        </form>
      </div>
    </div>
  );
}
