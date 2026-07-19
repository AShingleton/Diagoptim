import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/supabase/server";
import { canManageProject } from "@/lib/scoping/service";
import { getStoredSynthesis } from "@/lib/scoping/synthesis";
import { synthesisToPdf } from "@/lib/scoping/export-pdf";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!(await canManageProject(prisma, id, user.id))) return new NextResponse("Forbidden", { status: 403 });
  const project = await prisma.scopingProject.findUnique({ where: { id }, select: { name: true } });
  const synth = await getStoredSynthesis(prisma, id);
  if (!project || !synth) return new NextResponse("Not found", { status: 404 });
  const bytes = synthesisToPdf(synth, project.name);
  const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cahier-des-charges-${slug}.pdf"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
