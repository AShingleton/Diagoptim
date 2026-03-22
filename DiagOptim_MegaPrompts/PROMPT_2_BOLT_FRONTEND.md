# ═══════════════════════════════════════════════════════════════════════════════
# MÉGA-PROMPT 2/4 — BOLT : INTERFACE VISUELLE COMPLÈTE
# Application DiagOptim™ — Diagnostic Interactif d'Entreprise
# ═══════════════════════════════════════════════════════════════════════════════
# INSTRUCTIONS : Copiez ce prompt dans Bolt pour générer toute l'interface
# ═══════════════════════════════════════════════════════════════════════════════

Crée l'interface complète de DiagOptim™, une application SaaS de diagnostic interactif d'entreprise. L'application aide les TPE/PME à optimiser leurs coûts et leur temps via le Lean Management, avec un diagnostic CONVERSATIONNEL (jamais de formulaires longs).

## STACK FRONT-END

```
Framework     : Next.js 14+ (App Router) / React 18+ / TypeScript
Styling       : Tailwind CSS 3.4+
Composants    : shadcn/ui (tous les composants)
Animations    : Framer Motion
Graphiques    : Recharts (charts standard) + D3.js (diagrammes custom : VSM, Ishikawa, Porter)
Icônes        : Lucide React
i18n          : next-intl (FR + EN)
State         : Zustand (global) + React Query/TanStack Query (server state)
Formulaires   : React Hook Form + Zod
```

## DESIGN SYSTEM — INSPIRÉ DE conseilachatspublics.com MODERNISÉ

```css
/* PALETTE - VARIABLES CSS GLOBALES */
:root {
  /* Primary */
  --primary: #1B4F72;         /* Bleu marine profond */
  --primary-light: #2E86C1;   /* Bleu vif */
  --primary-lighter: #D4E6F1; /* Bleu très clair */
  
  /* Accents */
  --success: #27AE60;         /* Vert réussite */
  --warning: #F39C12;         /* Orange attention */
  --danger: #E74C3C;          /* Rouge alerte */
  --info: #3498DB;            /* Bleu info */
  
  /* Neutres */
  --dark: #1C2833;            /* Presque noir */
  --gray-700: #2D3436;
  --gray-500: #5D6D7E;
  --gray-300: #B0BEC5;
  --gray-100: #F2F4F4;
  --white: #FFFFFF;
  
  /* Surfaces */
  --surface: #FFFFFF;
  --surface-elevated: #FAFBFC;
  --surface-overlay: rgba(27, 79, 114, 0.03);
  
  /* Glassmorphism */
  --glass-bg: rgba(255, 255, 255, 0.72);
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-blur: 16px;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 30px rgba(0,0,0,0.12);
  --shadow-glow: 0 0 20px rgba(46, 134, 193, 0.15);
  
  /* Border radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 9999px;
}

/* DARK MODE */
[data-theme="dark"] {
  --primary: #5DADE2;
  --primary-light: #85C1E9;
  --dark: #ECF0F1;
  --surface: #1A1D23;
  --surface-elevated: #22262E;
  --glass-bg: rgba(30, 34, 40, 0.72);
}
```

```
/* TYPOGRAPHIE */
Titres : 'Plus Jakarta Sans' (Google Fonts) — weight 600/700/800
Corps  : 'DM Sans' (Google Fonts) — weight 400/500
Mono   : 'JetBrains Mono' — pour les chiffres/données

Tailles :
- Hero : 3.5rem (56px) / line-height 1.1
- H1   : 2rem (32px) / line-height 1.25
- H2   : 1.5rem (24px) / line-height 1.3
- H3   : 1.25rem (20px) / line-height 1.4
- Body : 1rem (16px) / line-height 1.6
- Small: 0.875rem (14px)
- Tiny : 0.75rem (12px)
```

## ARCHITECTURE DES PAGES

Génère TOUTES les pages suivantes avec leur layout, composants et animations :

