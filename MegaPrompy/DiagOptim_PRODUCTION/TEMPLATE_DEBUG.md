# ═══════════════════════════════════════════════════════════════════════════════
# PROMPT DE DEBUG — CLAUDE CODE (Template à adapter)
# Utilisez ce prompt chaque fois que vous rencontrez une erreur
# ═══════════════════════════════════════════════════════════════════════════════

L'application DiagOptim rencontre un problème.

CONTEXTE :
- Étape en cours : [REMPLACEZ : ex: "je lance npm run dev", "je teste le diagnostic", "le build échoue"]
- Page/fonctionnalité : [REMPLACEZ : ex: "page dashboard", "upload document", "paiement Stripe"]

ERREUR :
```
[COLLEZ L'ERREUR COMPLÈTE ICI — terminal ou console navigateur]
```

INSTRUCTIONS :
1. Diagnostique la cause racine de cette erreur
2. Propose la correction la plus simple et directe
3. Applique la correction
4. Vérifie que le problème est résolu :
   - npm run build (0 erreurs)
   - npm run typecheck (0 erreurs)
   - npm run test (0 tests cassés)
5. Vérifie qu'aucune régression n'a été introduite
6. Explique-moi en 2-3 phrases ce qui n'allait pas et ce que tu as changé
