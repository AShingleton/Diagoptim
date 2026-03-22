# ═══════════════════════════════════════════════════════════════════════════════
# MÉGA-PROMPT BOLT — PRODUCTION READY
# DiagOptim™ — Tout le front-end en un seul prompt
# ═══════════════════════════════════════════════════════════════════════════════
# Collez ce prompt dans Bolt. Il couvre : fix Next.js, design premium,
# toutes les pages, tous les composants graphiques interactifs.
# ═══════════════════════════════════════════════════════════════════════════════

Tu vas créer l'interface COMPLÈTE et PRODUCTION-READY de DiagOptim™, une application SaaS de diagnostic interactif d'entreprise. Le design s'inspire de conseilachatspublics.com, modernisé.

## RÈGLES CRITIQUES NEXT.JS

AVANT TOUT : pour CHAQUE fichier page.tsx et layout.tsx qui utilise des params dynamiques (comme [locale] ou [id]), utilise OBLIGATOIREMENT cette syntaxe :

```tsx
// CORRECT — Next.js 15 compatible
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  // ...
}
```

JAMAIS cette syntaxe :
```tsx
// FAUX — provoque Runtime InvariantError
export default function Page({ params }: { params: { locale: string } }) {
```

Applique cette règle à TOUS les fichiers sans exception.

## STACK

```
Next.js 14+ (App Router) / React 18+ / TypeScript
Tailwind CSS 3.4+ / shadcn/ui / Framer Motion
Recharts (charts) + D3.js (diagrammes custom)
Lucide React (icônes) / next-intl (FR + EN)
```

## DESIGN SYSTEM

```css
:root {
  --primary: #1B4F72;
  --primary-light: #2E86C1;
  --primary-lighter: #D4E6F1;
  --success: #27AE60;
  --warning: #F39C12;
  --danger: #E74C3C;
  --dark: #1C2833;
  --gray-500: #5D6D7E;
  --gray-100: #F2F4F4;
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 30px rgba(0,0,0,0.12);
  --radius-md: 12px;
  --radius-lg: 16px;
}

[data-theme="dark"] {
  --primary: #5DADE2;
  --dark: #ECF0F1;
  --surface: #1A1D23;
}
```

Typographie : Plus Jakarta Sans (titres, weight 600-800) + DM Sans (corps, 400-500)

## TOUTES LES PAGES À CRÉER

### Pages publiques :

1. `app/[locale]/page.tsx` — LANDING PAGE
   - Hero : titre animé "Découvrez ce que votre entreprise perd chaque jour" + sous-titre "Diagnostic gratuit en 10 minutes" + CTA primary + mockup app en parallax
   - Section "Comment ça marche" : 3 étapes avec icônes animées au scroll (1. Répondez 2. Recevez votre diagnostic 3. Suivez votre roadmap)
   - Section fonctionnalités : grille de 6 cards (8 Gaspillages, VSM, Ishikawa, A3, SWOT, Formations) avec hover effect
   - Section témoignages : carousel 3 témoignages
   - Section pricing : tableau comparatif 4 colonnes (Free/Starter/Pro/Expert) avec toggle mensuel/annuel
   - FAQ : accordion 8 questions
   - Footer : liens, mentions légales, réseaux, switch langue

2. `app/[locale]/pricing/page.tsx` — PAGE TARIFS détaillée
   - Même tableau que landing mais plus détaillé avec toutes les features listées
   - Section packs support (3 cards)
   - Section consultants (2 plans)
   - FAQ pricing

3. `app/[locale]/(auth)/login/page.tsx` — CONNEXION
   - Card centrée, glassmorphism léger
   - Email + mot de passe
   - Bouton "Se connecter avec Google" (icône Google)
   - Lien vers inscription et mot de passe oublié
   - Logo DiagOptim en haut

4. `app/[locale]/(auth)/register/page.tsx` — INSCRIPTION
   - Card centrée : nom, email, mot de passe, confirmation
   - Bouton Google OAuth
   - Checkbox CGV
   - Lien vers connexion

5. `app/[locale]/(auth)/forgot-password/page.tsx`
6. `app/[locale]/offline/page.tsx` — Page offline élégante (logo, message, bouton retry)

### Layout authentifié :

7. `app/[locale]/(app)/layout.tsx` — APP SHELL
   - Sidebar gauche collapsible : logo, navigation (Dashboard, Diagnostic, Documents, Outils, Roadmap, Formations, Rapports, Support), avatar utilisateur en bas
   - Topbar : breadcrumb, barre de recherche, notifications (cloche avec badge), switch langue FR/EN, toggle dark mode, avatar dropdown
   - Mobile : bottom tab bar (Dashboard, Diagnostic, Roadmap, Plus)
   - Framer Motion : sidebar slide-in, page transitions

### Pages app :

