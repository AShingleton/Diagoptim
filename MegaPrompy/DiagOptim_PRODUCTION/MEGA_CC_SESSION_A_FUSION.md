# ═══════════════════════════════════════════════════════════════════════════════
# MÉGA-PROMPT CLAUDE CODE — SESSION A (PARALLÈLE)
# FUSION BOLT + BACK-END
# ═══════════════════════════════════════════════════════════════════════════════
# Pré-requis : Bolt ZIP dézippé dans C:\Users\antho\Desktop\bolt-frontend
# Peut tourner EN MÊME TEMPS que la Session B
# ═══════════════════════════════════════════════════════════════════════════════

Tu vas fusionner le code front-end visuel (Bolt) avec le back-end DiagOptim existant dans ce dossier. L'objectif est d'obtenir UNE SEULE application avec le beau design de Bolt ET toute la logique métier du back-end.

## ÉTAPE 1 : INVENTAIRE

1. Liste tous les fichiers dans le dossier actuel (back-end) :
   - src/components/*.tsx
   - src/app/[locale]/**/*.tsx
   - Compte le nombre total

2. Liste tous les fichiers dans C:\Users\antho\Desktop\bolt-frontend :
   - Tous les composants React
   - Toutes les pages
   - Le design system (globals.css, tailwind.config, etc.)
   - Compte le nombre total

3. Affiche un tableau de correspondance :
   | Composant/Page | Back-end | Bolt | Action |
   |---|---|---|---|
   | Dashboard | ✅ basique | ✅ design élaboré | FUSIONNER |
   | ConversationalInterface | ✅ logique | ✅ beau | FUSIONNER |
   | ... | ... | ... | ... |

## ÉTAPE 2 : FUSION DU DESIGN SYSTEM

1. Copie le design system de Bolt vers le back-end :
   - tailwind.config.ts → fusionne les deux (garde les customisations des deux côtés)
   - globals.css → intègre les CSS variables de Bolt
   - Fonts : ajoute Plus Jakarta Sans + DM Sans si pas déjà présentes
   - Palette : #1B4F72, #2E86C1, #27AE60

2. Vérifie que shadcn/ui est configuré des deux côtés et fusionne les configs

## ÉTAPE 3 : FUSION COMPOSANT PAR COMPOSANT

Pour CHAQUE composant qui existe des deux côtés :

```
RÈGLE : GARDE la logique du back-end + PRENDS le JSX/design de Bolt
```

Concrètement :
- Les imports d'API, les hooks custom, les appels fetch → du BACK-END
- Le JSX, les classes Tailwind, les animations Framer Motion → de BOLT
- Les types TypeScript → fusionner (prendre le plus complet)
- Les traductions i18n → garder celles du back-end, ajouter celles de Bolt si manquantes

## ÉTAPE 4 : COMPOSANTS UNIQUES

- Composants qui n'existent QUE dans Bolt → copie-les dans src/components/
- Composants qui n'existent QUE dans le back-end → garde-les tels quels
- Pour les composants Bolt qui font des appels API fictifs → remplace par les vrais appels API du back-end

## ÉTAPE 5 : PAGES

Même logique que les composants :
- La STRUCTURE et le ROUTING → du back-end (app/[locale]/...)
- Le DESIGN et les ANIMATIONS → de Bolt
- La LOGIQUE MÉTIER (appels API, auth checks, plan gating) → du back-end

## ÉTAPE 6 : VÉRIFICATIONS CRITIQUES

Après la fusion, vérifie TOUT :

1. `npm run build` → 0 erreurs
2. `npm run typecheck` → 0 erreurs TypeScript
3. `npm run lint` → corrige les warnings
4. Vérifie que CHAQUE page qui utilise [locale] ou [id] a la syntaxe async/await params :
   ```tsx
   export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
     const { locale } = await params;
   ```
5. Vérifie que TOUS les imports sont corrects (pas de fichiers manquants)
6. Vérifie que le dark mode fonctionne (CSS variables)
7. Vérifie que l'i18n fonctionne (messages/fr.json et messages/en.json complets)

## ÉTAPE 7 : RAPPORT

Génère un rapport de fusion :
- Nombre de composants fusionnés
- Nombre de composants ajoutés depuis Bolt
- Nombre de composants gardés du back-end uniquement
- Fichiers modifiés
- Résultat du build
- Warnings éventuels

Commence MAINTENANT par l'étape 1 (inventaire).
