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
}

export default function Favorites({ 
  favorites, 
  onFavoriteToggle,
  onSelectPlace,
  setTab
}: FavoritesProps) {
  // Obter apenas os locais que estão favoritados
  const favoritedPlaces = MOCK_PLACES.filter(place => favorites.includes(place.id));

  return (
    <div className="min-h-screen pb-24 text-slate-100">
      <Header title="Meus Favoritos" showLocationSelector={false} />

      <div className="px-6 py-4">
        {favoritedPlaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
