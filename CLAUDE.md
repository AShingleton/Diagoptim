# DiagOptimIA

Lean Management diagnostic SaaS for French SMBs (TPE/PME). Conversational Q&A engine assesses the 8 TIMWOODS wastes, generates scored insights, AI-powered recommendations, and a prioritised action roadmap.

**Owner:** Anthony Shingleton (EmbraceIA)
**Managed by:** Alice (Claude Code EA)
**Repo:** github.com/AShingleton/diagoptim
**Target deployment:** diagnostic.embraceia.com

---

## Tech Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16, React 19, TypeScript 5 |
| Styling | TailwindCSS 4, Framer Motion, shadcn/ui |
| State | Zustand (diagnosticStore, uiStore, userStore) |
| Database | PostgreSQL via Supabase (pgvector for RAG) |
| ORM | Prisma 6.3 (45 models) |
| Auth | Supabase Auth (email + Google OAuth) |
| AI | Claude API (Anthropic) — claude-sonnet-4-20250514 |
| Payments | Stripe (6 plans, 3 packs, Stripe Connect for affiliates) |
| Email | Brevo (transactional, 10 bilingual templates) |
| Analytics | PostHog (conditional on env var) |
| i18n | next-intl (FR + EN) |
| PWA | Service Worker, Web Push, IndexedDB offline sync |
| Tests | Vitest (unit), Playwright (E2E) |
| Deployment | Vercel (cdg1 — Paris) |

---

## Key Directories

```
src/
├── app/
│   ├── [locale]/           # i18n pages (fr/en)
│   │   ├── (app)/          # Authenticated: dashboard, diagnostic, roadmap, training, etc.
│   │   └── (auth)/         # Login, register, forgot-password, OAuth callback
│   ├── api/                # 54 API endpoints (auth, billing, diagnostic, documents, reports, rag, cron)
│   └── offline/            # PWA offline page
├── components/             # React components (ui/, diagnostic/, charts/, dashboard/, landing/, billing/)
├── lib/
│   ├── ai/                 # Claude API client, scoring, benchmarks, prompts
│   ├── diagnostic/         # Question engine, waste analyzer, decision tree, strategy tools
│   ├── billing/            # Stripe wrapper, plans, packs, connect
│   ├── documents/          # OCR pipeline, extractors (invoice, quote, balance sheet)
│   ├── rag/                # Embeddings, chunking, search, ingestion
│   ├── reports/            # PDF/DOCX/PPTX generation
│   ├── notifications/      # Brevo email + Web Push
│   ├── jobs/               # Background job processor
│   └── supabase/           # Supabase clients (SSR, admin, auth)
├── stores/                 # Zustand state stores
├── i18n/                   # Translation JSON files (fr.json, en.json)
└── types/                  # TypeScript interfaces
```

---

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run test` | Unit tests (Vitest — 129 tests) |
| `npm run test:e2e` | E2E tests (Playwright) |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run prisma:studio` | DB browser |
| `npm run prisma:push` | Push schema to Supabase |

---

## Database

Prisma schema at `prisma/schema.prisma` — 45 models. Key tables:

- **User, Company, TeamMember** — Multi-tenant user/company model
- **Diagnostic, DiagnosticAnswer, DiagnosticInsight** — Core diagnostic engine
- **VsmMap, IshikawaDiagram, A3Report, SwotAnalysis, SteepleAnalysis, PorterAnalysis, BcgMatrix, HoshinMatrix** — Strategic frameworks
- **Roadmap, RoadmapAction** — Action plans (quick_win / short_term / structural / transformation)
- **Subscription, SupportPack, SupportSession** — Billing
- **KnowledgeBase, KnowledgeDocument, KnowledgeChunk** — RAG system
- **DocumentJob, ReportJob** — Async job queue
- **WhiteLabelConfig, ConsultantClient** — White-label / consultant model
- **AuditLog, Notification** — Infrastructure

Supabase SQL scripts (not yet applied):
- `supabase/rls-policies.sql` — Row-level security
- `supabase/enable-pgvector.sql` — Vector extension
- `supabase/create-embeddings-table.sql` — Embeddings table

---

## Diagnostic Engine

7-phase conversational flow:
1. **Framing** — Target (revenue/cost), timeline, autonomy
2. **Profile** — Company details (SIRET lookup via INSEE)
3. **Documents** — Upload and OCR analysis
4. **Wastes** — 8 TIMWOODS scoring (conversational Q&A, 0-100 per waste)
5. **Deepening** — Ishikawa, VSM, DMAIC
6. **Strategy** — SWOT, Porter, STEEPLE, BCG, Hoshin, McKinsey
7. **Recommendations** — AI-generated action plan with financial impact

Core logic in `src/lib/diagnostic/` (waste-analyzer, question-engine, decision-tree) and `src/lib/ai/` (engine, scoring, prompts).

---

## Billing (Stripe)

6 plans: Découverte (free), Starter (€49/mo), Pro (€149/mo), Expert (€299/mo), Consultant Solo (€199/mo), Cabinet (€499/mo).

3 support packs: Coup de Pouce (1h), Accélération (3h), Transformation (10h).

Stripe Connect for affiliate commission.

Config in `src/lib/billing/` (stripe.ts, plans.ts, packs.ts).

---

## Pending Work

### Completed refactors:
- Redis/BullMQ/Railway removed — job processing uses Supabase-backed queue + Vercel cron (2026-04-13)
- Brevo replaces Resend for transactional emails

### Unexecuted:
- `MEGA_CC_RAG_DATABASE.md` — Full RAG implementation with pgvector

### Infrastructure not yet set up:
- RLS policies not applied to Supabase
- pgvector extension not activated
- Knowledge base not seeded
- Stripe webhooks not configured for production
- No custom domain configured
- No legal docs (CGV, RGPD, mentions légales)
- E2E tests exist but are skipped

### See LAUNCH_CHECKLIST.md for full deployment checklist.

---

## Conventions

- **Language:** Code in English. UI content bilingual FR/EN via next-intl.
- **API routes:** Next.js App Router — `src/app/api/[feature]/route.ts`
- **Components:** shadcn/ui base, domain components in `components/[feature]/`
- **State:** Zustand stores in `stores/` — no prop drilling
- **AI calls:** Always through `src/lib/ai/engine.ts` — never call Anthropic directly from components
- **Security:** Anonymize PII before sending to Claude (see `lib/utils/anonymizer.ts`). AES-256-GCM for document encryption (see `lib/utils/encryption.ts`).
- **Testing:** Unit tests in `__tests__/`, E2E in `e2e/`. Run `npm run test` before committing.

@AGENTS.md
