# DiagOptim - Rapport de Generation Back-End

**Date :** 21 mars 2026
**Version :** 1.0.0
**Statut :** Compilation TypeScript OK (0 erreurs)

---

## 1. Vue d'ensemble

| Metrique | Valeur |
|----------|--------|
| Fichiers back-end generes | **110** |
| Lignes de code TypeScript | **~24 600** |
| Modeles Prisma | **30** |
| Enums Prisma | **29** |
| API Routes | **43 endpoints** |
| Workers asynchrones | **3** |
| Erreurs TypeScript | **0** |

---

## 2. Stack technique

| Composant | Technologie | Version |
|-----------|-------------|---------|
| Runtime | Node.js / TypeScript strict | 20+ / 5.x |
| Framework | Next.js (App Router) | 16.2.1 |
| ORM | Prisma | 6.3.x |
| BDD | PostgreSQL via Supabase | - |
| IA | Anthropic Claude API | claude-sonnet-4-20250514 |
| Paiement | Stripe (subscriptions + Connect) | 17.5.x |
| Emails | Resend | 4.1.x |
| Files | Supabase Storage | - |
| Queues | BullMQ + Redis (ioredis) | 5.34.x |
| Validation | Zod | 4.3.x |
| Auth | Supabase Auth (JWT + OAuth + 2FA) | - |
| PDF | Puppeteer | 23.x |
| DOCX | docx (npm) | 9.2.x |
| OCR | Tesseract.js | 5.1.x |
| Images | Sharp | 0.33.x |

---

## 3. Architecture des fichiers

### 3.1. Schema Prisma (`prisma/`)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `schema.prisma` | 807 | 30 modeles, 29 enums, relations, index, cascade deletes |

**Modeles par domaine :**

| Domaine | Modeles |
|---------|---------|
| Core | `User`, `Company`, `Subscription` |
| Diagnostic | `Diagnostic`, `DiagnosticAnswer`, `DiagnosticInsight` |
| Outils methodologiques | `VsmMap`, `IshikawaDiagram`, `A3Report`, `SwotAnalysis`, `SteepleAnalysis`, `PorterAnalysis`, `BcgMatrix`, `HoshinMatrix` |
| Documents | `Document` |
| Feuille de route | `Roadmap`, `RoadmapAction` |
| Formations | `Training`, `UserTrainingProgress` |
| White-label | `WhiteLabelConfig`, `ConsultantClient` |
| Notifications | `Notification` |
| Paiement | `SupportPack`, `SupportSession` |
| Affiliation | `Affiliate`, `Referral` |
| Collaboration | `TeamMember` |
| Audit | `AuditLog` |

---

### 3.2. Moteur IA (`src/lib/ai/`) - 8 fichiers, 2 177 lignes

| Fichier | Description |
|---------|-------------|
| `engine.ts` | Client Anthropic, retries exponentiels, tracking tokens |
| `scoring.ts` | Scoring 0-100, poids sectoriels, estimation gains (fourchette) |
| `benchmarks.ts` | Benchmarks sectoriels (6 secteurs), comparaison entreprise |
| `prompts/diagnostic.ts` | Prompt systeme conversationnel avec branchement sectoriel |
| `prompts/document-analysis.ts` | Prompts extraction par type de document |
| `prompts/recommendations.ts` | Prompt generation recommandations priorisees |
| `prompts/report-writer.ts` | Prompt redaction rapport professionnel FR/EN |
| `prompts/training-content.ts` | Prompt generation micro-formations |

---

### 3.3. Moteur de diagnostic (`src/lib/diagnostic/`) - 12 fichiers, 6 548 lignes

