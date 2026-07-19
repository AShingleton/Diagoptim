import { NextResponse } from "next/server";
import { fishbonePngBuffer } from "@/lib/scoping/fishbone-image";
import type { ScopingSynthesis } from "@/lib/ai/engine";

// TEMPORARY diagnostic route — renders the fishbone on Vercel with sample data so
// the font/text rendering can be verified in the real serverless environment.
// Delete after verification.
export const dynamic = "force-dynamic";

export async function GET() {
  const ishikawa: ScopingSynthesis["ishikawa"] = {
    problem: "Trop de temps perdu sur la prise de commande et la gestion des stocks a la boulangerie",
    rootCause: "Absence d'outil numerique centralise pour commandes, stock et caisse",
    causes: {
      man: ["Personnel non forme au nouvel outil", "Turnover eleve en periode de rush", "Manque de polyvalence"],
      method: ["Prise de commande manuelle sur papier", "Pas de procedure standardisee", "Double saisie caisse/compta"],
      measurement: ["Aucun indicateur de gaspillage", "Stock non suivi en temps reel"],
      machine: ["Caisse ancienne sans export", "Pas de logiciel de gestion"],
      material: ["Ruptures d'ingredients frequentes", "Perte matiere premiere non tracee"],
      environment: ["Pics d'affluence 7h-9h", "Local exigu en arriere-boutique"],
    },
  } as ScopingSynthesis["ishikawa"];
  const png = fishbonePngBuffer(ishikawa);
  return new NextResponse(new Uint8Array(png), {
    headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
  });
}
