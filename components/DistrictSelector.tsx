'use client';

import { useState, useEffect } from 'react';

interface District {
  districtCode: string;
  districtName: string;
  stateCode: string;
  stateName: string;
}

interface DistrictsResponse {
  districts: District[];
}

interface DistrictSelectorProps {
  onSelect: (districtCode: string) => void;
  selectedDistrict: string | null;
}

export default function DistrictSelector({ onSelect, selectedDistrict }: DistrictSelectorProps) {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>('');

  useEffect(() => {
    fetchDistricts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDistricts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/districts');
      if (!response.ok) throw new Error('Failed to fetch districts');
      const data: DistrictsResponse = await response.json();
      setDistricts(data.districts);
      
      // Group by state
      const states = Array.from(new Set(data.districts.map((d) => d.stateCode)));
      if (states.length > 0 && !selectedState) {
        setSelectedState(states[0]);
      }
    } catch (error) {
      console.error('Error fetching districts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDistricts = selectedState
    ? districts.filter((d) => d.stateCode === selectedState)
    : districts;

  const states = Array.from(new Set(districts.map((d) => d.stateCode)));

  if (loading) {
    return (
      <div className="w-full rounded-md border border-input bg-card p-3 text-sm text-muted-foreground animate-pulse">
        Loading districts...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative w-full">
          <label htmlFor="state-select" className="text-sm font-medium mb-1 block text-muted-foreground">
            State
          </label>
          <select
            id="state-select"
            className="select"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            {states.map((stateCode) => {
              const state = districts.find((d) => d.stateCode === stateCode);
              return (
                <option key={stateCode} value={stateCode}>
                  {state?.stateName || stateCode}
                </option>
              );
            })}
          </select>
        </div>
        
        <div className="relative w-full">
          <label htmlFor="district-select" className="text-sm font-medium mb-1 block text-muted-foreground">
            District
          </label>
          <select
            id="district-select"
            className="select"
            value={selectedDistrict || ''}
            onChange={(e) => onSelect(e.target.value)}
          >
            <option value="">Select a district...</option>
            {filteredDistricts.map((district) => (
              <option key={district.districtCode} value={district.districtCode}>
                {district.districtName}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {selectedDistrict && (
        <div className="flex items-center">
          <div className="h-2 w-2 rounded-full bg-secondary mr-2"></div>
          <p className="text-xs text-muted-foreground">
            Showing data for {filteredDistricts.find(d => d.districtCode === selectedDistrict)?.districtName || selectedDistrict}
          </p>
        </div>
      )}
    </div>
  );
}
