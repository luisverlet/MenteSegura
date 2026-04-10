// ===========================================================
// SHARED DOMAIN TYPES – ready for backend contract alignment
// ===========================================================

export interface Student {
  id: number;
  name: string;
  code: string;
  risk: string;           // e.g. "32%"  → backend: number
  date: string;           // e.g. "02 - 03 - 2026" → backend: ISO date string
  program?: string;
  email?: string;
  contact?: string;
  phq9?: number;
  gad7?: number;
}

export interface RiskEvolutionPoint {
  name: string;  // month label
  value: number; // risk % value
}

export interface ExportOptions {
  anonymousData: boolean;
  includePHQ9: boolean;
  includeGAD7: boolean;
  includeProbability: boolean;
  startDate: string;
  endDate: string;
}

export interface PaginationState {
  page: number;
  rowsPerPage: number;
}

export interface FilterState {
  name: string;
  code: string;
  riskMin: string;
  riskMax: string;
  startDate: string;
  endDate: string;
}