**Coeur applicatif - le plus gros module.**

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `question-engine.ts` | ~838 | Moteur adaptatif : `getNextQuestion`, `submitAnswer`, `getProgress`, `skipQuestionsFromDocument`, `generateBlockInsight` |
| `decision-tree.ts` | ~1 077 | Arbre de decision : 3 questions cadrage, 9 profil, 41 gaspillages (8 categories), 5 approfondissement, 6 strategie |
| `waste-analyzer.ts` | ~403 | Analyse TIMWOODS, multiplicateurs sectoriels, estimation impact financier |
| `vsm-engine.ts` | ~553 | Value Stream Mapping : bottlenecks, lead time, PCE, etat futur |
| `ishikawa-engine.ts` | ~422 | Diagramme causes-effet 6M, cause racine, priorisation |
| `dmaic-engine.ts` | ~699 | Workflow DMAIC 5 phases, outils par gaspillage, estimation ROI |

**Outils strategiques (`strategy/`) :**

| Fichier | Description |
|---------|-------------|
| `swot.ts` | SWOT + matrice TOWS croisee (SO/WO/ST/WT) |
| `porter.ts` | 5 Forces de Porter, scoring 1-5, position concurrentielle |
| `bcg.ts` | Matrice BCG (star/cash cow/question mark/dog), recommandations |
| `steeple.ts` | 7 facteurs macro-environnement, tendances cles |
| `hoshin.ts` | Hoshin Kanri : vision > objectifs > KPIs > responsabilites |
| `mckinsey.ts` | Matrice McKinsey/GE : attractivite vs force competitive |

---

### 3.4. Pipeline documentaire (`src/lib/documents/`) - 8 fichiers, 2 043 lignes

| Fichier | Description |
|---------|-------------|
| `parser.ts` | Pipeline principal : upload > detection > extraction > anonymisation > IA > validation |
| `ocr.ts` | OCR Tesseract.js avec preprocessing Sharp (contraste, resize) |
| `validator.ts` | Validation coherence (HT+TVA=TTC, dates, montants), detection anomalies |
| `extractors/invoice.ts` | Extraction factures : fournisseur, montants HT/TTC, TVA, recurrence |
| `extractors/quote.ts` | Extraction devis : postes, marges implicites, conditions |
| `extractors/balance-sheet.ts` | Extraction bilan/liasse : CA, charges, resultat, ratios financiers |
| `extractors/insurance.ts` | Extraction assurances : garanties, primes, couvertures, echeances |
| `extractors/brochure.ts` | Extraction plaquettes : offre, positionnement, segments |

---

### 3.5. Facturation (`src/lib/billing/`) - 4 fichiers, 1 285 lignes

| Fichier | Description |
|---------|-------------|
| `stripe.ts` | Checkout, portal, webhook (4 events), annulation |
| `plans.ts` | 6 plans (free > cabinet), limites, `canAccessFeature()`, `getPlanPrice()` |
| `packs.ts` | Packs support (1h/3h/10h), suivi heures, expiration |
| `affiliate.ts` | Stripe Connect, liens affilies, commissions, stats |

**Plans tarifaires :**

| Plan | Prix/mois | Diagnostics | Documents | Outils |
|------|-----------|-------------|-----------|--------|
| Decouverte | Gratuit | 1 | 0 | SWOT basic |
| Starter | 49 EUR | 3 | 5 | Waste + VSM + Ishikawa |
| Pro | 149 EUR | Illimite | 30 | Tous |
| Expert | 299 EUR | Illimite | Illimite | Tous + custom |
| Consultant Solo | 199 EUR | - | - | White-label, 15 clients |
| Cabinet | 499 EUR | - | - | White-label, domaine custom, illimite |

---

### 3.6. Rapports (`src/lib/reports/`) - 3 fichiers, 1 897 lignes

| Fichier | Description |
|---------|-------------|
| `pdf-generator.ts` | PDF via Puppeteer : cover, TOC, executive summary, radar chart SVG, recommandations, roadmap, annexes. Support branding white-label. |
| `docx-generator.ts` | DOCX via npm `docx` : document stylise, tableaux, en-tetes/pieds de page |
| `memory-sheets.ts` | Fiches memo par gaspillage : definition, impact, indicateurs, 3-5 actions |

