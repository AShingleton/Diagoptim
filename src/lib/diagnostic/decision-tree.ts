// ============================================================================
// DiagOptim - Adaptive Decision Tree
// Defines the question flow structure and branching logic for Lean diagnostics
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

/** Diagnostic phases matching Prisma DiagnosticPhase enum */
export type DiagnosticPhaseType =
  | 'framing'
  | 'profile'
  | 'documents'
  | 'wastes'
  | 'deepening'
  | 'strategy'
  | 'scoping'
  | 'recommendations';

/** Subscription tiers matching Prisma Plan enum */
export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'expert' | 'consultant_solo' | 'consultant_cabinet';

/** Supported question input types */
export type QuestionType = 'scale' | 'choice' | 'text' | 'number' | 'boolean' | 'multi_select';

/** Context available when evaluating skip conditions */
export interface QuestionContext {
  sector: string;
  subsector: string;
  employeeCount: number;
  annualRevenue: number;
  answers: Map<string, unknown>;
  documentsUploaded: string[];
  plan: SubscriptionTier;
  locale: 'fr' | 'en';
}

/** Option for choice/multi_select questions */
export interface QuestionOption {
  value: string;
  labelFr: string;
  labelEn: string;
}

/** Waste category identifiers (TIMWOODS) */
export type WasteCategoryId =
  | 'transport'
  | 'inventory'
  | 'motion'
  | 'waiting'
  | 'overproduction'
  | 'overprocessing'
  | 'defects'
  | 'skills';

/** A single question node in the decision tree */
export interface QuestionNode {
  /** Unique question identifier, e.g. "framing_target_amount" */
  id: string;
  /** French question text (conversational tone) */
  textFr: string;
  /** English question text */
  textEn: string;
  /** Input type for this question */
  type: QuestionType;
  /** Available options for choice/multi_select types */
  options?: QuestionOption[];
  /** Grouping category (e.g. "framing", "transport", "swot") */
  category: string;
  /** Phase this question belongs to */
  phase: DiagnosticPhaseType;
  /** Weight applied when computing waste/diagnostic scores (0-10) */
  scoringWeight: number;
  /** Returns true if this question should be skipped given current context */
  skipIf?: (context: QuestionContext) => boolean;
  /** Follow-up questions shown conditionally after this one (max 2) */
  followUp?: QuestionNode[];
  /** Minimum subscription tier required to see this question */
  requiresPlan?: SubscriptionTier;
  /** Hint text shown below the question (fr) */
  hintFr?: string;
  /** Hint text shown below the question (en) */
  hintEn?: string;
  /** Linked waste category for scoring */
  wasteCategory?: WasteCategoryId;
}

// ============================================================================
// HELPER: Sector checks
// ============================================================================

const SERVICE_SECTORS = new Set([
  'consulting', 'services', 'finance', 'insurance', 'real_estate',
  'education', 'health', 'it', 'marketing', 'legal', 'accounting',
  'design', 'hr', 'telecom',
]);

const PRODUCTION_SECTORS = new Set([
  'manufacturing', 'construction', 'food_processing', 'automotive',
  'aerospace', 'electronics', 'metalwork', 'woodwork', 'textile',
  'chemicals', 'pharmaceuticals', 'agriculture',
]);

/** True when the company is a service-type business */
function isService(ctx: QuestionContext): boolean {
  return SERVICE_SECTORS.has(ctx.sector);
}

/** True when the company is a production/manufacturing business */
function isProduction(ctx: QuestionContext): boolean {
  return PRODUCTION_SECTORS.has(ctx.sector);
}

/** True when a document type has been uploaded */
function hasDocument(ctx: QuestionContext, docType: string): boolean {
  return ctx.documentsUploaded.includes(docType);
}

// ============================================================================
// PHASE 0: FRAMING QUESTIONS (3 questions)
// ============================================================================

export const FRAMING_QUESTIONS: QuestionNode[] = [
  {
    id: 'framing_target',
    textFr: 'Quel est votre objectif principal : augmenter votre chiffre d\'affaires ou reduire vos couts ?',
    textEn: 'What is your main goal: increase revenue or reduce costs?',
    type: 'choice',
    options: [
      { value: 'revenue_increase', labelFr: 'Augmenter mon chiffre d\'affaires', labelEn: 'Increase my revenue' },
      { value: 'cost_reduction', labelFr: 'Reduire mes couts', labelEn: 'Reduce my costs' },
    ],
    category: 'framing',
    phase: 'framing',
    scoringWeight: 0,
    hintFr: 'Cela nous permet d\'orienter le diagnostic vers ce qui compte le plus pour vous.',
    hintEn: 'This helps us focus the diagnostic on what matters most to you.',
  },
  {
    id: 'framing_target_amount',
    textFr: 'Quel montant visez-vous ? (en euros)',
    textEn: 'What amount are you targeting? (in euros)',
    type: 'number',
    category: 'framing',
    phase: 'framing',
    scoringWeight: 0,
    hintFr: 'Meme approximatif, cela nous aide a calibrer les recommandations.',
    hintEn: 'Even a rough estimate helps us calibrate our recommendations.',
    followUp: [
      {
        id: 'framing_target_timeline',
        textFr: 'En combien de mois souhaitez-vous atteindre cet objectif ?',
        textEn: 'In how many months do you want to reach this goal?',
        type: 'choice',
        options: [
          { value: '3', labelFr: '3 mois', labelEn: '3 months' },
          { value: '6', labelFr: '6 mois', labelEn: '6 months' },
          { value: '12', labelFr: '12 mois', labelEn: '12 months' },
          { value: '18', labelFr: '18 mois', labelEn: '18 months' },
          { value: '24', labelFr: '24 mois', labelEn: '24 months' },
        ],
        category: 'framing',
        phase: 'framing',
        scoringWeight: 0,
      },
    ],
  },
  {
    id: 'framing_autonomy',
    textFr: 'Comment souhaitez-vous etre accompagne dans cette demarche ?',
    textEn: 'How would you like to be supported in this process?',
    type: 'choice',
    options: [
      { value: 'self', labelFr: 'Je veux faire seul avec les outils', labelEn: 'I want to do it myself with tools' },
      { value: 'guided', labelFr: 'Guide par l\'IA avec un plan d\'action', labelEn: 'Guided by AI with an action plan' },
      { value: 'accompanied', labelFr: 'Accompagne par un consultant', labelEn: 'Supported by a consultant' },
    ],
    category: 'framing',
    phase: 'framing',
    scoringWeight: 0,
    hintFr: 'Vous pourrez changer d\'avis a tout moment.',
    hintEn: 'You can change your mind at any time.',
  },
];

