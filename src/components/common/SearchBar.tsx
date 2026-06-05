import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
}

export default function SearchBar({ 
  value, 
  onChange, 
  onFilterClick, 
  placeholder = "Escreva como quiser, o Giro acha..." 
}: SearchBarProps) {
  return (
    <div className="flex items-center gap-3 w-full px-4 py-2">
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-5 h-5 text-slate-400" />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-2xl bg-slate-100 dark:bg-brand-indigo-900/50 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-brand-coral-500/50 text-sm outline-none transition-all duration-300"
          placeholder={placeholder}
        />
      </div>
      
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          className="flex items-center justify-center w-11 h-11 rounded-2xl bg-slate-100 dark:bg-brand-indigo-900/50 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-300 hover:text-brand-coral-500 active:bg-brand-coral-500/10 transition-all duration-300 btn-premium"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
