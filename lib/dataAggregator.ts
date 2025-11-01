/**
 * On-demand aggregation instead of pre-computed summaries
 * More flexible and always up-to-date
 */

import MgnregaData, { IMgnregaData } from '@/models/MgnregaData';
import { getCalendarYear } from './dataNormalizer';

export interface AggregatedMetrics {
  totalPersonsWorked: number;
  totalHouseholdsWorked: number;
  totalWorkdaysGenerated: number;
  averageWorkdaysPerPerson: number;
  totalExpenditure: number;
  averageExpenditurePerWorkday: number;
  totalWorksCompleted: number;
  totalWorksInProgress: number;
  totalWorksSanctioned: number;
  recordCount: number;
}

/**
 * Aggregate data for a district
 */
export async function aggregateDistrictData(
  districtCode: string,
  financialYear?: string
): Promise<AggregatedMetrics | null> {
  const match: any = { districtCode };
  if (financialYear) match.financialYear = financialYear;

  const result = await MgnregaData.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalPersonsWorked: { $sum: '$personsWorked' },
        totalHouseholdsWorked: { $sum: '$householdsWorked' },
        totalWorkdaysGenerated: { $sum: '$workdaysGenerated' },
        totalExpenditure: { $sum: '$totalExpenditure' },
        totalWorksCompleted: { $sum: '$worksCompleted' },
        totalWorksInProgress: { $sum: '$worksInProgress' },
        totalWorksSanctioned: { $sum: '$worksSanctioned' },
        totalPersonsSum: { $sum: '$personsWorked' },
        recordCount: { $sum: 1 },
      },
    },
    {
      $project: {
        totalPersonsWorked: 1,
        totalHouseholdsWorked: 1,
        totalWorkdaysGenerated: 1,
        averageWorkdaysPerPerson: {
          $cond: [
            { $gt: ['$totalPersonsSum', 0] },
            { $divide: ['$totalWorkdaysGenerated', '$totalPersonsSum'] },
            0,
          ],
        },
        totalExpenditure: 1,
        averageExpenditurePerWorkday: {
          $cond: [
            { $gt: ['$totalWorkdaysGenerated', 0] },
            { $divide: ['$totalExpenditure', '$totalWorkdaysGenerated'] },
            0,
          ],
        },
        totalWorksCompleted: 1,
        totalWorksInProgress: 1,
        totalWorksSanctioned: 1,
        recordCount: 1,
      },
    },
  ]);

  return result[0] || null;
}

/**
 * Get latest month's data for a district
 */
export async function getLatestDistrictData(districtCode: string, financialYear?: string) {
  const match: any = { districtCode };
  if (financialYear) match.financialYear = financialYear;

  const result = await MgnregaData.findOne(match)
    .sort({ financialYearStart: -1, month: -1 })
    .lean<IMgnregaData | null>();

  if (!result) {
    return null;
  }

  return {
    ...result,
    year: getCalendarYear(result.financialYear, result.month),
  };
}

/**
 * Get monthly trend data for a district
 */
export async function getDistrictTrend(districtCode: string, months: number = 12) {
  const data = await MgnregaData.find({ districtCode })
    .sort({ financialYearStart: -1, month: -1 })
    .limit(months)
    .select(
      'financialYear financialYearStart month workdaysGenerated totalExpenditure personsWorked householdsWorked workdaysPerPerson worksCompleted'
    )
    .lean<IMgnregaData[]>();

  return data.map((item) => ({
    ...item,
    year: getCalendarYear(item.financialYear, item.month),
  }));
}

/**
 * Calculate trends from monthly data
 */
export function calculateTrends(monthlyData: any[]) {
  if (monthlyData.length < 2) {
    return {
      workdaysTrend: 'stable' as const,
      expenditureTrend: 'stable' as const,
      worksTrend: 'stable' as const,
      workdaysChange: 0,
      expenditureChange: 0,
      worksChange: 0,
    };
  }

  const latest = monthlyData[0];
  const previous = monthlyData[1];

  const workdaysChange =
    previous.workdaysGenerated > 0
      ? ((latest.workdaysGenerated - previous.workdaysGenerated) / previous.workdaysGenerated) * 100
      : 0;

  const expenditureChange =
    previous.totalExpenditure > 0
      ? ((latest.totalExpenditure - previous.totalExpenditure) / previous.totalExpenditure) * 100
      : 0;

  const worksChange =
    previous.worksCompleted > 0
      ? ((latest.worksCompleted - previous.worksCompleted) / previous.worksCompleted) * 100
      : 0;

  return {
    workdaysTrend: workdaysChange > 5 ? 'up' : workdaysChange < -5 ? 'down' : 'stable',
    expenditureTrend: expenditureChange > 5 ? 'up' : expenditureChange < -5 ? 'down' : 'stable',
    worksTrend: worksChange > 5 ? 'up' : worksChange < -5 ? 'down' : 'stable',
    workdaysChange: Math.round(workdaysChange * 100) / 100,
    expenditureChange: Math.round(expenditureChange * 100) / 100,
    worksChange: Math.round(worksChange * 100) / 100,
  };
}

