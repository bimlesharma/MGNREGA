import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import District from '@/models/District';
import MgnregaData from '@/models/MgnregaData';
import { getCached, setCache } from '@/lib/redis';
import {
  aggregateDistrictData,
  getLatestDistrictData,
  getDistrictTrend,
  calculateTrends,
  aggregateStateData,
  getPerformanceCategory,
} from '@/lib/dataAggregator';
import { convertCroresToAmount } from '@/lib/dataNormalizer';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const districtCode = searchParams.get('districtCode');
    const financialYear = searchParams.get('financialYear');
    const months = searchParams.get('months') ? parseInt(searchParams.get('months')!) : 12;

    if (!districtCode) {
      return NextResponse.json({ error: 'districtCode is required' }, { status: 400 });
    }

    // Check cache
    const cacheKey = `dashboard:district:${districtCode}:${financialYear || 'all'}:${months}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    await connectDB();

    // First, check if district exists
    const districtDoc = await District.findOne({ districtCode });
    if (!districtDoc) {
      return NextResponse.json(
        { 
          error: 'District not found',
          message: `District with code "${districtCode}" not found in database. Please ensure ETL has run and populated district data.`
        }, 
        { status: 404 }
      );
    }

    // Use optimized aggregation approach
    const query: any = { districtCode };
    if (financialYear) query.financialYear = financialYear;

    // Get latest month's data
    const latestData: any = await getLatestDistrictData(districtCode, financialYear || undefined);

    if (!latestData) {
      return NextResponse.json({
        error: 'No data available',
        message: `No MGNREGA data found for district "${districtDoc.districtName}". Please run ETL to fetch data.`,
        district: {
          code: districtCode,
          name: districtDoc.districtName,
          stateCode: districtDoc.stateCode,
          stateName: districtDoc.stateName,
        },
      });
    }

    // Get monthly trend data
    const monthlyData = await getDistrictTrend(districtCode, months);
    const trends = calculateTrends(monthlyData);

    // Get aggregated metrics
    const aggregated = await aggregateDistrictData(districtCode, financialYear || undefined);

    // Get state average for comparison
    const stateCode = districtDoc.stateCode;
    const stateData = await aggregateStateData(
      stateCode,
      latestData.financialYear,
      latestData.month
    );

    const stateAverage = stateData
      ? {
          workdaysGenerated: stateData.totalWorkdaysGenerated / (stateData.districtCount || 1),
          averageWorkdaysPerPerson: stateData.averageWorkdaysPerPerson,
          totalExpenditure: stateData.totalExpenditure / (stateData.districtCount || 1),
        }
      : null;
    
    // Calculate vs state average
    const vsStateAverage = stateAverage && stateAverage.workdaysGenerated > 0
      ? ((latestData.workdaysGenerated - stateAverage.workdaysGenerated) / stateAverage.workdaysGenerated) * 100
      : 0;

    const performanceCategory = getPerformanceCategory(vsStateAverage);

    const response = {
      district: {
        code: districtCode,
        name: districtDoc.districtName,
        stateCode: districtDoc.stateCode,
        stateName: districtDoc.stateName,
      },
      latest: {
        ...latestData,
        financialYear: latestData.financialYear,
        month: latestData.month,
        // Convert crores to actual amounts for display
        totalExpenditure: convertCroresToAmount(latestData.totalExpenditure),
        wageExpenditure: convertCroresToAmount(latestData.wageExpenditure),
        materialExpenditure: convertCroresToAmount(latestData.materialExpenditure),
        // Use aggregated totals if available
        totalPersonsWorked: aggregated?.totalPersonsWorked || latestData.personsWorked,
        totalHouseholdsWorked: aggregated?.totalHouseholdsWorked || latestData.householdsWorked,
        totalWorkdaysGenerated: aggregated?.totalWorkdaysGenerated || latestData.workdaysGenerated,
        averageWorkdaysPerPerson: aggregated?.averageWorkdaysPerPerson || latestData.workdaysPerPerson,
        totalWorksCompleted: aggregated?.totalWorksCompleted || latestData.worksCompleted,
        vsStateAverage,
        performanceCategory,
      },
      monthlyData: monthlyData.map((d) => ({
        financialYear: d.financialYear,
        month: d.month,
        year: d.year,
        personsWorked: d.personsWorked,
        householdsWorked: d.householdsWorked,
        workdaysGenerated: d.workdaysGenerated,
        workdaysPerPerson: d.workdaysPerPerson || (d.personsWorked > 0 ? d.workdaysGenerated / d.personsWorked : 0),
        totalExpenditure: convertCroresToAmount(d.totalExpenditure),
        worksCompleted: d.worksCompleted,
      })),
      trends,
      stateAverage: stateAverage
        ? {
            workdaysGenerated: stateAverage.workdaysGenerated,
            averageWorkdaysPerPerson: stateAverage.averageWorkdaysPerPerson,
            totalExpenditure: convertCroresToAmount(stateAverage.totalExpenditure),
          }
        : null,
      alerts: generateAlerts(latestData, stateAverage, vsStateAverage),
    };

    // Cache for 1 hour
    await setCache(cacheKey, response, 3600);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


function generateAlerts(latestData: any, stateAverage: any, vsStateAverage: number) {
  const alerts: any[] = [];

  if (!latestData) return alerts;

  // Check if below state average
  if (vsStateAverage < -10) {
    alerts.push({
      type: 'warning',
      message: 'This district is performing below the state average.',
      severity: vsStateAverage < -20 ? 'high' : 'medium',
    });
  }

  // Check if workdays are very low
  if (latestData.workdaysGenerated < 1000) {
    alerts.push({
      type: 'info',
      message: 'Workdays generated is relatively low this month.',
      severity: 'medium',
    });
  }

  // Performance category alerts
  const category = getPerformanceCategory(vsStateAverage);
  if (category === 'poor') {
    alerts.push({
      type: 'critical',
      message: 'District performance needs immediate attention.',
      severity: 'high',
    });
  }

  return alerts;
}
