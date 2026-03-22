# ═══════════════════════════════════════════════════════════════════════════════
# GUIDE D'UTILISATION DES MÉGA-PROMPTS — DiagOptim™
# ═══════════════════════════════════════════════════════════════════════════════

## 📋 VUE D'ENSEMBLE

Vous avez 4 méga-prompts à exécuter dans l'ordre :

| # | Fichier | Outil | Contenu | Taille estimée |
|---|---------|-------|---------|----------------|
| 1 | `PROMPT_1_CLAUDE_CODE_BACKEND.md` | **Claude Code** | Fondation back-end : BDD, API, auth, billing, scoring | ~60 fichiers |
| 2 | `PROMPT_2_BOLT_FRONTEND.md` | **Bolt** | Interface complète : pages, composants, design system | ~80 composants |
| 3 | `PROMPT_3_CLAUDE_CODE_IA_ENGINE.md` | **Claude Code** | Cerveau IA : prompts système, scoring, analyse docs, rapports | ~25 fichiers |
| 4 | `PROMPT_4_DEPLOYMENT_ASSEMBLY.md` | **Claude Code** | Assemblage : PWA, notifications, déploiement, tests, sécurité | ~30 fichiers |

## 🚀 ORDRE D'EXÉCUTION

### Étape 1 : Claude Code — Fondation Back-end
```
1. Ouvrez Claude Code dans votre terminal
2. Créez un nouveau projet : mkdir diagoptim && cd diagoptim
3. Copiez-collez le contenu de PROMPT_1_CLAUDE_CODE_BACKEND.md
4. Laissez Claude Code générer toute la structure
5. Vérifiez que `npm install` et `npm run build` passent
```

### Étape 2 : Bolt — Interface Visuelle
```
1. Ouvrez Bolt (bolt.new)
2. Copiez-collez le contenu de PROMPT_2_BOLT_FRONTEND.md
3. Bolt va générer toutes les pages et composants
4. Vérifiez le rendu visuel dans le preview
5. Exportez le code vers votre repo Git
```

### Étape 3 : Claude Code — Moteur IA
```
1. Revenez dans Claude Code (même projet que l'étape 1)
2. Copiez-collez le contenu de PROMPT_3_CLAUDE_CODE_IA_ENGINE.md
3. Ce prompt va créer tous les fichiers IA dans src/lib/ai/
4. Il s'intègre automatiquement au code de l'étape 1
```

### Étape 4 : Claude Code — Assemblage Final
```
1. Toujours dans Claude Code
2. Copiez-collez le contenu de PROMPT_4_DEPLOYMENT_ASSEMBLY.md
3. Ce prompt assemble tout, configure la PWA, les tests, le déploiement
4. À la fin : npm run dev devrait lancer l'app complète
```

## ⚙️ PRÉREQUIS TECHNIQUES

Avant de commencer, assurez-vous d'avoir :

- [ ] Node.js 20+ installé
- [ ] Un compte Supabase (gratuit pour commencer)
- [ ] Un compte Stripe (mode test)
- [ ] Une clé API Anthropic (Claude)
- [ ] Un compte Vercel (gratuit)
- [ ] Un compte Resend (gratuit pour 3000 emails/mois)
- [ ] Git installé

## 💡 CONSEILS

1. **Si Claude Code coupe** en milieu de génération (limite de tokens), 
   dites simplement "continue" — il reprendra où il en était.

2. **Si Bolt ne génère pas tout**, divisez le Prompt 2 en sous-sections :
   - D'abord le layout + design system
   - Puis les pages une par une
   - Puis les composants complexes (ConversationalInterface, VsmBuilder...)

3. **Pour les clés API**, commencez en mode test/développement :
   - Stripe : mode test (sk_test_...)
   - Supabase : projet local (supabase start)
   - Anthropic : clé avec limits basses

4. **Priorisez le MVP** (Mois 1-3 de la roadmap) :
   - Diagnostic 8 gaspillages ✓
   - Profilage entreprise ✓
   - SWOT basique ✓
   - Dashboard ✓
   - Rapport synthèse ✓
   - Freemium ✓

## 📊 ESTIMATION DE COÛTS MENSUELS (Production)

| Service | Plan | Coût/mois |
|---------|------|-----------|
| Vercel | Pro | 20€ |
| Supabase | Pro | 25€ |
| Railway (workers) | Starter | 5€ |
| Redis (Upstash) | Pay-as-you-go | 5-10€ |
| Anthropic API | Usage | 50-200€ (selon nb utilisateurs) |
| Resend | Starter | 0€ (< 3000 emails) |
| Stripe | Commission | 1.4% + 0.25€/transaction |
| PostHog | Free tier | 0€ (< 1M events) |
| **TOTAL** | | **~110-270€/mois** |

Ce coût est largement couvert dès 3-5 abonnés Starter (49€/mois).
