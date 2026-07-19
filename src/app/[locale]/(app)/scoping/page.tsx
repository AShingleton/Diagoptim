import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/scoping/bootstrap";
import { listProjects } from "@/lib/scoping/service";
import { NewProjectForm } from "./NewProjectForm";
import { createProjectAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function ScopingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/${locale}/login`);
  await ensureUser(prisma, user);
  const projects = await listProjects(prisma, user.id);

  return (
    <div className="mx-auto max-w-4xl p-6">
      <h1 className="text-2xl font-bold">Cadrages automatisation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Créez un projet de cadrage, définissez le panel de parties prenantes, et recueillez leurs avis (dialogue 6M) pour bâtir le cahier des charges.
      </p>

      <div className="mt-6">
        <NewProjectForm action={createProjectAction} />
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold">Vos projets ({projects.length})</h2>
        {projects.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Aucun projet pour l'instant. Créez-en un ci-dessus.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {projects.map((p: { id: string; name: string; status: string; requiredRespondents: number; _count?: { stakeholders: number } }) => (
              <li key={p.id}>
                <Link
                  href={`/${locale}/scoping/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-4 py-3 transition hover:border-ring"
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {p._count?.stakeholders ?? 0} partie(s) prenante(s) · {p.requiredRespondents} avis requis · {p.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
