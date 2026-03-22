# DiagOptim - Rapport Prompt 4/4 : Assemblage, Deploiement & Tests

**Date :** 21 mars 2026
**Version :** 1.0.0
**Statut :** Compilation TypeScript OK (0 erreurs) | 129 tests passing

---

## 1. Vue d'ensemble globale du projet (Prompts 1-4)

| Metrique | Valeur |
|----------|--------|
| Fichiers source totaux | **215+** |
| Lignes de code (total) | **~41 000** |
| Backend lib (src/lib/) | 59 fichiers / 20 133 lignes |
| API Routes | 46 fichiers / 3 413 lignes |
| Components React | 52 fichiers / 7 947 lignes |
| Pages (App Router) | 18 pages / 3 255 lignes |
| Workers BullMQ | 5 fichiers / 954 lignes |
| Types TypeScript | 9 fichiers / 784 lignes |
| Tests (unit + E2E) | 10 fichiers / 1 594 lignes |
| Prisma schema | 807 lignes / 30 modeles / 29 enums |
| Supabase RLS | 574 lignes / 20+ tables protegees |
| PWA (offline + SW) | 7 fichiers / 1 148 lignes |
| Erreurs TypeScript | **0** |
| Tests unitaires | **129 passing (9 suites)** |

---

## 2. Ce que le Prompt 4 a ajoute

### 2.1. Progressive Web App (PWA) - 7 fichiers, 1 148 lignes

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `public/manifest.json` | 26 | Manifest PWA : nom, icones (8 tailles), screenshots, display standalone, theme bleu |
| `public/sw.js` | 276 | Service worker custom : cache NetworkFirst (API), CacheFirst (videos, PDFs), background sync pour reponses diagnostic hors-ligne, push notifications |
| `src/app/offline/page.tsx` | 109 | Page offline elegante : logo, message FR/EN, liste des donnees accessibles, bouton retry, animation CSS-only |
| `src/lib/pwa/install-prompt.ts` | 154 | Gestion prompt installation : capture beforeinstallprompt, detection standalone, cooldown 7 jours, seuil 3 visites |
| `src/lib/pwa/offline-sync.ts` | 331 | Sync IndexedDB : 6 stores (diagnostic-progress, roadmap-actions, memory-sheets, dashboard-snapshot, company-profile, pending-sync), queue/replay des actions offline |
| `src/components/pwa/InstallBanner.tsx` | 108 | Banner installation non-intrusif, dismissible, respecte cooldown |
| `src/components/pwa/OfflineIndicator.tsx` | 144 | Indicateur online/offline anime, progres de sync au retour en ligne |

**Stores IndexedDB pour le mode offline :**

| Store | Contenu cache |
|-------|---------------|
| `diagnostic-progress` | Diagnostic en cours (reponses, phase, scores) |
| `roadmap-actions` | Actions feuille de route avec statuts |
| `memory-sheets` | Fiches memo telechargees (PDF blob) |
| `dashboard-snapshot` | Dernier etat du dashboard |
| `company-profile` | Profil entreprise (toujours dispo) |
| `pending-sync` | File d'attente des actions a synchroniser |

---

### 2.2. Tests - 10 fichiers, 1 594 lignes

#### Tests unitaires (Vitest) - 9 suites, 129 tests

| Fichier | Tests | Ce qui est teste |
|---------|-------|------------------|
| `__tests__/scoring.test.ts` | 18 | `calculateWasteScore` (range 0-10, filtre par categorie), `calculateGlobalScore` (0 pour zeros, 100 pour max), `getSectorWeights` (services vs manufacturing, somme=1.0), `estimateGains` (min<=max, 8 categories, tri desc), `calculatePriority` (impact/effort) |
| `__tests__/question-engine.test.ts` | 9 | Structure arbre de decision, phases (full vs quick), plan gating (free/starter/pro/expert), branchement conditionnel (skip inventory si services), limite questions par phase |
| `__tests__/waste-analyzer.test.ts` | 8 | Analyse 8 gaspillages, scores dans range, `identifyTopWastes` (count, tri), impact sectoriel different |
| `__tests__/billing.test.ts` | 10 | `getPlanLimits` (tous les plans), `canAccessFeature` (free bloque premium, pro autorise), `getPlanPrice` (gratuit pour free, annuel < 12x mensuel), noms definis |
| `__tests__/anonymizer.test.ts` | 12 | Remplacement SIRET (14 chiffres), emails, telephones FR (01, 06, +33, points), texte non-PII preserve, `restoreAnonymized` aller-retour |
| `__tests__/encryption.test.ts` | 10 | Chiffrer/dechiffrer (texte, unicode, vide, long), cles differentes = chiffres differents, mauvaise cle = erreur, `generateSalt` 32 bytes, `hashSensitiveData` deterministe |
| `__tests__/validator.test.ts` | 16 | Champs requis manquants, montants negatifs, dates invalides, coherence HT+TVA=TTC, somme lignes, anomalies (montant > CA, TVA zero) |
| `__tests__/document-analyzer.test.ts` | 8 | Pipeline documents (mock), extraction facture, bilan, anonymisation |
| `__tests__/api/diagnostic.test.ts` | 7 | Flow API complet (mock), demarrage, reponses, progression |

