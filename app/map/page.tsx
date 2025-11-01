'use client';

import { useState, useEffect } from 'react';
import DistrictMap from '@/components/DistrictMap';
import { useRouter } from 'next/navigation';
import Loading from '@/components/Loading';

export default function MapPage() {
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchDistricts();
  }, []);

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/map/districts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch districts');
      }
      
      const data = await response.json();
      console.log('Fetched districts data:', data); // Debug log
      
      if (!data.districts || !Array.isArray(data.districts)) {
        throw new Error('Invalid districts data format');
      }
      
      // Filter out districts without coordinates
      const districtsWithCoordinates = data.districts.filter(
        (district: any) => district.coordinates && 
        typeof district.coordinates.lat === 'number' && 
        typeof district.coordinates.lng === 'number'
      );
      
      console.log(`Found ${districtsWithCoordinates.length} districts with valid coordinates`);
      setDistricts(districtsWithCoordinates);
      
      if (districtsWithCoordinates.length === 0) {
        setError('No districts with valid coordinates found');
      } else {
        setError(null);
      }
    } catch (error: any) {
      console.error('Error fetching districts:', error);
      setError(error.message || 'Failed to load district data');
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictSelect = (districtCode: string) => {
    router.push(`/?district=${districtCode}`);
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-primary mb-2">
          District Map
        </h1>
        <p className="text-muted-foreground">
          Click on a district marker to view its performance dashboard
        </p>
      </header>

      {error && (
        <div className="p-4 mb-6 border border-red-300 bg-red-50 text-red-700 rounded-md">
          <p className="font-medium">Error: {error}</p>
          <button 
            onClick={fetchDistricts}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-sm"
          >
            Retry
          </button>
        </div>
      )}

      <div className="card overflow-hidden p-0">
        {districts.length > 0 ? (
          <DistrictMap
            districts={districts}
            onDistrictSelect={handleDistrictSelect}
          />
        ) : !error ? (
          <div className="h-[400px] bg-gray-100 flex items-center justify-center">
            <p className="text-muted-foreground">No district data available</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}
