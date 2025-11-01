import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import District from '@/models/District';
import { getCached, setCache } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stateCode = searchParams.get('stateCode');

    // Check cache
    const cacheKey = `map:districts:${stateCode || 'all'}`;
    const cached = await getCached(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    await connectDB();

    const query: any = {};
    if (stateCode) query.stateCode = stateCode;

    const districts = await District.find({
      ...query,
      coordinates: { $exists: true, $ne: null },
    }).sort({ districtName: 1 });

    const response = {
      districts: districts.map((d) => ({
        districtCode: d.districtCode,
        districtName: d.districtName,
        stateCode: d.stateCode,
        stateName: d.stateName,
        coordinates: d.coordinates,
      })),
    };

    // Cache for 24 hours
    await setCache(cacheKey, response, 86400);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