#### Test E2E (Playwright) - 1 suite

| Fichier | Description |
|---------|-------------|
| `e2e/diagnostic-flow.spec.ts` | Flow complet : landing > inscription > profil > diagnostic > reponses > resultats > rapport. Tests desktop Chrome + mobile Pixel 5 |

#### Configuration tests

| Fichier | Description |
|---------|-------------|
| `vitest.config.ts` | Alias `@/`, coverage v8 (text + lcov), exclude prompts et PWA |
| `playwright.config.ts` | 2 projets (Desktop Chrome + Pixel 5), webServer auto, retries CI |

---

### 2.3. Deploiement - 3 fichiers config + 3 cron routes

#### Infrastructure

| Fichier | Description |
|---------|-------------|
| `vercel.json` | Region `cdg1` (Paris EU), security headers (X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy), sw.js no-cache, 3 cron jobs |
| `Dockerfile` | Node 20 Alpine, workers BullMQ pour Railway, prisma generate, `npx tsx workers/index.ts` |
| `docker-compose.yml` | Redis 7 Alpine (port 6379, volume persistant) + worker, pour dev local |

#### Cron Jobs (Vercel Cron)

| Route | Schedule | Description |
|-------|----------|-------------|
| `/api/cron/notifications` | Toutes les 6h | Traite les notifications planifiees : rappels diagnostic abandonne (>48h), actions en retard, milestones |
| `/api/cron/weekly-summary` | Lundi 8h | Email resume hebdomadaire aux abonnes actifs (actions completees, score, prochaines echeances) |
| `/api/cron/rediagnostic-reminder` | Quotidien 9h | Rappel aux users dont le dernier diagnostic date de >90 jours |

**Architecture de deploiement :**

```
                    +------------------+
                    |   Vercel (CDG1)  |
                    |   Next.js App    |
                    |   + API Routes   |
                    |   + Cron Jobs    |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
    +---------+--+   +------+------+  +----+-------+
    | Supabase   |   |   Stripe    |  |  Resend    |
    | PostgreSQL |   |  Payments   |  |  Emails    |
    | Auth + RLS |   |  Connect    |  |            |
    | Storage    |   +-------------+  +------------+
    +------------+
              |
    +---------+--+
    |   Redis    |  <--- BullMQ Queues
    | (Upstash)  |
    +-----+------+
          |
    +-----+------+
    |  Railway   |
    |  Workers   |
    |  (Docker)  |
    +------------+
```

---

### 2.4. Supabase RLS (Row Level Security) - 574 lignes SQL

| Element | Detail |
|---------|--------|
| Tables protegees | 20+ (toutes les tables du schema) |
| Fonctions helper | 5 : `is_company_owner()`, `is_team_member()`, `is_consultant_of()`, `has_team_role()`, `is_admin()` |
| Fichier | `supabase/rls-policies.sql` |

**Politiques par table :**

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `users` | Propre row uniquement | - | Propre row | - |
| `companies` | Owner + consultant clients + team | Owner | Owner | Owner |
| `diagnostics` | Owner + team members | Company owner | Company owner | Company owner |
| `documents` | Company owner uniquement (strict) | Owner | Owner | Owner |
| `roadmaps` | Owner + team collaborators | Owner | Owner | Owner |
| `trainings` | Tous les authentifies (contenu public) | Admin | Admin | Admin |
| `notifications` | Propres notifs uniquement | System | Propre (markRead) | - |
| `white_label_configs` | Owner uniquement | Owner | Owner | Owner |
| `consultant_clients` | Consultant uniquement | Consultant | Consultant | Consultant |
| `audit_logs` | Admin uniquement | System (auto) | - | - |

---

### 2.5. Integrations ajoutees - 3 nouveaux fichiers, 1 117 lignes

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `src/lib/integrations/accounting-import.ts` | 462 | Import CSV comptable multi-format |
| `src/lib/integrations/export-project-tools.ts` | 254 | Export roadmap vers outils de gestion |
| `src/lib/integrations/zapier-webhook.ts` | 401 | Webhooks pour Zapier/Make/n8n |

