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
  const [viewMode, setViewMode] = useState<'swipe' | 'list'>('swipe');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lng: number }>({
    lat: -25.4290,
    lng: -49.2671
  });
  const [mapFilterFavoritesOnly, setMapFilterFavoritesOnly] = useState(false);
  const [isDesktopMapOpen, setIsDesktopMapOpen] = useState(true);
  const [searchRadius, setSearchRadius] = useState<number>(10.0);

  // Early theme initialization
  useEffect(() => {
    let savedTheme = localStorage.getItem('giro_theme');
    if (!savedTheme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      if (prefersDark) {
        savedTheme = 'dark';
      } else if (prefersLight) {
        savedTheme = 'light';
      } else {
        const hour = new Date().getHours();
        savedTheme = hour >= 6 && hour < 18 ? 'light' : 'dark';
      }
    }
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

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
    return base
      .map(place => {
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
      })
      .filter(place => {
        if (mapFilterFavoritesOnly) return true;
        if (!activeCoords || searchRadius === Infinity) return true;
        return (place.distance || 0) <= searchRadius;
      });
  }, [mapFilterFavoritesOnly, favorites, activeCoords, searchRadius]);

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
            viewMode={viewMode}
            setViewMode={setViewMode}
            onSelectPlace={handleSelectPlaceFromHome}
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            activeCoords={activeCoords}
            onPinClick={handlePinClick}
            searchRadius={searchRadius}
            setSearchRadius={setSearchRadius}
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
            searchRadius={searchRadius}
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
            viewMode={viewMode}
            setViewMode={setViewMode}
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
    <div className="h-dvh w-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-brand-indigo-950 dark:to-slate-950 font-sans overflow-hidden transition-colors duration-300">
      <main id="main-app-container" className="w-full h-full flex flex-col relative overflow-hidden bg-slate-50/50 dark:bg-brand-indigo-950/40 backdrop-blur-md">
        <div className={`flex-1 w-full relative bg-transparent pb-16 h-full flex flex-col min-h-0 ${
          (currentTab === 'home' && viewMode === 'swipe') || currentTab === 'explore'
            ? 'overflow-hidden'
            : 'overflow-y-auto'
        }`}>
          {renderTabContent()}
        </div>
        <BottomNavigation 
          currentTab={currentTab} 
          setTab={(tab) => {
            if (tab === 'home') {
              setViewMode('swipe');
            }
            setTab(tab);
          }} 
        />
      </main>
    </div>
  );
}
