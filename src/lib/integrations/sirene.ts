/**
 * INSEE/SIRENE API integration.
 *
 * Provides company lookup by SIRET number or company name via the
 * French government's SIRENE API. Enriches company profiles with
 * official registry data.
 *
 * @see https://api.insee.fr/catalogue/site/themes/wso2/subthemes/insee/pages/item-info.jag?name=Sirene&version=V3&provider=insee
 * @module integrations/sirene
 */

import type { CompanyProfile } from "@/types/company";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result from a SIRENE API lookup. */
export interface SireneResult {
  siret: string;
  siren: string;
  denomination: string;
  activitePrincipale: string;
  codeNaf: string;
  trancheEffectifs: string;
  adresse: SireneAddress;
  dateCreation: string;
  categorieJuridique: string;
}

/** Structured address from SIRENE data. */
export interface SireneAddress {
  numeroVoie: string | null;
  typeVoie: string | null;
  libelleVoie: string | null;
  codePostal: string;
  libelleCommune: string;
  codeCommuneEtablissement: string;
}

/** Raw API response shape for a single establishment. */
interface SireneEtablissement {
  siret: string;
  siren: string;
  dateCreationEtablissement: string;
  uniteLegale: {
    denominationUniteLegale: string | null;
    prenomUsuelUniteLegale: string | null;
    nomUniteLegale: string | null;
    categorieJuridiqueUniteLegale: string;
    trancheEffectifsUniteLegale: string;
    activitePrincipaleUniteLegale: string;
  };
  adresseEtablissement: {
    numeroVoieEtablissement: string | null;
    typeVoieEtablissement: string | null;
    libelleVoieEtablissement: string | null;
    codePostalEtablissement: string;
    libelleCommuneEtablissement: string;
    codeCommuneEtablissement: string;
  };
  periodesEtablissement: Array<{
    activitePrincipaleEtablissement: string;
  }>;
}

