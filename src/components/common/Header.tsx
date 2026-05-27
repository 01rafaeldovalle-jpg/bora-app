import React from 'react';
import { Compass, Sparkles, MapPin } from 'lucide-react';

interface HeaderProps {
  title?: string;
  showLocationSelector?: boolean;
}

export default function Header({ title = 'Bora!', showLocationSelector = true }: HeaderProps) {
  return (
    <header className="glass-panel sticky top-0 z-50 flex items-center justify-between px-6 py-4 text-white">
      <div className="flex items-center gap-2">
        {/* LOGO DO BORA! Criada do zero em SVG/CSS de acordo com psicologia de cores */}
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-coral-500 to-amber-500 shadow-md">
          <Compass className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <h1 className="text-xl font-outfit font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-brand-coral-300 bg-clip-text text-transparent">
            {title}
          </h1>
          {showLocationSelector && (
            <div className="flex items-center gap-1 text-[10px] text-brand-teal-400 font-medium tracking-wider uppercase mt-[-2px]">
              <MapPin className="w-3 h-3" />
              <span>Curitiba - PR</span>
            </div>
          )}
        </div>
      </div>

      <button className="flex items-center justify-center w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-brand-coral-500 hover:text-white transition-all btn-premium">
        <Sparkles className="w-4 h-4 text-brand-gold-400" />
      </button>
    </header>
  );
}
