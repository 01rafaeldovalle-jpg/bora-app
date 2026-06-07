import React, { useState, useEffect } from 'react';
import { X, Plus, FolderHeart } from 'lucide-react';
import { getLanguage, t } from '../../utils/i18n';

interface CollectionModalProps {
  placeId: string;
  collections: Record<string, string[]>;
  onToggleCollectionItem: (collectionName: string, placeId: string) => void;
  onCreateCollection: (name: string) => void;
  onClose: () => void;
  onRemoveFromAll?: (placeId: string) => void;
}

export default function CollectionModal({
  placeId,
  collections,
  onToggleCollectionItem,
  onCreateCollection,
  onClose,
  onRemoveFromAll
}: CollectionModalProps) {
  const [lang, setLangState] = useState(getLanguage());
  useEffect(() => {
    const handleLang = (e: any) => setLangState(e.detail.lang);
    window.addEventListener('giro-language-change', handleLang);
    return () => window.removeEventListener('giro-language-change', handleLang);
  }, []);

  const [newCollectionName, setNewCollectionName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCollectionName.trim();
    if (!trimmed) return;
    onCreateCollection(trimmed);
    // Auto-select the newly created collection for this place
    onToggleCollectionItem(trimmed, placeId);
    setNewCollectionName('');
  };

  const collectionNames = Object.keys(collections);
  const isSavedInAny = Object.values(collections).some(list => list.includes(placeId));

  return (
    <div className="fixed inset-0 z-[11000] backdrop-blur-md bg-black/60 flex items-center justify-center p-4 animate-fade-in">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="bg-white dark:bg-brand-indigo-950 w-full max-w-sm rounded-[32px] p-6 border border-slate-200 dark:border-white/10 shadow-2xl relative z-10 animate-[zoomIn_0.2s_ease-out] flex flex-col text-slate-900 dark:text-slate-100 max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 shrink-0">
          <div className="flex items-center gap-2">
            <FolderHeart className="w-5 h-5 text-brand-coral-500" />
            <h3 className="text-base font-outfit font-black text-slate-900 dark:text-white">{t('col_save_in')}</h3>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Collections List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-5 scrollbar-thin">
          {collectionNames.length > 0 ? (
            collectionNames.map((name) => {
              const isSaved = collections[name]?.includes(placeId);
              return (
                <button
                  type="button"
                  key={name}
                  onClick={() => onToggleCollectionItem(name, placeId)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                    isSaved
                      ? 'bg-brand-coral-500/10 border-brand-coral-500 text-brand-coral-600 dark:text-brand-coral-400 font-bold'
                      : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                  }`}
                >
                  <span className="truncate text-xs">{name === 'Todos os Salvos' || name === 'Salvos' ? t('home_all_saved') : name}</span>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    isSaved
                      ? 'bg-brand-coral-500 border-brand-coral-500'
                      : 'border-slate-300 dark:border-white/20'
                  }`}>
                    {isSaved && (
                      <div className="w-2 h-2 rounded-full bg-white animate-[scaleIn_0.15s_ease-out]" />
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="text-center py-6 text-slate-400 dark:text-slate-500">
              <p className="text-xs">{t('col_no_folders')}</p>
              <p className="text-[10px] mt-1">{t('col_create_first')}</p>
            </div>
          )}

          {isSavedInAny && onRemoveFromAll && (
            <button
              type="button"
              onClick={() => {
                onRemoveFromAll(placeId);
                onClose();
              }}
              className="w-full mt-4 py-2.5 text-center text-xs font-bold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-all active:scale-[0.98]"
            >
              {t('col_remove_all')}
            </button>
          )}
        </div>

        {/* Create Collection Form */}
        <form onSubmit={handleCreate} className="border-t border-slate-100 dark:border-white/5 pt-4 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={t('col_new_placeholder')}
              value={newCollectionName}
              onChange={(e) => setNewCollectionName(e.target.value)}
              className="flex-1 h-11 rounded-xl form-input px-3 text-xs"
            />
            <button
              type="submit"
              disabled={!newCollectionName.trim()}
              className="w-11 h-11 rounded-xl btn-primary flex items-center justify-center shrink-0 disabled:opacity-40 disabled:pointer-events-none"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
