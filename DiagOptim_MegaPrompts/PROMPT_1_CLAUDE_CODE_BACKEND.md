# ═══════════════════════════════════════════════════════════════════════════════
# MÉGA-PROMPT 1/4 — CLAUDE CODE : FONDATION BACK-END
# Application DiagOptim™ — Diagnostic Interactif d'Entreprise
# ═══════════════════════════════════════════════════════════════════════════════
# INSTRUCTIONS : Copiez ce prompt dans Claude Code pour générer toute la base back-end
# ═══════════════════════════════════════════════════════════════════════════════

Tu es un architecte logiciel senior et développeur full-stack expert. Tu vas créer le back-end complet de DiagOptim™, une application SaaS de diagnostic interactif d'entreprise basée sur le Lean Management, le Lean Six Sigma et les outils stratégiques des grands cabinets de conseil.

## CONTEXTE PROJET

DiagOptim™ est un coach digital qui aide les TPE/PME à optimiser leurs coûts et leur temps via un diagnostic CONVERSATIONNEL (jamais de longs formulaires). L'app utilise l'IA (API Claude Anthropic) pour analyser des documents d'entreprise, poser des questions adaptatives, et générer des rapports de recommandations avec feuille de route.

## STACK TECHNIQUE OBLIGATOIRE

```
Runtime       : Node.js 20+ / TypeScript strict
Framework     : Next.js 14+ (App Router) — API Routes pour le back-end
ORM           : Prisma (PostgreSQL)
BDD           : Supabase (PostgreSQL + Auth + Storage + Realtime + RLS)
IA            : API Anthropic Claude (claude-sonnet-4-20250514)
Paiement      : Stripe (subscriptions + one-shot + Connect pour affiliation)
Emails        : Resend
File Storage  : Supabase Storage (documents uploadés, chiffrés)
Queues        : BullMQ + Redis (tâches async : analyse docs, génération rapports, vidéos)
i18n          : next-intl (FR + EN)
Validation    : Zod
Auth          : Supabase Auth (JWT + OAuth Google + 2FA optionnel)
Analytics     : PostHog (self-hosted ou cloud EU)
```

## ARCHITECTURE DU PROJET

Génère la structure complète suivante :

