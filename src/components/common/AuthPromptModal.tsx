import React from 'react';
import { Bookmark, X } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export default function AuthPromptModal({ isOpen, onClose, onAccept }: AuthPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[12000] backdrop-blur-md bg-black/60 flex items-center justify-center p-4">
      {/* Background click to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Modal Container */}
      <div className="bg-white dark:bg-brand-indigo-950 w-full max-w-sm rounded-[32px] p-6 border border-slate-200 dark:border-white/10 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 flex flex-col text-slate-900 dark:text-slate-100 items-center text-center">
        
        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon with soft glow */}
        <div className="w-16 h-16 rounded-full bg-brand-coral-500/10 border border-brand-coral-500/20 flex items-center justify-center mb-5 text-brand-coral-500 shadow-lg shadow-brand-coral-500/10 mt-4">
          <Bookmark className="w-8 h-8 fill-brand-coral-500 text-brand-coral-500" />
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-lg font-outfit font-black text-slate-900 dark:text-white mb-2">
          Crie suas coleções no Giro!
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 px-2">
          Crie uma conta gratuita em segundos para salvar seus locais favoritos, criar pastas de rolês personalizadas e sincronizar em qualquer dispositivo.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-2">
          <button
            type="button"
            onClick={onAccept}
            className="w-full py-3 rounded-2xl bg-[#ff5422] text-white text-xs font-bold transition-all shadow-md shadow-brand-coral-500/20 hover:bg-[#f03b0a] active:scale-[0.98]"
          >
            Criar conta ou Entrar
          </button>
          
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-650 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-white/10 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-[0.98]"
          >
            Continuar explorando
          </button>
        </div>
      </div>
    </div>
  );
}
