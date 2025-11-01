'use client';

import { useState } from 'react';
import DistrictDashboard from '@/components/DistrictDashboard';
import DistrictSelector from '@/components/DistrictSelector';
import GeolocationButton from '@/components/GeolocationButton';
import Loading from '@/components/Loading';

export default function Home() {
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDistrictSelect = (districtCode: string) => {
    setSelectedDistrict(districtCode);
    setError(null);
  };

  const handleGeolocationSuccess = (districtCode: string) => {
    setSelectedDistrict(districtCode);
    setError(null);
  };

  const handleGeolocationError = (message: string) => {
    setError(message);
  };

  return (
    <main className="container py-8">
      <header className="mb-8 pb-4 border-b">
        <h1 className="text-3xl font-bold gradient-text mb-2">
          MGNREGA District Performance
        </h1>
        <p className="text-muted-foreground">
          View and understand monthly MGNREGA district performance data
        </p>
      </header>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-8">
            <DistrictSelector
              onSelect={handleDistrictSelect}
              selectedDistrict={selectedDistrict}
            />
          </div>
          <div className="md:col-span-4 flex justify-center">
            <GeolocationButton
              onSuccess={handleGeolocationSuccess}
              onError={handleGeolocationError}
            />
          </div>
          {/* <div className="md:col-span-2 flex justify-center">
            <a href="/map" className="button-primary w-full justify-center">
              <span className="mr-2">🗺️</span> View Map
            </a>
          </div> */}
        </div>
      </div>

      {loading && <Loading />}

      {selectedDistrict && !loading && (
        <DistrictDashboard districtCode={selectedDistrict} />
      )}

      {!selectedDistrict && !loading && (
        <div className="card glass glass-hover animate-pulse">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-lg text-card-foreground">
              Please select a district or use geolocation to view performance data
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              The dashboard will display detailed metrics once a district is selected
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