```
diagoptim/
├── prisma/
│   └── schema.prisma              # Schéma complet BDD
├── src/
│   ├── app/
│   │   └── api/                   # API Routes Next.js
│   │       ├── auth/              # Auth endpoints
│   │       ├── diagnostic/        # Moteur de diagnostic
│   │       ├── documents/         # Upload & analyse IA
│   │       ├── reports/           # Génération rapports
│   │       ├── roadmap/           # Feuille de route
│   │       ├── training/          # Formations & memory sheets
│   │       ├── billing/           # Stripe webhooks
│   │       ├── whitelabel/        # API consultant
│   │       ├── integrations/      # Intégrations tiers
│   │       ├── notifications/     # Système notifications
│   │       └── export/            # Export marchés publics
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── engine.ts          # Moteur IA principal
│   │   │   ├── prompts/           # Tous les prompts système
│   │   │   │   ├── diagnostic.ts  # Prompt diagnostic conversationnel
│   │   │   │   ├── document-analysis.ts  # Analyse de documents
│   │   │   │   ├── recommendations.ts    # Génération recommandations
│   │   │   │   ├── training-content.ts   # Génération contenu formation
│   │   │   │   └── report-writer.ts      # Rédaction rapports
│   │   │   ├── scoring.ts         # Algorithmes de scoring
│   │   │   └── benchmarks.ts      # Calculs benchmarks sectoriels
│   │   ├── diagnostic/
│   │   │   ├── decision-tree.ts   # Arbre de décision adaptatif
│   │   │   ├── question-engine.ts # Moteur de questionnement
│   │   │   ├── waste-analyzer.ts  # Analyse 8 gaspillages
│   │   │   ├── vsm-engine.ts      # Calculs VSM
│   │   │   ├── ishikawa-engine.ts # Moteur Ishikawa
│   │   │   ├── dmaic-engine.ts    # Workflow DMAIC
│   │   │   └── strategy/
│   │   │       ├── swot.ts        # SWOT / TOWS croisée
│   │   │       ├── porter.ts      # 5 Forces de Porter
│   │   │       ├── bcg.ts         # Matrice BCG
│   │   │       ├── steeple.ts     # Analyse STEEPLE
│   │   │       ├── hoshin.ts      # Hoshin Kanri
│   │   │       └── mckinsey.ts    # Matrice McKinsey
│   │   ├── documents/
│   │   │   ├── parser.ts          # Pipeline parsing multi-format
│   │   │   ├── ocr.ts             # OCR Tesseract
│   │   │   ├── extractors/
│   │   │   │   ├── invoice.ts     # Extraction factures
│   │   │   │   ├── quote.ts       # Extraction devis
│   │   │   │   ├── balance-sheet.ts # Extraction bilan/liasse
│   │   │   │   ├── insurance.ts   # Extraction assurances
│   │   │   │   └── brochure.ts    # Extraction plaquettes
│   │   │   └── validator.ts       # Validation données extraites
│   │   ├── reports/
│   │   │   ├── pdf-generator.ts   # Génération PDF (Puppeteer)
│   │   │   ├── docx-generator.ts  # Génération DOCX (docx-js)
│   │   │   ├── templates/         # Templates de rapports FR/EN
│   │   │   └── memory-sheets.ts   # Génération fiches mémo
│   │   ├── billing/
│   │   │   ├── stripe.ts          # Service Stripe
│   │   │   ├── plans.ts           # Définition des plans
│   │   │   ├── packs.ts           # Packs support one-shot
│   │   │   └── affiliate.ts       # Stripe Connect affiliation
│   │   ├── notifications/
│   │   │   ├── email.ts           # Emails transactionnels (Resend)
│   │   │   ├── push.ts            # Push notifications PWA
│   │   │   ├── scheduler.ts       # Cron jobs relances
│   │   │   └── templates/         # Templates emails FR/EN
│   │   ├── integrations/
│   │   │   ├── sirene.ts          # API INSEE/SIRENE
│   │   │   ├── banque-france.ts   # Données benchmarks
│   │   │   └── export-mp.ts       # Export marchés publics
│   │   ├── whitelabel/
│   │   │   ├── tenant.ts          # Gestion multi-tenant
│   │   │   ├── branding.ts        # Configuration branding
│   │   │   └── consultant-api.ts  # API spécifique consultants
│   │   └── utils/
│   │       ├── encryption.ts      # Chiffrement AES-256
│   │       ├── anonymizer.ts      # Anonymisation avant envoi IA
│   │       ├── rate-limiter.ts    # Rate limiting
│   │       └── i18n.ts            # Helpers i18n
│   ├── types/
│   │   ├── diagnostic.ts          # Types diagnostic
│   │   ├── company.ts             # Types profil entreprise
│   │   ├── document.ts            # Types documents
│   │   ├── report.ts              # Types rapports
│   │   ├── billing.ts             # Types facturation
│   │   └── api.ts                 # Types API partagés
│   └── middleware.ts              # Auth middleware + RLS
├── workers/
│   ├── document-analyzer.ts       # Worker analyse documents
│   ├── report-generator.ts        # Worker génération rapports
│   └── training-generator.ts      # Worker génération formations
├── .env.example
├── package.json
└── tsconfig.json
```

## SCHÉMA DE BASE DE DONNÉES COMPLET

Génère le fichier `prisma/schema.prisma` complet avec TOUS les modèles suivants :

