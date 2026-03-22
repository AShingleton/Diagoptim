# ═══════════════════════════════════════════════════════════════════════════════
# MÉGA-PROMPT CLAUDE CODE — SESSION B (PARALLÈLE)
# TOUTE LA CONFIGURATION : BDD + RLS + STRIPE + OAUTH + HEALTH CHECK
# ═══════════════════════════════════════════════════════════════════════════════
# Pré-requis : .env configuré avec tous les credentials
# Peut tourner EN MÊME TEMPS que la Session A
# ═══════════════════════════════════════════════════════════════════════════════

Tu vas configurer TOUTE l'infrastructure DiagOptim en une seule session. Exécute les 5 blocs suivants dans l'ordre, sans attendre ma confirmation entre chaque bloc. Si un bloc échoue, diagnostique et corrige avant de passer au suivant.

# ═══ BLOC 1/5 : BASE DE DONNÉES PRISMA ═══

1. Vérifie que le fichier .env existe et contient DATABASE_URL
2. Exécute :
   ```
   npx prisma generate
   npx prisma db push
   ```
3. Vérifie que TOUTES les 30 tables sont créées
4. Liste les tables créées pour confirmation
5. Si erreur → diagnostique (mauvaise URL ? schéma incompatible ?) → corrige → relance

# ═══ BLOC 2/5 : POLITIQUES RLS SUPABASE ═══

1. Lis le fichier supabase/rls-policies.sql
2. Vérifie que le SQL est syntaxiquement correct
3. Vérifie que toutes les tables référencées existent (sinon corrige les noms)
4. Divise le SQL en blocs logiques et affiche-les clairement :
   - Bloc A : Fonctions helper (is_company_owner, is_team_member, etc.)
   - Bloc B : Policies tables core (users, companies, subscriptions)
   - Bloc C : Policies tables diagnostic
   - Bloc D : Policies tables documents (strictes)
   - Bloc E : Policies tables billing
   - Bloc F : Policies tables white-label
   - Bloc G : Policies tables notifications et audit
5. Pour chaque bloc, affiche le SQL prêt à copier dans l'éditeur SQL Supabase
6. Si possible, tente d'exécuter via la connexion PostgreSQL directe (DATABASE_URL)

# ═══ BLOC 3/5 : PRODUITS STRIPE ═══

1. Crée le script scripts/setup-stripe.ts qui :

```typescript
// Ce script crée automatiquement tous les produits et prix Stripe
// Produits à créer :

const PRODUCTS = [
  // ABONNEMENTS UTILISATEURS
  { name: 'DiagOptim Starter', description: 'Diagnostic 3/mois, 5 docs, outils de base', 
    prices: [{ amount: 4900, interval: 'month' }, { amount: 46800, interval: 'year' }] },
  { name: 'DiagOptim Pro', description: 'Diagnostics illimités, 30 docs, tous les outils', 
    prices: [{ amount: 14900, interval: 'month' }, { amount: 142800, interval: 'year' }] },
  { name: 'DiagOptim Expert', description: 'Tout illimité, multi-sites, intégrations', 
    prices: [{ amount: 29900, interval: 'month' }, { amount: 286800, interval: 'year' }] },
  
  // ABONNEMENTS CONSULTANTS
  { name: 'Consultant Solo', description: 'White-label, 15 clients max', 
    prices: [{ amount: 19900, interval: 'month' }, { amount: 190800, interval: 'year' }] },
  { name: 'Cabinet', description: 'White-label, 5 users, clients illimités, domaine custom', 
    prices: [{ amount: 49900, interval: 'month' }, { amount: 478800, interval: 'year' }] },
  
  // PACKS SUPPORT (one-time)
  { name: 'Pack Coup de Pouce', description: '1h de visio avec un consultant', 
    prices: [{ amount: 7900, type: 'one_time' }] },
  { name: 'Pack Accélération', description: '3h sur 1 mois + revue roadmap', 
    prices: [{ amount: 24900, type: 'one_time' }] },
  { name: 'Pack Transformation', description: '10h sur 3 mois + coaching personnalisé', 
    prices: [{ amount: 69900, type: 'one_time' }] },
  
  // ABONNEMENTS SUPPORT
  { name: 'Support Essentiel', description: '2h/mois, réponse 48h', 
    prices: [{ amount: 9900, interval: 'month' }] },
  { name: 'Support Premium', description: '5h/mois, réponse 24h, consultant dédié', 
    prices: [{ amount: 24900, interval: 'month' }] },
];
```

