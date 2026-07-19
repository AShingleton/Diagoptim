import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/supabase/server";
import { canManageProject } from "@/lib/scoping/service";
import { getStoredSynthesis } from "@/lib/scoping/synthesis";
import { synthesisToPptx } from "@/lib/scoping/export-pptx";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ locale: string; id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!(await canManageProject(prisma, id, user.id))) return new NextResponse("Forbidden", { status: 403 });
  const project = await prisma.scopingProject.findUnique({ where: { id }, select: { name: true } });
  const synth = await getStoredSynthesis(prisma, id);
  if (!project || !synth) return new NextResponse("Not found", { status: 404 });
  const buf = await synthesisToPptx(synth, project.name);
  const slug = project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="cahier-des-charges-${slug}.pptx"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