```prisma
// Utilise ces modèles — GÉNÈRE LE SCHÉMA COMPLET avec toutes les relations

// CORE
- User (id, email, name, role, locale[fr/en], avatar, createdAt, updatedAt)
- Company (id, userId, name, siret, sector, subsector, products, location, employees, revenue, clients, competitors, createdAt)
- Subscription (id, userId, plan[free/starter/pro/expert/consultant_solo/consultant_cabinet], stripeCustomerId, stripeSubscriptionId, status, currentPeriodEnd)

// DIAGNOSTIC
- Diagnostic (id, companyId, type[full/waste/strategy/quick], status[in_progress/completed/archived], targetAmount, targetType[revenue_increase/cost_reduction], targetTimeMonths, autonomyLevel[self/guided/accompanied], score, results:Json, startedAt, completedAt)
- DiagnosticAnswer (id, diagnosticId, questionKey, questionText, answer:Json, score, category[waste_1..8/strategy/financial/operational], createdAt)
- DiagnosticInsight (id, diagnosticId, type[strength/weakness/opportunity/quick_win], title, description, estimatedImpact, priority, category)

// OUTILS METHODOLOGIQUES
- VsmMap (id, diagnosticId, processName, steps:Json, bottlenecks:Json, currentState:Json, futureState:Json)
- IshikawaDiagram (id, diagnosticId, problem, causes:Json, rootCause, prioritizedCauses:Json)
- A3Report (id, diagnosticId, background, problemStatement, goal, rootCauseAnalysis, countermeasures:Json, implementationPlan:Json, followUp:Json)
- SwotAnalysis (id, diagnosticId, strengths:Json, weaknesses:Json, opportunities:Json, threats:Json, towsStrategies:Json)
- SteepleAnalysis (id, diagnosticId, social:Json, technological:Json, economic:Json, environmental:Json, political:Json, legal:Json, ethical:Json)
- PorterAnalysis (id, diagnosticId, supplierPower, buyerPower, newEntrants, substitutes, rivalry, details:Json)
- BcgMatrix (id, diagnosticId, products:Json)
- HoshinMatrix (id, diagnosticId, vision, objectives:Json, kpis:Json, responsibilities:Json)

// DOCUMENTS
- Document (id, companyId, type[invoice/quote/balance_sheet/insurance/brochure_company/brochure_client], filename, storagePath, mimeType, extractedData:Json, validatedByUser:Boolean, uploadedAt)

// FEUILLE DE ROUTE
- Roadmap (id, diagnosticId, timelineMonths, capacityHoursPerWeek, hasDedicatedPerson, budget, generatedAt)
- RoadmapAction (id, roadmapId, title, description, category[quick_win/short_term/structural/transformation], estimatedGain, effortLevel[low/medium/high], durationWeeks, responsibleRole, status[todo/in_progress/done/skipped], dueDate, completedAt, linkedWaste, linkedTrainingId)

// FORMATIONS
- Training (id, type[theory_video/practice_video/memory_sheet/implementation_guide], title, description, locale[fr/en], sector, contentUrl, thumbnailUrl, durationSeconds, methodology[lean/six_sigma/strategy/general])
- UserTrainingProgress (id, userId, trainingId, status[not_started/in_progress/completed], progressPercent, completedAt)

// WHITE-LABEL
- WhiteLabelConfig (id, userId, brandName, logoUrl, primaryColor, secondaryColor, customDomain, contactEmail, isActive)
- ConsultantClient (id, consultantId, companyId, status[active/archived], notes, addedAt)

// NOTIFICATIONS
- Notification (id, userId, type[diagnostic_reminder/action_due/milestone/training_new/rediagnostic], title, body, isRead, scheduledAt, sentAt, channel[email/push/in_app])

// PAIEMENT
- SupportPack (id, userId, type[coup_de_pouce/acceleration/transformation], status[purchased/partially_used/used/expired], hoursTotal, hoursUsed, purchasedAt, expiresAt, stripePaymentId)
- SupportSession (id, packId, date, durationMinutes, notes, consultantNotes)

// AFFILIATION
- Affiliate (id, userId, code, commissionRate, stripeConnectId, totalEarned, status[active/paused])
- Referral (id, affiliateId, referredUserId, status[signed_up/converted/churned], convertedAt, commissionPaid)

// COLLABORATION
- TeamMember (id, companyId, userId, role[owner/collaborator/observer], invitedAt, acceptedAt)
```

## MOTEUR DE DIAGNOSTIC CONVERSATIONNEL — LOGIQUE CRITIQUE

Le cœur de l'application. Génère `src/lib/diagnostic/question-engine.ts` :

```typescript
/**
 * MOTEUR DE QUESTIONNEMENT ADAPTATIF
 * 
 * RÈGLES ABSOLUES :
 * 1. JAMAIS plus de 1 question principale par écran (+ max 2 sous-questions liées)
 * 2. Chaque question dépend de TOUTES les réponses précédentes
 * 3. Si un document uploadé répond déjà → SKIP la question
 * 4. Ton conversationnel, humain, pas de jargon Lean (sauf mode consultant)
 * 5. Feedback immédiat après chaque bloc de 3-5 réponses
 * 6. Branchement conditionnel : entreprise de services → skip questions stocks/production
 * 
 * FLUX :
 * Phase 0 : 3 questions de cadrage (objectif financier, horizon temps, autonomie)
 * Phase 1 : Profilage entreprise (secteur, taille, CA...) — enrichi par documents/SIRENE
 * Phase 2 : Diagnostic 8 gaspillages (adapté au secteur)
 * Phase 3 : Approfondissement des 3 pires gaspillages (VSM, Ishikawa si pertinent)
 * Phase 4 : Analyse stratégique (SWOT, Porter si pertinent)
 * Phase 5 : Génération recommandations + feuille de route
 * 
 * Le moteur utilise l'API Claude pour :
 * - Générer la prochaine question contextuelle
 * - Analyser la réponse et extraire le score
 * - Détecter quand approfondir ou passer au bloc suivant
 * - Générer les mini-insights entre les blocs
 */
```

