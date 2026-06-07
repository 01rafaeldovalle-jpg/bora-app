import React, { useState, useEffect } from 'react';
import { Place } from '../types';
import { MOCK_PLACES } from '../utils/constants';
import PlaceCard from '../components/places/PlaceCard';
import { Bookmark, Compass, FolderHeart, FolderOpen, ArrowLeft, Trash2 } from 'lucide-react';
import { getLanguage, t } from '../utils/i18n';

interface FavoritesProps {
  favorites: string[];
  onFavoriteToggle: (id: string) => void;
  onSelectPlace: (place: Place) => void;
  setTab: (tab: 'home' | 'explore' | 'favorites' | 'profile') => void;
  activeCoords?: { lat: number; lng: number };
  collections: Record<string, string[]>;
  onDeleteCollection: (collectionName: string) => void;
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

export default function Favorites({ 
  favorites, 
  onFavoriteToggle,
  onSelectPlace,
  setTab,
  activeCoords,
  collections,
  onDeleteCollection
}: FavoritesProps) {
  const [lang, setLangState] = useState(getLanguage());
  useEffect(() => {
    const handleLang = (e: any) => setLangState(e.detail.lang);
    window.addEventListener('giro-language-change', handleLang);
    return () => window.removeEventListener('giro-language-change', handleLang);
  }, []);

  const [activeSubTab, setActiveSubTab] = useState<'places' | 'collections'>('places');
  const [expandedCollectionName, setExpandedCollectionName] = useState<string | null>(null);

  // Obter apenas os locais que estão favoritados com a distância calculada
  const favoritedPlaces = React.useMemo(() => {
    const places = MOCK_PLACES.filter(place => favorites.includes(place.id));
    return places.map(place => {
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
  }, [favorites, activeCoords]);

  // Obter locais pertencentes à coleção expandida ativa
  const collectionPlaces = React.useMemo(() => {
    if (!expandedCollectionName) return [];
    const list = collections[expandedCollectionName] || [];
    return favoritedPlaces.filter(place => list.includes(place.id));
  }, [expandedCollectionName, collections, favoritedPlaces]);

  const collectionNames = Object.keys(collections);

  return (
    <div className="pb-24 text-slate-100 w-full flex flex-col items-center">
      <div className="px-6 py-4 max-w-6xl mx-auto w-full flex flex-col items-center">
        
        {/* Visão Expandida de uma Coleção */}
        {expandedCollectionName ? (
          <div className="w-full animate-fade-in">
            {/* Header de Voltar */}
            <div className="flex flex-col gap-4 w-full mb-6 text-left">
              <button
                type="button"
                onClick={() => setExpandedCollectionName(null)}
                className="self-start flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-brand-coral-500 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> {t('fav_back_collections')}
              </button>
              
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-11 h-11 rounded-2xl bg-brand-coral-500/10 flex items-center justify-center text-brand-coral-500 border border-brand-coral-500/20">
                    <FolderOpen className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-outfit font-black text-slate-900 dark:text-white leading-tight">
                      {expandedCollectionName === 'Todos os Salvos' || expandedCollectionName === 'Salvos' ? t('home_all_saved') : expandedCollectionName}
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">
                      {collectionPlaces.length} {collectionPlaces.length === 1 ? t('fav_saved_singular') : t('fav_saved_plural')}
                    </p>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const dispName = expandedCollectionName === 'Todos os Salvos' || expandedCollectionName === 'Salvos' ? t('home_all_saved') : expandedCollectionName;
                    if (confirm(`${t('fav_confirm_delete')}"${dispName}"?`)) {
                      onDeleteCollection(expandedCollectionName);
                      setExpandedCollectionName(null);
                    }
                  }}
                  className="w-10 h-10 rounded-2xl bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-500 transition-all flex items-center justify-center border border-rose-500/20 active:scale-95 shadow-sm"
                  title="Excluir Coleção"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Listagem de locais da coleção */}
            {collectionPlaces.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {collectionPlaces.map((place) => (
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
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full">
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-brand-indigo-900/50 border border-slate-200 dark:border-white/5 flex items-center justify-center mb-4 text-brand-coral-500">
                  <Bookmark className="w-8 h-8" />
                </div>
                <h3 className="text-base font-outfit font-bold text-slate-850 dark:text-white mb-2">{t('fav_empty_collection_title')}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                  {t('fav_empty_collection_desc')}
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Visão Principal da Aba de Favoritos (Alternador entre Locais e Coleções) */
          <>
            {/* Seletor Visual de Sub-Abas */}
            <div className="bg-slate-200/60 dark:bg-brand-indigo-950/85 border border-slate-300/40 dark:border-white/5 p-1 rounded-2xl flex gap-1 shadow-inner w-full mb-6 max-w-xs">
              <button
                type="button"
                onClick={() => setActiveSubTab('places')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeSubTab === 'places' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('fav_tab_places')}
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('collections')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeSubTab === 'collections' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t('fav_tab_collections')}
              </button>
            </div>

            {/* Conteúdo Aba Locais */}
            {activeSubTab === 'places' && (
              <div className="w-full">
                {favoritedPlaces.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
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
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-brand-indigo-900/50 border border-slate-200/60 dark:border-white/5 flex items-center justify-center mb-4 text-brand-coral-500 animate-pulse">
                      <Bookmark className="w-8 h-8 fill-brand-coral-500" />
                    </div>
                    
                    <h3 className="text-base font-outfit font-bold text-slate-855 dark:text-white mb-2">{t('fav_no_favorites_title')}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-6">
                      {t('fav_no_favorites_desc')}
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => setTab('home')}
                      className="flex items-center gap-2 bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-semibold text-xs px-6 h-11 rounded-2xl transition-all btn-premium shadow-md"
                    >
                      <Compass className="w-4 h-4" />
                      <span>{t('fav_explore_btn')}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Conteúdo Aba Coleções */}
            {activeSubTab === 'collections' && (
              <div className="w-full">
                {collectionNames.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full">
                    {collectionNames.map((name) => (
                      <div 
                        key={name}
                        onClick={() => setExpandedCollectionName(name)}
                        className="glass-card rounded-[28px] p-5 border border-slate-200/60 dark:border-white/5 hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer flex flex-col justify-between aspect-square relative overflow-hidden group min-h-[140px]"
                      >
                        {/* Efeito de brilho de fundo */}
                        <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-brand-coral-500/10 blur-xl group-hover:bg-brand-coral-500/20 transition-all pointer-events-none" />
                        
                        <div className="w-11 h-11 rounded-2xl bg-brand-coral-500/10 flex items-center justify-center mb-4 text-brand-coral-500 border border-brand-coral-500/20">
                          <FolderHeart className="w-5.5 h-5.5" />
                        </div>
                        
                        <div className="text-left mt-auto">
                          <h4 className="font-outfit font-black text-slate-800 dark:text-white text-sm line-clamp-1 leading-snug">
                            {name === 'Todos os Salvos' || name === 'Salvos' ? t('home_all_saved') : name}
                          </h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold uppercase tracking-wider">
                            {collections[name]?.length || 0} {collections[name]?.length === 1 ? t('home_local_singular') : t('home_local_plural')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-6 text-center w-full">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-brand-indigo-900/50 border border-slate-200/60 dark:border-white/5 flex items-center justify-center mb-4 text-brand-coral-500">
                      <FolderHeart className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-outfit font-bold text-slate-855 dark:text-white mb-2">{t('fav_no_collections_title')}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                      {t('fav_no_collections_desc')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
