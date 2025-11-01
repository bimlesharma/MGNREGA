'use client';

import { useEffect } from 'react';

export default function MapLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Import Leaflet CSS dynamically
    import('leaflet/dist/leaflet.css');
  }, []);

  return <>{children}</>;
}