/** Raw API response wrapper. */
interface SireneApiResponse {
  header: { total: number; debut: number; nombre: number };
  etablissements: SireneEtablissement[];
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const SIRENE_API_BASE = "https://api.insee.fr/entreprises/sirene/V3.11";

function getApiToken(): string {
  const token = process.env.INSEE_SIRENE_API_TOKEN;
  if (!token) {
    throw new Error("INSEE_SIRENE_API_TOKEN environment variable is not set");
  }
  return token;
}

// ---------------------------------------------------------------------------
// Workforce mapping
// ---------------------------------------------------------------------------

/** Maps INSEE tranche effectifs code to approximate employee count. */
const TRANCHE_EFFECTIFS: Record<string, { label: string; min: number; max: number }> = {
  "00": { label: "0 salarié", min: 0, max: 0 },
  "01": { label: "1 ou 2 salariés", min: 1, max: 2 },
  "02": { label: "3 à 5 salariés", min: 3, max: 5 },
  "03": { label: "6 à 9 salariés", min: 6, max: 9 },
  "11": { label: "10 à 19 salariés", min: 10, max: 19 },
  "12": { label: "20 à 49 salariés", min: 20, max: 49 },
  "21": { label: "50 à 99 salariés", min: 50, max: 99 },
  "22": { label: "100 à 199 salariés", min: 100, max: 199 },
  "31": { label: "200 à 249 salariés", min: 200, max: 249 },
  "32": { label: "250 à 499 salariés", min: 250, max: 499 },
  "41": { label: "500 à 999 salariés", min: 500, max: 999 },
  "42": { label: "1 000 à 1 999 salariés", min: 1000, max: 1999 },
  "51": { label: "2 000 à 4 999 salariés", min: 2000, max: 4999 },
  "52": { label: "5 000 à 9 999 salariés", min: 5000, max: 9999 },
  "53": { label: "10 000 salariés et plus", min: 10000, max: 50000 },
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Searches for a company by its SIRET number (14 digits).
 *
 * @param siret - The 14-digit SIRET number.
 * @returns The matching company data, or `null` if not found.
 */
export async function searchBySiret(siret: string): Promise<SireneResult | null> {
  const cleanSiret = siret.replace(/\s/g, "");
  if (!/^\d{14}$/.test(cleanSiret)) {
    throw new Error(`Invalid SIRET format: expected 14 digits, got "${siret}"`);
  }

  const token = getApiToken();
  const url = `${SIRENE_API_BASE}/siret/${cleanSiret}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`SIRENE API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as { etablissement: SireneEtablissement };
  return mapEtablissement(data.etablissement);
}

/**
 * Searches for companies by name, optionally filtered by location.
 *
 * @param name     - The company name to search for.
 * @param location - Optional city or postal code filter.
 * @returns An array of matching results (max 20).
 */
export async function searchByName(name: string, location?: string): Promise<SireneResult[]> {
  const token = getApiToken();

  let query = `denominationUniteLegale:"${encodeURIComponent(name)}"`;
  if (location) {
    // Try to determine if location is a postal code or city name
    if (/^\d{5}$/.test(location)) {
      query += ` AND codePostalEtablissement:${location}`;
    } else {
      query += ` AND libelleCommuneEtablissement:"${encodeURIComponent(location)}"`;
    }
  }

  const url = `${SIRENE_API_BASE}/siret?q=${query}&nombre=20`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new Error(`SIRENE API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as SireneApiResponse;
  return data.etablissements.map(mapEtablissement);
}

/**
 * Enriches a company profile with data from the SIRENE registry.
 *
 * Fetches the SIRENE record and returns a partial CompanyProfile
 * with the fields that can be populated from the registry.
 *
 * @param siret - The 14-digit SIRET number.
 * @returns A partial CompanyProfile with available data.
 */
export async function enrichCompanyProfile(siret: string): Promise<Partial<CompanyProfile>> {
  const result = await searchBySiret(siret);

  if (!result) {
    return {};
  }

  const tranche = TRANCHE_EFFECTIFS[result.trancheEffectifs];
  const employeeEstimate = tranche
    ? Math.round((tranche.min + tranche.max) / 2)
    : 0;

  const locationParts = [
    result.adresse.codePostal,
    result.adresse.libelleCommune,
  ].filter(Boolean);

  return {
    name: result.denomination,
    sector: result.activitePrincipale,
    employeeCount: employeeEstimate,
    location: locationParts.join(" "),
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function mapEtablissement(etab: SireneEtablissement): SireneResult {
  const uniteLegale = etab.uniteLegale;

  // Build denomination from available fields
  const denomination =
    uniteLegale.denominationUniteLegale ??
    [uniteLegale.prenomUsuelUniteLegale, uniteLegale.nomUniteLegale].filter(Boolean).join(" ") ??
    "N/A";

  // Get activity code from the most recent period or from uniteLegale
  const activitePrincipale =
    etab.periodesEtablissement?.[0]?.activitePrincipaleEtablissement ??
    uniteLegale.activitePrincipaleUniteLegale ??
    "";

  const addr = etab.adresseEtablissement;

  return {
    siret: etab.siret,
    siren: etab.siren,
    denomination,
    activitePrincipale,
    codeNaf: activitePrincipale,
    trancheEffectifs: uniteLegale.trancheEffectifsUniteLegale ?? "00",
    adresse: {
      numeroVoie: addr.numeroVoieEtablissement,
      typeVoie: addr.typeVoieEtablissement,
      libelleVoie: addr.libelleVoieEtablissement,
      codePostal: addr.codePostalEtablissement,
      libelleCommune: addr.libelleCommuneEtablissement,
      codeCommuneEtablissement: addr.codeCommuneEtablissement,
    },
    dateCreation: etab.dateCreationEtablissement,
    categorieJuridique: uniteLegale.categorieJuridiqueUniteLegale,
  };
}
