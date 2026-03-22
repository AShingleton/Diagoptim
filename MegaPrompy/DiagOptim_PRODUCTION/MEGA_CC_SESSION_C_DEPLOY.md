# ═══════════════════════════════════════════════════════════════════════════════
# MÉGA-PROMPT CLAUDE CODE — SESSION C (APRÈS A + B)
# TESTER + DÉPLOYER + MONITORING
# ═══════════════════════════════════════════════════════════════════════════════
# Pré-requis : Sessions A (fusion) et B (config) terminées
# Lancez ce prompt quand tout est configuré et fusionné
# ═══════════════════════════════════════════════════════════════════════════════

Tu vas tester l'application DiagOptim complète, préparer le déploiement production et configurer le monitoring. Exécute les 4 blocs suivants sans attendre entre chaque bloc.

# ═══ BLOC 1/4 : TESTS COMPLETS ═══

1. Lance le build complet :
   ```bash
   npm run build
   ```
   Si des erreurs → corrige-les une par une → relance le build jusqu'à 0 erreurs.

2. Lance le type checking :
   ```bash
   npm run typecheck
   ```
   Si des erreurs TypeScript → corrige → relance.

3. Lance les tests unitaires :
   ```bash
   npm run test
   ```
   Si des tests échouent → diagnostique et corrige → relance.
   Objectif : 129+ tests passing, 0 failing.

4. Lance le linter :
   ```bash
   npm run lint
   ```
   Corrige les erreurs critiques (les warnings sont OK).

5. Vérifie que l'application démarre :
   ```bash
   npm run dev
   ```
   Vérifie (via curl ou fetch) que ces routes répondent :
   - GET http://localhost:3000 → 200 (landing page)
   - GET http://localhost:3000/fr → 200
   - GET http://localhost:3000/en → 200
   - GET http://localhost:3000/fr/pricing → 200
   - GET http://localhost:3000/fr/login → 200
   - GET http://localhost:3000/api/health → 200 (si le endpoint existe)
   
   Si des routes échouent → diagnostique et corrige.

6. Résumé des tests :
   ```
   Build        : ✅ / ❌
   TypeScript   : ✅ / ❌ (X erreurs)
   Tests        : ✅ / ❌ (X passing / Y failing)
   Lint         : ✅ / ❌
   Dev server   : ✅ / ❌
   Routes       : X/6 OK
   ```

# ═══ BLOC 2/4 : PRÉPARATION DÉPLOIEMENT ═══

1. Crée/vérifie .gitignore :
   ```
   node_modules/
   .next/
   .env
   .env.local
   .env.production
   *.log
   dist/
   coverage/
   .DS_Store
   .vercel
   prisma/generated/
   ```

2. Vérifie vercel.json :
   ```json
   {
     "framework": "nextjs",
     "regions": ["cdg1"],
     "headers": [
       {
         "source": "/(.*)",
         "headers": [
           { "key": "X-Frame-Options", "value": "DENY" },
           { "key": "X-Content-Type-Options", "value": "nosniff" },
           { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
           { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
         ]
       },
       {
         "source": "/sw.js",
         "headers": [{ "key": "Cache-Control", "value": "no-cache" }]
       }
     ],
     "crons": [
       { "path": "/api/cron/notifications", "schedule": "0 */6 * * *" },
       { "path": "/api/cron/weekly-summary", "schedule": "0 8 * * 1" },
       { "path": "/api/cron/rediagnostic-reminder", "schedule": "0 9 * * *" }
     ]
   }
   ```

