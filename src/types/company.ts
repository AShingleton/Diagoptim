export interface Company {
  id: string;
  name: string;
  siret?: string;
  sector?: string;
  sectorCode?: string;
  productsDescription?: string;
  location?: string;
  country: string;
  employeeCount?: number;
  annualRevenue?: number;
  clientCount?: number;
  competitors?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyProfile {
  name: string;
  sector: string;
  employeeCount: number;
  annualRevenue: number;
  location: string;
  productsDescription: string;
  clientCount: number;
  competitors: string[];
}