Implémente ce moteur complet avec :
- `getNextQuestion(diagnosticId)` : retourne la prochaine question contextuelle
- `submitAnswer(diagnosticId, answer)` : traite la réponse, met à jour les scores, décide du branchement
- `getProgress(diagnosticId)` : retourne la progression et les insights partiels
- `skipQuestionsFromDocument(diagnosticId, documentId)` : marque les questions répondues par un document
- `generateInsight(diagnosticId)` : génère un mini-insight après un bloc de réponses

## PROMPT SYSTÈME POUR L'IA DIAGNOSTIC

Génère `src/lib/ai/prompts/diagnostic.ts` avec le prompt système complet :

```typescript
export const DIAGNOSTIC_SYSTEM_PROMPT = `
Tu es DiagOptim, un consultant expert en Lean Management et en stratégie d'entreprise. 
Tu réalises un diagnostic interactif pour une TPE/PME.

RÈGLES DE COMPORTEMENT :
1. Tu poses UNE SEULE question à la fois, formulée simplement
2. Tu adaptes ton vocabulaire au niveau de l'utilisateur (jamais de jargon sauf si mode consultant)
3. Tu es encourageant et bienveillant, comme un coach
4. Tu utilises les données déjà connues (profil, documents) pour contextualiser
5. Si tu détectes une incohérence dans les réponses, tu demandes gentiment une clarification
6. Tu donnes des mini-feedbacks positifs régulièrement ("Bon point : ...")
7. Tu quantifies toujours quand c'est possible ("Cela représente environ X€/an de gains potentiels")

CONTEXTE ENTREPRISE :
{companyProfile}

DOCUMENTS ANALYSÉS :
{analyzedDocuments}

RÉPONSES PRÉCÉDENTES :
{previousAnswers}

PHASE ACTUELLE : {currentPhase}
OBJECTIF UTILISATEUR : {targetType} de {targetAmount}€ en {targetMonths} mois

LANGUE : {locale}

Génère la prochaine question au format JSON :
{
  "questionId": "waste_overproduction_1",
  "questionText": "...",
  "questionType": "scale|choice|text|number|boolean",
  "options": [...],  // si choice
  "min": 0, "max": 10, // si scale
  "helpText": "...",  // explication simple du concept
  "skipIf": "...",    // condition de skip
  "category": "waste_1",
  "insight": "..." // mini-insight optionnel basé sur les réponses précédentes
}
`;
```

## PIPELINE D'ANALYSE DOCUMENTAIRE

Génère `src/lib/documents/parser.ts` complet :

```typescript
/**
 * PIPELINE D'ANALYSE DOCUMENTAIRE
 * 
 * 1. Upload → Supabase Storage (chiffré)
 * 2. Détection type (PDF, image, DOCX)
 * 3. Extraction texte (OCR si image, parsing si PDF/DOCX)
 * 4. Anonymisation des données personnelles
 * 5. Envoi à Claude pour extraction structurée selon le type de document
 * 6. Retour données structurées pour validation utilisateur
 * 7. Intégration au diagnostic si validé
 * 
 * TYPES DE DOCUMENTS ET DONNÉES EXTRAITES :
 * - Facture : montant, fournisseur, date, récurrence, poste de coût
 * - Devis : montants, postes, marges implicites, conditions
 * - Bilan/Liasse : CA, charges, résultat, trésorerie, ratios
 * - Assurance : garanties, primes, couvertures, échéances
 * - Plaquette : offre, positionnement, arguments, segments
 */
```

## SYSTÈME DE SCORING

Génère `src/lib/ai/scoring.ts` :