3. Vérifie le Dockerfile (workers Railway) :
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --production
   COPY prisma ./prisma
   RUN npx prisma generate
   COPY . .
   CMD ["npx", "tsx", "workers/index.ts"]
   ```

4. Vérifie docker-compose.yml (dev local) :
   ```yaml
   version: '3.8'
   services:
     redis:
       image: redis:7-alpine
       ports: ['6379:6379']
       volumes: ['redis-data:/data']
   volumes:
     redis-data:
   ```

5. Crée README.md professionnel :
   - Titre + description du projet
   - Badges (TypeScript, tests, licence)
   - Stack technique
   - Installation (5 étapes)
   - Variables d'environnement requises (tableau)
   - Commandes disponibles (tableau)
   - Architecture du projet (arbre de fichiers simplifié)
   - Déploiement (Vercel + Railway)
   - Licence

6. Initialise Git :
   ```bash
   git init
   git add .
   git commit -m "DiagOptim v1.0.0 - Production ready - 215+ files, 41K lines, 129 tests"
   ```

7. Affiche les stats Git :
   ```bash
   git log --oneline
   git diff --stat --cached HEAD~1 2>/dev/null || echo "Premier commit"
   find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l
   ```

# ═══ BLOC 3/4 : MONITORING ET ANALYTICS ═══

1. Crée src/app/api/health/route.ts :
   ```typescript
   // GET /api/health
   // Retourne :
   // - 200 { status: "ok", version: "1.0.0", uptime: X, services: { db: true, redis: true } }
   // - 503 { status: "degraded", services: { db: true, redis: false } }
   
   // Vérifie :
   // - Connexion Prisma (SELECT 1)
   // - Connexion Redis (PING) si REDIS_URL défini
   // - Ne vérifie PAS les services externes (Stripe, Claude) pour éviter les rate limits
   ```

2. Crée scripts/monitor.ts :
   ```typescript
   // Script de monitoring à lancer via cron externe ou Railway
   // Toutes les 5 minutes :
   // 1. GET /api/health → si pas 200, alerte
   // 2. Vérifie les workers BullMQ (jobs failed > seuil)
   // 3. Si problème → envoie email alerte via Resend
   ```

3. Configure PostHog (si la clé est définie dans .env) :
   - Crée src/lib/analytics/posthog.ts (client + provider)
   - Crée src/components/providers/PostHogProvider.tsx
   - Intègre dans le layout racine (conditionnel : seulement si NEXT_PUBLIC_POSTHOG_KEY est défini)
   - Track les events :
     * page_view (automatique via PostHog)
     * diagnostic_started
     * diagnostic_completed  
     * document_uploaded
     * report_downloaded
     * subscription_created
     * subscription_cancelled
     * support_pack_purchased

4. Crée src/app/[locale]/(app)/admin/page.tsx — Dashboard admin :
   ```typescript
   // Accessible uniquement aux utilisateurs avec role === 'admin'
   // Affiche :
   // - Nombre total d'utilisateurs
   // - Nombre de diagnostics ce mois
   // - Nombre d'abonnés payants (par plan)
   // - MRR estimé (calculé depuis les subscriptions actives)
   // - Graphique inscriptions 30 derniers jours (Recharts BarChart)
   // - Liste des 10 derniers diagnostics complétés
   // - État des workers (pending/failed jobs)
   // - Bouton "Lancer health check"
   ```

# ═══ BLOC 4/4 : LAUNCH CHECKLIST FINALE ═══

1. Vérifie que LAUNCH_CHECKLIST.md existe et est à jour
2. Ajoute automatiquement les statuts de ce qu'on peut vérifier programmatiquement :
   ```markdown
   ## Vérifications automatiques (résultat de cette session)
   - [x] Build production : 0 erreurs
   - [x] TypeScript : 0 erreurs
   - [x] Tests : 129 passing
   - [x] Lint : OK
   - [x] .gitignore : configuré
   - [x] vercel.json : configuré (cdg1, headers, crons)
   - [x] Dockerfile : configuré
   - [x] docker-compose.yml : configuré
   - [x] README.md : créé
   - [x] Git : initialisé et premier commit fait
   - [x] /api/health : endpoint créé
   - [x] PostHog : configuré (si clé définie)
   - [x] Dashboard admin : créé
   - [x] Monitoring script : créé
   ```

3. Liste les actions MANUELLES restantes :
   ```markdown
   ## Actions manuelles restantes
   - [ ] Créer un repo GitHub privé et pusher le code
   - [ ] Importer le projet sur Vercel et configurer les env vars
   - [ ] Déployer les workers sur Railway
   - [ ] Configurer Redis sur Upstash
   - [ ] Configurer le domaine DNS (app.diagoptim.com → Vercel)
   - [ ] Configurer le webhook Stripe en production
   - [ ] Exécuter les RLS policies dans Supabase SQL Editor
   - [ ] Configurer Google OAuth redirect URLs pour production
   - [ ] CGV + Politique de confidentialité (avocat)
   - [ ] Assurance RC Pro
   - [ ] Beta test avec 10-20 utilisateurs
   - [ ] 🚀 GO LIVE
   ```

# ═══ RAPPORT FINAL SESSION C ═══

```
RAPPORT FINAL DiagOptim v1.0.0
=================================

BUILD & TESTS
  Build        : ✅ 0 erreurs
  TypeScript   : ✅ 0 erreurs
  Tests        : ✅ 129 passing
  Routes       : ✅ 6/6 OK

DÉPLOIEMENT
  .gitignore   : ✅
  vercel.json  : ✅ (cdg1, 3 crons)
  Dockerfile   : ✅
  README.md    : ✅
  Git commit   : ✅

MONITORING
  /api/health  : ✅
  PostHog      : ✅ / ⏭️ (selon .env)
  Admin dashboard : ✅
  Monitor script  : ✅

PRÊT POUR PRODUCTION : OUI ✅
Suivez les actions manuelles dans LAUNCH_CHECKLIST.md
```
