/**
 * GET  /api/company/profile - Get the authenticated user's company profile
 * POST /api/company/profile - Create or update (upsert) the company profile
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const companyUpsertSchema = z.object({
  name: z.string().min(1),
  siret: z.string().optional().default(''),
  sector: z.string().optional().default(''),
  subsector: z.string().optional().default(''),
  productsDescription: z.string().optional().default(''),
  location: z.string().optional().default(''),
  employeeCount: z.number().int().min(0).optional().default(0),
  annualRevenue: z.number().min(0).optional().default(0),
  clientCount: z.number().int().min(0).optional().default(0),
  competitors: z.array(z.string()).optional().default([]),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const company = await prisma.company.findFirst({
      where: { userId },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ data: company });
  } catch (error) {
    console.error('[GET /api/company/profile]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = companyUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Check if the user already has a company
    const existing = await prisma.company.findFirst({
      where: { userId },
    });

    let company;
    if (existing) {
      company = await prisma.company.update({
        where: { id: existing.id },
        data,
      });
    } else {
      company = await prisma.company.create({
        data: {
          ...data,
          userId,
        },
      });
    }

    return NextResponse.json(
      { data: company },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    console.error('[POST /api/company/profile]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