```
src/app/
├── [locale]/                          # FR / EN
│   ├── layout.tsx                     # Layout racine (i18n provider, theme, fonts)
│   ├── page.tsx                       # Landing page (marketing)
│   ├── (auth)/
│   │   ├── login/page.tsx             # Login (email + Google OAuth)
│   │   ├── register/page.tsx          # Inscription
│   │   └── forgot-password/page.tsx
│   ├── (app)/                         # Layout authentifié (sidebar + topbar)
│   │   ├── layout.tsx                 # App shell (sidebar, topbar, notifications)
│   │   ├── dashboard/page.tsx         # Tableau de bord principal
│   │   ├── diagnostic/
│   │   │   ├── new/page.tsx           # Démarrer diagnostic (3 questions cadrage)
│   │   │   ├── [id]/page.tsx          # Diagnostic en cours (interface conversationnelle)
│   │   │   ├── [id]/results/page.tsx  # Résultats du diagnostic
│   │   │   └── history/page.tsx       # Historique des diagnostics
│   │   ├── documents/
│   │   │   ├── page.tsx               # Bibliothèque de documents
│   │   │   └── [id]/page.tsx          # Détail document + données extraites
│   │   ├── tools/
│   │   │   ├── vsm/page.tsx           # Value Stream Mapping (drag & drop)
│   │   │   ├── ishikawa/page.tsx      # Diagramme Ishikawa interactif
│   │   │   ├── a3/page.tsx            # Template A3
│   │   │   ├── dmaic/page.tsx         # Parcours DMAIC (stepper)
│   │   │   ├── swot/page.tsx          # SWOT / TOWS
│   │   │   ├── porter/page.tsx        # 5 Forces de Porter
│   │   │   ├── bcg/page.tsx           # Matrice BCG
│   │   │   ├── steeple/page.tsx       # Analyse STEEPLE
│   │   │   └── hoshin/page.tsx        # Matrice Hoshin
│   │   ├── roadmap/
│   │   │   ├── page.tsx               # Feuille de route (Gantt + checklist)
│   │   │   └── [actionId]/page.tsx    # Détail action + formation associée
│   │   ├── training/
│   │   │   ├── page.tsx               # Bibliothèque formations
│   │   │   ├── [id]/page.tsx          # Lecteur vidéo + memory sheet
│   │   │   └── progress/page.tsx      # Ma progression
│   │   ├── reports/
│   │   │   ├── page.tsx               # Mes rapports
│   │   │   └── [id]/page.tsx          # Prévisualisation rapport
│   │   ├── team/page.tsx              # Gestion équipe (invitations, rôles)
│   │   ├── settings/
│   │   │   ├── profile/page.tsx       # Profil utilisateur
│   │   │   ├── company/page.tsx       # Profil entreprise
│   │   │   ├── billing/page.tsx       # Abonnement + factures
│   │   │   ├── notifications/page.tsx # Préférences notifications
│   │   │   └── integrations/page.tsx  # Intégrations tiers
│   │   └── support/
│   │       ├── page.tsx               # Acheter du support (packs + abo)
│   │       └── sessions/page.tsx      # Mes sessions de support
│   ├── (consultant)/                  # Layout white-label
│   │   ├── layout.tsx                 # Layout consultant (branding custom)
│   │   ├── dashboard/page.tsx         # Vue multi-clients
│   │   ├── clients/page.tsx           # Gestion clients
│   │   ├── clients/[id]/page.tsx      # Diagnostic d'un client
│   │   └── branding/page.tsx          # Configuration white-label
│   └── pricing/page.tsx               # Page tarifs (publique)
```

## COMPOSANTS — LISTE COMPLÈTE À CRÉER