2. Le script doit :
   - Lire STRIPE_SECRET_KEY du .env
   - Créer chaque produit via stripe.products.create()
   - Créer chaque prix via stripe.prices.create() (currency: 'eur')
   - Afficher tous les IDs dans la console
   - Sauvegarder dans config/stripe-prices.json
   - Mettre à jour src/lib/billing/plans.ts avec les vrais price IDs Stripe

3. Exécute le script : npx tsx scripts/setup-stripe.ts
4. Vérifie que tous les produits sont créés (affiche le résumé)

# ═══ BLOC 4/5 : GOOGLE OAUTH ═══

1. Vérifie que src/app/api/auth/oauth/google/route.ts existe et est correct
2. Crée src/app/[locale]/(auth)/auth/callback/page.tsx si manquant :
   - Page qui reçoit le callback OAuth
   - Échange le code contre une session Supabase
   - Redirige vers /dashboard
   - Gère les erreurs proprement

3. Vérifie que le flow complet est implémenté :
   - Bouton "Google" → appel Supabase auth signInWithOAuth
   - Callback → session créée → profil utilisateur créé automatiquement
   - Nouveau user = plan "free" par défaut + locale détectée

4. Si des fichiers manquent, crée-les

# ═══ BLOC 5/5 : HEALTH CHECK ═══

1. Crée scripts/health-check.ts :

```typescript
// Vérifie TOUS les services DiagOptim
// Pour chaque service : tente une connexion minimale et affiche le résultat

async function checkAll() {
  const results = [];
  
  // 1. Supabase DB
  // → tente: SELECT 1 via Prisma client
  
  // 2. Supabase Auth  
  // → tente: supabase.auth.getSession() (devrait retourner null mais pas d'erreur)
  
  // 3. Redis
  // → tente: redis.ping()
  
  // 4. Anthropic Claude
  // → tente: anthropic.messages.create({ model, max_tokens: 10, messages: [{role:'user', content:'test'}] })
  
  // 5. Stripe
  // → tente: stripe.products.list({ limit: 1 })
  
  // 6. Resend
  // → tente: vérifier la clé API (GET https://api.resend.com/domains)
  
  // 7. Stripe Products
  // → lit config/stripe-prices.json et vérifie chaque price ID via stripe.prices.retrieve()
  
  // 8. Prisma Schema Sync
  // → tente: npx prisma db pull --print et compare
  
  // 9. Variables .env
  // → vérifie que TOUTES les variables critiques sont définies et non vides
  
  // Affichage :
  // ✅ Supabase DB : OK (30 tables)
  // ✅ Redis : OK (pong)
  // ✅ Anthropic : OK (claude-sonnet-4-20250514)
  // ❌ Stripe : ERREUR (clé invalide)
  // etc.
}
```

2. Exécute : npx tsx scripts/health-check.ts
3. Si des services échouent → affiche les instructions pour corriger

# ═══ RAPPORT FINAL ═══

Quand les 5 blocs sont terminés, affiche un rapport global :

```
RAPPORT CONFIGURATION DiagOptim
================================
Bloc 1 - Base de données : ✅ / ❌
  Tables créées : X/30
  
Bloc 2 - RLS Supabase : ✅ / ❌
  Policies prêtes : X tables protégées
  
Bloc 3 - Stripe : ✅ / ❌
  Produits créés : X/10
  Price IDs sauvegardés : config/stripe-prices.json
  
Bloc 4 - Google OAuth : ✅ / ❌
  Callback page : créée / existante
  
Bloc 5 - Health Check : ✅ / ❌
  Services OK : X/9
  Services en erreur : [liste]
```