// ============================================================================
// PHASE 1: PROFILE QUESTIONS (8+ questions)
// ============================================================================

export const PROFILE_QUESTIONS: QuestionNode[] = [
  {
    id: 'profile_sector',
    textFr: 'Dans quel secteur d\'activite exercez-vous ?',
    textEn: 'What industry sector are you in?',
    type: 'choice',
    options: [
      { value: 'manufacturing', labelFr: 'Industrie / Fabrication', labelEn: 'Manufacturing' },
      { value: 'construction', labelFr: 'BTP / Construction', labelEn: 'Construction' },
      { value: 'services', labelFr: 'Services aux entreprises', labelEn: 'Business Services' },
      { value: 'consulting', labelFr: 'Conseil', labelEn: 'Consulting' },
      { value: 'it', labelFr: 'Informatique / Tech', labelEn: 'IT / Tech' },
      { value: 'food_processing', labelFr: 'Agroalimentaire', labelEn: 'Food Processing' },
      { value: 'health', labelFr: 'Sante', labelEn: 'Healthcare' },
      { value: 'education', labelFr: 'Education / Formation', labelEn: 'Education / Training' },
      { value: 'metalwork', labelFr: 'Metallurgie / Chaudronnerie', labelEn: 'Metalwork' },
      { value: 'automotive', labelFr: 'Automobile', labelEn: 'Automotive' },
      { value: 'retail', labelFr: 'Commerce / Distribution', labelEn: 'Retail / Distribution' },
      { value: 'logistics', labelFr: 'Logistique / Transport', labelEn: 'Logistics / Transport' },
      { value: 'other', labelFr: 'Autre', labelEn: 'Other' },
    ],
    category: 'profile',
    phase: 'profile',
    scoringWeight: 0,
    skipIf: (ctx) => ctx.answers.has('profile_sector'),
  },
  {
    id: 'profile_subsector',
    textFr: 'Pouvez-vous preciser votre sous-secteur ou specialite ?',
    textEn: 'Can you specify your sub-sector or specialty?',
    type: 'text',
    category: 'profile',
    phase: 'profile',
    scoringWeight: 0,
    skipIf: (ctx) => ctx.answers.has('profile_subsector'),
  },
  {
    id: 'profile_employees',
    textFr: 'Combien de personnes travaillent dans votre entreprise ?',
    textEn: 'How many people work in your company?',
    type: 'choice',
    options: [
      { value: '1', labelFr: 'Juste moi', labelEn: 'Just me' },
      { value: '2-5', labelFr: '2 a 5', labelEn: '2 to 5' },
      { value: '6-10', labelFr: '6 a 10', labelEn: '6 to 10' },
      { value: '11-25', labelFr: '11 a 25', labelEn: '11 to 25' },
      { value: '26-50', labelFr: '26 a 50', labelEn: '26 to 50' },
      { value: '51-100', labelFr: '51 a 100', labelEn: '51 to 100' },
      { value: '100+', labelFr: 'Plus de 100', labelEn: 'More than 100' },
    ],
    category: 'profile',
    phase: 'profile',
    scoringWeight: 0,
    skipIf: (ctx) => ctx.employeeCount > 0,
  },
  {
    id: 'profile_revenue',
    textFr: 'Quel est votre chiffre d\'affaires annuel approximatif ?',
    textEn: 'What is your approximate annual revenue?',
    type: 'choice',
    options: [
      { value: 'under_100k', labelFr: 'Moins de 100 000 EUR', labelEn: 'Under 100,000 EUR' },
      { value: '100k_500k', labelFr: '100 000 - 500 000 EUR', labelEn: '100,000 - 500,000 EUR' },
      { value: '500k_1m', labelFr: '500 000 - 1 000 000 EUR', labelEn: '500,000 - 1,000,000 EUR' },
      { value: '1m_5m', labelFr: '1 - 5 millions EUR', labelEn: '1 - 5 million EUR' },
      { value: '5m_20m', labelFr: '5 - 20 millions EUR', labelEn: '5 - 20 million EUR' },
      { value: 'over_20m', labelFr: 'Plus de 20 millions EUR', labelEn: 'Over 20 million EUR' },
    ],
    category: 'profile',
    phase: 'profile',
    scoringWeight: 0,
    skipIf: (ctx) => ctx.annualRevenue > 0 || hasDocument(ctx, 'balance_sheet'),
  },
  {
    id: 'profile_products',
    textFr: 'Decrivez brievement vos produits ou services principaux.',
    textEn: 'Briefly describe your main products or services.',
    type: 'text',
    category: 'profile',
    phase: 'profile',
    scoringWeight: 0,
  },
  {
    id: 'profile_clients',
    textFr: 'Combien de clients actifs avez-vous environ ?',
    textEn: 'Approximately how many active clients do you have?',
    type: 'choice',
    options: [
      { value: '1-5', labelFr: '1 a 5', labelEn: '1 to 5' },
      { value: '6-20', labelFr: '6 a 20', labelEn: '6 to 20' },
      { value: '21-50', labelFr: '21 a 50', labelEn: '21 to 50' },
      { value: '51-200', labelFr: '51 a 200', labelEn: '51 to 200' },
      { value: '200+', labelFr: 'Plus de 200', labelEn: 'More than 200' },
    ],
    category: 'profile',
    phase: 'profile',
    scoringWeight: 0,
  },
  {
    id: 'profile_competitors',
    textFr: 'Combien de concurrents directs identifiez-vous ?',
    textEn: 'How many direct competitors can you identify?',
    type: 'choice',
    options: [
      { value: '0', labelFr: 'Aucun (niche)', labelEn: 'None (niche)' },
      { value: '1-3', labelFr: '1 a 3', labelEn: '1 to 3' },
      { value: '4-10', labelFr: '4 a 10', labelEn: '4 to 10' },
      { value: '10+', labelFr: 'Plus de 10', labelEn: 'More than 10' },
    ],
    category: 'profile',
    phase: 'profile',
    scoringWeight: 0,
  },
  {
    id: 'profile_main_challenge',
    textFr: 'Quel est le plus gros defi auquel votre entreprise fait face aujourd\'hui ?',
    textEn: 'What is the biggest challenge your company faces today?',
    type: 'text',
    category: 'profile',
    phase: 'profile',
    scoringWeight: 0,
    hintFr: 'Quelques mots suffisent. Cela nous aide a personnaliser l\'analyse.',
    hintEn: 'A few words are enough. This helps us personalize the analysis.',
  },
  {
    id: 'profile_digital_maturity',
    textFr: 'Comment evalueriez-vous la maturite numerique de votre entreprise ?',
    textEn: 'How would you rate your company\'s digital maturity?',
    type: 'scale',
    category: 'profile',
    phase: 'profile',
    scoringWeight: 0,
    hintFr: '1 = tout sur papier, 10 = tout digitalise et automatise',
    hintEn: '1 = everything on paper, 10 = fully digitized and automated',
  },
];

