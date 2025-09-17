import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Phone, Navigation, Star, Clock } from 'lucide-react';

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

interface PharmacyListProps {
  pharmacies: Pharmacy[];
  onPharmacySelect: (pharmacy: Pharmacy) => void;
  selectedPharmacy: Pharmacy | null;
}

export const PharmacyList = ({ pharmacies, onPharmacySelect, selectedPharmacy }: PharmacyListProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPharmacies = pharmacies.filter(pharmacy =>
    pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pharmacy.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPharmacies = [...filteredPharmacies].sort((a, b) => a.distance - b.distance);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="bg-gradient-medical p-4 text-white">
        <h2 className="text-xl font-bold mb-2">24/7 Pharmacies in Indore</h2>
        <p className="text-white/80 text-sm">Always open when you need them most</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search pharmacies or areas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 bg-secondary/50 text-sm text-muted-foreground">
        {sortedPharmacies.length} pharmacies found
      </div>

      {/* Pharmacy list */}
      <div className="flex-1 overflow-y-auto">
        {sortedPharmacies.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No pharmacies found matching your search.</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {sortedPharmacies.map((pharmacy) => (
              <Card
                key={pharmacy.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-medical ${
                  selectedPharmacy?.id === pharmacy.id
                    ? 'ring-2 ring-medical-blue shadow-medical'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => onPharmacySelect(pharmacy)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground">{pharmacy.name}</h3>
                        {pharmacy.verified24x7 && (
                          <Badge className="bg-emergency-red text-white text-xs px-2 py-1">
                            <Clock className="w-3 h-3 mr-1" />
                            24/7
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex items-center">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(pharmacy.rating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">({pharmacy.rating})</span>
                      </div>
                      
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{pharmacy.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="medical"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(pharmacy.mapUrl, '_blank');
                      }}
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Directions
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`tel:${pharmacy.phone}`, '_self');
                      }}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};