/**
 * Aggregate state-level data
 */
export async function aggregateStateData(stateCode: string, financialYear?: string, month?: number) {
  const match: any = { stateCode };
  if (financialYear) match.financialYear = financialYear;
  if (month) match.month = month;

  const result = await MgnregaData.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalWorkdaysGenerated: { $sum: '$workdaysGenerated' },
        totalPersonsWorked: { $sum: '$personsWorked' },
        totalExpenditure: { $sum: '$totalExpenditure' },
        districtCount: { $addToSet: '$districtCode' },
      },
    },
    {
      $project: {
        totalWorkdaysGenerated: 1,
        totalPersonsWorked: 1,
        totalExpenditure: 1,
        averageWorkdaysPerPerson: {
          $cond: [
            { $gt: ['$totalPersonsWorked', 0] },
            { $divide: ['$totalWorkdaysGenerated', '$totalPersonsWorked'] },
            0,
          ],
        },
        districtCount: { $size: '$districtCount' },
      },
    },
  ]);

  return result[0] || null;
}

/**
 * Calculate performance category based on vsStateAverage
 */
export function getPerformanceCategory(vsStateAverage: number): 'excellent' | 'good' | 'average' | 'below_average' | 'poor' {
  if (vsStateAverage >= 20) return 'excellent';
  if (vsStateAverage >= 10) return 'good';
  if (vsStateAverage >= -10) return 'average';
  if (vsStateAverage >= -20) return 'below_average';
  return 'poor';
}

/**
 * Monthly aggregates for a state (latest first)
 */
export async function getStateMonthlyAggregates(stateCode: string, financialYear?: string, limit: number = 12) {
  const match: any = { stateCode };
  if (financialYear) {
    match.financialYear = financialYear;
  }

  const results = await MgnregaData.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          financialYear: '$financialYear',
          financialYearStart: '$financialYearStart',
          month: '$month',
        },
        totalPersonsWorked: { $sum: '$personsWorked' },
        totalHouseholdsWorked: { $sum: '$householdsWorked' },
        totalWorkdaysGenerated: { $sum: '$workdaysGenerated' },
        totalExpenditure: { $sum: '$totalExpenditure' },
        totalWorksCompleted: { $sum: '$worksCompleted' },
      },
    },
    { $sort: { '_id.financialYearStart': -1, '_id.month': -1 } },
    { $limit: limit },
  ]);

  return results.map((entry) => {
    const { financialYear, month } = entry._id;
    return {
      financialYear,
      month,
      year: getCalendarYear(financialYear, month),
      totalPersonsWorked: entry.totalPersonsWorked,
      totalHouseholdsWorked: entry.totalHouseholdsWorked,
      totalWorkdaysGenerated: entry.totalWorkdaysGenerated,
      totalExpenditure: entry.totalExpenditure,
      totalWorksCompleted: entry.totalWorksCompleted,
    };
  });
}

/**
 * Top districts for a state in a specific month (default latest month in dataset)
 */
export async function getTopDistrictsForState(
  stateCode: string,
  financialYear: string,
  month: number,
  limit: number = 20
) {
  const results = await MgnregaData.aggregate([
    { $match: { stateCode, financialYear, month } },
    {
      $group: {
        _id: '$districtCode',
        workdaysGenerated: { $sum: '$workdaysGenerated' },
        personsWorked: { $sum: '$personsWorked' },
        totalExpenditure: { $sum: '$totalExpenditure' },
      },
    },
    { $sort: { workdaysGenerated: -1 } },
    { $limit: limit },
  ]);

  return results.map((entry) => ({
    districtCode: entry._id,
    workdaysGenerated: entry.workdaysGenerated,
    personsWorked: entry.personsWorked,
    totalExpenditure: entry.totalExpenditure,
  }));
}
