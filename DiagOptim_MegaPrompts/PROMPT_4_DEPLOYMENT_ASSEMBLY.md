# ═══════════════════════════════════════════════════════════════════════════════
# MÉGA-PROMPT 4/4 — ASSEMBLAGE FINAL, DÉPLOIEMENT & TESTS
# Application DiagOptim™ — Infrastructure, PWA, intégrations, CI/CD
# ═══════════════════════════════════════════════════════════════════════════════
# INSTRUCTIONS : Exécutez APRÈS les Prompts 1, 2 et 3.
# Ce prompt assemble tout, configure le déploiement et les tests.
# ═══════════════════════════════════════════════════════════════════════════════

Tu vas finaliser l'application DiagOptim™ en assemblant le back-end (Prompt 1+3) et le front-end (Prompt 2), puis configurer l'infrastructure de production, les tests, la PWA et le CI/CD.

## 1. CONFIGURATION PROGRESSIVE WEB APP (PWA)

Génère tous les fichiers nécessaires pour une PWA complète :

```typescript
// next.config.js — Configuration PWA
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.diagoptim\.com\/api\/.*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-cache', expiration: { maxEntries: 50, maxAgeSeconds: 300 } }
    },
    {
      urlPattern: /\/training\/.*\.(mp4|webm)/,
      handler: 'CacheFirst',
      options: { cacheName: 'video-cache', expiration: { maxEntries: 20, maxAgeSeconds: 30 * 24 * 60 * 60 } }
    },
    {
      urlPattern: /\/memory-sheets\/.*\.pdf/,
      handler: 'CacheFirst',
      options: { cacheName: 'pdf-cache', expiration: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 } }
    },
  ],
  fallbacks: { document: '/offline' },
});
```