```
src/components/
├── layout/
│   ├── Sidebar.tsx                    # Navigation latérale (collapsible, icônes Lucide)
│   ├── Topbar.tsx                     # Barre sup (user, notifications, langue, dark mode)
│   ├── MobileNav.tsx                  # Navigation mobile (bottom tabs)
│   └── NotificationCenter.tsx         # Panneau notifications (slide-in)
│
├── diagnostic/
│   ├── ConversationalInterface.tsx    # ★ COMPOSANT CLÉ — Interface type "chat"
│   │   # Affiche questions une par une avec animation d'entrée
│   │   # Bulles de question (gauche, bleu) + réponses (droite, gris clair)
│   │   # Input adaptatif : slider / boutons choix / champ texte / nombre
│   │   # Mini-insights entre les blocs (carte verte avec icône ampoule)
│   │   # Barre de progression circulaire en haut
│   │   # Animation "typing" avant chaque nouvelle question
│   │   # Scroll automatique vers la dernière question
│   │
│   ├── CadreQuestions.tsx             # Les 3 questions de cadrage (cards animées)
│   ├── ScaleSlider.tsx                # Slider 0-10 avec labels et couleur gradient
│   ├── ChoiceCards.tsx                # Cartes de choix cliquables (multi ou single)
│   ├── QuestionBubble.tsx             # Bulle de question (style message)
│   ├── AnswerBubble.tsx               # Bulle de réponse utilisateur
│   ├── InsightCard.tsx                # Carte mini-insight (fond vert/orange)
│   ├── ProgressRing.tsx               # Anneau de progression circulaire
│   ├── DiagnosticSummary.tsx          # Résumé final du diagnostic
│   └── WasteRadarChart.tsx            # Radar chart des 8 gaspillages (Recharts)
│
├── documents/
│   ├── DocumentUploader.tsx           # Zone upload drag & drop
│   ├── DocumentPreview.tsx            # Prévisualisation document
│   ├── ExtractedDataReview.tsx        # Revue données extraites (éditable)
│   └── DocumentTypeSelector.tsx       # Sélection type document
│
├── tools/
│   ├── VsmBuilder.tsx                 # ★ VSM drag & drop (React DnD + D3)
│   ├── IshikawaDiagram.tsx            # ★ Diagramme arête de poisson (D3)
│   ├── A3Template.tsx                 # Template A3 interactif (7 sections)
│   ├── DmaicStepper.tsx               # Stepper DMAIC (5 étapes)
│   ├── SwotMatrix.tsx                 # Matrice SWOT 4 quadrants (drag items)
│   ├── TowsMatrix.tsx                 # Matrice TOWS croisée
│   ├── PorterDiagram.tsx              # ★ 5 Forces (D3, diagramme circulaire)
│   ├── BcgMatrix.tsx                  # Matrice BCG (plot interactif)
│   ├── SteepleChart.tsx               # Graphique STEEPLE (barres/radar)
│   ├── HoshinMatrix.tsx               # Matrice X Hoshin
│   └── EffortImpactMatrix.tsx         # Matrice effort/impact (scatter plot)
│
├── roadmap/
│   ├── GanttChart.tsx                 # Diagramme de Gantt simplifié
│   ├── ActionChecklist.tsx            # Check-list d'actions (tri par catégorie)
│   ├── ActionCard.tsx                 # Carte action (statut, gains, échéance)
│   ├── ProgressTracker.tsx            # Suivi de progression global
│   └── FinancialTracker.tsx           # Suivi gains vs objectif initial
│
├── training/
│   ├── VideoPlayer.tsx                # Lecteur vidéo (Mux)
│   ├── MemorySheetViewer.tsx          # Viewer de fiche mémo PDF
│   ├── TrainingCard.tsx               # Carte formation (thumbnail, durée, statut)
│   ├── ProgressBadge.tsx              # Badge de progression / gamification
│   └── TrainingPath.tsx               # Parcours de formations (timeline)
│
├── dashboard/
│   ├── ScoreGauge.tsx                 # Jauge score global 0-100
│   ├── TopPriorities.tsx              # Top 3 axes d'amélioration
│   ├── TimelineComparison.tsx         # Comparaison diagnostics dans le temps
│   ├── QuickActions.tsx               # Actions rapides (commencer diagnostic, etc.)
│   ├── RecentActivity.tsx             # Activité récente
│   └── FinancialGoalProgress.tsx      # Progression vers l'objectif financier
│
├── billing/
│   ├── PricingTable.tsx               # Tableau comparatif des plans
│   ├── SupportPackCards.tsx           # Cartes packs de support
│   ├── SubscriptionStatus.tsx         # Statut abonnement actuel
│   └── CheckoutButton.tsx             # Bouton Stripe Checkout
│
├── whitelabel/
│   ├── BrandingConfigurator.tsx       # Config logo, couleurs, domaine
│   ├── ClientList.tsx                 # Liste clients (consultant)
│   ├── ClientDiagnosticView.tsx       # Vue diagnostic client
│   └── ConsultantDashboard.tsx        # Dashboard multi-clients
│
├── shared/
│   ├── Logo.tsx                       # Logo DiagOptim (SVG animé)
│   ├── LanguageSwitcher.tsx           # Switch FR/EN
│   ├── ThemeToggle.tsx                # Toggle dark/light
│   ├── LoadingSpinner.tsx             # Spinner animé
│   ├── EmptyState.tsx                 # État vide (illustration + CTA)
│   ├── ErrorBoundary.tsx              # Gestion d'erreurs
│   ├── FeatureGate.tsx                # Affiche/cache selon le plan
│   ├── Disclaimer.tsx                 # Disclaimer légal (rapports, IA)
│   └── ConfettiCelebration.tsx        # Animation confettis (jalons atteints)
│
└── landing/
    ├── Hero.tsx                       # Section hero (headline + CTA + démo)
    ├── Features.tsx                   # Fonctionnalités (cards animées)
    ├── HowItWorks.tsx                 # Comment ça marche (3 étapes)
    ├── Testimonials.tsx               # Témoignages
    ├── PricingSection.tsx             # Section tarifs
    ├── Faq.tsx                        # FAQ accordion
    └── Footer.tsx                     # Footer (liens, mentions légales)
```

