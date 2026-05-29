import React, { useState } from 'react';
import { Place, Category } from '../types';
import { CATEGORIES, MOCK_PLACES, MOCK_EVENTS } from '../utils/constants';
import PlaceCard from '../components/places/PlaceCard';
import Header from '../components/common/Header';
import SearchBar from '../components/common/SearchBar';
import * as Icons from 'lucide-react';
import { Calendar, Clock, MapPin, Sparkles, Flame, Check } from 'lucide-react';

// Helper dinâmico para renderizar ícones do Lucide por nome
const IconRenderer = ({ name, className }: { name: string; className: string }) => {
  const LucideIcon = (Icons as any)[name];
  if (!LucideIcon) return <Icons.HelpCircle className={className} />;
  return <LucideIcon className={className} />;
};

interface HomeProps {
  onSelectPlace: (place: Place) => void;
  favorites: string[];
  onFavoriteToggle: (id: string) => void;
  activeCoords?: { lat: number; lng: number };
  onPinClick?: () => void;
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

export default function Home({ onSelectPlace, favorites, onFavoriteToggle, activeCoords, onPinClick }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'swipe' | 'list'>('swipe');
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Injetar distâncias nos locais em tempo real
  const placesWithDistance = React.useMemo(() => {
    return MOCK_PLACES.map(place => {
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
  }, [activeCoords]);

  // Filtrar locais com base na busca e categoria selecionada e ordenar por proximidade
  const filteredPlaces = React.useMemo(() => {
    const filtered = placesWithDistance.filter(place => {
      const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            place.address.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? place.category_id === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });

    if (activeCoords) {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return filtered;
  }, [placesWithDistance, searchQuery, selectedCategory, activeCoords]);

  const featuredPlaces = React.useMemo(() => {
    const featured = placesWithDistance.filter(p => p.is_featured);
    if (activeCoords) {
      featured.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return featured;
  }, [placesWithDistance, activeCoords]);

  // Reset active card index when filter changes
  React.useEffect(() => {
    setActiveCardIndex(0);
  }, [searchQuery, selectedCategory]);

  // Listen to home reset events (e.g. from header logo click)
  React.useEffect(() => {
    const handleReset = () => {
      setSearchQuery('');
      setSelectedCategory(null);
      setViewMode('swipe');
      setActiveCardIndex(0);
    };

    window.addEventListener('giro-home-reset', handleReset);
    return () => window.removeEventListener('giro-home-reset', handleReset);
  }, []);

  const swipeQueue = filteredPlaces;
  const activePlace = swipeQueue[activeCardIndex] || null;
  const nextPlace = swipeQueue[(activeCardIndex + 1) % swipeQueue.length] || null;

  const handleSwipeLike = () => {
    if (!activePlace) return;
    onFavoriteToggle(activePlace.id);
    setActiveCardIndex((prev) => (prev + 1) % swipeQueue.length);
  };

  const handleSwipeNope = () => {
    if (!activePlace) return;
    setActiveCardIndex((prev) => (prev + 1) % swipeQueue.length);
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPinClick) {
      onPinClick();
    }
  };

  return (
    <div className="pb-24 text-slate-100">
      <Header />

      {/* Hero Header Banner */}
      <div className="px-6 py-4">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-brand-indigo-900 to-brand-indigo-950 border border-white/5 p-6 shadow-premium">
          {/* Background overlay shapes */}
          <div className="absolute top-[-30px] right-[-30px] w-48 h-48 rounded-full bg-brand-coral-500/10 blur-2xl" />
          <div className="absolute bottom-[-20px] left-[-20px] w-36 h-36 rounded-full bg-brand-teal-500/10 blur-2xl" />

          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 bg-brand-coral-500/20 text-brand-coral-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-brand-coral-500/30 mb-3">
              <Flame className="w-3.5 h-3.5 animate-pulse" /> Novidades de Curitiba
            </span>
            
            <h2 className="text-2xl font-outfit font-extrabold leading-tight text-white mb-2">
              Giro para encontrar o próximo rolê?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
              Locais, parques, cafés e experiências a um clique de distância, com rotas rápidas no celular.
            </p>
          </div>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="px-2">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Switch View Selectors */}
      <div className="px-6 py-2 flex justify-between items-center mt-2">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Descoberta Reativa</span>
        <div className="bg-brand-indigo-950/80 dark:bg-brand-indigo-950/40 border border-slate-200/50 dark:border-white/5 p-1 rounded-xl flex gap-1 shadow-inner transition-colors duration-300">
          <button 
            onClick={() => setViewMode('swipe')} 
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'swipe' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >
            <Flame className="w-3.5 h-3.5" /> Match
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'list' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'}`}
          >
            <Icons.List className="w-3.5 h-3.5" /> Lista
          </button>
        </div>
      </div>

      {/* Categorias Horizontal Slider */}
      <div className="py-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-6 mb-3">Categorias</h3>
        
        <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-none snap-x">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`snap-start shrink-0 flex items-center gap-2 h-10 px-4 rounded-2xl border transition-all btn-premium ${
              selectedCategory === null
                ? 'bg-brand-coral-500 border-brand-coral-500 text-white font-semibold shadow-md'
                : 'bg-brand-indigo-900/40 border-white/5 text-slate-300 hover:border-white/10'
            }`}
          >
            <span className="text-xs">Todos</span>
          </button>

          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
              className={`snap-start shrink-0 flex items-center gap-2 h-10 px-4 rounded-2xl border transition-all btn-premium ${
                selectedCategory === cat.id
                  ? 'bg-brand-coral-500 border-brand-coral-500 text-white font-semibold shadow-md'
                  : 'bg-brand-indigo-900/40 border-white/5 text-slate-300 hover:border-white/10'
              }`}
            >
              <IconRenderer name={cat.icon} className={`w-4 h-4 ${selectedCategory === cat.id ? 'text-white' : 'text-brand-teal-400'}`} />
              <span className="text-xs">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'swipe' ? (
        <div className="flex-1 flex flex-col justify-center items-center py-2 px-6 relative max-w-sm mx-auto animate-fade-in">
          {swipeQueue.length > 0 && activePlace ? (
            <div className="w-full flex flex-col items-center">
              {/* Card Container */}
              <div className="w-full relative h-[420px] select-none">
                {/* Background Card (Next Card) */}
                {swipeQueue.length > 1 && nextPlace && (
                  <div className="absolute inset-x-2 bottom-[-16px] h-full rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-brand-indigo-900/40 opacity-60 scale-[0.93] translate-y-4 -z-10 pointer-events-none flex flex-col shadow-lg">
                    <img src={nextPlace.image_url} alt={nextPlace.name} className="w-full h-full object-cover animate-pulse" />
                  </div>
                )}

                {/* Active Card */}
                <div 
                  onClick={() => onSelectPlace(activePlace)}
                  className="w-full h-full rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/5 bg-white dark:bg-brand-indigo-950 flex flex-col shadow-2xl relative cursor-pointer group active:scale-[0.99] transition-all duration-300"
                >
                  <img src={activePlace.image_url} alt={activePlace.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-indigo-950/90 via-brand-indigo-950/20 to-black/20" />

                  {/* Badges/Category */}
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-brand-indigo-950/80 backdrop-blur-xs border border-slate-200 dark:border-white/10 text-[10px] font-semibold text-brand-teal-600 dark:text-brand-teal-400 px-3 py-1 rounded-full uppercase tracking-wider">
                    {activePlace.price_range} · {activePlace.avg_rating.toFixed(1)} ★
                  </div>

                  {/* Place Info */}
                  <div className="absolute bottom-6 left-6 right-6 text-left">
                    <h3 className="text-xl font-outfit font-extrabold text-white mb-1.5 flex items-center gap-1.5 leading-tight">
                      {activePlace.name}
                    </h3>
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed mb-3">
                      {activePlace.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-300 font-medium">
                      <Icons.MapPin className="w-3.5 h-3.5 text-brand-coral-500 shrink-0" />
                      <span className="line-clamp-1">{activePlace.address}</span>
                      {activePlace.distance !== undefined && (
                        <span className="text-brand-teal-400 font-bold shrink-0">
                          • {activePlace.distance < 1 ? `${Math.round(activePlace.distance * 1000)} m` : `${activePlace.distance.toFixed(1)} km`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Swipe Control Buttons */}
              <div className="flex items-center justify-center gap-6 mt-10">
                <button 
                  onClick={handleSwipeNope}
                  className="w-14 h-14 rounded-full bg-white dark:bg-brand-indigo-900 border border-slate-200 dark:border-white/5 flex items-center justify-center text-brand-coral-500 shadow-lg hover:bg-brand-coral-500 hover:text-white hover:border-brand-coral-500 active:scale-90 transition-all"
                >
                  <Icons.X className="w-6 h-6" />
                </button>
                <button 
                  onClick={handlePinClick}
                  className="w-11 h-11 rounded-full bg-white dark:bg-brand-indigo-900 border border-slate-200 dark:border-white/5 flex items-center justify-center text-brand-teal-400 shadow-md hover:bg-brand-teal-500 hover:text-white hover:border-brand-teal-500 active:scale-90 transition-all"
                >
                  <Icons.MapPin className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleSwipeLike}
                  className="w-14 h-14 rounded-full bg-white dark:bg-brand-indigo-900 border border-slate-200 dark:border-white/5 flex items-center justify-center text-brand-teal-400 shadow-lg hover:bg-brand-teal-500 hover:text-white hover:border-brand-teal-500 active:scale-90 transition-all"
                >
                  <Icons.Heart className={`w-6 h-6 ${favorites.includes(activePlace.id) ? 'fill-brand-coral-500 text-brand-coral-500' : 'fill-transparent'}`} />
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-[32px] p-8 text-center border border-white/5 w-full">
              <div className="w-16 h-16 rounded-full bg-brand-indigo-900/50 border border-white/5 flex items-center justify-center mb-4 text-brand-coral-500 mx-auto">
                <Icons.Compass className="w-8 h-8 animate-spin-slow" />
              </div>
              <h3 className="text-lg font-outfit font-bold text-white mb-2">Sem locais nesta categoria</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed mx-auto">Selecione outra categoria ou limpe filtros para continuar combinando.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory(null);
                }}
                className="mt-4 text-xs font-semibold text-brand-coral-400 border border-brand-coral-500/20 px-4 py-2 rounded-full hover:bg-brand-coral-500/10 transition-all"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Seção Destaques (Apenas se nenhuma busca/filtro ativo) */}
          {!searchQuery && !selectedCategory && (
            <div className="py-2">
              <div className="flex items-center justify-between px-6 mb-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-brand-gold-400" /> Destaques em Destaque
                </h3>
              </div>
              
              <div className="flex gap-4 overflow-x-auto px-6 pb-4 scrollbar-none snap-x">
                {featuredPlaces.map((place) => (
                  <div key={place.id} className="snap-start shrink-0 w-[280px]">
                    <PlaceCard
                      place={place}
                      isFavorited={favorites.includes(place.id)}
                      onFavoriteToggle={onFavoriteToggle}
                      onSelect={onSelectPlace}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção Eventos Próximos de Curitiba */}
          {!searchQuery && !selectedCategory && (
            <div className="py-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-6 mb-3">Próximos Eventos</h3>
              
              <div className="flex flex-col gap-3 px-6">
                {MOCK_EVENTS.map((event) => (
                  <div 
                    key={event.id}
                    className="glass-card rounded-2xl p-4 flex gap-4 border border-white/5 items-center hover:border-brand-coral-500/20 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    <img 
                      src={event.image_url} 
                      alt={event.name} 
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-brand-indigo-950" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-outfit font-bold text-white tracking-tight line-clamp-1">{event.name}</h4>
                      <p className="text-[11px] text-slate-300 line-clamp-1 mt-0.5">{event.description}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-brand-coral-500" /> Dom, 09h - 14h
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-brand-teal-400" /> Largo da Ordem
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista Principal de Locais */}
          <div className="py-4 px-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              {searchQuery || selectedCategory ? 'Resultados da Busca' : 'Todos os Locais'}
            </h3>
            
            {filteredPlaces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredPlaces.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    isFavorited={favorites.includes(place.id)}
                    onFavoriteToggle={onFavoriteToggle}
                    onSelect={onSelectPlace}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-8 text-center border border-white/5">
                <p className="text-sm text-slate-400">Nenhum local encontrado para a sua seleção.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="mt-4 text-xs font-semibold text-brand-coral-400 border border-brand-coral-500/20 px-4 py-2 rounded-full hover:bg-brand-coral-500/10 transition-all"
                >
                  Limpar Filtros
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