8. `app/[locale]/(app)/dashboard/page.tsx` — DASHBOARD
   - Score global : grande jauge circulaire animée (0-100) au centre, couleur selon score
   - Progression objectif financier : barre "12 450€ / 50 000€ objectif" avec gradient
   - Top 3 priorités : cards empilées avec badge criticité (rouge/orange/vert)
   - Radar chart 8 gaspillages (Recharts, interactif, animé au mount)
   - Mini timeline d'évolution des diagnostics
   - 3-5 actions en cours de la roadmap avec statut
   - 2-3 formations recommandées
   - Notifications récentes

9. `app/[locale]/(app)/diagnostic/new/page.tsx` — DÉMARRER DIAGNOSTIC
   - 3 grandes cards animées pour les questions de cadrage :
     * Card 1 : "Quel est votre objectif ?" → choix entre "+Revenus" et "-Coûts" + input montant €
     * Card 2 : "En combien de temps ?" → 4 boutons (3 mois, 6 mois, 12 mois, 24 mois)
     * Card 3 : "Prêt à faire seul ?" → 3 options (Autonome, Guidé, Accompagné)
   - Animation de transition entre les cards (slide + fade)
   - Bouton "Commencer mon diagnostic" qui pulse

10. `app/[locale]/(app)/diagnostic/[id]/page.tsx` — ★ DIAGNOSTIC EN COURS (ConversationalInterface)
    - C'est LE composant central. Interface type "chat premium" :
    - Colonne centrale max-w-2xl, fond surface élevé
    - Questions = bulles à gauche, fond bleu clair, avatar robot animé
    - Réponses = bulles à droite, fond blanc/gris
    - Animation "typing" (3 points qui rebondissent) avant chaque question (800ms)
    - Chaque nouvelle question : fade-in + slide-up (Framer Motion, duration 0.4s)
    - Zone d'input fixe en bas, s'adapte au type de question :
      * scale → Slider gradient rouge→vert avec labels 0-10
      * choice → Cards cliquables (max 4) avec animation check ✓
      * text → Input avec placeholder contextuel
      * number → Input avec suffixe unité (€, %, heures)
      * boolean → 2 gros boutons Oui/Non
      * file → Zone drag & drop
    - Anneau de progression circulaire en haut à droite (% au centre, animé)
    - Mini-insights entre les blocs : card verte/orange, icône ampoule, slide-in
    - Boutons : Retour (modifier réponse), Passer (si optionnel), Plus d'info (tooltip)
    - Auto-scroll vers la dernière question
    - Sauvegarde auto à chaque réponse
    - Confettis quand diagnostic terminé

11. `app/[locale]/(app)/diagnostic/[id]/results/page.tsx` — RÉSULTATS
    - Score global + date + rappel objectif
    - Grand radar chart 8 gaspillages (animé au chargement, interactif)
    - Pour chaque gaspillage : barre de score colorée + résumé + estimation gains
    - Matrice effort/impact (scatter plot interactif)
    - SWOT générée (matrice 4 quadrants)
    - CTAs : "Voir ma feuille de route" + "Télécharger rapport PDF"
    - Disclaimer en bas

12. `app/[locale]/(app)/diagnostic/history/page.tsx` — HISTORIQUE
    - Liste des diagnostics passés en cards (date, score, type)
    - Graphique d'évolution du score dans le temps
    - Comparaison entre 2 diagnostics

13. `app/[locale]/(app)/documents/page.tsx` — DOCUMENTS
    - Zone upload drag & drop centrale
    - Liste des documents uploadés (cards avec type, date, statut)
    - Preview au clic
    - Badge "Analysé" / "En attente" / "Erreur"

14. `app/[locale]/(app)/roadmap/page.tsx` — FEUILLE DE ROUTE
    - Diagramme de Gantt simplifié en haut (barres colorées par catégorie)
    - En dessous : check-list d'actions groupées par catégorie (Quick wins, Court terme, Structurel, Transformation)
    - Chaque action : card avec titre, gains estimés, durée, statut (todo/en cours/fait), bouton check
    - Barre de progression globale : "X actions sur Y complétées — Z€ de gains estimés"
    - Tracker financier : progression vers l'objectif initial

15. `app/[locale]/(app)/training/page.tsx` — FORMATIONS
    - Grille de cards formations (thumbnail, titre, durée, type : vidéo/fiche)
    - Filtres : par méthodologie, par durée, par statut
    - Badges de progression (gamification)
    - Section "Parcours recommandé" basé sur le diagnostic

16. `app/[locale]/(app)/reports/page.tsx` — RAPPORTS
    - Liste des rapports générés
    - Preview en ligne
    - Boutons download PDF / DOCX
    - Personnalisation (logo, couleurs) pour les plans Pro/Expert

17. `app/[locale]/(app)/settings/profile/page.tsx` — PROFIL utilisateur
18. `app/[locale]/(app)/settings/company/page.tsx` — PROFIL entreprise
19. `app/[locale]/(app)/settings/billing/page.tsx` — ABONNEMENT (plan actuel, factures, bouton changer)
20. `app/[locale]/(app)/settings/notifications/page.tsx` — PRÉFÉRENCES notifications
21. `app/[locale]/(app)/support/page.tsx` — ACHETER SUPPORT (3 pack cards + 2 abo cards)
22. `app/[locale]/(app)/team/page.tsx` — ÉQUIPE (inviter, rôles, liste membres)

