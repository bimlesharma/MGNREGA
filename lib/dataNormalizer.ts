/**
 * Optimized data normalization based on actual API structure
 * API returns all fields as strings in Title_Case format
 */

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

function parseMonth(value: unknown): number {
  if (typeof value === 'number' && value >= 1 && value <= 12) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return 0;
    }

    const directNumber = Number(trimmed);
    if (!Number.isNaN(directNumber)) {
      return Math.max(1, Math.min(12, Math.floor(directNumber)));
    }

    const short = trimmed.slice(0, 3).toLowerCase();
    return MONTH_MAP[short] || 0;
  }

  return 0;
}

function parseFinancialYearStart(financialYear: string): number {
  const start = Number.parseInt(financialYear.split('-')[0], 10);
  return Number.isFinite(start) ? start : new Date().getFullYear();
}

export function getCalendarYear(financialYear: string, month: number): number {
  const startYear = parseFinancialYearStart(financialYear);
  // Indian financial year starts in April. Months Jan-Mar belong to startYear + 1.
  return month >= 4 ? startYear : startYear + 1;
}

// Helper to safely parse string numbers
function parseNum(value: any, defaultValue = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

// Helper to safely convert string to number
function toInt(value: any, defaultValue = 0): number {
  const num = parseNum(value, defaultValue);
  return Math.floor(num);
}

/**
 * Direct field mapping from API response structure
 * API fields are in Title_Case format, all values are strings
 */
export interface NormalizedRecord {
  // Identity fields (composite key)
  districtCode: string;
  stateCode: string;
  financialYear: string;
  financialYearStart: number;
  month: number;
  
  // Core metrics (stored as-is from API, converted only on retrieval)
  personsWorked: number;
  householdsWorked: number;
  workdaysGenerated: number; // Calculated from persondays
  workdaysPerPerson: number;
  
  // Financial metrics (in crores as stored in API)
  totalExpenditure: number;
  wageExpenditure: number;
  materialExpenditure: number;
  
  // Works metrics
  worksCompleted: number;
  worksInProgress: number;
  worksSanctioned: number;
  
  // Additional useful metrics
  personsDemanded?: number;
  avgWageRate?: number;
}

/**
 * Simplified normalization - direct mapping from API structure
 */
export function normalizeRecord(apiRecord: any): NormalizedRecord | null {
  try {
    // Parse month from string like "Dec"
    const month = parseMonth(apiRecord.month);
    
    if (!month || month < 1 || month > 12) {
      console.warn(`Invalid month in record`, apiRecord.district_code);
      return null;
    }

    // Extract core identifiers
    const districtCode = String(apiRecord.district_code || '').trim();
    const stateCode = String(apiRecord.state_code || '').trim();
    const financialYear = String(
      apiRecord.fin_year ||
      apiRecord.financial_year ||
      apiRecord.financialYear ||
      apiRecord.finyear ||
      ''
    ).trim();

    if (!districtCode || !stateCode || !financialYear) {
      return null; // Invalid record
    }

    const financialYearStart = parseFinancialYearStart(financialYear);

    // Calculate workdays from persondays (most accurate)
    const scPersondays = parseNum(apiRecord.SC_persondays);
    const stPersondays = parseNum(apiRecord.ST_persondays);
    const womenPersondays = parseNum(apiRecord.Women_Persondays);
    // Use total from central liability or sum of categories
    const totalPersondays =
      parseNum(apiRecord.Persondays_of_Central_Liability_so_far) ||
      (scPersondays + stPersondays + womenPersondays);

    // Core metrics
    const personsWorked = toInt(apiRecord.Total_Individuals_Worked);
    const householdsWorked = toInt(apiRecord.Total_Households_Worked);
    const workdaysGenerated = totalPersondays;
    const workdaysPerPerson = personsWorked > 0 ? workdaysGenerated / personsWorked : 0;

    // Financial metrics (keep in crores for consistency with API)
    const totalExpenditure = parseNum(apiRecord.Total_Exp);
    const wageExpenditure = parseNum(apiRecord.Wages);
    const materialExpenditure = parseNum(apiRecord.Material_and_skilled_Wages);

    // Works metrics
    const worksCompleted = toInt(apiRecord.Number_of_Completed_Works);
    const worksInProgress = toInt(apiRecord.Number_of_Ongoing_Works);
    const worksSanctioned = toInt(apiRecord.Total_No_of_Works_Takenup);

    return {
    districtCode,
    stateCode,
    financialYear,
    financialYearStart,
      month,
      personsWorked,
      householdsWorked,
      workdaysGenerated,
      workdaysPerPerson,
      totalExpenditure,
      wageExpenditure,
      materialExpenditure,
      worksCompleted,
      worksInProgress,
      worksSanctioned,
      personsDemanded: toInt(apiRecord.Approved_Labour_Budget),
      avgWageRate: parseNum(apiRecord.Average_Wage_rate_per_day_per_person),
    };
  } catch (error) {
    console.error('Error normalizing record:', error);
    return null;
  }
}

/**
 * Convert financial values from crores to actual amount
 * Use this only when displaying data
 */
export function convertCroresToAmount(crores: number): number {
  return crores * 10000000;
}

/**
 * Format amount for display
 */
export function formatAmount(crores: number): string {
  if (crores >= 100) {
    return `₹${crores.toFixed(2)} Cr`;
  } else if (crores >= 1) {
    return `₹${crores.toFixed(2)} Cr`;
  } else {
    return `₹${(crores * 100).toFixed(2)} L`;
  }
}
