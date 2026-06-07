import React, { useState } from 'react';
import { Place } from '../../types';
import { Bookmark, Navigation, Star, Phone, CheckCircle, Share2, ArrowRight, Instagram, Globe, X, MapPin, ShoppingBag, Calendar, Clock, Ticket, MessageSquare } from 'lucide-react';
import { getLanguage, t } from '../../utils/i18n';

interface PlaceCardProps {
  place: Place;
  isFavorited: boolean;
  onFavoriteToggle: (id: string) => void;
  onSelect?: (place: Place) => void;
  onClose?: () => void;
}

export default function PlaceCard({ 
  place, 
  isFavorited, 
  onFavoriteToggle,
  onSelect,
  onClose
}: PlaceCardProps) {
  const [isImgLoaded, setIsImgLoaded] = useState(false);
  const [isWazeOpen, setIsWazeOpen] = useState(false);
  const [wazeStep, setWazeStep] = useState<'ask' | 'loading' | 'reply' | 'thanked'>('ask');
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

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

        {/* Categoria tag (Clicável para abrir avaliações) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.dispatchEvent(new CustomEvent('giro-open-reviews', { detail: { place } }));
          }}
          className="absolute top-3 left-3 z-30 bg-white/90 dark:bg-brand-indigo-950/80 backdrop-blur-xs border border-slate-200 dark:border-white/10 text-[10px] font-semibold text-brand-teal-600 dark:text-brand-teal-400 px-2.5 py-1 rounded-full uppercase tracking-wider transition-all cursor-pointer active:scale-95 hover:opacity-85 shadow-sm"
        >
          {place.price_range} · {place.avg_rating.toFixed(1)} ★
        </button>

        {/* Botão de Fechar (X) na Imagem */}
        {onClose && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3 right-3 z-50 flex items-center justify-center w-8 h-8 rounded-full bg-brand-indigo-900 border border-white/10 text-slate-300 hover:bg-brand-coral-500 hover:text-white transition-all btn-premium shadow-md"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Detalhes do Local */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <h3 className="text-base font-outfit font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-brand-coral-600 dark:group-hover:text-brand-coral-300 transition-colors truncate">
                {place.name}
              </h3>
              {place.is_verified && (
                <CheckCircle className="w-4 h-4 text-brand-teal-500 dark:text-brand-teal-400 fill-brand-teal-950/10 shrink-0" />
              )}
            </div>

            {/* Botões de Ação Inline (Mapa, Compartilhar e Salvar) */}
            <div className="flex items-center gap-1 shrink-0">
              {onSelect && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(place);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-555 dark:text-slate-350 transition-colors"
                  title="Ver no mapa"
                >
                  <MapPin className="w-3.5 h-3.5 text-brand-teal-500 dark:text-brand-teal-400" />
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsWazeOpen(true);
                  setWazeStep('ask');
                  setSelectedQuestion(null);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-555 dark:text-slate-350 transition-colors"
                title={t('como_esta_agora')}
              >
                <MessageSquare className="w-3.5 h-3.5 text-brand-coral-500" />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-350 transition-colors"
                title="Compartilhar"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new CustomEvent('giro-open-collection', { detail: { placeId: place.id, autoSave: !isFavorited } }));
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-350 transition-colors"
                title="Salvar"
              >
                <Bookmark 
                  className={`w-3.5 h-3.5 transition-all ${
                    isFavorited ? 'fill-brand-coral-500 text-brand-coral-500 scale-110' : 'text-slate-400 dark:text-slate-300'
                  }`} 
                />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-3">
            {getLanguage() === 'en' && place.description_en 
              ? place.description_en 
              : getLanguage() === 'es' && place.description_es 
                ? place.description_es 
                : place.description}
          </p>
          {place.event_date && (
            <div className="flex items-center gap-3 mb-3 p-2.5 rounded-2xl bg-brand-coral-500/5 dark:bg-brand-coral-500/10 border border-brand-coral-500/20 text-[10px] font-bold text-brand-coral-600 dark:text-brand-coral-400 uppercase tracking-wider">
              <span className="flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-brand-coral-500" />
                {place.event_date}
              </span>
              {place.event_time && (
                <span className="flex items-center gap-1 border-l border-slate-200 dark:border-white/10 pl-3">
                  <Clock className="w-3.5 h-3.5 text-brand-coral-500" />
                  {place.event_time}h
                </span>
              )}
              <span className="flex items-center gap-1 border-l border-slate-200 dark:border-white/10 pl-3">
                <Ticket className="w-3.5 h-3.5 text-brand-coral-500" />
                {place.ticket_price === 0 || place.ticket_price === undefined ? 'Grátis' : `R$ ${place.ticket_price}`}
              </span>
            </div>
          )}
          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-4 flex items-center gap-1 flex-wrap">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
            <span>{place.address}</span>
            {place.distance !== undefined && (
              <span className="text-brand-coral-500 font-bold ml-1">• a {place.distance < 1 ? `${Math.round(place.distance * 1000)} m` : `${place.distance.toFixed(1)} km`} de você</span>
            )}
          </p>
          
          {/* Waze highlighted link */}
          <div className="mt-2.5 mb-1 text-left">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsWazeOpen(true);
                setWazeStep('ask');
                setSelectedQuestion(null);
              }}
              className="text-[10px] font-bold text-brand-coral-500 hover:text-brand-coral-600 flex items-center gap-1 bg-brand-coral-500/5 px-2.5 py-1.5 rounded-xl border border-brand-coral-500/10 active:scale-95 transition-all cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-brand-coral-500/10" />
              {t('como_esta_agora')}
            </button>
          </div>
        </div>

        {/* Ações e Rotas Integradas */}
        <div className="border-t border-slate-100 dark:border-white/5 pt-4">
          {(place.phone || place.instagram_handle || place.website_url || place.ifood_url) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {place.phone && (
                <a
                  href={`https://wa.me/55${place.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[10px] font-extrabold tracking-wide uppercase transition-all shadow-md shadow-emerald-600/10 decoration-none no-underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              )}
              {place.instagram_handle && (
                <a
                  href={`https://instagram.com/${place.instagram_handle.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:opacity-90 active:scale-95 text-white text-[10px] font-extrabold tracking-wide uppercase transition-all shadow-md shadow-pink-500/10 decoration-none no-underline"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  Instagram
                </a>
              )}
              {place.website_url && (
                <a
                  href={place.website_url.startsWith('http') ? place.website_url : `https://${place.website_url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-200 text-[10px] font-extrabold tracking-wide uppercase transition-all decoration-none no-underline"
                >
                  <Globe className="w-3.5 h-3.5" />
                  Site
                </a>
              )}
              {place.ifood_url && (
                <a
                  href={place.ifood_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#EA1D2C] hover:opacity-90 active:scale-95 text-white text-[10px] font-extrabold tracking-wide uppercase transition-all shadow-md shadow-red-600/10 decoration-none no-underline"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  iFood
                </a>
              )}
              {place.ticket_url && (
                <a
                  href={place.ticket_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-brand-coral-500 hover:bg-brand-coral-600 active:scale-95 text-white text-[10px] font-extrabold tracking-wide uppercase transition-all shadow-md shadow-brand-coral-500/10 decoration-none no-underline"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  Ingressos
                </a>
              )}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={(e) => handleDirections(e, 'google-maps')}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-brand-coral-500 hover:text-white border border-slate-200/60 dark:border-white/5 hover:border-brand-coral-500/30 text-slate-700 dark:text-slate-200 transition-all active:scale-95 group/btn"
            >
              <Navigation className="w-4 h-4 text-brand-coral-500 dark:text-brand-coral-400 group-hover/btn:text-white transition-colors mb-1" />
              <span className="text-[9px] font-bold tracking-wide uppercase">Maps</span>
            </button>
            
            <button
              onClick={(e) => handleDirections(e, 'uber')}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-black hover:text-white border border-slate-200/60 dark:border-white/5 hover:border-black/30 text-slate-700 dark:text-slate-200 transition-all active:scale-95 group/btn"
            >
              <span className="text-xs font-black text-slate-700 dark:text-slate-300 group-hover/btn:text-white transition-colors mb-1">Uber</span>
              <span className="text-[9px] font-bold tracking-wide uppercase">Uber</span>
            </button>
            
            <button
              onClick={(e) => handleDirections(e, '99')}
              className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-yellow-500 hover:text-black border border-slate-200/60 dark:border-white/5 hover:border-yellow-500/30 text-slate-700 dark:text-slate-200 transition-all active:scale-95 group/btn"
            >
              <span className="text-xs font-black text-amber-600 dark:text-amber-500 group-hover/btn:text-black transition-colors mb-1">99</span>
              <span className="text-[9px] font-bold tracking-wide uppercase">99App</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════ WAZE MODAL ══════════ */}
      {isWazeOpen && (
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
        >
          <div className="relative w-full max-w-sm bg-white dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/10 rounded-[28px] p-6 shadow-2xl flex flex-col text-slate-900 dark:text-slate-100 animate-scaleIn">
            <button
              onClick={() => setIsWazeOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {wazeStep === 'ask' && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-coral-500/15 border border-brand-coral-500/30 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-brand-coral-500" />
                  </div>
                  <h3 className="text-base font-outfit font-black text-slate-900 dark:text-white">
                    {getLanguage() === 'en' ? `How is ${place.name} now?` : getLanguage() === 'es' ? `¿Cómo está ${place.name} ahora?` : `Como está o ${place.name} agora?`}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 text-center">{t('perguntar_sobre')}</p>
                </div>

                <div className="space-y-2.5">
                  {[
                    { id: 'crowd', label: getLanguage() === 'en' ? 'Is it very crowded?' : getLanguage() === 'es' ? '¿Está muy lleno?' : 'Está muito cheio?' },
                    { id: 'line', label: getLanguage() === 'en' ? 'Is there a line to enter?' : getLanguage() === 'es' ? '¿Hay fila para entrar?' : 'Tem fila para entrar?' },
                    { id: 'vibe', label: getLanguage() === 'en' ? 'What is the current vibe?' : getLanguage() === 'es' ? '¿Cuál es la vibra actual?' : 'Qual a vibe atual?' }
                  ].map((q) => (
                    <button
                      key={q.id}
                      onClick={() => setSelectedQuestion(q.id)}
                      className={`w-full p-4 text-left text-xs font-bold rounded-2xl border transition-all cursor-pointer ${
                        selectedQuestion === q.id
                          ? 'border-brand-coral-500 bg-brand-coral-500/5 text-brand-coral-500 shadow-sm shadow-brand-coral-500/10'
                          : 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (selectedQuestion) {
                      setWazeStep('loading');
                      setTimeout(() => {
                        setWazeStep('reply');
                      }, 2000);
                    }
                  }}
                  disabled={!selectedQuestion}
                  className="w-full h-12 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-coral-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {t('continuar')}
                </button>
              </div>
            )}

            {wazeStep === 'loading' && (
              <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-brand-coral-500 border-r-2" />
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white px-2">
                    {getLanguage() === 'en' 
                      ? 'Searching GPS signal and asking whoever is at the location...' 
                      : getLanguage() === 'es' 
                        ? 'Buscando señal GPS y preguntando a quien está en el local...' 
                        : 'Buscando sinal GPS e perguntando a quem está no local...'}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {getLanguage() === 'en' ? 'Querying nearby contributors via GPS...' : getLanguage() === 'es' ? 'Consultando colaboradores cercanos vía GPS...' : 'Consultando colaboradores próximos via GPS...'}
                  </p>
                </div>
              </div>
            )}

            {wazeStep === 'reply' && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-teal-500/15 border border-brand-teal-500/30 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle className="w-6 h-6 text-brand-teal-500" />
                  </div>
                  <h3 className="text-base font-outfit font-black text-slate-900 dark:text-white">
                    {getLanguage() === 'en' ? 'Response Received!' : getLanguage() === 'es' ? '¡Respuesta Recibida!' : 'Resposta Recebida!'}
                  </h3>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-left space-y-1">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                    <span className="font-bold text-brand-coral-500">@renatomoreira </span>
                    {getLanguage() === 'en' ? 'replied: ' : getLanguage() === 'es' ? 'respondió: ' : 'respondeu: '}
                    {selectedQuestion === 'crowd' ? (
                      getLanguage() === 'en' ? 'Está tranquilo, com mesas livres!' : getLanguage() === 'es' ? 'Está tranquilo, con mesas libres!' : 'Está tranquilo, com mesas livres!'
                    ) : selectedQuestion === 'line' ? (
                      getLanguage() === 'en' ? 'Fila super rápida, menos de 5 minutos.' : getLanguage() === 'es' ? 'Fila súper rápida, menos de 5 minutos.' : 'Fila super rápida, menos de 5 minutos.'
                    ) : (
                      getLanguage() === 'en' ? 'Música ao vivo incrível e chopp trincando!' : getLanguage() === 'es' ? '¡Música en vivo increíble y cerveza fría!' : 'Música ao vivo incrível e chopp trincando!'
                    )}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setWazeStep('thanked');
                    setTimeout(() => {
                      setIsWazeOpen(false);
                    }, 2000);
                  }}
                  className="w-full h-12 rounded-2xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-teal-500/20 active:scale-95 transition-all cursor-pointer"
                >
                  {getLanguage() === 'en' ? 'Agradecer e Dar +10 Pontos' : getLanguage() === 'es' ? 'Agradecer y Dar +10 Puntos' : 'Agradecer e Dar +10 Pontos'}
                </button>
              </div>
            )}

            {wazeStep === 'thanked' && (
              <div className="py-6 flex flex-col items-center justify-center space-y-4 text-center animate-scaleIn">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-500 font-black text-2xl animate-bounce">
                  ✓
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-relaxed px-4">
                    {getLanguage() === 'en' 
                      ? 'Você agradeceu! Pontos de fidelidade enviados para @renatomoreira.' 
                      : getLanguage() === 'es' 
                        ? 'Você agradeceu! Pontos de fidelidade enviados para @renatomoreira.' 
                        : 'Você agradeceu! Pontos de fidelidade enviados para @renatomoreira.'}
                  </h4>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