// ============================================================================
// PHASE 2: WASTE QUESTIONS — 8 Wastes (TIMWOODS), 5+ per category = 40+
// ============================================================================

// ---------- TRANSPORT ----------
export const TRANSPORT_QUESTIONS: QuestionNode[] = [
  {
    id: 'waste_transport_01',
    textFr: 'Vos produits ou dossiers passent-ils par plusieurs etapes de transfert avant d\'arriver a destination ?',
    textEn: 'Do your products or files go through multiple transfer steps before reaching their destination?',
    type: 'scale',
    category: 'transport',
    phase: 'wastes',
    scoringWeight: 8,
    wasteCategory: 'transport',
    hintFr: '1 = trajet direct, 10 = nombreux allers-retours',
    hintEn: '1 = direct route, 10 = many back-and-forth trips',
  },
  {
    id: 'waste_transport_02',
    textFr: 'Vos equipes doivent-elles se deplacer physiquement pour transmettre des informations ?',
    textEn: 'Do your teams need to physically travel to share information?',
    type: 'scale',
    category: 'transport',
    phase: 'wastes',
    scoringWeight: 6,
    wasteCategory: 'transport',
  },
  {
    id: 'waste_transport_03',
    textFr: 'Les matieres premieres ou fournitures sont-elles stockees loin de leur lieu d\'utilisation ?',
    textEn: 'Are raw materials or supplies stored far from where they are used?',
    type: 'scale',
    category: 'transport',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'transport',
    skipIf: (ctx) => isService(ctx),
  },
  {
    id: 'waste_transport_04',
    textFr: 'Combien de fois un meme document est-il transfere entre services avant validation finale ?',
    textEn: 'How many times is a single document transferred between departments before final approval?',
    type: 'choice',
    options: [
      { value: '0-1', labelFr: '0 a 1 fois', labelEn: '0 to 1 time' },
      { value: '2-3', labelFr: '2 a 3 fois', labelEn: '2 to 3 times' },
      { value: '4-5', labelFr: '4 a 5 fois', labelEn: '4 to 5 times' },
      { value: '6+', labelFr: 'Plus de 5 fois', labelEn: 'More than 5 times' },
    ],
    category: 'transport',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'transport',
  },
  {
    id: 'waste_transport_05',
    textFr: 'Utilisez-vous des outils numeriques pour eviter les deplacements inutiles (visio, cloud, etc.) ?',
    textEn: 'Do you use digital tools to avoid unnecessary travel (video calls, cloud, etc.)?',
    type: 'scale',
    category: 'transport',
    phase: 'wastes',
    scoringWeight: 5,
    wasteCategory: 'transport',
    hintFr: '1 = oui, tout est digital, 10 = non, tout necessite un deplacement',
    hintEn: '1 = yes, everything is digital, 10 = no, everything requires travel',
  },
];