---

### 3.7. Notifications (`src/lib/notifications/`) - 3 fichiers, 963 lignes

| Fichier | Description |
|---------|-------------|
| `email.ts` | Resend : 6 templates HTML FR/EN (welcome, reminder, report ready...) |
| `push.ts` | Web Push API / VAPID, gestion subscriptions |
| `scheduler.ts` | Planification : relances diagnostic, echeances actions, rediagnostic |

---

### 3.8. Integrations (`src/lib/integrations/`) - 3 fichiers, 1 276 lignes

| Fichier | Description |
|---------|-------------|
| `sirene.ts` | API INSEE SIRENE V3.11 : recherche SIRET, enrichissement profil |
| `banque-france.ts` | Benchmarks sectoriels statiques (5 codes NAF), ratios par quartile |
| `export-mp.ts` | Memoire technique marches publics (PDF/DOCX, 5 sections) |

---

### 3.9. White-label (`src/lib/whitelabel/`) - 3 fichiers, 1 039 lignes

| Fichier | Description |
|---------|-------------|
| `tenant.ts` | Multi-tenant : resolution par domaine, cache 5min, theme branding |
| `branding.ts` | CSS custom properties, validation couleurs/domaines/contraste |
| `consultant-api.ts` | Portail consultant : clients, diagnostics, rapports brandes, dashboard |

---

### 3.10. Utilitaires (`src/lib/utils/`) - 4 fichiers, 685 lignes

| Fichier | Description |
|---------|-------------|
| `encryption.ts` | AES-256-GCM, PBKDF2, derivation cle par utilisateur |
| `anonymizer.ts` | Suppression PII (SIRET, tel, email, IBAN, noms) avant envoi IA |
| `rate-limiter.ts` | Fenetre glissante en memoire, 4 presets (API, IA, uploads, auth) |
| `i18n.ts` | Helpers serveur : locale, `formatCurrency`, `formatDate` |

---

### 3.11. Types (`src/types/`) - 9 fichiers, 784 lignes

| Fichier | Description |
|---------|-------------|
| `api.ts` | `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>`, schemas Zod |
| `diagnostic.ts` | `DiagnosticQuestion`, `WasteCategory`, `WasteScores`, `DiagnosticState` |
| `company.ts` | `Company`, `CompanyProfile` |
| `billing.ts` | `SubscriptionTier`, `PricingPlan`, `SupportPack`, `Subscription` |
| `document.ts` | `DocumentType`, `ExtractedInvoiceData`, `ExtractedBalanceSheet`... |
| `report.ts` | `ReportFormat`, `ReportSection`, `ReportConfig`, `MemorySheet` |
| `roadmap.ts` | Types feuille de route |
| `tools.ts` | Types outils Lean |
| `training.ts` | Types formations |

---

### 3.12. Middleware (`src/middleware.ts`) - 349 lignes

- Verification JWT Supabase sur `/api/*`
- Exemption routes publiques (`/api/auth/*`, `/api/billing/webhook`)
- Rate limiting par IP (60 req/min) avec headers `X-RateLimit-*`
- CORS avec origines configurables
- Redirection pages protegees si non authentifie
- Injection `X-User-Id`, `X-User-Email`, `X-User-Role` dans les headers

---

## 4. API Routes - 43 endpoints

### 4.1. Authentification (4 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription Supabase + creation User + Subscription free |
| POST | `/api/auth/login` | Connexion email/password |
| POST | `/api/auth/oauth/google` | OAuth Google |
| POST | `/api/auth/2fa/enable` | Activation TOTP 2FA |

### 4.2. Entreprise (2 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET/POST | `/api/company/profile` | Lecture / upsert profil entreprise |
| GET | `/api/company/sirene/:siret` | Auto-completion SIRENE |