#### Import comptable (`accounting-import.ts`)

| Format supporte | Description |
|-----------------|-------------|
| Sage | Format standard comptabilite francaise |
| Pennylane | Export Pennylane CSV |
| QuickBooks | QuickBooks CSV export |
| Generic | CSV generique avec mapping colonnes |

**Fonctions :** `importFromCSV()`, `detectFormat()` (auto-detection par headers), `parseRows()`, `summarizeFinancials()` (ratios: marge brute %, ratio personnel, marge operationnelle, top categories charges, tendances mensuelles)

#### Export roadmap (`export-project-tools.ts`)

| Export | Format | Description |
|--------|--------|-------------|
| Trello | JSON | Listes par categorie (Quick Wins, Court terme, Structurel, Transformation), cartes avec labels |
| Notion | JSON | Database avec proprietes (titre, categorie, statut, echeance, gain, effort) |
| iCalendar | `.ics` | VEVENT par action avec due date, rappel 1 jour avant |
| CSV | `.csv` | Tableau : titre, categorie, statut, priorite, echeance, gain min/max, effort, impact |

#### Webhooks Zapier (`zapier-webhook.ts`)

| Event | Declencheur |
|-------|-------------|
| `diagnostic.completed` | Diagnostic finalise |
| `roadmap.action.completed` | Action marquee "done" |
| `document.analyzed` | Analyse document terminee |
| `milestone.reached` | Milestone atteint (ex: 3 actions completees) |