// ---------- INVENTORY ----------
export const INVENTORY_QUESTIONS: QuestionNode[] = [
  {
    id: 'waste_inventory_01',
    textFr: 'Avez-vous regulierement des stocks de marchandises ou fournitures qui restent longtemps inutilises ?',
    textEn: 'Do you regularly have goods or supplies that remain unused for long periods?',
    type: 'scale',
    category: 'inventory',
    phase: 'wastes',
    scoringWeight: 8,
    wasteCategory: 'inventory',
    skipIf: (ctx) => isService(ctx) && !ctx.answers.has('waste_inventory_service'),
    followUp: [
      {
        id: 'waste_inventory_01_fu',
        textFr: 'Estimez-vous la valeur de ce stock dormant (en % du CA) ?',
        textEn: 'Can you estimate the value of dormant stock (as % of revenue)?',
        type: 'choice',
        options: [
          { value: 'under_1', labelFr: 'Moins de 1%', labelEn: 'Under 1%' },
          { value: '1_5', labelFr: '1-5%', labelEn: '1-5%' },
          { value: '5_10', labelFr: '5-10%', labelEn: '5-10%' },
          { value: 'over_10', labelFr: 'Plus de 10%', labelEn: 'Over 10%' },
        ],
        category: 'inventory',
        phase: 'wastes',
        scoringWeight: 6,
        wasteCategory: 'inventory',
      },
    ],
  },
  {
    id: 'waste_inventory_service',
    textFr: 'Avez-vous des projets ou dossiers en attente qui s\'accumulent sans etre traites ?',
    textEn: 'Do you have projects or files piling up without being processed?',
    type: 'scale',
    category: 'inventory',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'inventory',
    skipIf: (ctx) => isProduction(ctx),
  },
  {
    id: 'waste_inventory_02',
    textFr: 'Arrive-t-il que des produits ou materiaux se periment ou deviennent obsoletes ?',
    textEn: 'Do products or materials expire or become obsolete?',
    type: 'scale',
    category: 'inventory',
    phase: 'wastes',
    scoringWeight: 8,
    wasteCategory: 'inventory',
    skipIf: (ctx) => isService(ctx),
  },
  {
    id: 'waste_inventory_03',
    textFr: 'Votre espace de stockage est-il suffisant ou devez-vous en louer en supplement ?',
    textEn: 'Is your storage space sufficient or do you need to rent additional space?',
    type: 'choice',
    options: [
      { value: 'sufficient', labelFr: 'Largement suffisant', labelEn: 'More than enough' },
      { value: 'tight', labelFr: 'Juste suffisant', labelEn: 'Just enough' },
      { value: 'renting', labelFr: 'On loue du stockage supplementaire', labelEn: 'We rent extra storage' },
    ],
    category: 'inventory',
    phase: 'wastes',
    scoringWeight: 6,
    wasteCategory: 'inventory',
    skipIf: (ctx) => isService(ctx),
  },
  {
    id: 'waste_inventory_04',
    textFr: 'Vos emails non traites ou dossiers en attente representent-ils une charge mentale importante ?',
    textEn: 'Do unprocessed emails or pending files represent a significant mental burden?',
    type: 'scale',
    category: 'inventory',
    phase: 'wastes',
    scoringWeight: 5,
    wasteCategory: 'inventory',
  },
  {
    id: 'waste_inventory_05',
    textFr: 'Avez-vous une bonne visibilite sur vos niveaux de stock ou d\'en-cours a tout moment ?',
    textEn: 'Do you have good visibility on your stock or work-in-progress levels at all times?',
    type: 'scale',
    category: 'inventory',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'inventory',
    hintFr: '1 = parfaite visibilite, 10 = aucune idee de l\'etat reel',
    hintEn: '1 = perfect visibility, 10 = no idea of the real state',
  },
];

// ---------- MOTION ----------
export const MOTION_QUESTIONS: QuestionNode[] = [
  {
    id: 'waste_motion_01',
    textFr: 'Vos collaborateurs doivent-ils souvent se deplacer dans les locaux pour chercher des outils ou informations ?',
    textEn: 'Do your employees often need to move around the premises to find tools or information?',
    type: 'scale',
    category: 'motion',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'motion',
  },
  {
    id: 'waste_motion_02',
    textFr: 'Les postes de travail sont-ils bien organises (tout a portee de main) ?',
    textEn: 'Are workstations well organized (everything within reach)?',
    type: 'scale',
    category: 'motion',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'motion',
    hintFr: '1 = parfaitement organise, 10 = on cherche constamment',
    hintEn: '1 = perfectly organized, 10 = constantly searching',
  },
  {
    id: 'waste_motion_03',
    textFr: 'Combien de logiciels ou applications differents vos equipes utilisent-elles au quotidien ?',
    textEn: 'How many different software applications do your teams use daily?',
    type: 'choice',
    options: [
      { value: '1-3', labelFr: '1 a 3', labelEn: '1 to 3' },
      { value: '4-7', labelFr: '4 a 7', labelEn: '4 to 7' },
      { value: '8-12', labelFr: '8 a 12', labelEn: '8 to 12' },
      { value: '12+', labelFr: 'Plus de 12', labelEn: 'More than 12' },
    ],
    category: 'motion',
    phase: 'wastes',
    scoringWeight: 6,
    wasteCategory: 'motion',
  },
  {
    id: 'waste_motion_04',
    textFr: 'Les reunions necessitent-elles souvent des deplacements physiques ?',
    textEn: 'Do meetings often require physical travel?',
    type: 'scale',
    category: 'motion',
    phase: 'wastes',
    scoringWeight: 5,
    wasteCategory: 'motion',
  },
  {
    id: 'waste_motion_05',
    textFr: 'Vos employes effectuent-ils des taches repetitives qui pourraient etre automatisees ?',
    textEn: 'Do your employees perform repetitive tasks that could be automated?',
    type: 'scale',
    category: 'motion',
    phase: 'wastes',
    scoringWeight: 8,
    wasteCategory: 'motion',
    hintFr: '1 = tout est optimise, 10 = beaucoup de taches manuelles repetitives',
    hintEn: '1 = everything is optimized, 10 = many repetitive manual tasks',
  },
];

// ---------- WAITING ----------
export const WAITING_QUESTIONS: QuestionNode[] = [
  {
    id: 'waste_waiting_01',
    textFr: 'Vos equipes attendent-elles souvent des validations ou approbations pour avancer ?',
    textEn: 'Do your teams often wait for validations or approvals to move forward?',
    type: 'scale',
    category: 'waiting',
    phase: 'wastes',
    scoringWeight: 9,
    wasteCategory: 'waiting',
  },
  {
    id: 'waste_waiting_02',
    textFr: 'Quel est le delai moyen entre une commande client et le debut du travail effectif ?',
    textEn: 'What is the average delay between a client order and the start of actual work?',
    type: 'choice',
    options: [
      { value: 'immediate', labelFr: 'Immediat', labelEn: 'Immediate' },
      { value: '1-3_days', labelFr: '1 a 3 jours', labelEn: '1 to 3 days' },
      { value: '1-2_weeks', labelFr: '1 a 2 semaines', labelEn: '1 to 2 weeks' },
      { value: 'over_2_weeks', labelFr: 'Plus de 2 semaines', labelEn: 'Over 2 weeks' },
    ],
    category: 'waiting',
    phase: 'wastes',
    scoringWeight: 8,
    wasteCategory: 'waiting',
  },
  {
    id: 'waste_waiting_03',
    textFr: 'Les pannes machines ou problemes techniques causent-ils des arrets frequents ?',
    textEn: 'Do machine breakdowns or technical issues cause frequent stoppages?',
    type: 'scale',
    category: 'waiting',
    phase: 'wastes',
    scoringWeight: 8,
    wasteCategory: 'waiting',
    skipIf: (ctx) => isService(ctx),
  },
  {
    id: 'waste_waiting_04',
    textFr: 'Vos fournisseurs livrent-ils generalement dans les delais ?',
    textEn: 'Do your suppliers generally deliver on time?',
    type: 'scale',
    category: 'waiting',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'waiting',
    hintFr: '1 = toujours a l\'heure, 10 = retards constants',
    hintEn: '1 = always on time, 10 = constant delays',
  },
  {
    id: 'waste_waiting_05',
    textFr: 'Arrive-t-il que des collaborateurs n\'aient pas de travail a faire en attendant une etape precedente ?',
    textEn: 'Do employees sometimes have nothing to do while waiting for a previous step to complete?',
    type: 'scale',
    category: 'waiting',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'waiting',
  },
  {
    id: 'waste_waiting_06',
    textFr: 'Les informations necessaires pour travailler sont-elles facilement accessibles ?',
    textEn: 'Is the information needed to work easily accessible?',
    type: 'scale',
    category: 'waiting',
    phase: 'wastes',
    scoringWeight: 6,
    wasteCategory: 'waiting',
    hintFr: '1 = tout est centralise et accessible, 10 = il faut toujours chercher',
    hintEn: '1 = everything is centralized and accessible, 10 = always searching',
  },
];

