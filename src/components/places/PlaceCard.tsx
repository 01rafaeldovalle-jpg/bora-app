import React, { useState } from 'react';
import { Place } from '../../types';
import { Heart, Navigation, Star, Phone, CheckCircle, Share2, ArrowRight } from 'lucide-react';

interface PlaceCardProps {
  place: Place;
  isFavorited: boolean;
  onFavoriteToggle: (id: string) => void;
  onSelect?: (place: Place) => void;
}

export default function PlaceCard({ 
  place, 
  isFavorited, 
  onFavoriteToggle,
  onSelect 
}: PlaceCardProps) {
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  // Helper para abrir as rotas do celular
  const handleDirections = (e: React.MouseEvent, type: 'google-maps' | 'uber' | '99') => {
    e.stopPropagation(); // Evita acionar o onSelect do card
    
    const { latitude: lat, longitude: lng, name, address } = place;
    let url = '';

    switch (type) {
      case 'google-maps':
        url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        break;
      case 'uber':
        url = `https://m.uber.com/ul/?action=setPickup&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}&dropoff[nickname]=${encodeURIComponent(name)}&dropoff[formatted_address]=${encodeURIComponent(address)}`;
        break;
      case '99':
        // URL esquema da 99Taxis
        url = `https://99taxis.mobi/passenger/route?lat=${lat}&lng=${lng}&name=${encodeURIComponent(name)}`;
        break;
    }

    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: place.name,
        text: `Bora conhecer o ${place.name} em Curitiba?`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: copiar para área de transferência
      navigator.clipboard.writeText(`${place.name} - ${place.address}`);
      alert('Informações do local copiadas para compartilhar!');
    }
  };

  return (
    <div 
      onClick={() => onSelect && onSelect(place)}
      className="glass-card rounded-3xl overflow-hidden hover:scale-[1.02] hover:border-brand-coral-500/20 active:scale-[0.99] transition-all duration-300 cursor-pointer flex flex-col h-full group"
    >
      {/* Imagem com Loader e Favorito */}
      <div className="relative aspect-video max-h-[30dvh] overflow-hidden bg-brand-indigo-950">
        {!isImgLoaded && (
          <div className="absolute inset-0 bg-brand-indigo-900/40 animate-pulse flex items-center justify-center">
            <span className="text-xs text-slate-400">Carregando...</span>
          </div>
        )}
        <img
          src={place.image_url}
          alt={place.name}
          onLoad={() => setIsImgLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isImgLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
        
        {/* Gradiente sutil na imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-indigo-950/70 via-transparent to-black/20" />

        {/* Categoria tag */}
        <div className="absolute top-3 left-3 bg-brand-indigo-950/80 backdrop-blur-xs border border-white/10 text-[10px] font-semibold text-brand-teal-400 px-2.5 py-1 rounded-full uppercase tracking-wider">
          {place.price_range} · {place.avg_rating.toFixed(1)} ★
        </div>

        {/* Botão de Favoritar */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle(place.id);
          }}
          className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-brand-indigo-950/70 backdrop-blur-xs border border-white/10 text-white hover:bg-brand-coral-500/20 hover:border-brand-coral-500/50 transition-all btn-premium"
        >
          <Heart 
            className={`w-4 h-4 transition-all ${
              isFavorited ? 'fill-brand-coral-500 text-brand-coral-500 scale-110' : 'text-slate-300'
            }`} 
          />
        </button>
      </div>

      {/* Detalhes do Local */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-1.5">
            <h3 className="text-base font-outfit font-bold tracking-tight text-white group-hover:text-brand-coral-300 transition-colors line-clamp-1">
              {place.name}
            </h3>
            {place.is_verified && (
              <CheckCircle className="w-4 h-4 text-brand-teal-400 fill-brand-teal-950/40 shrink-0 mt-0.5" />
            )}
          </div>
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-3">
            {place.description}
          </p>
          <p className="text-[10px] text-slate-400 line-clamp-1 mb-4 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-slate-500" />
            {place.address}
          </p>
        </div>

        {/* Ações e Rotas Integradas */}
        <div className="border-t border-white/5 pt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Como ir:</span>
            
            <button 
              onClick={handleShare}
              className="text-[11px] text-brand-teal-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={(e) => handleDirections(e, 'google-maps')}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/5 hover:bg-brand-coral-500 hover:text-white border border-white/5 hover:border-brand-coral-500/30 text-slate-200 transition-all active:scale-95 group/btn"
            >
              <Navigation className="w-4 h-4 text-brand-coral-400 group-hover/btn:text-white transition-colors mb-1" />
              <span className="text-[9px] font-bold tracking-wide uppercase">Maps</span>
            </button>
            
            <button
              onClick={(e) => handleDirections(e, 'uber')}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/5 hover:bg-black hover:text-white border border-white/5 hover:border-black/30 text-slate-200 transition-all active:scale-95 group/btn"
            >
              <span className="text-xs font-black text-slate-300 group-hover/btn:text-white transition-colors mb-1">Uber</span>
              <span className="text-[9px] font-bold tracking-wide uppercase">Uber</span>
            </button>
            
            <button
              onClick={(e) => handleDirections(e, '99')}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white/5 hover:bg-yellow-500 hover:text-black border border-white/5 hover:border-yellow-500/30 text-slate-200 transition-all active:scale-95 group/btn"
            >
              <span className="text-xs font-black text-amber-500 group-hover/btn:text-black transition-colors mb-1">99</span>
              <span className="text-[9px] font-bold tracking-wide uppercase">99App</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
