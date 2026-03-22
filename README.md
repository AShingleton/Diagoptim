# DiagOptim

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-129%20passing-green)]()
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

**Plateforme SaaS de diagnostic et d'optimisation Lean Management pour PME/TPE.**

DiagOptim permet aux entreprises de réaliser un diagnostic complet de leur performance opérationnelle basé sur les 8 gaspillages du Lean (TIMWOODS), puis génère automatiquement un plan d'action chiffré avec roadmap, formation et suivi.

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 16, React 19, TailwindCSS 4 |
| UI | shadcn/ui, Framer Motion, Recharts |
| Backend | Next.js API Routes, Prisma ORM |
| Base de données | PostgreSQL (Supabase) |
| Auth | Supabase Auth (email + Google OAuth) |
| IA | Claude API (Anthropic) |
| Paiement | Stripe (abonnements + packs) |
| Emails | Brevo (transactional) |
| Analytics | PostHog |
| i18n | next-intl (FR/EN) |
| PWA | Service Worker, Web Push |
| Tests | Vitest, Playwright |

## Installation

```bash
# 1. Cloner le repository
git clone https://github.com/your-org/diagoptim.git
cd diagoptim

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local

# 4. Générer le client Prisma et pousser le schéma
npx prisma generate
npx prisma db push

# 5. Lancer le serveur de développement
npm run dev
```

## Variables d'environnement

| Variable | Description | Requis |
|----------|------------|--------|
| `DATABASE_URL` | URL PostgreSQL (Supabase pooling) | ✅ |
| `DIRECT_URL` | URL PostgreSQL directe (migrations) | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anonyme Supabase | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service Supabase | ✅ |
| `ANTHROPIC_API_KEY` | Clé API Claude (Anthropic) | ✅ |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | ✅ |
| `BREVO_API_KEY` | Clé API Brevo (emails) | ✅ |
| `NEXT_PUBLIC_POSTHOG_KEY` | Clé PostHog (analytics) | ❌ |
| `NEXT_PUBLIC_POSTHOG_HOST` | Host PostHog | ❌ |
| `REDIS_URL` | URL Redis (workers) | ❌ |
| `ENCRYPTION_KEY` | Clé chiffrement documents (AES-256) | ✅ |

## Commandes disponibles

| Commande | Description |
|----------|------------|
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build production |
| `npm run start` | Serveur production |
| `npm run typecheck` | Vérification TypeScript |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests E2E (Playwright) |
| `npm run lint` | Linter ESLint |
| `npm run format` | Formatage Prettier |
| `npm run prisma:studio` | Interface BDD Prisma |
| `npm run prisma:migrate` | Migrations Prisma |

## Architecture

```
src/
├── app/
│   ├── [locale]/          # Pages i18n (fr/en)
│   │   ├── (app)/         # App authentifiée (dashboard, diagnostic, etc.)
│   │   ├── (auth)/        # Pages auth (login, register, callback)
│   │   └── (marketing)/   # Pages publiques (landing, pricing)
│   ├── api/               # API Routes
│   │   ├── auth/          # Authentification
│   │   ├── billing/       # Stripe (checkout, webhook, portal)
│   │   ├── diagnostic/    # Moteur de diagnostic
│   │   ├── documents/     # Upload et analyse de documents
│   │   ├── reports/       # Génération de rapports (PDF, DOCX)
│   │   ├── rag/           # RAG knowledge base
│   │   ├── cron/          # Tâches planifiées
│   │   └── ...
│   └── offline/           # Page offline PWA
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── dashboard/         # Composants dashboard
│   ├── diagnostic/        # Composants diagnostic
│   ├── landing/           # Composants landing page
│   └── layout/            # Layout (sidebar, header)
├── lib/
│   ├── ai/                # Intégration Claude API
│   ├── billing/           # Logique Stripe
│   ├── diagnostic/        # Moteur de scoring Lean
│   ├── documents/         # Analyse de documents (OCR, PDF)
│   ├── reports/           # Génération rapports
│   ├── rag/               # RAG pipeline
│   └── ...
├── i18n/                  # Traductions FR/EN
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## Déploiement

### Vercel (Application principale)

1. Importer le repository sur [Vercel](https://vercel.com)
2. Framework: **Next.js** (détecté automatiquement)
3. Région: **cdg1** (Paris)
4. Configurer toutes les variables d'environnement
5. Déployer

### Railway (Workers background)

1. Créer un nouveau projet sur [Railway](https://railway.app)
2. Connecter le repository GitHub
3. Utiliser le `Dockerfile` à la racine
4. Configurer les variables d'environnement (DATABASE_URL, REDIS_URL, etc.)
5. Déployer

## Licence

Propriétaire - Tous droits réservés.
