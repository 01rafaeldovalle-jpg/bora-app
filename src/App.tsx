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

  // Carregar favoritos salvos do localStorage
  useEffect(() => {
    const savedFavs = localStorage.getItem('bora_favorites');
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
      localStorage.setItem('bora_favorites', JSON.stringify(updated));
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
          />
        );
      case 'explore':
        return (
          <Explore 
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
          />
        );
      case 'favorites':
        return (
          <Favorites 
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            onSelectPlace={handleSelectPlaceFromHome}
            setTab={setTab}
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
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between md:py-8 md:px-4 bg-gradient-to-br from-brand-indigo-950 to-slate-950 font-sans">
      <div className="w-full max-w-lg md:max-w-4xl mx-auto bg-brand-indigo-950/40 md:glass-card md:rounded-[36px] relative shadow-2xl min-h-screen md:min-h-[800px] border border-white/5 flex flex-col justify-between overflow-hidden">
        
        {/* Top Decorator for Desktop */}
        <div className="hidden md:flex justify-between items-center px-8 py-3 bg-brand-indigo-950/80 border-b border-white/5 text-white">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bora! Curitiba · Modo Desktop Inteligente</span>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/80"></div>
          </div>
        </div>

        {/* Content Tabs area */}
        <div className="flex-1 flex flex-col md:flex-row h-full">
          <main className="flex-1 w-full relative bg-brand-indigo-950/20 border-r border-white/5 pb-16 min-h-screen md:min-h-0 overflow-y-auto">
            {renderTabContent()}
          </main>

          {/* Persistent Desktop Map (Airbnb Style) */}
          <div className="hidden md:block md:w-[380px] lg:w-[450px] relative p-4 bg-brand-indigo-950/10">
            <div className="w-full h-full rounded-2xl overflow-hidden border border-white/5 shadow-inner bg-brand-indigo-950 flex flex-col items-center justify-center p-6 text-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-brand-indigo-900 border border-white/5 flex items-center justify-center mb-3 text-brand-coral-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
              </div>
              <h4 className="text-sm font-outfit font-bold text-white mb-1">Mapa de Curitiba</h4>
              <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
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

