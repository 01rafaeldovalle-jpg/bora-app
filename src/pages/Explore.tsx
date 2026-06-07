import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { MOCK_PLACES } from '../utils/constants';
import LeafletMap from '../components/maps/LeafletMap';
import SearchBar from '../components/common/SearchBar';
import PlaceCard from '../components/places/PlaceCard';
import { MapPin, X, Navigation, ArrowLeft } from 'lucide-react';
import { getLanguage, t } from '../utils/i18n';

interface ExploreProps {
  favorites: string[];
  onFavoriteToggle: (id: string) => void;
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
  activeCoords?: { lat: number; lng: number };
  showOnlyFavoritesOnMap?: boolean;
  onCloseOnlyFavorites?: () => void;
  searchRadius?: number;
}

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

export default function Explore({ 
  favorites, 
  onFavoriteToggle,
  selectedPlace,
  setSelectedPlace,
  activeCoords,
  showOnlyFavoritesOnMap = false,
  onCloseOnlyFavorites,
  searchRadius
}: ExploreProps) {
  const [lang, setLangState] = useState(getLanguage());
  useEffect(() => {
    const handleLang = (e: any) => setLangState(e.detail.lang);
    window.addEventListener('giro-language-change', handleLang);
    return () => window.removeEventListener('giro-language-change', handleLang);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');

  // Filtrar locais no mapa
  const filteredPlaces = React.useMemo(() => {
    const basePlaces = showOnlyFavoritesOnMap
      ? MOCK_PLACES.filter(place => favorites.includes(place.id))
      : MOCK_PLACES;

    return basePlaces.filter(place => {
      const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            place.address.toLowerCase().includes(searchQuery.toLowerCase());
      if (showOnlyFavoritesOnMap) return matchesSearch;
      const matchesRadius = (!activeCoords || searchRadius === undefined || searchRadius === Infinity)
        ? true
        : getHaversineDistance(activeCoords.lat, activeCoords.lng, place.latitude, place.longitude) <= searchRadius;
      return matchesSearch && matchesRadius;
    });
  }, [searchQuery, showOnlyFavoritesOnMap, favorites, activeCoords, searchRadius]);

  // Injetar distâncias nos locais do mapa
  const placesWithDistance = React.useMemo(() => {
    return filteredPlaces.map(place => {
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
  }, [filteredPlaces, activeCoords]);

  // Se selecionadoPlace existe, também calculamos a distância dele
  const selectedPlaceWithDistance = React.useMemo(() => {
    if (!selectedPlace) return null;
    if (activeCoords) {
      const distance = getHaversineDistance(
        activeCoords.lat,
        activeCoords.lng,
        selectedPlace.latitude,
        selectedPlace.longitude
      );
      return { ...selectedPlace, distance };
    }
    return selectedPlace;
  }, [selectedPlace, activeCoords]);

  return (
    <div className="relative w-full h-full overflow-hidden text-slate-100">
      {/* MAPA EM TELA CHEIA */}
      <div className="absolute inset-0 z-0">
        <LeafletMap 
          places={placesWithDistance}
          selectedPlace={selectedPlaceWithDistance}
          userLocation={activeCoords ? { latitude: activeCoords.lat, longitude: activeCoords.lng } : null}
          onMarkerClick={(place) => setSelectedPlace(place)}
          fitBoundsOnChange={showOnlyFavoritesOnMap}
        />
      </div>

      {/* SEARCH BAR OVERLAY (Flutuando no Topo) */}
      <div className="absolute top-4 left-0 right-0 z-50 px-4 max-w-lg mx-auto flex flex-col gap-3">
        <div className="glass-card rounded-2xl border border-white/10 shadow-premium">
          <SearchBar 
            value={searchQuery} 
            onChange={(val) => {
              setSearchQuery(val);
              setSelectedPlace(null); // Limpa seleção ao buscar
            }} 
            placeholder={t('search_on_map')}
          />
        </div>

        {showOnlyFavoritesOnMap && onCloseOnlyFavorites && (
          <button 
            onClick={onCloseOnlyFavorites}
            className="w-full h-11 bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-premium border border-white/10 btn-premium transition-all animate-fade-in"
          >
            <ArrowLeft className="w-4 h-4" /> {t('home_back_matches')}
          </button>
        )}
      </div>

      {/* SELECIONADO PLACE DRAWER / CARD OVERLAY (Flutuando na parte inferior) */}
      {selectedPlace && (
        <div className="absolute bottom-20 left-0 right-0 z-50 px-4 pb-2 max-w-lg mx-auto animate-slide-up">
          <PlaceCard
            place={selectedPlaceWithDistance || selectedPlace}
            isFavorited={favorites.includes(selectedPlace.id)}
            onFavoriteToggle={onFavoriteToggle}
            onClose={() => setSelectedPlace(null)}
          />
        </div>
      )}
    </div>
  );
}
