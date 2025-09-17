import { useState, useEffect } from 'react';
import { PharmacyMap } from './PharmacyMap';
import { PharmacyList } from './PharmacyList';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Navigation, 
  Shield, 
  Clock, 
  Phone,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';
import pharmaciesData from '@/data/pharmacies.json';

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

export const PharmacyLocator = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>(pharmaciesData);
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const { toast } = useToast();

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get user's current location
  const getUserLocation = () => {
    setIsLoading(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        
        // Calculate distances and sort pharmacies
        const updatedPharmacies = pharmacies.map(pharmacy => ({
          ...pharmacy,
          distance: calculateDistance(latitude, longitude, pharmacy.lat, pharmacy.lng)
        })).sort((a, b) => a.distance - b.distance);
        
        setPharmacies(updatedPharmacies);
        setIsLoading(false);
        
        toast({
          title: "Location found!",
          description: `Found ${updatedPharmacies.length} nearby pharmacies.`,
        });
      },
      (error) => {
        setIsLoading(false);
        let errorMessage = "Unable to get your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location Error",
          description: errorMessage,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Find nearest pharmacy
  const findNearest = () => {
    if (pharmacies.length > 0) {
      const nearest = pharmacies[0];
      setSelectedPharmacy(nearest);
      setShowSidebar(true);
      
      toast({
        title: "Nearest pharmacy found!",
        description: `${nearest.name} - ${nearest.distance.toFixed(1)}km away`,
      });
    }
  };

  // Emergency call function
  const callEmergency = () => {
    window.open('tel:108', '_self'); // Indian emergency number
  };

  useEffect(() => {
    // Auto-get location on component mount
    const timer = setTimeout(() => {
      getUserLocation();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const nearestPharmacy = pharmacies.length > 0 ? pharmacies[0] : null;

  return (
    <div className="h-screen w-full flex flex-col bg-background">
      {/* Header */}
      <header className="bg-gradient-medical text-white shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Indore PharmaFind</h1>
                <p className="text-white/80 text-sm">24/7 Emergency Pharmacy Locator</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="emergency"
                size="sm"
                onClick={callEmergency}
                className="hidden md:flex"
              >
                <Phone className="w-4 h-4 mr-1" />
                Emergency: 108
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(!showSidebar)}
                className="md:hidden text-white hover:bg-white/20"
              >
                {showSidebar ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions Bar */}
      <div className="bg-white border-b shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 overflow-x-auto">
            <Button
              variant={isLoading ? "secondary" : "medical"}
              size="sm"
              onClick={getUserLocation}
              disabled={isLoading}
            >
              <Navigation className="w-4 h-4 mr-1" />
              {isLoading ? "Finding..." : "Find My Location"}
            </Button>
            
            {nearestPharmacy && (
              <Button
                variant="outline"
                size="sm"
                onClick={findNearest}
              >
                <MapPin className="w-4 h-4 mr-1" />
                Nearest: {nearestPharmacy.name}
              </Button>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 text-medical-green" />
              <span>All pharmacies verified 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Map */}
        <div className="flex-1 relative">
          <PharmacyMap
            pharmacies={pharmacies}
            selectedPharmacy={selectedPharmacy}
            onPharmacySelect={(pharmacy) => {
              setSelectedPharmacy(pharmacy);
              setShowSidebar(true);
            }}
            userLocation={userLocation}
          />
          
          {/* Mobile overlay info */}
          {selectedPharmacy && (
            <Card className="absolute bottom-4 left-4 right-4 md:hidden bg-white/95 backdrop-blur-sm shadow-lg">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{selectedPharmacy.name}</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedPharmacy(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{selectedPharmacy.address}</p>
                <div className="flex gap-2">
                  <Button
                    variant="medical"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(selectedPharmacy.mapUrl, '_blank')}
                  >
                    <Navigation className="w-4 h-4 mr-1" />
                    Directions
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`tel:${selectedPharmacy.phone}`, '_self')}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className={`
          ${showSidebar ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          fixed md:relative top-0 right-0 h-full w-full md:w-96 bg-white shadow-xl
          transform transition-transform duration-300 ease-in-out z-20 md:z-0
          flex flex-col
        `}>
          <PharmacyList
            pharmacies={pharmacies}
            onPharmacySelect={(pharmacy) => {
              setSelectedPharmacy(pharmacy);
              if (window.innerWidth < 768) {
                setShowSidebar(false);
              }
            }}
            selectedPharmacy={selectedPharmacy}
          />
        </div>

        {/* Mobile backdrop */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-10 md:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </div>

      {/* Footer info */}
      <div className="bg-muted/50 border-t px-4 py-2 text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>All pharmacies open 24/7</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>Verified locations</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="w-3 h-3" />
            <span>Emergency: 108</span>
          </div>
        </div>
      </div>
    </div>
  );
};