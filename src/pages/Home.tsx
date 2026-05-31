import React, { useState } from 'react';
import { Place, Category } from '../types';
import { CATEGORIES, MOCK_PLACES, MOCK_EVENTS } from '../utils/constants';
import PlaceCard from '../components/places/PlaceCard';
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
  viewMode: 'swipe' | 'list';
  setViewMode: (mode: 'swipe' | 'list') => void;
  onSelectPlace: (place: Place) => void;
  favorites: string[];
  onFavoriteToggle: (id: string) => void;
  activeCoords?: { lat: number; lng: number };
  onPinClick?: () => void;
  searchRadius?: number;
  setSearchRadius?: (radius: number) => void;
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

export default function Home({ 
  viewMode,
  setViewMode,
  onSelectPlace, 
  favorites, 
  onFavoriteToggle, 
  activeCoords, 
  onPinClick,
  searchRadius,
  setSearchRadius
}: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // Refs de Swipe Físico
  const cardRef = React.useRef<HTMLDivElement>(null);
  const badgeLikeRef = React.useRef<HTMLDivElement>(null);
  const badgeNopeRef = React.useRef<HTMLDivElement>(null);
  const startXRef = React.useRef(0);
  const currentXRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);

  const getX = (e: any) => {
    return e.touches ? e.touches[0].clientX : e.clientX;
  };

  const handleDragStart = (e: any) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    startXRef.current = getX(e);
    currentXRef.current = startXRef.current;
    isDraggingRef.current = true;
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
  };

  const handleDragMove = (e: any) => {
    if (!isDraggingRef.current) return;
    const card = cardRef.current;
    const badgeLike = badgeLikeRef.current;
    const badgeNope = badgeNopeRef.current;
    if (!card) return;

    currentXRef.current = getX(e);
    const deltaX = currentXRef.current - startXRef.current;
    const rotation = deltaX * 0.08;

    card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;

    if (badgeLike && badgeNope) {
      if (deltaX > 20) {
        badgeLike.style.opacity = String(Math.min(deltaX / 100, 1));
        badgeNope.style.opacity = '0';
      } else if (deltaX < -20) {
        badgeNope.style.opacity = String(Math.min(Math.abs(deltaX) / 100, 1));
        badgeLike.style.opacity = '0';
      } else {
        badgeLike.style.opacity = '0';
        badgeNope.style.opacity = '0';
      }
    }
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const card = cardRef.current;
    const badgeLike = badgeLikeRef.current;
    const badgeNope = badgeNopeRef.current;
    if (!card) return;

    const deltaX = currentXRef.current - startXRef.current;
    const threshold = 120;

    card.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease';

    if (deltaX > threshold) {
      card.style.transform = 'translateX(400px) rotate(45deg)';
      card.style.opacity = '0';
      setTimeout(() => {
        if (activePlace) {
          onFavoriteToggle(activePlace.id);
        }
        setActiveCardIndex((prev) => (prev + 1) % swipeQueue.length);
        resetCardStyles();
      }, 300);
    } else if (deltaX < -threshold) {
      card.style.transform = 'translateX(-400px) rotate(-45deg)';
      card.style.opacity = '0';
      setTimeout(() => {
        setActiveCardIndex((prev) => (prev + 1) % swipeQueue.length);
        resetCardStyles();
      }, 300);
    } else {
      card.style.transform = 'translateX(0) rotate(0)';
      if (badgeLike) badgeLike.style.opacity = '0';
      if (badgeNope) badgeNope.style.opacity = '0';
    }
  };

  const resetCardStyles = () => {
    const card = cardRef.current;
    const badgeLike = badgeLikeRef.current;
    const badgeNope = badgeNopeRef.current;
    if (card) {
      card.style.transform = 'translateX(0) rotate(0)';
      card.style.opacity = '1';
      card.style.transition = 'none';
    }
    if (badgeLike) badgeLike.style.opacity = '0';
    if (badgeNope) badgeNope.style.opacity = '0';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    handleDragStart(e);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handleDragMove(moveEvent);
    };

    const onMouseUp = () => {
      handleDragEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const animateSwipe = (liked: boolean) => {
    if (!activePlace) return;
    const card = cardRef.current;
    const badgeLike = badgeLikeRef.current;
    const badgeNope = badgeNopeRef.current;
    if (!card) {
      if (liked) handleSwipeLike();
      else handleSwipeNope();
      return;
    }

    card.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    if (liked) {
      if (badgeLike) badgeLike.style.opacity = '1';
      card.style.transform = 'translateX(400px) rotate(45deg)';
    } else {
      if (badgeNope) badgeNope.style.opacity = '1';
      card.style.transform = 'translateX(-400px) rotate(-45deg)';
    }
    card.style.opacity = '0';

    setTimeout(() => {
      if (liked) {
        onFavoriteToggle(activePlace.id);
      }
      setActiveCardIndex((prev) => (prev + 1) % swipeQueue.length);
      resetCardStyles();
    }, 350);
  };

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
      const matchesRadius = (!activeCoords || searchRadius === undefined || searchRadius === Infinity) ? true : (place.distance || 0) <= searchRadius;
      return matchesSearch && matchesCategory && matchesRadius;
    });

    if (activeCoords) {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return filtered;
  }, [placesWithDistance, searchQuery, selectedCategory, activeCoords, searchRadius]);

  const featuredPlaces = React.useMemo(() => {
    const featured = placesWithDistance.filter(p => {
      const matchesRadius = (!activeCoords || searchRadius === undefined || searchRadius === Infinity) ? true : (p.distance || 0) <= searchRadius;
      return p.is_featured && matchesRadius;
    });
    if (activeCoords) {
      featured.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return featured;
  }, [placesWithDistance, activeCoords, searchRadius]);

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
    <div className="pb-24 text-slate-100 w-full flex flex-col items-center">

      {/* Barra de Busca */}
      <div className="px-6 pt-4 max-w-6xl mx-auto w-full">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Switch View Selectors */}
      <div className="px-6 py-2 flex justify-between items-center mt-2 max-w-6xl mx-auto w-full">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Descoberta Reativa</span>
        <div className="bg-slate-100 dark:bg-brand-indigo-950/85 border border-slate-200/60 dark:border-white/5 p-1 rounded-xl flex gap-1 shadow-inner transition-colors duration-300">
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
      <div className="py-4 max-w-6xl mx-auto w-full">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-6 mb-3">Categorias</h3>
        
        <div className="flex gap-3 overflow-x-auto px-6 pb-2 scrollbar-none snap-x">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`snap-start shrink-0 flex items-center gap-2 h-10 px-4 rounded-2xl border transition-all btn-premium ${
              selectedCategory === null
                ? 'bg-brand-coral-500 border-brand-coral-500 text-white font-semibold shadow-md'
                : 'bg-slate-100 dark:bg-brand-indigo-900/40 border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/10'
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
                  : 'bg-slate-100 dark:bg-brand-indigo-900/40 border-slate-200/60 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/10'
              }`}
            >
              <IconRenderer name={cat.icon} className={`w-4 h-4 ${selectedCategory === cat.id ? 'text-white' : 'text-brand-teal-400'}`} />
              <span className="text-xs">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'swipe' ? (
        <div className="flex-1 flex flex-col justify-center items-center py-2 px-6 relative max-w-md mx-auto animate-fade-in w-full min-h-0">
          {swipeQueue.length > 0 && activePlace ? (
            <div className="w-full flex-1 flex flex-col justify-between items-center min-h-0">
              {/* Card Container */}
              <div className="w-full flex-1 min-h-[260px] max-h-[420px] relative select-none">
                {/* Background Card (Next Card) */}
                {swipeQueue.length > 1 && nextPlace && (
                  <div className="absolute inset-x-2 bottom-[-16px] h-full rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-brand-indigo-900/40 opacity-60 scale-[0.93] translate-y-4 -z-10 pointer-events-none flex flex-col shadow-lg">
                    <img src={nextPlace.image_url} alt={nextPlace.name} className="w-full h-full object-cover animate-pulse" />
                  </div>
                )}

                {/* Active Card */}
                <div 
                  ref={cardRef}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleDragStart}
                  onTouchMove={handleDragMove}
                  onTouchEnd={handleDragEnd}
                  onClick={() => {
                    const deltaX = Math.abs(currentXRef.current - startXRef.current);
                    if (deltaX < 10) {
                      onSelectPlace(activePlace);
                    }
                  }}
                  className="w-full h-full rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/5 bg-white dark:bg-brand-indigo-950 flex flex-col shadow-2xl relative cursor-grab active:cursor-grabbing select-none group active:scale-[0.99] transition-all duration-300"
                >
                  {/* Swipe overlays */}
                  <div 
                    ref={badgeLikeRef}
                    className="absolute top-8 left-8 border-4 border-brand-teal-500 text-brand-teal-500 dark:border-brand-teal-400 dark:text-brand-teal-400 px-4 py-2 rounded-xl text-xl font-black uppercase tracking-wider -rotate-12 opacity-0 z-20 pointer-events-none transition-opacity duration-100"
                  >
                    Giro!
                  </div>
                  <div 
                    ref={badgeNopeRef}
                    className="absolute top-8 right-8 border-4 border-brand-coral-500 text-brand-coral-500 px-4 py-2 rounded-xl text-xl font-black uppercase tracking-wider rotate-12 opacity-0 z-20 pointer-events-none transition-opacity duration-100"
                  >
                    Nem...
                  </div>

                  <img src={activePlace.image_url} alt={activePlace.name} className="w-full h-full object-cover pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-indigo-950/90 via-brand-indigo-950/20 to-black/20 pointer-events-none" />

                  {/* Badges/Category */}
                  <div className="absolute top-4 left-4 bg-white/90 dark:bg-brand-indigo-950/80 backdrop-blur-xs border border-slate-200 dark:border-white/10 text-[10px] font-semibold text-brand-teal-600 dark:text-brand-teal-400 px-3 py-1 rounded-full uppercase tracking-wider pointer-events-none">
                    {activePlace.price_range} · {activePlace.avg_rating.toFixed(1)} ★
                  </div>

                  {/* Botão de salvar na coleção */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      window.dispatchEvent(new CustomEvent('giro-open-collection', { detail: { placeId: activePlace.id } }));
                    }}
                    className="absolute top-4 right-4 z-30 flex items-center justify-center w-9 h-9 rounded-full bg-white/80 dark:bg-brand-indigo-950/70 backdrop-blur-xs border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-brand-coral-500/20 hover:border-brand-coral-500/50 transition-all btn-premium shadow-sm"
                  >
                    <Icons.Bookmark 
                      className={`w-4 h-4 transition-all ${
                        favorites.includes(activePlace.id) ? 'fill-brand-coral-500 text-brand-coral-500 scale-110' : 'text-slate-400 dark:text-slate-300'
                      }`} 
                    />
                  </button>

                  {/* Place Info */}
                  <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6 text-left pointer-events-none">
                    <h3 className="text-lg sm:text-xl font-outfit font-extrabold text-white mb-1 flex items-center gap-1.5 leading-tight">
                      {activePlace.name}
                    </h3>
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed mb-2 sm:mb-3">
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
              <div className="flex items-center justify-center gap-6 mt-4 sm:mt-6 shrink-0 select-none">
                <button 
                  onClick={() => animateSwipe(false)}
                  className="w-14 h-14 rounded-full bg-white dark:bg-brand-indigo-900 border border-slate-200 dark:border-white/5 flex items-center justify-center text-brand-coral-500 shadow-lg hover:bg-brand-coral-500 hover:text-white hover:border-brand-coral-500 active:scale-90 transition-all shrink-0"
                >
                  <Icons.X className="w-6 h-6" />
                </button>
                <button 
                  onClick={handlePinClick}
                  className="w-11 h-11 rounded-full bg-white dark:bg-brand-indigo-900 border border-slate-200 dark:border-white/5 flex items-center justify-center text-brand-teal-500 dark:text-brand-teal-400 shadow-md hover:bg-brand-teal-500 hover:text-white hover:border-brand-teal-500 active:scale-90 transition-all shrink-0"
                >
                  <Icons.MapPin className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => animateSwipe(true)}
                  className="w-14 h-14 rounded-full bg-white dark:bg-brand-indigo-900 border border-slate-200 dark:border-white/5 flex items-center justify-center text-brand-coral-500 shadow-lg hover:bg-brand-coral-500 hover:text-white hover:border-brand-coral-500 active:scale-90 transition-all shrink-0"
                >
                  <Icons.Heart className={`w-6 h-6 ${favorites.includes(activePlace.id) ? 'fill-brand-coral-500 text-brand-coral-500' : 'fill-transparent text-brand-coral-500'}`} />
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
        <div className="w-full flex flex-col">
          {/* Lista Principal de Locais */}
          <div className="py-4 px-6 max-w-6xl mx-auto w-full">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
              {searchQuery || selectedCategory ? 'Resultados da Busca' : 'Todos os Locais'}
            </h3>
            
            {filteredPlaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
        </div>
      )}
    </div>
  );
}