```typescript
/**
 * ALGORITHMES DE SCORING
 * 
 * Score global (0-100) = moyenne pondérée des modules activés
 * 
 * 8 Gaspillages : score 0-10 par catégorie
 *   - Surproduction (poids: 15%)
 *   - Attentes (poids: 15%)
 *   - Transports (poids: 10%)
 *   - Traitements excessifs (poids: 15%)
 *   - Stocks (poids: 10%) — pondération réduite si services
 *   - Mouvements (poids: 10%)
 *   - Défauts (poids: 15%)
 *   - Sous-utilisation RH (poids: 10%)
 * 
 * Chaque score est calculé à partir des réponses ET des données documentaires
 * Les poids sont ajustés selon le secteur (industrie vs services vs commerce)
 * 
 * Estimation des gains :
 * - Chaque gaspillage identifié → fourchette de gains (min-max)
 * - Basée sur le CA, le nombre d'employés et les benchmarks sectoriels
 * - TOUJOURS en fourchette, JAMAIS un chiffre unique
 * - Disclaimer systématique
 */
```

## STRIPE — PLANS ET PACKS

Génère `src/lib/billing/plans.ts` :

```typescript
export const PLANS = {
  free: {
    name: { fr: 'Découverte', en: 'Discovery' },
    price: 0,
    diagnosticsPerMonth: 1,
    documentsPerMonth: 0,
    leanTools: ['swot_basic'],
    strategyTools: [],
    reportType: 'online_summary',
    roadmap: false,
    trainings: { theoryVideos: 2, memorySheets: 3 },
    collaborators: 1,
    integrations: [],
    history: 'last_only',
  },
  starter: {
    name: { fr: 'Starter', en: 'Starter' },
    priceMonthly: 4900, // centimes
    priceYearly: 46800,  // -20%
    diagnosticsPerMonth: 3,
    documentsPerMonth: 5,
    leanTools: ['waste_analysis', 'vsm_basic', 'ishikawa'],
    strategyTools: [],
    reportType: 'pdf_basic',
    roadmap: 'basic',
    trainings: { theoryVideos: 'all', practiceVideos: 0, memorySheets: 10 },
    collaborators: 2,
    integrations: ['csv_excel'],
    history: '6_months',
  },
  pro: {
    name: { fr: 'Pro', en: 'Pro' },
    priceMonthly: 14900,
    priceYearly: 142800,
    diagnosticsPerMonth: -1, // illimité
    documentsPerMonth: 30,
    leanTools: 'all',
    strategyTools: 'all',
    reportType: 'pdf_full_branded',
    roadmap: 'full_gantt',
    trainings: 'all',
    collaborators: 5,
    integrations: ['csv_excel', 'api_3'],
    history: 'unlimited',
  },
  expert: {
    name: { fr: 'Expert', en: 'Expert' },
    priceMonthly: 29900,
    priceYearly: 286800,
    diagnosticsPerMonth: -1,
    documentsPerMonth: -1,
    leanTools: 'all_custom',
    strategyTools: 'all_benchmarks',
    reportType: 'pdf_docx_custom',
    roadmap: 'full_realtime',
    trainings: 'all_sectorial',
    collaborators: -1,
    integrations: 'all_zapier',
    history: 'unlimited_multisite',
  },
  consultant_solo: {
    name: { fr: 'Consultant Solo', en: 'Consultant Solo' },
    priceMonthly: 19900,
    priceYearly: 190800,
    maxClients: 15,
    whiteLabel: true,
    customDomain: false,
    customTemplates: false,
  },
  consultant_cabinet: {
    name: { fr: 'Cabinet', en: 'Firm' },
    priceMonthly: 49900,
    priceYearly: 478800,
    maxUsers: 5,
    maxClients: -1,
    whiteLabel: true,
    customDomain: true,
    customTemplates: true,
    advancedAnalytics: true,
  },
} as const;

export const SUPPORT_PACKS = {
  coup_de_pouce: { price: 7900, hours: 1, validityMonths: 6 },
  acceleration: { price: 24900, hours: 3, validityMonths: 6 },
  transformation: { price: 69900, hours: 10, validityMonths: 6 },
} as const;

export const SUPPORT_SUBSCRIPTIONS = {
  essential: { priceMonthly: 9900, hoursPerMonth: 2, responseTime: '48h' },
  premium: { priceMonthly: 24900, hoursPerMonth: 5, responseTime: '24h', dedicatedConsultant: true },
} as const;
```

## API ROUTES — ENDPOINTS COMPLETS

Génère TOUTES les API Routes suivantes avec leur logique métier :

