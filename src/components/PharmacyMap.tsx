import { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, Phone, Star } from 'lucide-react';
import pharmacyMarker from '@/assets/pharmacy-marker.png';

interface Pharmacy {
  id: number;
  name: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  verified24x7: boolean;
  rating: number;
  distance: number;
  mapUrl: string;
}

interface PharmacyMapProps {
  pharmacies: Pharmacy[];
  selectedPharmacy: Pharmacy | null;
  onPharmacySelect: (pharmacy: Pharmacy) => void;
  userLocation: [number, number] | null;
}

export const PharmacyMap = ({ pharmacies, selectedPharmacy, onPharmacySelect, userLocation }: PharmacyMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Custom pharmacy marker icon
  const pharmacyIcon = L.icon({
    iconUrl: pharmacyMarker,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
    className: 'pharmacy-marker'
  });

  // User location marker icon
  const userIcon = L.divIcon({
    html: '<div class="user-location-marker"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    className: 'user-marker-container'
  });

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map centered on Indore
    const map = L.map(mapRef.current, {
      center: [22.7196, 75.8577], // Indore coordinates
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add custom CSS for user location marker
    const style = document.createElement('style');
    style.textContent = `
      .user-location-marker {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, hsl(200 98% 39%), hsl(180 94% 37%));
        border: 3px solid white;
        box-shadow: 0 0 10px rgba(0, 174, 255, 0.5);
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(0, 174, 255, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(0, 174, 255, 0); }
        100% { box-shadow: 0 0 0 0 rgba(0, 174, 255, 0); }
      }
      
      .pharmacy-marker {
        filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
        transition: all 0.3s ease;
      }
      
      .pharmacy-marker:hover {
        filter: drop-shadow(0 4px 8px rgba(0, 174, 255, 0.4));
        transform: scale(1.1);
      }
    `;
    document.head.appendChild(style);

    return () => {
      map.remove();
      document.head.removeChild(style);
    };
  }, []);

  // Add/update pharmacy markers
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add pharmacy markers
    pharmacies.forEach(pharmacy => {
      const marker = L.marker([pharmacy.lat, pharmacy.lng], { 
        icon: pharmacyIcon,
        title: pharmacy.name
      });

      const popupContent = `
        <div class="pharmacy-popup">
          <div class="flex items-center gap-2 mb-2">
            <div class="flex items-center gap-1 text-emergency-red text-sm font-semibold">
              <span class="w-2 h-2 bg-emergency-red rounded-full animate-pulse"></span>
              24/7 OPEN
            </div>
          </div>
          <h3 class="font-semibold text-lg mb-1">${pharmacy.name}</h3>
          <div class="flex items-center gap-1 mb-2">
            <div class="flex items-center">
              ${Array.from({ length: 5 }, (_, i) => 
                `<span class="text-yellow-400">${i < Math.floor(pharmacy.rating) ? '★' : '☆'}</span>`
              ).join('')}
            </div>
            <span class="text-sm text-muted-foreground">(${pharmacy.rating})</span>
          </div>
          <p class="text-sm text-muted-foreground mb-2">${pharmacy.address}</p>
          <div class="flex items-center gap-2 mb-3">
            <span class="text-sm">${pharmacy.phone}</span>
          </div>
          <button 
            onclick="window.open('${pharmacy.mapUrl}', '_blank')"
            class="w-full bg-gradient-medical text-white py-2 px-4 rounded-md hover:shadow-medical transition-all"
          >
            Get Directions
          </button>
        </div>
      `;

      marker.bindPopup(popupContent, {
        maxWidth: 280,
        className: 'custom-popup'
      });

      marker.on('click', () => {
        onPharmacySelect(pharmacy);
      });

      marker.addTo(mapInstanceRef.current!);
      markersRef.current.push(marker);
    });
  }, [pharmacies, onPharmacySelect]);

  // Add/update user location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;

    // Remove existing user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Add user location marker
    const userMarker = L.marker(userLocation, { 
      icon: userIcon,
      title: 'Your Location'
    });

    userMarker.bindPopup(`
      <div class="text-center p-2">
        <div class="font-semibold mb-1">Your Location</div>
        <div class="text-sm text-muted-foreground">We'll help you find the nearest pharmacy</div>
      </div>
    `);

    userMarker.addTo(mapInstanceRef.current);
    userMarkerRef.current = userMarker;
  }, [userLocation]);

  // Highlight selected pharmacy
  useEffect(() => {
    if (!selectedPharmacy || !mapInstanceRef.current) return;

    const selectedMarker = markersRef.current.find((marker, index) => 
      pharmacies[index]?.id === selectedPharmacy.id
    );

    if (selectedMarker) {
      mapInstanceRef.current.setView([selectedPharmacy.lat, selectedPharmacy.lng], 15);
      selectedMarker.openPopup();
    }
  }, [selectedPharmacy, pharmacies]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden shadow-card-custom" />
      
      {/* Custom popup styles */}
      <style>{`
        .leaflet-popup-content-wrapper {
          background: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border-radius: 8px;
          box-shadow: var(--shadow-card);
        }
        
        .leaflet-popup-tip {
          background: hsl(var(--card));
        }
        
        .pharmacy-popup h3 {
          color: hsl(var(--medical-blue));
        }
        
        .custom-popup .leaflet-popup-content {
          margin: 12px;
        }
      `}</style>
    </div>
  );
};