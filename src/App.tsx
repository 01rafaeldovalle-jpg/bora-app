import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import BottomNavigation from './components/layout/BottomNavigation';
import { Place } from './types';
import LeafletMap from './components/maps/LeafletMap';
import { MOCK_PLACES } from './utils/constants';
import { ArrowLeft } from 'lucide-react';

type Tab = 'home' | 'explore' | 'favorites' | 'profile';

export default function App() {
  const [currentTab, setTab] = useState<Tab>('home');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lng: number }>({
    lat: -25.4290,
    lng: -49.2671
  });
  const [mapFilterFavoritesOnly, setMapFilterFavoritesOnly] = useState(false);
  const [isDesktopMapOpen, setIsDesktopMapOpen] = useState(true);

  // Reset filter when changing tabs to anything other than home or explore
  useEffect(() => {
    if (currentTab !== 'explore' && currentTab !== 'home') {
      setMapFilterFavoritesOnly(false);
    }
  }, [currentTab]);

  // Listen to go-home events from header logo click
  useEffect(() => {
    const handleGoHome = () => {
      setTab('home');
      setMapFilterFavoritesOnly(false);
      setSelectedPlace(null);
      window.dispatchEvent(new CustomEvent('giro-home-reset'));
    };

    window.addEventListener('giro-go-home', handleGoHome);
    return () => window.removeEventListener('giro-go-home', handleGoHome);
  }, []);

  // Haversine Distance helper
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

  const desktopPlaces = React.useMemo(() => {
    const base = mapFilterFavoritesOnly 
      ? MOCK_PLACES.filter(place => favorites.includes(place.id))
      : MOCK_PLACES;
    return base.map(place => {
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
  }, [mapFilterFavoritesOnly, favorites, activeCoords]);

  const handlePinClick = () => {
    setMapFilterFavoritesOnly(true);
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setTab('explore');
    } else {
      setIsDesktopMapOpen(true);
    }
  };

  const handleCloseSavedPins = () => {
    setMapFilterFavoritesOnly(false);
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setTab('home');
    } else {
      setIsDesktopMapOpen(false);
    }
  };

  // Ouvir o evento de alteração de localização customizado
  useEffect(() => {
    const handleLocationChange = (e: CustomEvent<{ lat: number; lng: number }>) => {
      if (e.detail && typeof e.detail.lat === 'number' && typeof e.detail.lng === 'number') {
        setActiveCoords({ lat: e.detail.lat, lng: e.detail.lng });
      }
    };

    window.addEventListener('giro-location-change' as any, handleLocationChange);
    return () => {
      window.removeEventListener('giro-location-change' as any, handleLocationChange);
    };
  }, []);

  // Carregar favoritos salvos do localStorage
  useEffect(() => {
    const savedFavs = localStorage.getItem('giro_favorites') || localStorage.getItem('bora_favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error('Erro ao carregar favoritos:', e);
      }
    }
  }, []);

  // Alternar favoritos
  const handleFavoriteToggle = (id: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(id) 
        ? prev.filter((favId) => favId !== id) 
        : [...prev, id];
      localStorage.setItem('giro_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Função para transição direta da Home para o Mapa (Explorar) ao clicar no card
  const handleSelectPlaceFromHome = (place: Place) => {
    setSelectedPlace(place);
    setTab('explore');
  };

  // Renderizar a tela com base na aba ativa
  const renderTabContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <Home 
            onSelectPlace={handleSelectPlaceFromHome}
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            activeCoords={activeCoords}
            onPinClick={handlePinClick}
          />
        );
      case 'explore':
        return (
          <Explore 
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            activeCoords={activeCoords}
            showOnlyFavoritesOnMap={mapFilterFavoritesOnly}
            onCloseOnlyFavorites={handleCloseSavedPins}
          />
        );
      case 'favorites':
        return (
          <Favorites 
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            onSelectPlace={handleSelectPlaceFromHome}
            setTab={setTab}
            activeCoords={activeCoords}
          />
        );
      case 'profile':
        return (
          <Profile 
            favoritesCount={favorites.length}
          />
        );
      default:
        return (
          <Home 
            onSelectPlace={handleSelectPlaceFromHome}
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            activeCoords={activeCoords}
            onPinClick={handlePinClick}
          />
        );
    }
  };

  return (
    <div className="h-dvh max-h-dvh md:h-screen md:min-h-screen flex flex-col justify-between md:py-8 md:px-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-brand-indigo-950 dark:to-slate-950 font-sans overflow-hidden transition-colors duration-300">
      <div className={`w-full ${isDesktopMapOpen ? 'max-w-lg md:max-w-4xl' : 'max-w-lg md:max-w-lg'} mx-auto bg-white/80 dark:bg-brand-indigo-950/40 md:shadow-lg md:rounded-[36px] relative shadow-2xl h-full md:h-auto md:min-h-[850px] border border-slate-200 dark:border-white/5 flex flex-col justify-between overflow-hidden transition-all duration-300`}>
        
        {/* Top Decorator for Desktop */}
        <div className="hidden md:flex justify-between items-center px-8 py-3 bg-slate-50 dark:bg-brand-indigo-950/80 border-b border-slate-200 dark:border-white/5 text-slate-800 dark:text-white transition-colors duration-300">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Giro Curitiba · Modo Desktop Inteligent</span>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
          </div>
        </div>

        {/* Content Tabs area */}
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
          <main className="flex-1 w-full relative bg-slate-50/20 dark:bg-brand-indigo-950/20 border-r border-slate-200 dark:border-white/5 pb-16 h-full md:min-h-0 overflow-y-auto transition-colors duration-300">
            {renderTabContent()}
          </main>

          {/* Persistent Desktop Map (Airbnb Style) */}
          {isDesktopMapOpen && (
            <div className="hidden md:block md:w-[380px] lg:w-[450px] relative p-4 bg-slate-100/50 dark:bg-brand-indigo-950/10 transition-colors duration-300 animate-fade-in">
              <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner bg-white dark:bg-brand-indigo-950 flex flex-col items-center justify-center transition-colors duration-300 relative">
                <LeafletMap 
                  places={desktopPlaces}
                  selectedPlace={selectedPlace}
                  userLocation={activeCoords ? { latitude: activeCoords.lat, longitude: activeCoords.lng } : null}
                  onMarkerClick={(place) => setSelectedPlace(place)}
                  fitBoundsOnChange={mapFilterFavoritesOnly}
                />
                
                {mapFilterFavoritesOnly && (
                  <div className="absolute top-8 left-8 right-8 z-[1000] animate-slide-up">
                    <button 
                      onClick={handleCloseSavedPins}
                      className="w-full h-11 bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-premium border border-white/10 btn-premium transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar para os Matches
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Mobile Navigation */}
        <BottomNavigation currentTab={currentTab} setTab={setTab} />
      </div>
    </div>
  );
}

