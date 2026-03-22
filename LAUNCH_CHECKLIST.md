# DiagOptim - Checklist de Lancement

## Verifications automatiques (resultat Session C - 2026-03-22)

- [x] Build production : 0 erreurs
- [x] TypeScript : 0 erreurs
- [x] Tests : 129 passing, 0 failing
- [x] Lint : 0 erreurs (warnings only)
- [x] Dev server : toutes routes OK (6/6)
- [x] .gitignore : configure
- [x] vercel.json : configure (cdg1, headers securite, 4 crons)
- [x] Dockerfile : configure (workers Railway)
- [x] docker-compose.yml : configure (Redis dev)
- [x] README.md : professionnel cree
- [x] /api/health : endpoint cree (DB + Redis checks)
- [x] PostHog : configure (conditionnel si NEXT_PUBLIC_POSTHOG_KEY defini)
- [x] Dashboard admin : cree (KPIs, graphique, health check)
- [x] Monitoring script : cree (scripts/monitor.ts)

## Pre-requis legaux

- [ ] CGV redigees par un avocat
- [ ] Politique de confidentialite (RGPD)
- [ ] DPA (Data Processing Agreement)
- [ ] Mentions legales
- [ ] Politique cookies
- [ ] Assurance RC Pro souscrite

## Infrastructure

- [ ] Creer un repo GitHub prive et pusher le code
- [ ] Importer le projet sur Vercel et configurer les env vars
- [ ] Deployer les workers sur Railway
- [ ] Configurer Redis sur Upstash
- [ ] Configurer le domaine DNS (app.diagoptim.com -> Vercel)
- [ ] SSL/TLS verifie
- [ ] Emails SPF/DKIM/DMARC configures

## Stripe

- [ ] Tous les produits crees (4 plans + 2 consultant + 3 packs + 2 support)
- [ ] Webhooks configures (checkout.session.completed, subscription.updated/deleted, invoice.payment_failed/paid)
- [ ] Configurer le webhook Stripe en production
- [ ] Mode live active
- [ ] Portail client teste
- [ ] Connect active (affiliation)
- [ ] Tax settings configures (TVA FR)

## Securite

- [ ] Executer les RLS policies dans Supabase SQL Editor
- [ ] Rate limiting teste par plan
- [ ] Chiffrement documents verifie (AES-256-GCM)
- [ ] Anonymisation IA testee (aucun PII dans les logs Claude)
- [ ] 2FA fonctionnel
- [ ] Headers securite verifies (CSP, HSTS, X-Frame-Options)
- [ ] CORS configure (domaines autorises)
- [ ] Pentest initial (recommande)

## Tests

- [x] Tests unitaires passing (129 tests - scoring, engine, billing, encryption, anonymizer)
- [ ] Tests E2E passing (flow diagnostic complet)
- [ ] Test mobile responsive (iPhone SE, iPhone 14, Pixel 5)
- [ ] Test PWA install + mode offline
- [ ] Test i18n (toutes les pages FR + EN)
- [ ] Test charge (50 utilisateurs simultanes)

## Contenu

- [ ] Landing page finalisee (Hero, Features, HowItWorks, Pricing, Testimonials, CTA)
- [ ] Page pricing avec tous les plans
- [ ] FAQ complete
- [ ] 2 videos de formation theorie pretes
- [ ] 8 fiches memo de base generees (1 par gaspillage)
- [ ] Templates email transactionnels testes (welcome, reminder, report)

## Analytics

- [x] PostHog configure (EU, conditionnel)
- [x] Events tracking : diagnostic_started/completed, document_uploaded, report_downloaded, subscription_created/cancelled, support_pack_purchased
- [x] Dashboard admin cree (KPIs, graphique inscriptions, health check)
- [ ] Alertes configurees (taux erreur > 1%, churn > 5%)

## Auth

- [ ] Configurer Google OAuth redirect URLs pour production

## Go Live

- [ ] Beta test avec 10-20 utilisateurs
- [ ] Feedback beta integre
- [x] Monitoring script operationnel (scripts/monitor.ts)
- [ ] Procedure de rollback documentee
- [ ] Support email operationnel (contact@diagoptim.com)
- [ ] GO LIVE
