import React, { useState } from 'react';
import { Place } from '../types';
import { MOCK_PLACES } from '../utils/constants';
import LeafletMap from '../components/maps/LeafletMap';
import SearchBar from '../components/common/SearchBar';
import PlaceCard from '../components/places/PlaceCard';
import { MapPin, X, Navigation } from 'lucide-react';

interface ExploreProps {
  favorites: string[];
  onFavoriteToggle: (id: string) => void;
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
}

export default function Explore({ 
  favorites, 
  onFavoriteToggle,
  selectedPlace,
  setSelectedPlace 
}: ExploreProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar locais no mapa
  const filteredPlaces = MOCK_PLACES.filter(place => {
    return place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
           place.address.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden text-slate-100">
      {/* MAPA EM TELA CHEIA */}
      <div className="absolute inset-0 z-0">
        <LeafletMap 
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          userLocation={null} // Pode ser estendido com a geolocalização do Capacitor futuramente
          onMarkerClick={(place) => setSelectedPlace(place)}
        />
      </div>

      {/* SEARCH BAR OVERLAY (Flutuando no Topo) */}
      <div className="absolute top-4 left-0 right-0 z-50 px-4 max-w-lg mx-auto">
        <div className="glass-card rounded-2xl border border-white/10 shadow-premium">
          <SearchBar 
            value={searchQuery} 
            onChange={(val) => {
              setSearchQuery(val);
              setSelectedPlace(null); // Limpa seleção ao buscar
            }} 
            placeholder="Pesquisar no mapa..."
          />
        </div>
      </div>

      {/* SELECIONADO PLACE DRAWER / CARD OVERLAY (Flutuando na parte inferior) */}
      {selectedPlace && (
        <div className="absolute bottom-20 left-0 right-0 z-50 px-4 pb-2 max-w-lg mx-auto animate-slide-up">
          <div className="relative">
            {/* Fechar botão */}
            <button
              onClick={() => setSelectedPlace(null)}
              className="absolute top-[-10px] right-3 z-50 flex items-center justify-center w-8 h-8 rounded-full bg-brand-indigo-900 border border-white/10 text-slate-300 hover:bg-brand-coral-500 hover:text-white transition-all btn-premium shadow-md"
            >
              <X className="w-4 h-4" />
            </button>
            
            <PlaceCard
              place={selectedPlace}
              isFavorited={favorites.includes(selectedPlace.id)}
              onFavoriteToggle={onFavoriteToggle}
            />
          </div>
        </div>
      )}
    </div>
  );
}
