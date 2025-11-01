'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Leaflet to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), {
  ssr: false,
});
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), {
  ssr: false,
});
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});

interface DistrictMapProps {
  districts?: Array<{
    districtCode: string;
    districtName: string;
    stateName?: string;
    coordinates?: { lat: number; lng: number };
  }>;
  selectedDistrict?: string;
  onDistrictSelect?: (districtCode: string) => void;
}

export default function DistrictMap({ districts = [], selectedDistrict, onDistrictSelect }: DistrictMapProps) {
  const [mounted, setMounted] = useState(false);
  const [markerIcon, setMarkerIcon] = useState<any>(null);

  useEffect(() => {
    // Import Leaflet CSS on client side
    // import('leaflet/dist/leaflet.css');
    
    // Fix marker icon issue - only run in browser
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        const icon = L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        });
        
        setMarkerIcon(icon);
        setMounted(true);
        console.log('Districts data in map component:', districts);
      });
    }
  }, [districts]);

  if (!mounted || typeof window === 'undefined') {
    return (
      <div className="h-[400px] bg-gray-100 flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  // Default center to India
  const center: [number, number] = [20.5937, 78.9629];
  
  // If districts have coordinates, center on first one
  const districtsWithCoords = districts.filter(
    (d) => d.coordinates && 
    typeof d.coordinates.lat === 'number' && 
    typeof d.coordinates.lng === 'number'
  );
  
  console.log(`Rendering map with ${districtsWithCoords.length} districts with coordinates`);
  
  const mapCenter = districtsWithCoords.length > 0
    ? [districtsWithCoords[0].coordinates!.lat, districtsWithCoords[0].coordinates!.lng] as [number, number]
    : center;

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden">
      <MapContainer
        center={mapCenter}
        zoom={districtsWithCoords.length > 0 ? 7 : 5}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markerIcon && districtsWithCoords.map((district) => (
          <Marker
            key={district.districtCode}
            position={[district.coordinates!.lat, district.coordinates!.lng]}
            icon={markerIcon}
            eventHandlers={{
              click: () => {
                if (onDistrictSelect) {
                  onDistrictSelect(district.districtCode);
                }
              },
            }}
          >
            <Popup>
              <div className="p-1">
                <strong className="text-primary">{district.districtName}</strong>
                {district.stateName && (
                  <p className="text-sm text-muted-foreground">{district.stateName}</p>
                )}
                {onDistrictSelect && (
                  <button
                    className="button-primary mt-2 text-xs py-1 px-2 w-full"
                    onClick={() => onDistrictSelect(district.districtCode)}
                  >
                    View Dashboard
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <style jsx global>{`
        .leaflet-container {
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
}
