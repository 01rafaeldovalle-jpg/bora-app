import React from 'react';
import { Place } from '../types';
import { MOCK_PLACES } from '../utils/constants';
import PlaceCard from '../components/places/PlaceCard';
import Header from '../components/common/Header';
import { Heart, Compass } from 'lucide-react';

interface FavoritesProps {
  favorites: string[];
  onFavoriteToggle: (id: string) => void;
  onSelectPlace: (place: Place) => void;
  setTab: (tab: 'home' | 'explore' | 'favorites' | 'profile') => void;
  activeCoords?: { lat: number; lng: number };
}

// Fórmula matemática de Haversine para distâncias em km
const getHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distância em km
};

export default function Favorites({ 
  favorites, 
  onFavoriteToggle,
  onSelectPlace,
  setTab,
  activeCoords
}: FavoritesProps) {
  // Obter apenas os locais que estão favoritados com a distância calculada
  const favoritedPlaces = React.useMemo(() => {
    const places = MOCK_PLACES.filter(place => favorites.includes(place.id));
    return places.map(place => {
      if (activeCoords) {
        const distance = getHaversineDistance(
          activeCoords.lat,
          activeCoords.lng,
          place.latitude,
          place.longitude
        );
        return { ...place, distance };
      }
      return place;
    });
  }, [favorites, activeCoords]);

  return (
    <div className="pb-24 text-slate-100 w-full flex flex-col items-center">
      <Header title="Meus Favoritos" showLocationSelector={false} />

      <div className="px-6 py-4 max-w-6xl mx-auto w-full">
        {favoritedPlaces.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {favoritedPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                isFavorited={true}
                onFavoriteToggle={onFavoriteToggle}
                onSelect={onSelectPlace}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-indigo-900/50 border border-white/5 flex items-center justify-center mb-4 text-brand-coral-500 animate-pulse">
              <Heart className="w-8 h-8 fill-brand-coral-500" />
            </div>
            
            <h3 className="text-lg font-outfit font-bold text-white mb-2">Nenhum favorito salvo</h3>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed mb-6">
              Marque locais incríveis de Curitiba com o coração para salvá-los aqui e planejar seu rolê com facilidade.
            </p>
            
            <button
              onClick={() => setTab('home')}
              className="flex items-center gap-2 bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-semibold text-xs px-6 h-11 rounded-2xl transition-all btn-premium shadow-md"
            >
              <Compass className="w-4 h-4" />
              <span>Explorar Locais</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
