# ═══════════════════════════════════════════════════════════════════════════════
# GUIDE RAPIDE — MÉGA-PROMPTS PRODUCTION DiagOptim™
# ═══════════════════════════════════════════════════════════════════════════════

## FICHIERS INCLUS

| Fichier | Outil | Durée | Parallèle ? |
|---------|-------|-------|-------------|
| MEGA_BOLT_PRODUCTION.md | Bolt | 30-45 min | ✅ Indépendant |
| MEGA_CC_SESSION_A_FUSION.md | Claude Code | 15-30 min | ✅ Parallèle avec B |
| MEGA_CC_SESSION_B_CONFIG.md | Claude Code | 20-40 min | ✅ Parallèle avec A |
| MEGA_CC_SESSION_C_DEPLOY.md | Claude Code | 15-25 min | ❌ Après A + B |
| TEMPLATE_DEBUG.md | Claude Code | À la demande | - |

## SCHÉMA D'EXÉCUTION

```
TEMPS ─────────────────────────────────────────────────────►

     ┌─────────────────────────────┐
     │  BOLT : MEGA_BOLT_PRODUCTION│  ← Lancez dans bolt.new
     │  (refaire le front complet) │
     └──────────────┬──────────────┘
                    │ Téléchargez le ZIP
                    ▼
     ┌──────────────────────────────────────────────┐
     │  CLAUDE CODE SESSION A : FUSION               │  ← Nouveau chat
     │  (fusionner Bolt ZIP + back-end existant)      │
     └──────────────────────────┬───────────────────┘
                                │
                                │  EN PARALLÈLE
                                │
     ┌──────────────────────────┴───────────────────┐
     │  CLAUDE CODE SESSION B : CONFIG               │  ← Nouveau chat
     │  (BDD + RLS + Stripe + OAuth + Health check)  │
     │  Pré-requis : .env rempli                     │
     └──────────────────────────┬───────────────────┘
                                │
                                │  QUAND A + B FINIS
                                ▼
     ┌──────────────────────────────────────────────┐
     │  CLAUDE CODE SESSION C : DEPLOY               │  ← Nouveau chat
     │  (Tests + Git + Vercel + Monitoring)           │
     └──────────────────────────────────────────────┘
                                │
                                ▼
                          🚀 PRODUCTION
```

## ÉTAPES CONCRÈTES

### 1. Lancez Bolt (peut commencer maintenant)
- Ouvrez bolt.new
- Collez MEGA_BOLT_PRODUCTION.md
- Lancez et attendez que ça finisse
- Téléchargez le ZIP quand c'est fait

### 2. Pendant que Bolt tourne, créez vos comptes et .env
- Supabase (https://supabase.com) → notez URL + clés
- Stripe (https://stripe.com) → mode test → notez clés
- Anthropic (https://console.anthropic.com) → notez clé API
- Resend (https://resend.com) → notez clé API
- Upstash (https://upstash.com) → créez Redis → notez URL
- Remplissez .env dans votre projet diagoptim

### 3. Lancez Sessions A et B en parallèle
- VS Code → Claude Code → nouveau chat → collez SESSION A (fusion)
  (nécessite que le ZIP Bolt soit prêt)
- VS Code → Claude Code → AUTRE nouveau chat → collez SESSION B (config)
  (nécessite que .env soit rempli)

### 4. Quand A et B sont terminés → Lancez Session C
- VS Code → Claude Code → nouveau chat → collez SESSION C (deploy)

### 5. Actions manuelles finales
- Créez repo GitHub → git push
- Importez sur Vercel → configurez env vars → Deploy
- Importez workers sur Railway
- Configurez DNS
- Copiez les RLS SQL dans Supabase SQL Editor
- 🚀 LIVE

## SI ERREUR → Utilisez TEMPLATE_DEBUG.md
Copiez le template, remplacez les [PLACEHOLDERS] par votre contexte et l'erreur, 
collez dans Claude Code.

## DURÉE TOTALE ESTIMÉE

| Phase | Durée |
|-------|-------|
| Bolt + Comptes + .env | ~45 min (en parallèle) |
| Sessions A + B (parallèle) | ~30 min |
| Session C | ~20 min |
| Actions manuelles (Vercel, DNS...) | ~30 min |
| **TOTAL** | **~2h pour être en production** |