// ---------- OVERPRODUCTION ----------
export const OVERPRODUCTION_QUESTIONS: QuestionNode[] = [
  {
    id: 'waste_overprod_01',
    textFr: 'Produisez-vous ou preparez-vous des choses "au cas ou" plutot qu\'a la demande ?',
    textEn: 'Do you produce or prepare things "just in case" rather than on demand?',
    type: 'scale',
    category: 'overproduction',
    phase: 'wastes',
    scoringWeight: 8,
    wasteCategory: 'overproduction',
  },
  {
    id: 'waste_overprod_02',
    textFr: 'Generez-vous des rapports ou documents que personne ne lit ?',
    textEn: 'Do you generate reports or documents that nobody reads?',
    type: 'scale',
    category: 'overproduction',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'overproduction',
  },
  {
    id: 'waste_overprod_03',
    textFr: 'Vos lots de production sont-ils souvent plus grands que les commandes reelles ?',
    textEn: 'Are your production batches often larger than actual orders?',
    type: 'scale',
    category: 'overproduction',
    phase: 'wastes',
    scoringWeight: 8,
    wasteCategory: 'overproduction',
    skipIf: (ctx) => isService(ctx),
  },
  {
    id: 'waste_overprod_04',
    textFr: 'Envoyez-vous des emails en copie a des personnes qui n\'en ont pas besoin ?',
    textEn: 'Do you CC people on emails who don\'t need them?',
    type: 'scale',
    category: 'overproduction',
    phase: 'wastes',
    scoringWeight: 4,
    wasteCategory: 'overproduction',
  },
  {
    id: 'waste_overprod_05',
    textFr: 'Avez-vous des fonctionnalites dans vos produits/services que les clients n\'utilisent pas ?',
    textEn: 'Do you have features in your products/services that clients don\'t use?',
    type: 'scale',
    category: 'overproduction',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'overproduction',
  },
];

// ---------- OVERPROCESSING ----------
export const OVERPROCESSING_QUESTIONS: QuestionNode[] = [
  {
    id: 'waste_overproc_01',
    textFr: 'Certaines etapes de vos processus vous semblent-elles inutiles ou redondantes ?',
    textEn: 'Do some steps in your processes seem unnecessary or redundant?',
    type: 'scale',
    category: 'overprocessing',
    phase: 'wastes',
    scoringWeight: 9,
    wasteCategory: 'overprocessing',
  },
  {
    id: 'waste_overproc_02',
    textFr: 'Saisissez-vous les memes informations dans plusieurs systemes differents ?',
    textEn: 'Do you enter the same information in multiple different systems?',
    type: 'scale',
    category: 'overprocessing',
    phase: 'wastes',
    scoringWeight: 8,
    wasteCategory: 'overprocessing',
  },
  {
    id: 'waste_overproc_03',
    textFr: 'Vos processus de validation comportent-ils plus de 3 niveaux d\'approbation ?',
    textEn: 'Do your approval processes have more than 3 levels of approval?',
    type: 'boolean',
    category: 'overprocessing',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'overprocessing',
  },
  {
    id: 'waste_overproc_04',
    textFr: 'Faites-vous des controles qualite a des etapes ou il n\'y a presque jamais de probleme ?',
    textEn: 'Do you perform quality checks at steps where there are almost never any issues?',
    type: 'scale',
    category: 'overprocessing',
    phase: 'wastes',
    scoringWeight: 6,
    wasteCategory: 'overprocessing',
    skipIf: (ctx) => isService(ctx),
  },
  {
    id: 'waste_overproc_05',
    textFr: 'Vos livrables depassent-ils regulierement les attentes client (sur-qualite) sans que cela soit valorise ?',
    textEn: 'Do your deliverables regularly exceed client expectations (over-quality) without being valued?',
    type: 'scale',
    category: 'overprocessing',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'overprocessing',
  },
];

