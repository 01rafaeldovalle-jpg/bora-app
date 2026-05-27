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
}

export default function Home({ onSelectPlace, favorites, onFavoriteToggle }: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filtrar locais com base na busca e categoria selecionada
  const filteredPlaces = MOCK_PLACES.filter(place => {
    const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          place.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          place.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? place.category_id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const featuredPlaces = MOCK_PLACES.filter(p => p.is_featured);

  return (
    <div className="min-h-screen pb-24 text-slate-100">
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
              Bora encontrar o próximo rolê?
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
    </div>
  );
}