**Securite :** Signature HMAC-SHA256 (`X-DiagOptim-Signature`), verification URL (HTTPS, pas d'IP privee), auto-desactivation apres 10 echecs consecutifs.

---

### 2.6. Middleware renforce - 565 lignes

Ajouts par rapport au Prompt 1 :

| Fonctionnalite | Detail |
|----------------|--------|
| Rate limiting par plan | free: 10/min, starter: 30/min, pro: 60/min, expert: 120/min |
| Plan gating | Verification automatique des features par plan sur les routes protegees |
| CSP (Content Security Policy) | Autorise Stripe, PostHog, Supabase, Google Fonts ; bloque object/frame |
| HSTS | 1 an, includeSubDomains, preload |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=(self) |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |

**Features gatees par plan :**

| Feature | free | starter | pro | expert |
|---------|------|---------|-----|--------|
| Diagnostics/mois | 1 | 3 | illimite | illimite |
| Documents/mois | 0 | 5 | 30 | illimite |
| Outils Lean | SWOT basic | waste+VSM+Ishikawa | tous | tous+custom |
| Insights IA | non | non | oui | oui |
| White-label | non | non | non | oui |
| Acces API | non | non | oui | oui |
| Collaborateurs | 1 | 2 | 5 | illimite |
| Dashboard consultant | non | non | non | oui |

---

### 2.7. Configuration qualite

| Fichier | Description |
|---------|-------------|
| `eslint.config.mjs` | Regles strictes TypeScript : `no-explicit-any` (warn), `explicit-function-return-type` (warn), `no-unused-vars` (error, prefixe `_`), `consistent-type-imports`, `prefer-const`, `eqeqeq` |
| `.prettierrc.json` | semi: true, singleQuote: true, trailingComma: all, printWidth: 100, tabWidth: 2 |
| `.prettierignore` | Exclut node_modules, .next, dist, coverage, sw.js, migrations |
| `LAUNCH_CHECKLIST.md` | 50+ items : prerequis legaux, infrastructure, Stripe, securite, tests, contenu, analytics, go live |

---

## 3. Inventaire complet des fichiers (Prompts 1-4)

### 3.1. Prisma & Base de donnees

```
prisma/schema.prisma                    807 lignes   30 modeles, 29 enums
supabase/rls-policies.sql               574 lignes   20+ tables, 5 fonctions helper
```

### 3.2. Moteur IA (`src/lib/ai/`)

```
engine.ts                               Client Anthropic, retries, tracking tokens
scoring.ts                              Scoring 0-100, poids sectoriels, estimation gains
benchmarks.ts                           Benchmarks 6 secteurs, comparaison
prompts/diagnostic.ts                   Prompt systeme conversationnel
prompts/document-analysis.ts            Prompts extraction par type document
prompts/recommendations.ts              Prompt recommandations priorisees
prompts/report-writer.ts                Prompt redaction rapport FR/EN
prompts/training-content.ts             Prompt micro-formations
```

### 3.3. Moteur diagnostic (`src/lib/diagnostic/`)

```
question-engine.ts                      Moteur adaptatif (coeur applicatif)
decision-tree.ts                        Arbre de decision (60+ questions)
waste-analyzer.ts                       Analyse TIMWOODS
vsm-engine.ts                          Value Stream Mapping
ishikawa-engine.ts                     Diagramme causes-effet 6M
dmaic-engine.ts                        Workflow DMAIC 5 phases
strategy/swot.ts                       SWOT + TOWS croisee
strategy/porter.ts                     5 Forces de Porter
strategy/bcg.ts                        Matrice BCG
strategy/steeple.ts                    Analyse STEEPLE 7 facteurs
strategy/hoshin.ts                     Hoshin Kanri
strategy/mckinsey.ts                   Matrice McKinsey/GE
```

### 3.4. Documents (`src/lib/documents/`)

```
parser.ts                              Pipeline multi-format
ocr.ts                                 OCR Tesseract.js + Sharp
validator.ts                           Validation coherence + anomalies
extractors/invoice.ts                  Extraction factures
extractors/quote.ts                    Extraction devis
extractors/balance-sheet.ts            Extraction bilan/liasse
extractors/insurance.ts                Extraction assurances
extractors/brochure.ts                 Extraction plaquettes
```

### 3.5. Facturation (`src/lib/billing/`)

```
stripe.ts                              Checkout, portal, webhook, Connect
plans.ts                               6 plans + limites + gating
packs.ts                               Packs support (1h/3h/10h)
affiliate.ts                           Affiliation Stripe Connect
```

### 3.6. Rapports (`src/lib/reports/`)

```
pdf-generator.ts                       PDF Puppeteer (cover, TOC, charts SVG)
docx-generator.ts                      DOCX npm docx (tables, styles)
memory-sheets.ts                       Fiches memo par gaspillage
```

### 3.7. Notifications (`src/lib/notifications/`)

```
email.ts                               Resend : 6 templates HTML FR/EN
push.ts                                Web Push API / VAPID
scheduler.ts                           Planification relances automatiques
```

### 3.8. Integrations (`src/lib/integrations/`)

```
sirene.ts                              API INSEE SIRENE V3.11
banque-france.ts                       Benchmarks sectoriels statiques
export-mp.ts                           Memoire technique marches publics
accounting-import.ts                   Import CSV Sage/Pennylane/QuickBooks
export-project-tools.ts                Export Trello/Notion/iCal/CSV
zapier-webhook.ts                      Webhooks Zapier/Make avec HMAC
```

### 3.9. White-label (`src/lib/whitelabel/`)

```
tenant.ts                              Multi-tenant, cache, resolution domaine
branding.ts                            CSS custom properties, validation
consultant-api.ts                      Portail consultant, dashboard
```

### 3.10. Utilitaires (`src/lib/utils/`)

```
encryption.ts                          AES-256-GCM, PBKDF2
anonymizer.ts                          Suppression PII avant IA
rate-limiter.ts                        Fenetre glissante, 4 presets
i18n.ts                                Helpers serveur FR/EN
```

### 3.11. PWA (`src/lib/pwa/` + `src/components/pwa/` + `public/`)

```
public/manifest.json                   Manifest PWA
public/sw.js                           Service worker custom
src/app/offline/page.tsx               Page hors-ligne
src/lib/pwa/install-prompt.ts          Gestion prompt installation
src/lib/pwa/offline-sync.ts            Sync IndexedDB 6 stores
src/components/pwa/InstallBanner.tsx    Banner installation
src/components/pwa/OfflineIndicator.tsx Indicateur online/offline
```

### 3.12. API Routes (`src/app/api/`) - 46 endpoints

```
auth/register                POST     Inscription
auth/login                   POST     Connexion
auth/oauth/google            POST     OAuth Google
auth/2fa/enable              POST     2FA TOTP

company/profile              GET/POST Profil entreprise
company/sirene/[siret]       GET      Lookup SIRENE

diagnostic/start             POST     Demarrer diagnostic
diagnostic/[id]/next         GET      Question suivante
diagnostic/[id]/answer       POST     Soumettre reponse
diagnostic/[id]/progress     GET      Progression + insights
diagnostic/[id]/results      GET      Resultats complets
diagnostic/[id]/complete     POST     Finaliser

documents/upload             POST     Upload multipart
documents/[id]/extracted     GET      Donnees extraites
documents/[id]/validate      POST     Validation utilisateur
documents/[id]               DELETE   Suppression

reports/[diagnosticId]       GET      Generer rapport
reports/.../download/[format] GET     Telecharger PDF/DOCX

roadmap/generate             POST     Generer feuille de route
roadmap/[id]                 GET      Recuperer roadmap
roadmap/action/[id]          PATCH    MAJ statut action
roadmap/[id]/gantt           GET      Donnees Gantt

training/library             GET      Bibliotheque formations
training/[id]                GET      Detail formation
training/[id]/progress       POST     MAJ progression
training/memory-sheet/.../download GET Telecharger fiche memo

billing/checkout             POST     Session Stripe Checkout
billing/portal               POST     Portail client
billing/webhook              POST     Webhook Stripe
billing/pack/purchase        POST     Achat pack support
billing/subscription         GET      Statut abonnement

whitelabel/config            POST     Config branding
whitelabel/clients           GET      Liste clients consultant
whitelabel/invite            POST     Inviter client

team/invite                  POST     Inviter collaborateur
team/[memberId]/role         PATCH    Changer role
team/[memberId]              DELETE   Retirer membre

notifications                GET      Liste paginee
notifications/[id]/read      PATCH    Marquer lu
notifications/preferences    PUT      Preferences

export/marches-publics       POST     Memoire technique
export/data                  GET      Export RGPD

benchmarks/[sector]          GET      Benchmarks sectoriels

cron/notifications           GET      Cron 6h : relances
cron/weekly-summary          GET      Cron lundi 8h : resume
cron/rediagnostic-reminder   GET      Cron 9h : rediagnostic
```

### 3.13. Workers BullMQ (`workers/`)

```
index.ts                               Point d'entree, graceful shutdown
queues.ts                              3 queues typees
document-analyzer.ts                   Analyse documents (concurrency: 2)
report-generator.ts                    Generation rapports (concurrency: 1)
training-generator.ts                  Generation formations (concurrency: 1)
```

### 3.14. Tests

```
__tests__/scoring.test.ts              18 tests scoring
__tests__/question-engine.test.ts       9 tests arbre decision
__tests__/waste-analyzer.test.ts        8 tests analyse gaspillages
__tests__/billing.test.ts              10 tests plans/facturation
__tests__/anonymizer.test.ts           12 tests anonymisation
__tests__/encryption.test.ts           10 tests chiffrement
__tests__/validator.test.ts            16 tests validation documents
__tests__/document-analyzer.test.ts     8 tests pipeline documents
__tests__/api/diagnostic.test.ts        7 tests API diagnostic
e2e/diagnostic-flow.spec.ts            E2E desktop + mobile
```

### 3.15. Configuration

```
.env.example                           15 variables d'environnement
vercel.json                            Region EU, headers securite, 3 crons
Dockerfile                             Workers Railway (Node 20 Alpine)
docker-compose.yml                     Redis + worker dev local
vitest.config.ts                       Config tests unitaires
playwright.config.ts                   Config tests E2E
eslint.config.mjs                      Regles TypeScript strictes
.prettierrc.json                       Style code
.prettierignore                        Exclusions Prettier
LAUNCH_CHECKLIST.md                    50+ items pre-lancement
```

---

## 4. Commandes disponibles

```bash
# Developpement
npm run dev                    # Lancer Next.js en dev
npm run workers:dev            # Lancer workers en dev (watch mode)

# Build & verification
npm run build                  # Build production Next.js
npm run typecheck              # Verification TypeScript (0 erreurs)
npm run lint                   # ESLint
npm run lint:fix               # ESLint auto-fix
npm run format                 # Prettier format
npm run format:check           # Prettier check

# Tests
npm run test                   # Vitest (129 tests)
npm run test:watch             # Vitest watch mode
npm run test:coverage          # Vitest avec couverture
npm run test:e2e               # Playwright E2E
npm run test:e2e:ui            # Playwright UI mode

# Base de donnees
npm run prisma:generate        # Generer client Prisma
npm run prisma:push            # Pousser schema vers BDD
npm run prisma:migrate         # Migration dev
npm run prisma:studio          # Interface admin BDD

# Production
npm run start                  # Lancer en production
npm run workers:start          # Workers en production
```

---

## 5. Prochaines etapes pour la mise en production

1. **Configurer `.env`** avec les vrais credentials (Supabase, Stripe, Anthropic, Redis, Resend)
2. **`npx prisma generate && npx prisma db push`** pour creer la BDD
3. **Executer `supabase/rls-policies.sql`** dans l'editeur SQL Supabase
4. **Creer les produits Stripe** (6 plans + 3 packs + 2 support) et noter les price IDs
5. **Deployer sur Vercel** (front + API) et **Railway** (workers)
6. **Configurer Redis** (Upstash recommande pour Vercel)
7. **Suivre la `LAUNCH_CHECKLIST.md`** pour la mise en production complete