// ---------- DEFECTS ----------
export const DEFECTS_QUESTIONS: QuestionNode[] = [
  {
    id: 'waste_defects_01',
    textFr: 'Quel pourcentage de votre travail doit etre refait ou corrige ?',
    textEn: 'What percentage of your work needs to be redone or corrected?',
    type: 'choice',
    options: [
      { value: 'under_1', labelFr: 'Moins de 1%', labelEn: 'Under 1%' },
      { value: '1_5', labelFr: '1-5%', labelEn: '1-5%' },
      { value: '5_10', labelFr: '5-10%', labelEn: '5-10%' },
      { value: '10_20', labelFr: '10-20%', labelEn: '10-20%' },
      { value: 'over_20', labelFr: 'Plus de 20%', labelEn: 'Over 20%' },
    ],
    category: 'defects',
    phase: 'wastes',
    scoringWeight: 9,
    wasteCategory: 'defects',
  },
  {
    id: 'waste_defects_02',
    textFr: 'Les reclamations clients sont-elles frequentes ?',
    textEn: 'Are customer complaints frequent?',
    type: 'scale',
    category: 'defects',
    phase: 'wastes',
    scoringWeight: 9,
    wasteCategory: 'defects',
    hintFr: '1 = tres rares, 10 = quasi quotidiennes',
    hintEn: '1 = very rare, 10 = almost daily',
  },
  {
    id: 'waste_defects_03',
    textFr: 'Avez-vous un processus formalise pour traiter les non-conformites ?',
    textEn: 'Do you have a formalized process for handling non-conformities?',
    type: 'choice',
    options: [
      { value: 'yes_digital', labelFr: 'Oui, digitalise et suivi', labelEn: 'Yes, digitized and tracked' },
      { value: 'yes_manual', labelFr: 'Oui, mais sur papier', labelEn: 'Yes, but on paper' },
      { value: 'informal', labelFr: 'Informel (on gere au cas par cas)', labelEn: 'Informal (case by case)' },
      { value: 'no', labelFr: 'Non, pas de processus', labelEn: 'No process' },
    ],
    category: 'defects',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'defects',
  },
  {
    id: 'waste_defects_04',
    textFr: 'Les erreurs se repetent-elles souvent (memes causes, memes problemes) ?',
    textEn: 'Do errors often repeat (same causes, same problems)?',
    type: 'scale',
    category: 'defects',
    phase: 'wastes',
    scoringWeight: 8,
    wasteCategory: 'defects',
  },
  {
    id: 'waste_defects_05',
    textFr: 'Combien de temps passez-vous en moyenne a corriger une erreur ?',
    textEn: 'How much time do you spend on average correcting an error?',
    type: 'choice',
    options: [
      { value: 'minutes', labelFr: 'Quelques minutes', labelEn: 'A few minutes' },
      { value: 'hours', labelFr: 'Quelques heures', labelEn: 'A few hours' },
      { value: 'day', labelFr: 'Une journee', labelEn: 'A full day' },
      { value: 'days', labelFr: 'Plusieurs jours', labelEn: 'Several days' },
    ],
    category: 'defects',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'defects',
  },
];

// ---------- SKILLS (Underutilized talent) ----------
export const SKILLS_QUESTIONS: QuestionNode[] = [
  {
    id: 'waste_skills_01',
    textFr: 'Vos collaborateurs utilisent-ils pleinement leurs competences dans leur poste actuel ?',
    textEn: 'Do your employees fully use their skills in their current role?',
    type: 'scale',
    category: 'skills',
    phase: 'wastes',
    scoringWeight: 8,
    wasteCategory: 'skills',
    hintFr: '1 = parfaitement, 10 = competences largement sous-exploitees',
    hintEn: '1 = perfectly, 10 = skills largely underutilized',
  },
  {
    id: 'waste_skills_02',
    textFr: 'Les idees d\'amelioration de vos equipes sont-elles ecoutees et mises en oeuvre ?',
    textEn: 'Are improvement ideas from your teams listened to and implemented?',
    type: 'scale',
    category: 'skills',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'skills',
    hintFr: '1 = toujours, 10 = jamais',
    hintEn: '1 = always, 10 = never',
  },
  {
    id: 'waste_skills_03',
    textFr: 'Investissez-vous dans la formation de vos equipes ?',
    textEn: 'Do you invest in training your teams?',
    type: 'choice',
    options: [
      { value: 'regular', labelFr: 'Regulierement (plan de formation)', labelEn: 'Regularly (training plan)' },
      { value: 'occasional', labelFr: 'Occasionnellement', labelEn: 'Occasionally' },
      { value: 'rare', labelFr: 'Rarement', labelEn: 'Rarely' },
      { value: 'never', labelFr: 'Jamais', labelEn: 'Never' },
    ],
    category: 'skills',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'skills',
  },
  {
    id: 'waste_skills_04',
    textFr: 'Le turnover (rotation du personnel) est-il un probleme pour vous ?',
    textEn: 'Is employee turnover a problem for you?',
    type: 'scale',
    category: 'skills',
    phase: 'wastes',
    scoringWeight: 6,
    wasteCategory: 'skills',
  },
  {
    id: 'waste_skills_05',
    textFr: 'Des taches qualifiees sont-elles confiees a des personnes surqualifiees (ou l\'inverse) ?',
    textEn: 'Are skilled tasks assigned to overqualified people (or vice versa)?',
    type: 'scale',
    category: 'skills',
    phase: 'wastes',
    scoringWeight: 7,
    wasteCategory: 'skills',
  },
];

// ============================================================================
// PHASE 3: DEEPENING QUESTIONS (triggered for top 3 worst wastes)
// ============================================================================

export const DEEPENING_QUESTIONS: QuestionNode[] = [
  {
    id: 'deep_process_map',
    textFr: 'Pouvez-vous decrire les grandes etapes de votre processus principal (de la commande a la livraison) ?',
    textEn: 'Can you describe the main steps of your core process (from order to delivery)?',
    type: 'text',
    category: 'deepening',
    phase: 'deepening',
    scoringWeight: 0,
    requiresPlan: 'starter',
    hintFr: 'Listez les etapes dans l\'ordre. Cela alimentera l\'analyse VSM.',
    hintEn: 'List the steps in order. This will feed the VSM analysis.',
  },
  {
    id: 'deep_bottleneck',
    textFr: 'Quelle etape de votre processus est la plus lente ou la plus problematique ?',
    textEn: 'Which step in your process is the slowest or most problematic?',
    type: 'text',
    category: 'deepening',
    phase: 'deepening',
    scoringWeight: 0,
    requiresPlan: 'starter',
  },
  {
    id: 'deep_root_cause',
    textFr: 'Selon vous, quelle est la cause principale de ce probleme ?',
    textEn: 'In your opinion, what is the main cause of this problem?',
    type: 'text',
    category: 'deepening',
    phase: 'deepening',
    scoringWeight: 0,
    requiresPlan: 'starter',
    hintFr: 'Ne vous censurez pas, toute reponse est utile.',
    hintEn: 'Don\'t hold back, every answer is useful.',
  },
  {
    id: 'deep_past_attempts',
    textFr: 'Avez-vous deja tente des actions pour resoudre ce probleme ? Si oui, lesquelles ?',
    textEn: 'Have you already tried any actions to solve this problem? If so, which ones?',
    type: 'text',
    category: 'deepening',
    phase: 'deepening',
    scoringWeight: 0,
    requiresPlan: 'starter',
  },
  {
    id: 'deep_impact_estimate',
    textFr: 'Si ce probleme etait resolu, quel impact financier estimeriez-vous (par mois) ?',
    textEn: 'If this problem were resolved, what financial impact would you estimate (per month)?',
    type: 'number',
    category: 'deepening',
    phase: 'deepening',
    scoringWeight: 0,
    requiresPlan: 'starter',
    hintFr: 'Meme une estimation grossiere aide a prioriser.',
    hintEn: 'Even a rough estimate helps prioritize.',
  },
];