Génère aussi :
- `public/manifest.json` (nom, icônes, couleurs, display: standalone, screenshots)
- `public/sw.js` (service worker custom pour sync offline)
- `src/app/offline/page.tsx` (page offline élégante)
- `src/lib/pwa/install-prompt.ts` (gestion du prompt d'installation)
- `src/lib/pwa/offline-sync.ts` (synchronisation quand retour en ligne)

### Données accessibles hors-ligne :
```typescript
// IndexedDB schema pour cache local
const OFFLINE_STORES = {
  'diagnostic-progress': 'Diagnostic en cours (dernière question, réponses)',
  'roadmap-actions': 'Actions de la feuille de route avec statuts',
  'memory-sheets': 'Fiches mémo téléchargées (PDF blob)',
  'training-videos': 'Vidéos téléchargées (si l\'utilisateur a cliqué "télécharger")',
  'dashboard-snapshot': 'Dernier snapshot du dashboard',
  'company-profile': 'Profil entreprise (toujours dispo)',
  'user-notes': 'Notes et commentaires (sync quand en ligne)',
};
```

## 2. SYSTÈME DE NOTIFICATIONS COMPLET

Génère `src/lib/notifications/` :

```typescript
// scheduler.ts — Cron jobs pour les relances automatiques
// Utilise BullMQ avec des jobs récurrents

const NOTIFICATION_RULES = [
  {
    trigger: 'diagnostic_abandoned',
    condition: 'diagnostic.status === "in_progress" && lastActivity > 48h',
    channel: ['email', 'push'],
    template: {
      fr: { title: 'Votre diagnostic vous attend !', body: 'Vous étiez à {progress}%. Reprenez en 5 minutes.' },
      en: { title: 'Your diagnostic awaits!', body: 'You were at {progress}%. Resume in 5 minutes.' },
    },
    maxFrequency: '72h', // pas plus d'un rappel tous les 3 jours
  },
  {
    trigger: 'action_overdue',
    condition: 'roadmapAction.dueDate < now() && roadmapAction.status !== "done"',
    channel: ['email', 'push', 'in_app'],
    template: {
      fr: { title: 'Action en retard', body: 'L\'action "{actionTitle}" devait être terminée le {dueDate}. Besoin d\'aide ?' },
      en: { title: 'Overdue action', body: 'Action "{actionTitle}" was due on {dueDate}. Need help?' },
    },
    maxFrequency: '7d',
  },
  {
    trigger: 'milestone_reached',
    condition: 'completedActionsCount % 3 === 0', // chaque 3 actions
    channel: ['push', 'in_app'],
    template: {
      fr: { title: 'Bravo ! 🎉', body: 'Vous avez complété {count} actions ! Gains estimés : +{gains}€' },
      en: { title: 'Congrats! 🎉', body: 'You completed {count} actions! Estimated gains: +{gains}€' },
    },
    celebrationAnimation: true,
  },
  {
    trigger: 'rediagnostic_reminder',
    condition: 'lastDiagnostic.completedAt < now() - 90d',
    channel: ['email'],
    template: {
      fr: { title: '3 mois depuis votre dernier diagnostic', body: 'Il est temps de mesurer vos progrès ! Lancez un nouveau diagnostic.' },
      en: { title: '3 months since your last diagnostic', body: 'Time to measure your progress! Start a new diagnostic.' },
    },
    maxFrequency: '30d',
  },
  {
    trigger: 'weekly_summary',
    condition: 'dayOfWeek === 1 && user.hasActiveSubscription', // lundi
    channel: ['email'],
    template: {
      fr: { title: 'Votre résumé hebdomadaire DiagOptim', body: '...' },
      en: { title: 'Your weekly DiagOptim summary', body: '...' },
    },
  },
  {
    trigger: 'plan_limit_approaching',
    condition: 'usage.diagnosticsThisMonth >= plan.diagnosticsPerMonth * 0.8',
    channel: ['in_app'],
    template: {
      fr: { title: 'Vous approchez de votre limite', body: 'Il vous reste {remaining} diagnostic(s) ce mois. Passez au plan supérieur pour continuer.' },
      en: { title: 'Approaching your limit', body: 'You have {remaining} diagnostic(s) left this month. Upgrade to continue.' },
    },
  },
];

// Email templates via Resend (HTML responsive)
// Push via Web Push API (service worker)
// In-app via Supabase Realtime (websocket)
```

## 3. INTÉGRATIONS TIERS

Génère `src/lib/integrations/` :

```typescript
// sirene.ts — API INSEE/SIRENE
export async function lookupCompanyBySiret(siret: string): Promise<CompanyInfo> {
  // GET https://api.insee.fr/entreprises/sirene/V3.11/siret/{siret}
  // Extraire : nom, secteur NAF, adresse, effectif, date création
  // Fallback : API data.gouv.fr si INSEE indisponible
}

// accounting-import.ts — Import données comptables
export async function importFromCSV(file: Buffer, format: 'sage' | 'pennylane' | 'quickbooks' | 'generic'): Promise<FinancialData> {
  // Parse CSV selon le format
  // Mapper les colonnes au modèle DiagOptim
  // Valider et retourner les données structurées
}

// export-project-tools.ts — Export feuille de route vers outils de gestion
export function exportToTrello(roadmap: Roadmap): TrelloBoard { ... }
export function exportToNotion(roadmap: Roadmap): NotionDatabase { ... }
export function generateICalendar(roadmap: Roadmap): string { ... } // Format .ics pour calendrier

// zapier-webhook.ts — Webhooks pour Zapier/Make
export async function triggerZapierWebhook(event: string, data: any, webhookUrl: string): Promise<void> { ... }
```

## 4. STRIPE — CONFIGURATION COMPLÈTE

Génère `src/lib/billing/stripe.ts` :

```typescript
/**
 * STRIPE INTEGRATION
 * 
 * Produits :
 * - 4 abonnements utilisateurs (free, starter, pro, expert) — mensuel + annuel
 * - 2 abonnements consultants (solo, cabinet) — mensuel + annuel
 * - 3 packs support one-shot (coup_de_pouce, acceleration, transformation)
 * - 2 abonnements support (essentiel, premium) — mensuel
 * 
 * Stripe Connect :
 * - Programme d'affiliation (commission 20% sur 12 premiers mois)
 * - Paiement automatique mensuel aux affiliés
 * 
 * Webhooks à gérer :
 * - checkout.session.completed → activer abonnement
 * - customer.subscription.updated → mettre à jour plan
 * - customer.subscription.deleted → rétrograder vers free
 * - invoice.payment_failed → notifier utilisateur
 * - invoice.paid → mettre à jour facturation
 * 
 * Portail client Stripe pour :
 * - Changer de plan
 * - Mettre à jour carte
 * - Télécharger factures
 * - Annuler abonnement
 */
```

## 5. SÉCURITÉ — MIDDLEWARE COMPLET

Génère `src/middleware.ts` :

```typescript
/**
 * MIDDLEWARE STACK
 * 
 * Ordre d'exécution :
 * 1. Rate limiting (par IP + par user)
 * 2. Auth (vérification JWT Supabase)
 * 3. Locale detection (Accept-Language header ou cookie)
 * 4. Plan gating (vérifier les droits selon l'abonnement)
 * 5. White-label detection (custom domain → charger le branding)
 * 6. CORS (si API appelée depuis un domaine white-label)
 * 7. Security headers (CSP, HSTS, X-Frame-Options, etc.)
 * 
 * Rate limits :
 * - Free : 10 req/min, 100 req/h
 * - Starter : 30 req/min, 500 req/h
 * - Pro : 60 req/min, 2000 req/h
 * - Expert : 120 req/min, 5000 req/h
 * - API Claude : max 5 appels simultanés par utilisateur
 */
```

## 6. TESTS

Génère les tests suivants :

```typescript
// __tests__/scoring.test.ts
// - Test scoring avec données d'une entreprise industrielle
// - Test scoring avec données d'une entreprise de services (stocks=0)
// - Test calcul des gains avec fourchettes
// - Test pondérations par secteur
// - Test score global

// __tests__/question-engine.test.ts
// - Test branchement conditionnel (skip questions stocks si services)
// - Test enrichissement par documents (pas de question si bilan uploadé)
// - Test progression des phases
// - Test limite 1 question par tour
// - Test insights entre les blocs

// __tests__/document-analyzer.test.ts
// - Test extraction facture (montants, fournisseur)
// - Test extraction bilan (CA, charges, ratios)
// - Test anonymisation avant envoi IA
// - Test validation des données extraites

// __tests__/billing.test.ts
// - Test plan gating (accès refusé si plan insuffisant)
// - Test upgrade/downgrade
// - Test webhook Stripe
// - Test packs support (achat, utilisation, expiration)

// __tests__/api/diagnostic.test.ts
// - Test flow complet : start → answer → answer → results
// - Test reprise d'un diagnostic abandonné
// - Test accès diagnostic d'un autre utilisateur (interdit)

// e2e/diagnostic-flow.spec.ts (Playwright)
// - Test E2E : inscription → profil → diagnostic complet → résultats → rapport
// - Test E2E mobile : même flow sur viewport 375px
// - Test E2E : upload document → validation → impact sur diagnostic
```

## 7. VARIABLES D'ENVIRONNEMENT

Génère `.env.example` :

```env
# ═══ SUPABASE ═══
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_DB_URL=postgresql://...

# ═══ ANTHROPIC (IA) ═══
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514
ANTHROPIC_MAX_TOKENS=4096

# ═══ STRIPE ═══
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CONNECT_CLIENT_ID=ca_...

# ═══ RESEND (Emails) ═══
RESEND_API_KEY=re_...
EMAIL_FROM=DiagOptim <noreply@diagoptim.com>

# ═══ REDIS (Queues BullMQ) ═══
REDIS_URL=redis://...

# ═══ API EXTERNES ═══
INSEE_API_KEY=...
INSEE_API_SECRET=...

# ═══ VIDÉO / AUDIO ═══
ELEVENLABS_API_KEY=...
MUX_TOKEN_ID=...
MUX_TOKEN_SECRET=...

# ═══ ANALYTICS ═══
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com

# ═══ APP ═══
NEXT_PUBLIC_APP_URL=https://app.diagoptim.com
NEXT_PUBLIC_DEFAULT_LOCALE=fr
ENCRYPTION_KEY=... # 256-bit key pour AES-256-GCM

# ═══ PUSH NOTIFICATIONS ═══
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:admin@diagoptim.com
```

## 8. DÉPLOIEMENT

Génère les fichiers de configuration :

```yaml
# vercel.json — Configuration Vercel (front + API routes)
{
  "framework": "nextjs",
  "regions": ["cdg1"],  // Paris (EU)
  "env": { ... },
  "crons": [
    { "path": "/api/cron/notifications", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/weekly-summary", "schedule": "0 8 * * 1" },
    { "path": "/api/cron/rediagnostic-reminder", "schedule": "0 9 * * *" }
  ]
}
```

```dockerfile
# Dockerfile — Pour Railway (workers BullMQ)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build:workers
CMD ["node", "dist/workers/index.js"]
```

```yaml
# docker-compose.yml — Développement local
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
  
  app:
    build: .
    ports: ['3000:3000']
    env_file: .env.local
    depends_on: [redis]
    volumes: ['./src:/app/src']
  
  worker:
    build: .
    command: node dist/workers/index.js
    env_file: .env.local
    depends_on: [redis]
```

## 9. SUPABASE — ROW LEVEL SECURITY

Génère les politiques RLS complètes :

```sql
-- Chaque utilisateur ne voit que SES données
-- Les consultants voient les données de LEURS clients uniquement
-- Les collaborateurs voient les données de LEUR entreprise selon leur rôle

-- Companies
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view client companies" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consultant_clients 
      WHERE consultant_id = auth.uid() AND company_id = companies.id AND status = 'active'
    )
  );

-- Diagnostics
CREATE POLICY "Owner and team can view diagnostics" ON diagnostics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM companies c
      LEFT JOIN team_members tm ON tm.company_id = c.id
      WHERE c.id = diagnostics.company_id 
      AND (c.user_id = auth.uid() OR tm.user_id = auth.uid())
    )
  );

-- Documents (CRITIQUE : accès strictement limité)
CREATE POLICY "Only company owner can manage documents" ON documents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM companies WHERE id = documents.company_id AND user_id = auth.uid()
    )
  );

-- ... générer toutes les policies pour chaque table
```

## 10. CHECKLIST DE LANCEMENT

Génère un fichier `LAUNCH_CHECKLIST.md` :

```markdown
# DiagOptim™ — Checklist de Lancement

## Pré-requis légaux
- [ ] CGV rédigées par un avocat
- [ ] Politique de confidentialité (RGPD)
- [ ] DPA (Data Processing Agreement) 
- [ ] Mentions légales
- [ ] Politique cookies
- [ ] Assurance RC Pro souscrite

## Infrastructure
- [ ] Supabase projet EU créé et configuré
- [ ] Vercel déployé (domaine custom)
- [ ] Railway déployé (workers)
- [ ] Redis cloud configuré
- [ ] DNS configuré (app.diagoptim.com)
- [ ] SSL/TLS vérifié
- [ ] Emails SPF/DKIM/DMARC configurés

## Stripe
- [ ] Tous les produits créés (4 plans + 2 consultant + 3 packs + 2 support)
- [ ] Webhooks configurés
- [ ] Mode live activé
- [ ] Portail client testé
- [ ] Connect activé (affiliation)

## Sécurité
- [ ] RLS activé sur toutes les tables Supabase
- [ ] Rate limiting testé
- [ ] Chiffrement documents vérifié
- [ ] Anonymisation IA testée
- [ ] 2FA fonctionnel
- [ ] Headers sécurité vérifiés (CSP, HSTS...)
- [ ] Pentest initial (optionnel mais recommandé)

## Tests
- [ ] Tests unitaires passing (scoring, engine, billing)
- [ ] Tests E2E passing (flow diagnostic complet)
- [ ] Test mobile responsive (iPhone SE, iPhone 14, Android)
- [ ] Test PWA install + offline
- [ ] Test charge (50 utilisateurs simultanés)
- [ ] Test i18n (toutes les pages en FR et EN)

## Contenu
- [ ] Landing page finalisée
- [ ] Page pricing avec tous les plans
- [ ] FAQ complète
- [ ] 5 premiers articles de blog publiés
- [ ] 2 vidéos de formation théorie prêtes
- [ ] 10 memory sheets de base générées
- [ ] Templates email transactionnels testés

## Analytics
- [ ] PostHog configuré
- [ ] Events tracking : inscription, diagnostic_start, diagnostic_complete, upgrade, churn
- [ ] Dashboard analytics créé
- [ ] Alertes configurées (churn, erreurs)

## Go Live
- [ ] Beta test avec 10-20 utilisateurs
- [ ] Feedback intégré
- [ ] Monitoring Vercel + Railway opérationnel
- [ ] Procédure de rollback documentée
- [ ] Support email opérationnel
- [ ] 🚀 LANCEMENT
```

## INSTRUCTIONS FINALES

1. Assemble tous les fichiers des prompts 1, 2 et 3 en un projet cohérent
2. Vérifie que toutes les importations entre fichiers sont correctes
3. Génère le package.json COMPLET avec TOUTES les dépendances
4. Configure ESLint + Prettier
5. Lance `npm run build` et corrige toutes les erreurs
6. Lance les tests et vérifie qu'ils passent
7. Génère la documentation développeur (README.md)

Le projet doit compiler et tourner en local avec `npm run dev` immédiatement après exécution de ce prompt.