## ★ COMPOSANT CLÉ : ConversationalInterface.tsx

C'est LE composant central de l'application. Voici les spécifications DÉTAILLÉES :

```
DESIGN :
- Layout : colonne centrale max-w-2xl, centré, fond surface-elevated
- Questions : bulles arrondies côté gauche, fond primary-lighter, avatar robot
- Réponses : bulles arrondies côté droit, fond white avec border
- Inputs : zone fixe en bas (comme un chat), s'adapte au type de question :
  → scale : Slider avec labels 0-10, couleur gradient rouge→vert
  → choice : Cartes cliquables (max 4), sélection avec animation check
  → text : Input texte avec placeholder contextuel
  → number : Input numérique avec unité (€, %, heures)
  → boolean : Deux gros boutons Oui/Non
  → file : Zone d'upload drag & drop
- Progression : anneau circulaire en haut à droite, pourcentage au centre
- Mini-insights : carte entre les blocs, fond vert clair, icône ampoule, animation slide-in
- "Typing indicator" : 3 points animés avant chaque nouvelle question (800ms)
- Transition entre questions : fade-in + slide-up (Framer Motion)
- Scroll : auto-scroll vers la dernière question, smooth

INTERACTIONS :
- Bouton "Retour" pour modifier une réponse précédente
- Bouton "Passer" (skip) si la question est optionnelle
- Bouton "Plus d'info" → tooltip/modal explicative (concept Lean en langage simple)
- Sauvegarde automatique à chaque réponse (optimistic update)
- Si diagnostic abandonné, popup "Reprendre où vous en étiez ?"

ANIMATIONS (Framer Motion) :
- Entrée question : opacity 0→1, y: 20→0, duration: 0.4s, ease: easeOut
- Entrée réponse : opacity 0→1, x: 20→0, duration: 0.3s
- Insight card : scale 0.95→1, opacity 0→1, delay: 0.2s
- Progress ring : animated stroke-dashoffset
- Transition entre phases : fond qui pulse légèrement en bleu
- Confettis quand diagnostic terminé
```

## PAGES CRITIQUES — SPÉCIFICATIONS DÉTAILLÉES

### Landing Page (page.tsx)
```
- Hero : titre animé "Découvrez ce que votre entreprise perd chaque jour"
  + sous-titre "Diagnostic gratuit en 10 minutes"
  + CTA "Commencer mon diagnostic gratuit" (bouton primary, hover scale 1.05)
  + Mockup de l'app en arrière-plan (parallax léger)
- Section "Comment ça marche" : 3 étapes animées au scroll
  1. "Répondez à quelques questions" (icône chat)
  2. "Recevez votre diagnostic complet" (icône chart)
  3. "Suivez votre feuille de route" (icône roadmap)
- Section "Outils" : grille de cards avec icônes des méthodologies
- Section témoignages : carousel
- Section pricing : tableau comparatif interactif (toggle mensuel/annuel)
- Footer : liens, mentions légales, réseaux sociaux
```