// ============================================================================
// PHASE 4: STRATEGY QUESTIONS (SWOT/Porter)
// ============================================================================

export const STRATEGY_QUESTIONS: QuestionNode[] = [
  {
    id: 'strategy_strengths',
    textFr: 'Quels sont les 3 principaux points forts de votre entreprise par rapport a vos concurrents ?',
    textEn: 'What are the 3 main strengths of your company compared to your competitors?',
    type: 'text',
    category: 'swot',
    phase: 'strategy',
    scoringWeight: 0,
    requiresPlan: 'pro',
  },
  {
    id: 'strategy_weaknesses',
    textFr: 'Quels sont les 3 points que vous aimeriez ameliorer en priorite ?',
    textEn: 'What are the 3 things you would most like to improve?',
    type: 'text',
    category: 'swot',
    phase: 'strategy',
    scoringWeight: 0,
    requiresPlan: 'pro',
  },
  {
    id: 'strategy_opportunities',
    textFr: 'Voyez-vous des opportunites de marche que vous n\'exploitez pas encore ?',
    textEn: 'Do you see market opportunities that you are not yet exploiting?',
    type: 'text',
    category: 'swot',
    phase: 'strategy',
    scoringWeight: 0,
    requiresPlan: 'pro',
  },
  {
    id: 'strategy_threats',
    textFr: 'Quelles menaces ou risques pesent sur votre activite ?',
    textEn: 'What threats or risks weigh on your business?',
    type: 'text',
    category: 'swot',
    phase: 'strategy',
    scoringWeight: 0,
    requiresPlan: 'pro',
  },
  {
    id: 'strategy_supplier_dependency',
    textFr: 'A quel point dependez-vous de quelques fournisseurs cles ?',
    textEn: 'How dependent are you on a few key suppliers?',
    type: 'scale',
    category: 'porter',
    phase: 'strategy',
    scoringWeight: 0,
    requiresPlan: 'pro',
    hintFr: '1 = tres diversifie, 10 = totalement dependant',
    hintEn: '1 = very diversified, 10 = totally dependent',
  },
  {
    id: 'strategy_client_concentration',
    textFr: 'Quel pourcentage de votre CA represente votre plus gros client ?',
    textEn: 'What percentage of your revenue does your biggest client represent?',
    type: 'choice',
    options: [
      { value: 'under_10', labelFr: 'Moins de 10%', labelEn: 'Under 10%' },
      { value: '10_25', labelFr: '10-25%', labelEn: '10-25%' },
      { value: '25_50', labelFr: '25-50%', labelEn: '25-50%' },
      { value: 'over_50', labelFr: 'Plus de 50%', labelEn: 'Over 50%' },
    ],
    category: 'porter',
    phase: 'strategy',
    scoringWeight: 0,
    requiresPlan: 'pro',
  },
];

// ============================================================================
// PHASE 5: SCOPING QUESTIONS (Ishikawa 6M-structured, 14 questions)
// ============================================================================

