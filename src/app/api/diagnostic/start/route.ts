/**
 * POST /api/diagnostic/start
 * Start a new diagnostic for a company. Creates the Diagnostic record
 * and returns the first set of framing questions.
 */
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { DiagnosticType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { QuestionEngine } from '@/lib/diagnostic/question-engine';

const startDiagnosticSchema = z.object({
  companyId: z.string().uuid(),
  type: z.enum(['full', 'waste', 'strategy', 'quick', 'automation_scoping']),
  targetAmount: z.number().positive(),
  targetType: z.enum(['revenue_increase', 'cost_reduction']),
  targetTimeMonths: z.number().int().min(1).max(60),
  autonomyLevel: z.enum(['self', 'guided', 'accompanied']),
});

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = startDiagnosticSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation error', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { companyId, type, targetAmount, targetType, targetTimeMonths, autonomyLevel } = parsed.data;

    // Verify the company belongs to the authenticated user
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 },
      );
    }

    // Create diagnostic record
    const diagnostic = await prisma.diagnostic.create({
      data: {
        companyId,
        // Cast bridges the new 'automation_scoping' value until the Prisma
        // DiagnosticType enum migration lands in a later task.
        type: type as DiagnosticType,
        targetAmount,
        targetType,
        targetTimeMonths,
        autonomyLevel,
        currentPhase: 'framing',
        status: 'in_progress',
      },
    });

    // Get the first question
    const engine = new QuestionEngine(prisma);
    const firstQuestion = await engine.getNextQuestion(diagnostic.id);

    return NextResponse.json(
      {
        data: {
          diagnostic,
          ...firstQuestion,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('[POST /api/diagnostic/start]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
