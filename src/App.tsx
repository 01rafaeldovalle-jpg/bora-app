import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import BottomNavigation from './components/layout/BottomNavigation';
import { Place } from './types';

type Tab = 'home' | 'explore' | 'favorites' | 'profile';

export default function App() {
  const [currentTab, setTab] = useState<Tab>('home');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lng: number }>({
    lat: -25.4290,
    lng: -49.2671
  });

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
          />
        );
    }
  };

  return (
    <div className="h-dvh max-h-dvh md:h-screen md:min-h-screen flex flex-col justify-between md:py-8 md:px-4 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-brand-indigo-950 dark:to-slate-950 font-sans overflow-hidden transition-colors duration-300">
      <div className="w-full max-w-lg md:max-w-4xl mx-auto bg-white/80 dark:bg-brand-indigo-950/40 md:shadow-lg md:rounded-[36px] relative shadow-2xl h-full md:h-auto md:min-h-[850px] border border-slate-200 dark:border-white/5 flex flex-col justify-between overflow-hidden transition-colors duration-300">
        
        {/* Top Decorator for Desktop */}
        <div className="hidden md:flex justify-between items-center px-8 py-3 bg-slate-50 dark:bg-brand-indigo-950/80 border-b border-slate-200 dark:border-white/5 text-slate-800 dark:text-white transition-colors duration-300">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Giro Curitiba · Modo Desktop Inteligente</span>
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
          <div className="hidden md:block md:w-[380px] lg:w-[450px] relative p-4 bg-slate-100/50 dark:bg-brand-indigo-950/10 transition-colors duration-300">
            <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-inner bg-white dark:bg-brand-indigo-950 flex flex-col items-center justify-center p-6 text-center text-slate-500 dark:text-slate-400 transition-colors duration-300">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-brand-indigo-900 border border-slate-200 dark:border-white/5 flex items-center justify-center mb-3 text-brand-coral-500 transition-colors duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              </div>
              <h4 className="text-sm font-outfit font-bold text-slate-800 dark:text-white mb-1 transition-colors duration-300">Mapa de Curitiba</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed transition-colors duration-300">
                Navegue pelas abas ao lado e selecione os locais para ver as posições em tempo real.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Mobile Navigation */}
        <BottomNavigation currentTab={currentTab} setTab={setTab} />
      </div>
    </div>
  );
}