### 4.3. Diagnostic (6 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/diagnostic/start` | Demarrer diagnostic avec cadrage |
| GET | `/api/diagnostic/:id/next` | Question suivante (moteur adaptatif) |
| POST | `/api/diagnostic/:id/answer` | Soumettre reponse |
| GET | `/api/diagnostic/:id/progress` | Progression + insights partiels |
| GET | `/api/diagnostic/:id/results` | Resultats complets |
| POST | `/api/diagnostic/:id/complete` | Finaliser diagnostic |

### 4.4. Documents (4 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/documents/upload` | Upload multipart (10MB max) |
| GET | `/api/documents/:id/extracted` | Donnees extraites |
| POST | `/api/documents/:id/validate` | Validation utilisateur |
| DELETE | `/api/documents/:id` | Suppression |

### 4.5. Rapports (2 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/reports/:diagnosticId` | Generer/recuperer rapport |
| GET | `/api/reports/:diagnosticId/download/:format` | Telecharger PDF/DOCX |

### 4.6. Feuille de route (4 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/roadmap/generate` | Generer depuis diagnostic |
| GET | `/api/roadmap/:id` | Recuperer avec actions |
| PATCH | `/api/roadmap/action/:id` | MAJ statut action |
| GET | `/api/roadmap/:id/gantt` | Donnees Gantt |

### 4.7. Formations (4 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/training/library` | Bibliotheque (filtres, pagination) |
| GET | `/api/training/:id` | Detail formation |
| POST | `/api/training/:id/progress` | MAJ progression |
| GET | `/api/training/memory-sheet/:id/download` | Telecharger fiche memo PDF |

### 4.8. Facturation (5 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/billing/checkout` | Session Stripe Checkout |
| POST | `/api/billing/portal` | Portail client Stripe |
| POST | `/api/billing/webhook` | Webhook Stripe (sans auth) |
| POST | `/api/billing/pack/purchase` | Achat pack support |
| GET | `/api/billing/subscription` | Statut abonnement |

### 4.9. White-label (3 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/whitelabel/config` | Config branding |
| GET | `/api/whitelabel/clients` | Liste clients consultant |
| POST | `/api/whitelabel/invite` | Inviter client |

### 4.10. Equipe (3 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/team/invite` | Inviter collaborateur |
| PATCH | `/api/team/:memberId/role` | Changer role |
| DELETE | `/api/team/:memberId` | Retirer membre |

### 4.11. Notifications (3 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/notifications` | Liste paginee |
| PATCH | `/api/notifications/:id/read` | Marquer comme lu |
| PUT | `/api/notifications/preferences` | Preferences |

### 4.12. Export (2 routes)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/export/marches-publics` | Memoire technique |
| GET | `/api/export/data` | Export RGPD complet |

### 4.13. Benchmarks (1 route)

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/benchmarks/:sector` | Benchmarks sectoriels |

---

## 5. Workers BullMQ - 5 fichiers, 1 242 lignes

| Worker | Concurrence | Description |
|--------|-------------|-------------|
| `document-analyzer.ts` | 2 | Download Supabase > OCR/parsing > extraction IA > stockage > notification |
| `report-generator.ts` | 1 | Fetch diagnostic > generation IA > PDF/DOCX > upload > notification |
| `training-generator.ts` | 1 | Actions roadmap > detection methodologie > contenu IA > stockage |
| `queues.ts` | - | Definitions des 3 queues avec retry exponential (3 tentatives) |
| `index.ts` | - | Point d'entree, graceful shutdown SIGTERM/SIGINT |

---

## 6. Securite implementee

| Mesure | Implementation |
|--------|----------------|
| Authentification | JWT Supabase verifie par middleware |
| Autorisation | Verification ownership sur chaque route |
| Rate limiting | Fenetre glissante par IP (60/min API, 10/min IA, 5/min uploads) |
| Validation input | Zod sur chaque endpoint |
| Chiffrement documents | AES-256-GCM avec cle derivee par utilisateur (PBKDF2) |
| Anonymisation IA | Suppression SIRET, noms, tel, email, IBAN avant envoi Claude |
| CORS | Origines configurables via env |
| 2FA | TOTP optionnel via Supabase MFA |
| Audit trail | Table `AuditLog` avec userId, action, resource, IP |
| RGPD | Endpoint export complet des donnees utilisateur |

---

## 7. Variables d'environnement requises

```
NEXT_PUBLIC_APP_URL          # URL de l'application
NEXT_PUBLIC_SUPABASE_URL     # URL projet Supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY # Cle publique Supabase
SUPABASE_SERVICE_ROLE_KEY    # Cle service Supabase
DATABASE_URL                 # PostgreSQL connection string
ANTHROPIC_API_KEY            # Cle API Anthropic
STRIPE_SECRET_KEY            # Cle secrete Stripe
STRIPE_WEBHOOK_SECRET        # Secret webhook Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY # Cle publique Stripe
RESEND_API_KEY               # Cle API Resend
REDIS_URL                    # URL Redis pour BullMQ
ENCRYPTION_KEY               # 32 bytes hex pour AES-256
SIRENE_API_KEY               # Cle API INSEE SIRENE
NEXT_PUBLIC_POSTHOG_KEY      # Cle PostHog (analytics)
```

---

## 8. Commandes de demarrage

```bash
# 1. Configurer les variables d'environnement
cp .env.example .env
# Remplir les valeurs dans .env

