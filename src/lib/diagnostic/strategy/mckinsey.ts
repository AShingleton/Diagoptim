/**
 * McKinsey / GE Matrix Analysis Engine
 *
 * Evaluates business units or products along two dimensions:
 * - Industry Attractiveness (external)
 * - Competitive Strength (internal)
 *
 * Classifies into three strategic zones:
 * invest/grow, selectivity/earnings, harvest/divest.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StrategicZone = 'invest_grow' | 'selectivity_earnings' | 'harvest_divest';

export interface AttractivenessFactors {
  /** Market size (1-5) */
  marketSize: number;
  /** Market growth rate (1-5) */
  marketGrowth: number;
  /** Industry profitability (1-5) */
  profitability: number;
  /** Competitive intensity – inverted: 5 = low competition (attractive) */
  competitiveIntensity: number;
  /** Technological requirements (1-5, 5 = manageable) */
  technologyRequirements: number;
  /** Regulatory environment (1-5, 5 = favourable) */
  regulatoryEnvironment: number;
  /** Social/environmental impact (1-5, 5 = positive) */
  socialImpact: number;
}

export interface StrengthFactors {
  /** Relative market share (1-5) */
  marketShare: number;
  /** Brand strength / reputation (1-5) */
  brandStrength: number;
  /** Production capacity (1-5) */
  productionCapacity: number;
  /** Profit margins relative to competitors (1-5) */
  profitMargins: number;
  /** Technological capability (1-5) */
  technologicalCapability: number;
  /** Management quality (1-5) */
  managementQuality: number;
  /** Knowledge of customer / market (1-5) */
  customerKnowledge: number;
}

export interface ProductData {
  id: string;
  name: string;
  revenue: number;
  attractivenessFactors: AttractivenessFactors;
  strengthFactors: StrengthFactors;
}

export interface IndustryData {
  name: string;
  /** Optional global-level overrides for attractiveness factors */
  globalAttractiveness?: Partial<AttractivenessFactors>;
}

export interface MckinseyClassification {
  product: ProductData;
  attractivenessScore: number;
  strengthScore: number;
  zone: StrategicZone;
  zoneLabel: string;
  recommendation: string;
  details: string;
}

export interface MckinseyPortfolioSummary {
  /** Distribution of revenue across strategic zones (%) */
  revenueDistribution: Record<StrategicZone, number>;
  /** Overall portfolio health score (0-100) */
  healthScore: number;
  healthDescription: string;
  portfolioRecommendations: string[];
}

