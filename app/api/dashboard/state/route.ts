import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import District from '@/models/District';
import MgnregaData, { IMgnregaData } from '@/models/MgnregaData';
import { getCached, setCache } from '@/lib/redis';
import {
  aggregateStateData,
  getStateMonthlyAggregates,
  getTopDistrictsForState,
  getPerformanceCategory,
} from '@/lib/dataAggregator';
import { convertCroresToAmount, getCalendarYear } from '@/lib/dataNormalizer';
import { getAppConfig } from '@/config/appConfig';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
  const stateCode = searchParams.get('stateCode') || getAppConfig().defaultStateCode;
    const financialYear = searchParams.get('financialYear');

    // Default to configured state if not provided

    // Check cache
    const cacheKey = `dashboard:state:${stateCode}:${financialYear || 'all'}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    await connectDB();

    const stateFilter: Record<string, unknown> = { stateCode };
    if (financialYear) {
      stateFilter.financialYear = financialYear;
    }

    const latestRecord = await MgnregaData.findOne(stateFilter)
      .sort({ financialYearStart: -1, month: -1 })
      .lean<IMgnregaData | null>();

    if (!latestRecord) {
      return NextResponse.json({
        error: 'No data available',
        message: `No records found for state ${stateCode}. Run ETL to ingest data first.`,
      });
    }

    const districts = await District.find({ stateCode }).lean();
    const stateSummary = await aggregateStateData(stateCode, latestRecord.financialYear, latestRecord.month);
    const monthlyAggregates = await getStateMonthlyAggregates(stateCode, financialYear || undefined, 12);
    const topDistricts = await getTopDistrictsForState(stateCode, latestRecord.financialYear, latestRecord.month, 20);

    const districtCount = stateSummary?.districtCount || districts.length || topDistricts.length || 1;
    const averageWorkdays = stateSummary && districtCount > 0
      ? stateSummary.totalWorkdaysGenerated / districtCount
      : 0;

    const response = {
      state: {
        code: stateCode,
        name: districts[0]?.stateName || stateCode,
      },
      summary: stateSummary
        ? {
            financialYear: latestRecord.financialYear,
            month: latestRecord.month,
            year: getCalendarYear(latestRecord.financialYear, latestRecord.month),
            totalPersonsWorked: stateSummary.totalPersonsWorked,
            totalHouseholdsWorked: stateSummary.totalHouseholdsWorked,
            totalWorkdaysGenerated: stateSummary.totalWorkdaysGenerated,
            averageWorkdaysPerPerson: stateSummary.averageWorkdaysPerPerson,
            totalExpenditure: convertCroresToAmount(stateSummary.totalExpenditure),
            averageExpenditurePerWorkday: stateSummary.averageExpenditurePerWorkday,
            districtCount,
          }
        : null,
      monthlyData: monthlyAggregates.map((entry) => ({
        financialYear: entry.financialYear,
        month: entry.month,
        year: entry.year,
        totalPersonsWorked: entry.totalPersonsWorked,
        totalHouseholdsWorked: entry.totalHouseholdsWorked,
        totalWorkdaysGenerated: entry.totalWorkdaysGenerated,
        totalExpenditure: convertCroresToAmount(entry.totalExpenditure),
        totalWorksCompleted: entry.totalWorksCompleted,
      })),
      topDistricts: topDistricts.map((districtMetric) => {
        const districtDoc = districts.find((dist) => dist.districtCode === districtMetric.districtCode);
        const vsStateAverage = averageWorkdays > 0
          ? ((districtMetric.workdaysGenerated - averageWorkdays) / averageWorkdays) * 100
          : 0;

        return {
          districtCode: districtMetric.districtCode,
          districtName: districtDoc?.districtName || districtMetric.districtCode,
          totalWorkdaysGenerated: districtMetric.workdaysGenerated,
          personsWorked: districtMetric.personsWorked,
          totalExpenditure: convertCroresToAmount(districtMetric.totalExpenditure),
          performanceCategory: getPerformanceCategory(vsStateAverage),
          vsStateAverage,
        };
      }),
      totalDistricts: districts.length,
    };

    // Cache for 1 hour
    await setCache(cacheKey, response, 3600);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