export const SCOPING_QUESTIONS: QuestionNode[] = [
  {
    id: 'scoping_role',
    textFr: 'Quelle est votre fonction dans l\'entreprise, et sur quels sujets travaillez-vous au quotidien ?',
    textEn: 'What is your role in the company, and what do you work on day to day?',
    type: 'text',
    category: 'framing',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Cela nous aide a situer votre point de vue.',
    hintEn: 'This helps us situate your perspective.',
  },
  {
    id: 'scoping_pain_top',
    textFr: 'Si vous pouviez supprimer UNE tache penible ou chronophage de vos journees, laquelle ?',
    textEn: 'If you could remove ONE painful or time-consuming task from your days, which one?',
    type: 'text',
    category: 'method',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Votre premiere frustration compte.',
    hintEn: 'Your top frustration matters.',
  },
  {
    id: 'scoping_man_tasks',
    textFr: 'Quelles taches vous prennent le plus de temps chaque semaine ? Donnez des exemples concrets.',
    textEn: 'Which tasks take you the most time each week? Give concrete examples.',
    type: 'text',
    category: 'man',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Main d\'oeuvre : ou part votre temps.',
    hintEn: 'People: where your time goes.',
  },
  {
    id: 'scoping_man_skills',
    textFr: 'Y a-t-il des taches que vous etes seul(e) a savoir faire, ou qui bloquent quand vous etes absent(e) ?',
    textEn: 'Are there tasks only you can do, or that stall when you are away?',
    type: 'text',
    category: 'man',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Points de dependance.',
    hintEn: 'Single points of dependency.',
  },
  {
    id: 'scoping_machine_tools',
    textFr: 'Quels logiciels ou outils utilisez-vous ? Lesquels vous ralentissent ou vous frustrent ?',
    textEn: 'Which software or tools do you use? Which ones slow you down or frustrate you?',
    type: 'text',
    category: 'machine',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Machines : votre outillage.',
    hintEn: 'Machines: your tooling.',
  },
  {
    id: 'scoping_machine_manual',
    textFr: 'Qu\'est-ce que vous faites encore \'a la main\' qui pourrait, selon vous, etre automatise ?',
    textEn: 'What do you still do \'by hand\' that you think could be automated?',
    type: 'text',
    category: 'machine',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Candidats a l\'automatisation.',
    hintEn: 'Automation candidates.',
  },
  {
    id: 'scoping_method_process',
    textFr: 'Decrivez une de vos taches recurrentes etape par etape (ex : prise de commande, facturation, planning).',
    textEn: 'Describe one of your recurring tasks step by step (e.g. taking orders, invoicing, scheduling).',
    type: 'text',
    category: 'method',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Methodes : le deroule reel.',
    hintEn: 'Methods: the real flow.',
  },
  {
    id: 'scoping_method_waits',
    textFr: 'Ou y a-t-il des attentes, des allers-retours ou des validations qui font perdre du temps ?',
    textEn: 'Where are there waits, back-and-forth, or approvals that waste time?',
    type: 'text',
    category: 'method',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Frictions de process.',
    hintEn: 'Process frictions.',
  },
  {
    id: 'scoping_material_data',
    textFr: 'Quelles informations saisissez-vous ou ressaisissez-vous plusieurs fois (tableur, logiciel, cahier) ?',
    textEn: 'What information do you enter or re-enter several times (spreadsheet, software, notebook)?',
    type: 'text',
    category: 'material',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Matieres : les donnees qui entrent.',
    hintEn: 'Materials: the data coming in.',
  },
  {
    id: 'scoping_material_sources',
    textFr: 'Ou sont stockees vos informations importantes ? Est-ce facile a retrouver ?',
    textEn: 'Where is your important information stored? Is it easy to find?',
    type: 'text',
    category: 'material',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Dispersion / accessibilite.',
    hintEn: 'Scatter / accessibility.',
  },
  {
    id: 'scoping_measurement_track',
    textFr: 'Qu\'aimeriez-vous suivre ou mesurer que vous ne suivez pas aujourd\'hui (delais, erreurs, ventes, stock) ?',
    textEn: 'What would you like to track or measure that you do not today (delays, errors, sales, stock)?',
    type: 'text',
    category: 'measurement',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Mesure : l\'invisible.',
    hintEn: 'Measurement: the invisible.',
  },
  {
    id: 'scoping_environment_flow',
    textFr: 'Comment circulent les informations entre les personnes ou services ? Ou ca coince le plus ?',
    textEn: 'How does information flow between people or departments? Where does it get stuck most?',
    type: 'text',
    category: 'environment',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Milieu : l\'organisation.',
    hintEn: 'Environment: the organisation.',
  },
  {
    id: 'scoping_ai_usecase',
    textFr: 'Si vous aviez un assistant qui pouvait faire une chose a votre place, ce serait quoi en priorite ?',
    textEn: 'If you had an assistant that could do one thing for you, what would it be first?',
    type: 'text',
    category: 'method',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Vision agent IA du repondant.',
    hintEn: 'Respondent\'s AI-agent vision.',
  },
  {
    id: 'scoping_constraints',
    textFr: 'Y a-t-il des contraintes a connaitre ? (donnees sensibles/clients, outils imposes, budget, reticences dans l\'equipe)',
    textEn: 'Any constraints to know about? (sensitive/client data, imposed tools, budget, team reluctance)',
    type: 'text',
    category: 'environment',
    phase: 'scoping',
    scoringWeight: 0,
    hintFr: 'Contraintes & risques.',
    hintEn: 'Constraints & risks.',
  },
];

// ============================================================================
// AGGREGATED TREE
// ============================================================================

/** All waste questions grouped for iteration */
export const ALL_WASTE_QUESTIONS: QuestionNode[] = [
  ...TRANSPORT_QUESTIONS,
  ...INVENTORY_QUESTIONS,
  ...MOTION_QUESTIONS,
  ...WAITING_QUESTIONS,
  ...OVERPRODUCTION_QUESTIONS,
  ...OVERPROCESSING_QUESTIONS,
  ...DEFECTS_QUESTIONS,
  ...SKILLS_QUESTIONS,
];

/** Complete question bank organized by phase */
export const QUESTION_TREE: Record<DiagnosticPhaseType, QuestionNode[]> = {
  framing: FRAMING_QUESTIONS,
  profile: PROFILE_QUESTIONS,
  documents: [], // Documents phase has no questions — it's upload-driven
  wastes: ALL_WASTE_QUESTIONS,
  deepening: DEEPENING_QUESTIONS,
  strategy: STRATEGY_QUESTIONS,
  scoping: SCOPING_QUESTIONS,
  recommendations: [], // Recommendations phase generates output, no questions
};

/** Total question count (excluding follow-ups) for progress calculation */
export const TOTAL_QUESTION_COUNT =
  FRAMING_QUESTIONS.length +
  PROFILE_QUESTIONS.length +
  ALL_WASTE_QUESTIONS.length +
  DEEPENING_QUESTIONS.length +
  STRATEGY_QUESTIONS.length;

/**
 * Returns the ordered list of phases for a given diagnostic type.
 */
export function getPhasesForType(diagnosticType: string): DiagnosticPhaseType[] {
  switch (diagnosticType) {
    case 'quick':
      return ['framing', 'profile', 'wastes', 'recommendations'];
    case 'waste':
      return ['framing', 'profile', 'documents', 'wastes', 'deepening', 'recommendations'];
    case 'strategy':
      return ['framing', 'profile', 'documents', 'strategy', 'recommendations'];
    case 'automation_scoping':
      // Stakeholder respondents only run the 6M scoping dialogue — no financial
      // framing or company profiling (those belong to the project, not each person).
      return ['scoping', 'recommendations'];
    case 'full':
    default:
      return ['framing', 'profile', 'documents', 'wastes', 'deepening', 'strategy', 'recommendations'];
  }
}

/**
 * Checks if a given plan meets the minimum required tier.
 */
export function planMeetsRequirement(userPlan: SubscriptionTier, required?: SubscriptionTier): boolean {
  if (!required) return true;

  const tierOrder: SubscriptionTier[] = [
    'free', 'starter', 'pro', 'expert', 'consultant_solo', 'consultant_cabinet',
  ];
  return tierOrder.indexOf(userPlan) >= tierOrder.indexOf(required);
}
