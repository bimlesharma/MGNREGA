import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import District from '@/models/District';

// Simple distance calculation (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    if (!lat || !lng || lat === 0 || lng === 0) {
      return NextResponse.json({ error: 'Valid lat and lng are required' }, { status: 400 });
    }

    await connectDB();

    // Get all districts with coordinates
    let districts = await District.find({
      coordinates: { $exists: true, $ne: null },
    });

    // If no districts have coordinates, try to use all districts and estimate based on state
    // This is a fallback - ideally districts should have coordinates
    if (districts.length === 0) {
      console.warn('No districts with coordinates found. Using fallback method.');
      
      // Get all districts
      const allDistricts = await District.find({});
      
      if (allDistricts.length === 0) {
        return NextResponse.json({ 
          error: 'No districts found in database',
          message: 'Please run ETL to populate district data first.'
        }, { status: 404 });
      }

      // Return the first district as fallback (not ideal, but better than error)
      // In production, you'd want to use a reverse geocoding API
      return NextResponse.json({
        district: {
          districtCode: allDistricts[0].districtCode,
          districtName: allDistricts[0].districtName,
          stateCode: allDistricts[0].stateCode,
          stateName: allDistricts[0].stateName,
        },
        distance: null,
        note: 'District coordinates not available. Please add coordinates to districts for accurate geolocation.',
      });
    }
    
    districts = districts;

    // Find nearest district
    let nearestDistrict = null;
    let minDistance = Infinity;

    for (const district of districts) {
      if (district.coordinates) {
        const distance = calculateDistance(
          lat,
          lng,
          district.coordinates.lat,
          district.coordinates.lng
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestDistrict = district;
        }
      }
    }

    if (!nearestDistrict) {
      return NextResponse.json({ error: 'Could not determine nearest district' }, { status: 404 });
    }

    return NextResponse.json({
      district: {
        districtCode: nearestDistrict.districtCode,
        districtName: nearestDistrict.districtName,
        stateCode: nearestDistrict.stateCode,
        stateName: nearestDistrict.stateName,
      },
      distance: parseFloat(minDistance.toFixed(2)),
    });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