export interface MckinseyResult {
  classifications: MckinseyClassification[];
  summary: MckinseyPortfolioSummary;
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ZONE_LABELS: Record<StrategicZone, string> = {
  invest_grow: 'Investir / Croître',
  selectivity_earnings: 'Sélectivité / Rentabilité',
  harvest_divest: 'Récolter / Désinvestir',
};

/** Factor weights for industry attractiveness (must sum to 1) */
const ATTRACTIVENESS_WEIGHTS: Record<keyof AttractivenessFactors, number> = {
  marketSize: 0.20,
  marketGrowth: 0.20,
  profitability: 0.15,
  competitiveIntensity: 0.15,
  technologyRequirements: 0.10,
  regulatoryEnvironment: 0.10,
  socialImpact: 0.10,
};

/** Factor weights for competitive strength (must sum to 1) */
const STRENGTH_WEIGHTS: Record<keyof StrengthFactors, number> = {
  marketShare: 0.20,
  brandStrength: 0.15,
  productionCapacity: 0.15,
  profitMargins: 0.15,
  technologicalCapability: 0.15,
  managementQuality: 0.10,
  customerKnowledge: 0.10,
};

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate weighted industry attractiveness score.
 *
 * @param factors - Attractiveness factor scores (each 1-5)
 * @returns Weighted score from 1 to 5
 */
export function calculateIndustryAttractiveness(factors: AttractivenessFactors): number {
  let weighted = 0;

  for (const [key, weight] of Object.entries(ATTRACTIVENESS_WEIGHTS) as [keyof AttractivenessFactors, number][]) {
    weighted += clamp(factors[key], 1, 5) * weight;
  }

  return Math.round(weighted * 100) / 100;
}

/**
 * Calculate weighted competitive strength score.
 *
 * @param factors - Strength factor scores (each 1-5)
 * @returns Weighted score from 1 to 5
 */
export function calculateCompetitiveStrength(factors: StrengthFactors): number {
  let weighted = 0;

  for (const [key, weight] of Object.entries(STRENGTH_WEIGHTS) as [keyof StrengthFactors, number][]) {
    weighted += clamp(factors[key], 1, 5) * weight;
  }

  return Math.round(weighted * 100) / 100;
}

// ---------------------------------------------------------------------------
// Zone classification (3x3 grid mapped to 3 zones)
// ---------------------------------------------------------------------------

/**
 * Determine the strategic zone based on attractiveness and strength scores.
 *
 * The 3x3 grid:
 * ```
 *                    Competitive Strength
 *                    High    Medium    Low
 * Attractiveness
 *   High          | Invest | Invest  | Select |
 *   Medium        | Invest | Select  | Harvest|
 *   Low           | Select | Harvest | Harvest|
 * ```
 */
function classifyZone(attractiveness: number, strength: number): StrategicZone {
  const attrLevel = attractiveness >= 3.67 ? 'high' : attractiveness >= 2.33 ? 'medium' : 'low';
  const strLevel = strength >= 3.67 ? 'high' : strength >= 2.33 ? 'medium' : 'low';

  if (attrLevel === 'high' && strLevel === 'high') return 'invest_grow';
  if (attrLevel === 'high' && strLevel === 'medium') return 'invest_grow';
  if (attrLevel === 'medium' && strLevel === 'high') return 'invest_grow';

  if (attrLevel === 'low' && strLevel === 'low') return 'harvest_divest';
  if (attrLevel === 'low' && strLevel === 'medium') return 'harvest_divest';
  if (attrLevel === 'medium' && strLevel === 'low') return 'harvest_divest';

  return 'selectivity_earnings';
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

/**
 * Generate a strategic recommendation based on attractiveness and strength scores.
 *
 * @param attractiveness - Industry attractiveness score (1-5)
 * @param strength - Competitive strength score (1-5)
 * @returns A strategic recommendation string
 */
export function getStrategicRecommendation(attractiveness: number, strength: number): string {
  const zone = classifyZone(attractiveness, strength);

  switch (zone) {
    case 'invest_grow':
      if (attractiveness >= 4 && strength >= 4) {
        return 'Position idéale. Investir massivement pour consolider la position de leader et capturer la croissance du marché.';
      }
      if (strength >= 3.5) {
        return 'Bonne position sur un marché attractif. Investir sélectivement pour renforcer les avantages concurrentiels clés.';
      }
      return 'Marché attractif avec une position compétitive à renforcer. Concentrer les investissements sur les facteurs de différenciation.';

    case 'selectivity_earnings':
      if (attractiveness >= 3 && strength >= 3) {
        return 'Position intermédiaire favorable. Investir de façon sélective dans les segments les plus rentables et protéger les parts de marché.';
      }
      if (attractiveness >= 3) {
        return 'Marché attractif mais position compétitive insuffisante. Évaluer la faisabilité d\'un investissement ciblé ou envisager un partenariat stratégique.';
      }
      return 'Position compétitive correcte sur un marché en déclin. Maximiser la rentabilité à court terme et préparer une transition.';

    case 'harvest_divest':
      if (strength >= 2.5) {
        return 'Marché peu attractif malgré une compétitivité résiduelle. Récolter les profits sans investir et planifier un repositionnement.';
      }
      return 'Position défavorable sur un marché peu attractif. Désinvestir progressivement et réallouer les ressources vers des activités plus porteuses.';
  }
}

function getZoneDetails(zone: StrategicZone): string {
  switch (zone) {
    case 'invest_grow':
      return 'Zone d\'investissement prioritaire. L\'attractivité du marché et la force concurrentielle justifient un engagement soutenu de ressources.';
    case 'selectivity_earnings':
      return 'Zone de sélectivité. La situation requiert des choix ciblés : investir dans les niches rentables ou se désengager des segments faibles.';
    case 'harvest_divest':
      return 'Zone de récolte ou désinvestissement. Les conditions ne justifient plus d\'investissements significatifs.';
  }
}

// ---------------------------------------------------------------------------
// Portfolio summary
// ---------------------------------------------------------------------------

function assessPortfolio(classifications: MckinseyClassification[]): MckinseyPortfolioSummary {
  const revenueDistribution: Record<StrategicZone, number> = {
    invest_grow: 0,
    selectivity_earnings: 0,
    harvest_divest: 0,
  };

  const totalRevenue = classifications.reduce((sum, c) => sum + c.product.revenue, 0);

  for (const c of classifications) {
    revenueDistribution[c.zone] += totalRevenue > 0
      ? Math.round((c.product.revenue / totalRevenue) * 100)
      : 0;
  }

  // Health score based on revenue distribution
  let healthScore = 50;
  healthScore += Math.min(30, revenueDistribution.invest_grow * 0.6);
  healthScore += Math.min(15, revenueDistribution.selectivity_earnings * 0.3);
  healthScore -= Math.min(30, revenueDistribution.harvest_divest * 0.6);
  healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

  let healthDescription: string;
  if (healthScore >= 70) {
    healthDescription = 'Portefeuille sain avec une part dominante d\'activités dans des marchés attractifs et des positions concurrentielles fortes.';
  } else if (healthScore >= 45) {
    healthDescription = 'Portefeuille mixte nécessitant des arbitrages stratégiques pour optimiser l\'allocation des ressources.';
  } else {
    healthDescription = 'Portefeuille fragile. Une restructuration significative est recommandée pour assurer la pérennité.';
  }

  const portfolioRecommendations: string[] = [];

  if (revenueDistribution.invest_grow < 20) {
    portfolioRecommendations.push(
      'Moins de 20 % du CA provient de la zone Investir/Croître. Diversifier vers des marchés plus attractifs.',
    );
  }
  if (revenueDistribution.harvest_divest > 40) {
    portfolioRecommendations.push(
      'Plus de 40 % du CA est en zone Récolter/Désinvestir. Accélérer la réallocation des ressources.',
    );
  }
  if (classifications.length <= 1) {
    portfolioRecommendations.push(
      'Portefeuille trop concentré. Envisager la diversification pour répartir les risques.',
    );
  }

  const investCount = classifications.filter((c) => c.zone === 'invest_grow').length;
  if (investCount === 0) {
    portfolioRecommendations.push(
      'Aucune activité en zone d\'investissement. Identifier de nouvelles opportunités de croissance.',
    );
  }

  if (portfolioRecommendations.length === 0) {
    portfolioRecommendations.push(
      'Le portefeuille est bien positionné. Continuer à surveiller l\'évolution de l\'attractivité des marchés.',
    );
  }

  return { revenueDistribution, healthScore, healthDescription, portfolioRecommendations };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Generate a complete McKinsey/GE Matrix analysis for a set of products/business units.
 *
 * @param products - Array of product/business unit data with factor assessments
 * @param industry - Industry-level data with optional global attractiveness overrides
 * @returns Complete McKinsey/GE matrix analysis
 */
export function generateMckinseyMatrix(
  products: ProductData[],
  industry: IndustryData,
): MckinseyResult {
  const classifications: MckinseyClassification[] = products.map((product) => {
    // Merge global attractiveness overrides if provided
    const attractivenessFactors: AttractivenessFactors = {
      ...product.attractivenessFactors,
      ...industry.globalAttractiveness,
    };

    const attractivenessScore = calculateIndustryAttractiveness(attractivenessFactors);
    const strengthScore = calculateCompetitiveStrength(product.strengthFactors);
    const zone = classifyZone(attractivenessScore, strengthScore);

    return {
      product,
      attractivenessScore,
      strengthScore,
      zone,
      zoneLabel: ZONE_LABELS[zone],
      recommendation: getStrategicRecommendation(attractivenessScore, strengthScore),
      details: getZoneDetails(zone),
    };
  });

  const summary = assessPortfolio(classifications);

  return {
    classifications,
    summary,
    generatedAt: new Date().toISOString(),
  };
}