```
POST   /api/auth/register         — Inscription (Supabase Auth)
POST   /api/auth/login             — Connexion
POST   /api/auth/oauth/google      — OAuth Google
POST   /api/auth/2fa/enable        — Activer 2FA

POST   /api/company/profile        — Créer/MAJ profil entreprise
GET    /api/company/profile        — Récupérer profil
GET    /api/company/sirene/:siret  — Auto-complétion SIRENE

POST   /api/diagnostic/start       — Démarrer un diagnostic (avec les 3 questions de cadrage)
GET    /api/diagnostic/:id/next    — Prochaine question (moteur adaptatif)
POST   /api/diagnostic/:id/answer  — Soumettre réponse
GET    /api/diagnostic/:id/progress — Progression + insights partiels
GET    /api/diagnostic/:id/results — Résultats complets
POST   /api/diagnostic/:id/complete — Finaliser diagnostic

POST   /api/documents/upload       — Upload document
GET    /api/documents/:id/extracted — Données extraites (pour validation)
POST   /api/documents/:id/validate — Valider les données extraites
DELETE /api/documents/:id          — Supprimer document

GET    /api/reports/:diagnosticId  — Générer/récupérer rapport
GET    /api/reports/:diagnosticId/download/:format — Télécharger PDF/DOCX

POST   /api/roadmap/generate       — Générer feuille de route
GET    /api/roadmap/:id            — Récupérer feuille de route
PATCH  /api/roadmap/action/:id     — MAJ statut action
GET    /api/roadmap/:id/gantt      — Données Gantt

GET    /api/training/library       — Bibliothèque formations
GET    /api/training/:id           — Détail formation
POST   /api/training/:id/progress  — MAJ progression
GET    /api/training/memory-sheet/:id/download — Télécharger fiche mémo

POST   /api/billing/checkout       — Créer session Stripe Checkout
POST   /api/billing/portal         — Portail client Stripe
POST   /api/billing/webhook        — Webhook Stripe
POST   /api/billing/pack/purchase  — Acheter pack support
GET    /api/billing/subscription   — Statut abonnement

POST   /api/whitelabel/config      — Config white-label
GET    /api/whitelabel/clients     — Liste clients consultant
POST   /api/whitelabel/invite      — Inviter client

POST   /api/team/invite            — Inviter collaborateur
PATCH  /api/team/:memberId/role    — Changer rôle
DELETE /api/team/:memberId         — Retirer collaborateur

GET    /api/notifications          — Liste notifications
PATCH  /api/notifications/:id/read — Marquer comme lu
PUT    /api/notifications/preferences — Préférences notifications

POST   /api/export/marches-publics — Export pour mémoire technique
GET    /api/export/data            — Export complet données (portabilité RGPD)

GET    /api/benchmarks/:sector     — Benchmarks sectoriels
```

## SÉCURITÉ — IMPLÉMENTATION OBLIGATOIRE

```typescript
// Chaque route API doit :
// 1. Vérifier le JWT (middleware auth)
// 2. Vérifier le plan (middleware plan-gate)
// 3. Appliquer le rate limiting (middleware rate-limit)
// 4. Valider les inputs avec Zod
// 5. Logger l'action (audit trail)
// 6. Appliquer le RLS Supabase (isolation des données)

// Chiffrement documents :
// - AES-256-GCM au repos
// - Clé dérivée par utilisateur
// - Suppression définitive (pas soft delete) sur demande

// Anonymisation avant IA :
// - Retirer noms, SIRET, adresses des prompts envoyés à Claude
// - Garder uniquement : secteur, taille, montants, ratios
```

## WORKERS ASYNCHRONES

Génère les 3 workers BullMQ :

1. `workers/document-analyzer.ts` : Reçoit un documentId, lance OCR + extraction IA, stocke résultats
2. `workers/report-generator.ts` : Reçoit un diagnosticId, génère le rapport PDF/DOCX complet avec recommandations
3. `workers/training-generator.ts` : Reçoit une liste d'actions de roadmap, génère les micro-contenus de formation (scripts vidéo, memory sheets)

## INSTRUCTIONS FINALES

1. Génère TOUS les fichiers ci-dessus avec le code TypeScript COMPLET et fonctionnel
2. Chaque fichier doit avoir des types stricts (pas de `any`)
3. Chaque endpoint doit gérer les erreurs proprement (try/catch, codes HTTP appropriés)
4. Ajoute des commentaires JSDoc sur chaque fonction publique
5. Le code doit être production-ready, pas un prototype
6. Génère aussi le `package.json` avec toutes les dépendances
7. Génère le `.env.example` avec toutes les variables nécessaires
8. Lance `npm install` et vérifie que le projet compile sans erreur

COMMENCE PAR : le schéma Prisma complet, puis le moteur de diagnostic (c'est le cœur), puis les API routes une par une.