### Dashboard (dashboard/page.tsx)
```
- Score global : grande jauge circulaire animée (0-100) au centre
- Progression objectif : barre horizontale "12 450€ / 50 000€ objectif"
- Top 3 priorités : 3 cards empilées avec indicateur de criticité
- Radar chart des 8 gaspillages : interactif, tooltip au hover
- Timeline : mini-graphique d'évolution des diagnostics
- Actions en cours : 3-5 actions de la roadmap avec statut
- Formations recommandées : 2-3 cards formations
- Notifications récentes : mini-liste
```

### Résultats Diagnostic (diagnostic/[id]/results/page.tsx)
```
- En-tête : score global + date + objectif rappelé
- Radar chart 8 gaspillages : grand, interactif, animé au chargement
- Pour chaque gaspillage (8 sections) :
  → Score (barre colorée)
  → Résumé en 1-2 phrases
  → Estimation gains potentiels (fourchette)
  → Actions recommandées (preview)
- Matrice effort/impact : scatter plot interactif
- SWOT générée : matrice 4 quadrants
- CTA : "Voir ma feuille de route" + "Télécharger le rapport PDF"
- Disclaimer en bas
```

## RESPONSIVE & PWA

```
- Mobile-first : tous les composants doivent d'abord fonctionner en 375px
- Breakpoints : sm:640 md:768 lg:1024 xl:1280 2xl:1536
- Navigation mobile : bottom tab bar (4 onglets : Dashboard, Diagnostic, Roadmap, Plus)
- Sidebar : collapsible sur desktop, drawer sur mobile
- Tableaux : scroll horizontal sur mobile OU conversion en cards empilées
- Charts : responsive, touch-friendly sur mobile
- PWA : manifest.json, service worker, install prompt, splash screen
- Offline : afficher badge "Mode hors-ligne" + données cachées accessibles
```

## ANIMATIONS GLOBALES (Framer Motion)

```typescript
// Presets d'animation à utiliser partout
export const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.3 } };
export const slideUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: "easeOut" } };
export const slideInLeft = { initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 } };
export const slideInRight = { initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 } };
export const scaleIn = { initial: { scale: 0.95, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
export const staggerChildren = { animate: { transition: { staggerChildren: 0.08 } } };

// Page transitions
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } }
};
```

## ACCESSIBILITÉ

```
- WCAG 2.1 AA minimum
- Tous les composants interactifs : focus visible (ring-2 ring-primary)
- Aria labels sur tous les boutons et inputs
- Skip navigation link
- Contraste minimum 4.5:1 (texte), 3:1 (éléments UI)
- Keyboard navigation complète
- Screen reader friendly : aria-live pour les mises à jour dynamiques
- Reduced motion : @media (prefers-reduced-motion: reduce) { désactiver animations }
```

## i18n — FICHIERS DE TRADUCTION

Génère les fichiers `messages/fr.json` et `messages/en.json` complets pour TOUTES les pages et composants.

## INSTRUCTIONS FINALES

1. Génère TOUS les fichiers listés ci-dessus avec le code React/TypeScript COMPLET
2. Chaque composant doit être fonctionnel (pas de placeholder "TODO")
3. Utilise shadcn/ui pour les composants de base (Button, Input, Dialog, etc.)
4. Installe et configure tous les packages nécessaires
5. Le design doit être SOPHISTIQUÉ, moderne, mémorable — PAS générique
6. Responsive mobile-first OBLIGATOIRE
7. Dark mode OBLIGATOIRE (toggle dans Topbar)
8. Toutes les animations Framer Motion comme spécifié
9. Tous les textes via next-intl (jamais de texte en dur)

COMMENCE PAR : le layout principal (app shell), puis la ConversationalInterface (composant critique), puis le Dashboard, puis la Landing page.