# 2. Generer le client Prisma
npx prisma generate

# 3. Pousser le schema vers la BDD
npx prisma db push

# 4. Lancer l'application
npm run dev

# 5. Lancer les workers (terminal separe)
npm run workers:dev

# 6. Verifier la compilation
npm run typecheck
```

---

## 9. Flux principaux

### 9.1. Diagnostic conversationnel

```
Utilisateur                    API                          IA (Claude)
    |                           |                              |
    |-- POST /diagnostic/start -->|                            |
    |<-- diagnostic + Q1 --------|                             |
    |                            |                             |
    |-- POST /answer (Q1) ------>|                             |
    |                            |-- generateNextQuestion() -->|
    |                            |<-- question contextuelle ---|
    |<-- Q2 + score partiel -----|                             |
    |                            |                             |
    |   ... (boucle 20-40 Q) ... |                             |
    |                            |                             |
    |-- POST /complete --------->|                             |
    |                            |-- analyzeWastes() --------->|
    |                            |-- generateRecommendations -->|
    |<-- resultats complets -----|                             |
```

### 9.2. Analyse documentaire

```
Upload --> Supabase Storage --> Queue BullMQ
                                    |
                            Worker document-analyzer
                                    |
                        Detect type --> Extract text
                                    |
                        OCR (si image) --> Anonymize
                                    |
                        Claude extraction --> Validation
                                    |
                        Stockage BDD --> Notification user
                                    |
                        Skip questions diagnostic (si actif)
```

---

## 10. Repartition du code

```
src/lib/diagnostic/    6 548 lignes  (27%)  -- Coeur metier
src/app/api/           3 242 lignes  (13%)  -- Endpoints REST
src/lib/ai/            2 177 lignes   (9%)  -- Moteur IA
src/lib/documents/     2 043 lignes   (8%)  -- Pipeline docs
src/lib/reports/       1 897 lignes   (8%)  -- Generation rapports
src/lib/billing/       1 285 lignes   (5%)  -- Facturation
src/lib/integrations/  1 276 lignes   (5%)  -- APIs externes
workers/               1 242 lignes   (5%)  -- Taches async
src/lib/whitelabel/    1 039 lignes   (4%)  -- Multi-tenant
src/lib/notifications/   963 lignes   (4%)  -- Notifications
prisma/schema.prisma     807 lignes   (3%)  -- Schema BDD
src/types/               784 lignes   (3%)  -- Definitions types
src/lib/utils/           685 lignes   (3%)  -- Utilitaires
src/middleware.ts        349 lignes   (1%)  -- Middleware auth
                      ------
Total                 24 337 lignes
```
