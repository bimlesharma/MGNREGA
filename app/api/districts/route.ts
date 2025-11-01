import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import District from '@/models/District';
import { getCached, setCache, invalidateCache } from '@/lib/redis';
import { getAppConfig } from '@/config/appConfig';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
  const stateCode = searchParams.get('stateCode') || getAppConfig().defaultStateCode;

    // Check cache
  const cacheKey = `districts:${stateCode || 'all'}`;
  const cached = await getCached(cacheKey);
  type DistrictCache = { districts?: any[] } | null;
  const cachedTyped = cached as DistrictCache;
    
    // Only use cache if it has districts (don't cache empty results)
    if (cachedTyped && cachedTyped.districts && cachedTyped.districts.length > 0) {
      return NextResponse.json(cachedTyped);
    }
    
    // If cached empty result, invalidate it
    if (cachedTyped && (!cachedTyped.districts || cachedTyped.districts.length === 0)) {
      await invalidateCache(cacheKey);
    }

    await connectDB();

  const query: any = {};
  if (stateCode) query.stateCode = stateCode;

    const districts = await District.find(query).sort({ districtName: 1 });

    if (districts.length === 0) {
      // If no districts found, check if this is cached (which might be wrong)
      console.warn(`No districts found in database${stateCode ? ` for state ${stateCode}` : ''}`);
      console.warn('Run "npm run populate-districts" to populate districts first');
    }

    const response = {
      districts: districts.map((d) => ({
        districtCode: d.districtCode,
        districtName: d.districtName,
        stateCode: d.stateCode,
        stateName: d.stateName,
        coordinates: d.coordinates,
      })),
      count: districts.length,
      message: districts.length === 0 ? 'No districts found. Run "npm run populate-districts" to populate districts.' : undefined,
    };

    // Cache for 24 hours (districts don't change often)
    // Only cache if we have districts (don't cache empty results)
    if (districts.length > 0) {
      await setCache(cacheKey, response, 86400);
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
