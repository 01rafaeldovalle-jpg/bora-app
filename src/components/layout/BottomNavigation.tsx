import React, { useState, useEffect } from 'react';
import { Home, Map, Heart, User } from 'lucide-react';
import { getLanguage, t } from '../../utils/i18n';

interface BottomNavigationProps {
  currentTab: 'home' | 'explore' | 'favorites' | 'profile';
  setTab: (tab: 'home' | 'explore' | 'favorites' | 'profile') => void;
}

export default function BottomNavigation({ currentTab, setTab }: BottomNavigationProps) {
  const [lang, setLangState] = useState(getLanguage());
  useEffect(() => {
    const handleLang = (e: any) => setLangState(e.detail.lang);
    window.addEventListener('giro-language-change', handleLang);
    return () => window.removeEventListener('giro-language-change', handleLang);
  }, []);

  const navItems = [
    { id: 'home', label: t('nav_home'), icon: Home },
    { id: 'explore', label: t('nav_explore'), icon: Map },
    { id: 'favorites', label: t('nav_favorites'), icon: Heart },
    { id: 'profile', label: t('nav_profile'), icon: User },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[1000] pb-safe-bottom bg-white/80 dark:bg-brand-indigo-950/80 backdrop-blur-md border-t border-slate-100 dark:border-white/5 transition-colors duration-300">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="flex flex-col items-center justify-center flex-1 h-full relative group transition-all duration-300"
            >
              {/* Highlight background on hover/active */}
              <div 
                className={`absolute w-12 h-8 rounded-full transition-all duration-300 -z-10 ${
                  isActive 
                    ? 'bg-brand-coral-500/10 scale-100' 
                    : 'bg-transparent scale-70 group-active:scale-95'
                }`}
              />
              
              <Icon 
                className={`w-5 h-5 transition-all duration-300 ${
                  isActive 
                    ? 'text-brand-coral-500 scale-110' 
                    : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`} 
              />
              
              <span 
                className={`text-[10px] font-medium mt-1 tracking-wide transition-colors duration-300 ${
                  isActive 
                    ? 'text-brand-coral-500 font-semibold' 
                    : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                }`}
              >
                {item.label}
              </span>
              
              {/* Indicator dot */}
              {isActive && (
                <div className="absolute top-1 w-1 h-1 rounded-full bg-brand-coral-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
