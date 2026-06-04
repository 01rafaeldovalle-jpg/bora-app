import React, { useState } from 'react';
import { X, Star, Camera, Send, MessageSquare } from 'lucide-react';
import { Place, Review } from '../../types';

interface ReviewsModalProps {
  place: Place;
  isLoggedIn: boolean;
  reviews: Review[];
  onRequireAuth: () => void;
  onSubmitReview: (placeId: string, rating: number, comment: string, images: string[]) => void;
  onClose: () => void;
}

export default function ReviewsModal({
  place,
  isLoggedIn,
  reviews,
  onRequireAuth,
  onSubmitReview,
  onClose
}: ReviewsModalProps) {
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  // Filtrar avaliações deste local
  const placeReviews = reviews.filter(r => r.place_id === place.id);

  // Extrair todas as fotos deste estabelecimento de todas as avaliações
  const allPhotos = placeReviews.flatMap(r => r.images || []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setNewPhotos(prev => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewPhoto = (index: number) => {
    setNewPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    onSubmitReview(place.id, rating, comment, newPhotos);
    
    // Resetar formulário
    setRating(5);
    setComment('');
    setNewPhotos([]);
    setShowForm(false);
  };

  const handleWriteReviewClick = () => {
    if (!isLoggedIn) {
      onRequireAuth();
    } else {
      setShowForm(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[11000] backdrop-blur-md bg-black/60 flex items-center justify-center p-4 animate-fade-in">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="bg-white dark:bg-brand-indigo-950 w-full max-w-md rounded-[32px] p-6 border border-slate-200 dark:border-white/10 shadow-2xl relative z-10 animate-[zoomIn_0.2s_ease-out] flex flex-col text-slate-900 dark:text-slate-100 max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-bold text-brand-coral-500 uppercase tracking-widest">Avaliações e Fotos</span>
            <h3 className="text-base font-outfit font-black text-slate-900 dark:text-white truncate max-w-[280px]">
              {place.name}
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Média de Notas e Estatísticas Rápidas */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black font-outfit text-slate-900 dark:text-white">
              {place.avg_rating.toFixed(1)}
            </span>
            <div className="flex flex-col text-left">
              <div className="flex text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3.5 h-3.5 ${i < Math.round(place.avg_rating) ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`} 
                  />
                ))}
              </div>
              <span className="text-[10px] font-semibold text-slate-450 dark:text-slate-500">
                {placeReviews.length} {placeReviews.length === 1 ? 'avaliação' : 'avaliações'}
              </span>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={handleWriteReviewClick}
              className="px-3.5 py-1.5 rounded-xl text-[10px] font-bold btn-primary flex items-center gap-1"
            >
              <Camera className="w-3.5 h-3.5" />
              Avaliar Local
            </button>
          )}
        </div>

        {/* Modal Scrollable Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 scrollbar-thin mb-2">
          
          {/* Formulário de Nova Avaliação (Condicional) */}
          {showForm && (
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl border border-brand-coral-500/20 bg-brand-coral-500/5 dark:bg-brand-coral-500/5 space-y-4 animate-fade-in text-left">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-brand-coral-500">Escreva sua avaliação</span>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 text-[10px] font-bold"
                >
                  Cancelar
                </button>
              </div>

              {/* Seletor Clicável de Estrelas */}
              <div className="flex gap-1.5 items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 mr-2">Sua nota:</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const starVal = i + 1;
                    return (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setRating(starVal)}
                        className="text-amber-500 hover:scale-110 active:scale-95 transition-all p-0.5"
                      >
                        <Star className={`w-6 h-6 ${starVal <= rating ? 'fill-current' : 'text-slate-350 dark:text-slate-700'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input de Comentário */}
              <div>
                <textarea
                  required
                  placeholder="Conte-nos sobre sua experiência..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full h-20 rounded-xl form-input p-3 text-xs resize-none"
                  maxLength={300}
                />
              </div>

              {/* Upload de Fotos e Previews */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase">Anexar Fotos</span>
                  <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1 text-[10px] font-bold">
                    <Camera className="w-3.5 h-3.5 text-brand-coral-500" />
                    <span>Adicionar</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      onChange={handlePhotoUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {newPhotos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {newPhotos.map((photo, index) => (
                      <div key={index} className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 bg-slate-100">
                        <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewPhoto(index)}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 flex items-center justify-center text-white text-[9px] hover:bg-red-500"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl btn-primary text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Publicar Avaliação
              </button>
            </form>
          )}

          {/* Carrossel de Fotos da Comunidade (Se existirem fotos) */}
          {allPhotos.length > 0 && (
            <div className="space-y-1.5 text-left shrink-0">
              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                Fotos da Comunidade ({allPhotos.length})
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {allPhotos.map((imgUrl, i) => (
                  <div 
                    key={i} 
                    onClick={() => setFullscreenImage(imgUrl)}
                    className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-slate-200/50 dark:border-white/5 bg-slate-100 cursor-zoom-in hover:opacity-95 transition-opacity"
                  >
                    <img src={imgUrl} alt={`Comunidade ${i}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de Avaliações / Comentários */}
          <div className="space-y-3 text-left">
            <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
              Comentários
            </span>
            
            {placeReviews.length > 0 ? (
              placeReviews.map((rev) => {
                const initial = rev.user_name.charAt(0).toUpperCase();
                return (
                  <div key={rev.id} className="p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                    {/* User profile header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        {rev.user_avatar ? (
                          <img src={rev.user_avatar} alt={rev.user_name} className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-coral-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs">
                            {initial}
                          </div>
                        )}
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1">
                            {rev.user_name}
                          </span>
                          <span className="text-[9px] text-slate-450 dark:text-slate-500">
                            {new Date(rev.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Rating stars inside review */}
                      <div className="flex text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-2.5 h-2.5 ${i < rev.rating ? 'fill-current' : 'text-slate-350 dark:text-slate-700'}`} 
                          />
                        ))}
                      </div>
                    </div>

                    {/* Comment text */}
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-3">
                      {rev.comment}
                    </p>

                    {/* Review attached images */}
                    {rev.images && rev.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                        {rev.images.map((img, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setFullscreenImage(img)}
                            className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200/50 dark:border-white/5 bg-slate-100 cursor-zoom-in hover:opacity-90 transition-all"
                          >
                            <img src={img} alt="Anexo de comentário" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 dark:text-slate-550 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-350 dark:text-slate-700" />
                <p className="text-xs">Nenhum comentário para este local ainda.</p>
                <p className="text-[10px] mt-1">Seja o primeiro a avaliar clicando acima!</p>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* Fullscreen Photo Light-box */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-[12000] bg-black/95 flex items-center justify-center p-4 animate-fade-in">
          {/* Close Area */}
          <div className="absolute inset-0 cursor-zoom-out" onClick={() => setFullscreenImage(null)} />
          
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-white/10 border border-white/10 text-white hover:bg-white/20 transition-all z-10"
          >
            <X className="w-5 h-5" />
          </button>
          
          <img 
            src={fullscreenImage} 
            alt="Fullscreen View" 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl relative z-0 animate-[zoomIn_0.2s_ease-out]" 
          />
        </div>
      )}

    </div>
  );
}
