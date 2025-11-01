'use client';

import { useState } from 'react';

interface GeolocationButtonProps {
  onSuccess: (districtCode: string) => void;
  onError: (message: string) => void;
}

export default function GeolocationButton({ onSuccess, onError }: GeolocationButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      onError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `/api/geolocation?lat=${latitude}&lng=${longitude}`
          );

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || 'Failed to detect district');
          }

          const data = await response.json();
          
          if (!data.district || !data.district.districtCode) {
            throw new Error('Invalid response from geolocation service');
          }
          
          if (data.note) {
            console.warn('Geolocation note:', data.note);
          }
          
          onSuccess(data.district.districtCode);
        } catch (error: any) {
          onError(error.message || 'Failed to detect your district');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        onError('Unable to access your location. Please enable location services.');
        setLoading(false);
      }
    );
  };

  return (
    <button
      className="button-secondary w-full flex items-center justify-center gap-2"
      onClick={handleGeolocation}
      disabled={loading}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Detecting...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          Use My Location
        </>
      )}
    </button>
  );
}