### Pages outils :

23. `app/[locale]/(app)/tools/vsm/page.tsx` — VSM Builder (drag & drop)
24. `app/[locale]/(app)/tools/ishikawa/page.tsx` — Diagramme Ishikawa (fishbone D3)
25. `app/[locale]/(app)/tools/swot/page.tsx` — Matrice SWOT (4 quadrants, drag items)
26. `app/[locale]/(app)/tools/a3/page.tsx` — Template A3 (7 sections guidées)
27. `app/[locale]/(app)/tools/dmaic/page.tsx` — DMAIC (stepper 5 étapes)
28. `app/[locale]/(app)/tools/porter/page.tsx` — 5 Forces de Porter (diagramme D3)
29. `app/[locale]/(app)/tools/bcg/page.tsx` — Matrice BCG
30. `app/[locale]/(app)/tools/steeple/page.tsx` — Analyse STEEPLE (radar/barres)
31. `app/[locale]/(app)/tools/hoshin/page.tsx` — Matrice Hoshin X

### Pages consultant :

32. `app/[locale]/(consultant)/layout.tsx` — Layout consultant (branding custom)
33. `app/[locale]/(consultant)/dashboard/page.tsx` — Dashboard multi-clients
34. `app/[locale]/(consultant)/clients/page.tsx` — Liste clients
35. `app/[locale]/(consultant)/branding/page.tsx` — Config white-label (logo, couleurs, domaine)

## COMPOSANTS GRAPHIQUES INTERACTIFS (D3/Recharts)

### WasteRadarChart (Recharts) :
- 8 axes (les 8 gaspillages), scores 0-10
- Polygone rempli avec gradient bleu
- Animation de dessin au mount (stroke-dasharray)
- Tooltip au hover : nom + score + estimation perte €
- Responsive

### VsmBuilder (D3 + drag & drop) :
- Boxes draggables pour les étapes du processus
- Flèches de connexion entre étapes
- Indicateurs de temps (traitement, attente)
- Surlignage goulots d'étranglement en rouge
- Toggle état actuel / état futur

### IshikawaDiagram (D3 SVG) :
- Flèche centrale (le problème)
- 6 branches (6M) : Main-d'œuvre, Matière, Méthode, Machine, Milieu, Management
- Sous-causes cliquables sur chaque branche
- Animation de dessin progressive
- Cause racine surlignée

### PorterDiagram (D3 SVG) :
- Layout pentagonal des 5 forces
- Barres de score 1-5 par force
- Nœud central "Rivalité"
- Code couleur : vert (faible), orange (moyen), rouge (fort)
- Interactif : clic pour détails

### EffortImpactMatrix (Recharts scatter) :
- X = Effort, Y = Impact
- 4 quadrants étiquetés (Quick Wins, Projets Majeurs, Nice-to-have, À éviter)
- Points = recommandations (taille = gain estimé)
- Hover pour détails

### GanttChart (custom SVG) :
- Timeline horizontale
- Barres colorées par catégorie d'action
- Jalons en losanges
- Ligne "Aujourd'hui"
- Scroll horizontal responsive

### ScoreGauge (SVG animé) :
- Jauge circulaire 0-100
- Couleur dynamique (rouge < 40, orange 40-70, vert > 70)
- Animation compteur au chargement
- Score au centre en grand

## ANIMATIONS GLOBALES (Framer Motion)

```typescript
// Utilise ces presets partout
const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } };
const slideUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: "easeOut" } };
const scaleIn = { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const pageTransition = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };
```

## RESPONSIVE + PWA + ACCESSIBILITÉ

- Mobile-first (375px → sm:640 → md:768 → lg:1024 → xl:1280)
- Navigation mobile : bottom tab bar 4 onglets
- Sidebar : drawer sur mobile
- Dark mode toggle dans Topbar
- WCAG 2.1 AA : focus visible, aria labels, contraste 4.5:1, skip nav
- @media (prefers-reduced-motion: reduce) → désactiver animations
- manifest.json + service worker basique pour PWA

## i18n

Crée messages/fr.json et messages/en.json avec TOUTES les traductions pour toutes les pages et composants. Jamais de texte en dur dans le code.

## INSTRUCTIONS

1. Commence par le layout principal (app shell avec sidebar/topbar)
2. Puis la ConversationalInterface (composant critique #1)
3. Puis le Dashboard (composant critique #2)
4. Puis la Landing page
5. Puis toutes les autres pages
6. Puis les composants graphiques D3/Recharts
7. Vérifie que CHAQUE fichier avec params utilise async/await
8. Lance npm run build — 0 erreurs obligatoire
9. Tout doit être fonctionnel, pas de placeholder "TODO"
