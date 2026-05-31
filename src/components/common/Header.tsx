import React, { useState, useEffect, useRef } from 'react';
import { Compass, Moon, Sun, MapPin, ChevronDown, Search, Locate, X } from 'lucide-react';



interface HeaderProps {
  title?: string;
  showLocationSelector?: boolean;
  searchRadius?: number;
  setSearchRadius?: (radius: number) => void;
}

const formatAddressLabel = (address: any) => {
  if (!address) return 'Curitiba - PR';
  
  let road = address.road || '';
  let suburb = address.suburb || address.neighbourhood || address.city_district || '';
  const houseNumber = address.house_number || '';
  
  if (road) {
    road = road.replace(/^Rua\s+/i, 'R. ')
               .replace(/^Avenida\s+/i, 'Av. ')
               .replace(/^Alameda\s+/i, 'Al. ')
               .replace(/^Travessa\s+/i, 'Tv. ')
               .replace(/^Praça\s+/i, 'Pça. ');
  }
  
  const roadWithNumber = road && houseNumber ? `${road}, ${houseNumber}` : road;
  
  if (road && suburb) {
    const fullLabel = roadWithNumber ? `${roadWithNumber}, ${suburb}` : suburb;
    if (fullLabel.length <= 30) {
      return fullLabel;
    } else {
      const parts = road.split(' ');
      const shortenedRoad = parts[0] + ' ' + (parts.slice(-1)[0] || '');
      const shortenedRoadWithNumber = shortenedRoad && houseNumber ? `${shortenedRoad}, ${houseNumber}` : shortenedRoad;
      const shortLabel = `${shortenedRoadWithNumber}, ${suburb}`;
      if (shortLabel.length <= 30) {
        return shortLabel;
      }
      return `${suburb}, Curitiba`;
    }
  }
  
  if (roadWithNumber) {
    return roadWithNumber;
  }
  
  return suburb ? `${suburb}, Curitiba` : (address.city || 'Curitiba - PR');
};

export default function Header({ 
  title = 'Giro', 
  showLocationSelector = true,
  searchRadius = 10.0,
  setSearchRadius
}: HeaderProps) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('dark');
  const [locationLabel, setLocationLabel] = useState('Curitiba - PR');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [waitingListCity, setWaitingListCity] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [gpsDenied, setGpsDenied] = useState(false);
  
  const debounceRef = useRef<any>(null);

  useEffect(() => {
    // 1. Detectar o tema inicial
    let initialTheme = localStorage.getItem('giro_theme') as 'light' | 'dark' | null;
    if (!initialTheme) {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      if (prefersDark) {
        initialTheme = 'dark';
      } else if (prefersLight) {
        initialTheme = 'light';
      } else {
        const hour = new Date().getHours();
        initialTheme = hour >= 6 && hour < 18 ? 'light' : 'dark';
      }
    }
    applyTheme(initialTheme);

    // Escutar eventos externos de mudança de tema
    const handleThemeChange = (e: any) => {
      setThemeState(e.detail.theme);
    };
    window.addEventListener('giro-theme-change', handleThemeChange);

    // Escutar eventos externos de mudança de localização para manter sincronizado
    const handleLocationChange = (e: any) => {
      setLocationLabel(e.detail.label);
    };
    window.addEventListener('giro-location-change', handleLocationChange);

    // 2. Tentar geolocalização automática por GPS na inicialização
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`;
          fetch(url, { headers: { 'Accept-Language': 'pt-BR' } })
            .then(res => res.json())
            .then(data => {
              const label = formatAddressLabel(data?.address);
              setLocationLabel(label);
              setGpsDenied(false);
              window.dispatchEvent(
                new CustomEvent('giro-location-change', {
                  detail: { lat, lng, label }
                })
              );
            })
            .catch(() => {});
        },
        () => {
          setGpsDenied(true);
          setIsModalOpen(true);
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    }

    return () => {
      window.removeEventListener('giro-theme-change', handleThemeChange);
      window.removeEventListener('giro-location-change', handleLocationChange);
    };
  }, []);

  const applyTheme = (t: 'light' | 'dark') => {
    setThemeState(t);
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('giro_theme', t);
    window.dispatchEvent(new CustomEvent('giro-theme-change', { detail: { theme: t } }));
  };

  const handleToggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
  };

  // Buscar localização no Nominatim OSM
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setWaitingListCity(null);
    setIsSubscribed(false);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(() => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&addressdetails=1&limit=5&viewbox=-49.40,-25.65,-49.15,-25.30&bounded=1`;
      fetch(url, { headers: { 'Accept-Language': 'pt-BR' } })
        .then((res) => res.json())
        .then((data) => {
          setSuggestions(data || []);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setIsLoading(false);
        });
    }, 500);
  };

  // Selecionar localização sugerida
  const handleSelectLocation = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    // Validação da Região de Curitiba (Bounding Box)
    // Latitude: -25.65 até -25.30 | Longitude: -49.40 até -49.15
    const isCuritiba = lat >= -25.65 && lat <= -25.30 && lon >= -49.40 && lon <= -49.15;

    if (isCuritiba) {
      let label = 'Curitiba - PR';
      if (item.address) {
        const suburb = item.address.suburb || item.address.neighbourhood || item.address.city_district || '';
        if (suburb) {
          label = `${suburb} - PR`;
        }
      }

      setLocationLabel(label);

      // Disparar o CustomEvent global
      window.dispatchEvent(
        new CustomEvent('giro-location-change', {
          detail: { lat, lng: lon, label }
        })
      );

      // Fechar modal
      setIsModalOpen(false);
      setSearchQuery('');
      setSuggestions([]);
    } else {
      // Exibir Lista de Espera
      const city = item.address
        ? item.address.city || item.address.town || item.address.village || item.address.municipality || 'sua cidade'
        : 'sua cidade';
      setWaitingListCity(city);
    }
  };

  // Registrar na lista de espera
  const handleWaitingListSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    const list = JSON.parse(localStorage.getItem('giro_waiting_list') || '[]');
    list.push({ email, city: waitingListCity, timestamp: new Date().toISOString() });
    localStorage.setItem('giro_waiting_list', JSON.stringify(list));

    setIsSubscribed(true);
    setEmail('');
  };

  const handleLocationFallback = () => {
    const lat = -25.4290;
    const lng = -49.2671;
    const label = 'Curitiba - PR';
    setLocationLabel(label);
    window.dispatchEvent(
      new CustomEvent('giro-location-change', {
        detail: { lat, lng, label }
      })
    );
    setIsLoading(false);
    setIsModalOpen(false);
  };

  // Usar GPS
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      setGpsDenied(true);
      handleLocationFallback();
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Fazer a geocodificação reversa para obter a rua e o bairro
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`;
        fetch(url, { headers: { 'Accept-Language': 'pt-BR' } })
          .then(res => res.json())
          .then(data => {
            const label = formatAddressLabel(data?.address);
            setLocationLabel(label);
            setGpsDenied(false);
            window.dispatchEvent(
              new CustomEvent('giro-location-change', {
                detail: { lat, lng, label }
              })
            );
            setIsLoading(false);
            setIsModalOpen(false);
          })
          .catch(err => {
            console.error("Erro na geocodificação reversa:", err);
            handleLocationFallback();
          });
      },
      (error) => {
        console.error("Erro ao obter GPS:", error);
        setGpsDenied(true);
        handleLocationFallback();
      },
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  };

  const handleLogoClick = () => {
    setIsModalOpen(false); // Fechar a modal de localização se estiver aberta
    window.dispatchEvent(new CustomEvent('giro-go-home'));
  };

  return (
    <>
      <header className="sticky top-0 z-50 px-6 py-4 bg-white/80 dark:bg-brand-indigo-950/85 backdrop-blur-md border-b border-slate-100 dark:border-white/5 text-slate-900 dark:text-white transition-colors duration-300 w-full">
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* LOGO (Esquerda) */}
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 cursor-pointer hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shrink-0"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-coral-500 to-amber-500 shadow-md shrink-0">
              <Compass className="w-4 h-4 text-white animate-pulse" />
            </div>
            <h1 className="text-base sm:text-lg font-outfit font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-brand-coral-500 dark:from-white dark:to-brand-coral-300 bg-clip-text text-transparent leading-tight">
              {title}
            </h1>
          </div>

          {/* ENDEREÇO (Centro) */}
          {showLocationSelector ? (
            <div className="flex-1 flex justify-center min-w-0 px-2">
              <div 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-1 bg-slate-100 dark:bg-brand-indigo-900/40 border border-slate-100 dark:border-white/5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-brand-teal-600 dark:text-brand-teal-400 tracking-wider uppercase cursor-pointer hover:bg-slate-200/50 dark:hover:bg-brand-indigo-900/60 transition-all active:scale-95 max-w-[200px] sm:max-w-[55%] mx-3 w-auto select-none"
              >
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate flex-1 text-center">{locationLabel}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
              </div>
            </div>
          ) : (
            <div className="flex-1" />
          )}

          {/* TEMA (Direita) */}
          <button 
            onClick={handleToggleTheme} 
            className="theme-toggle-btn w-10 h-10 flex items-center justify-center rounded-full relative focus:outline-none shrink-0" 
            aria-label="Alterar Tema"
          >
            <div className="coin-container w-8 h-8 relative transition-transform duration-500 transform-style-3d pointer-events-none">
              {/* FACE NOITE (LUA) - Visível no modo Dark */}
              <div className="coin-face coin-face-dark absolute inset-0 rounded-full flex items-center justify-center bg-brand-indigo-900 border border-white/10 text-brand-teal-400 backface-hidden">
                <Moon className="w-4 h-4" />
              </div>
              {/* FACE DIA (SOL) - Visível no modo Light (Rotacionada em 180 graus) */}
              <div className="coin-face coin-face-light absolute inset-0 rounded-full flex items-center justify-center bg-amber-500 border border-amber-400 text-white backface-hidden rotate-y-180">
                <Sun className="w-4 h-4" />
              </div>
            </div>
          </button>
        </div>
      </header>

      {/* MODAL DE LOCALIZAÇÃO MANUAL CENTRALIZADO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
          />
          
          {/* Modal Panel */}
          <div className="relative w-full max-w-sm bg-slate-50 dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-2xl z-10 flex flex-col gap-6 text-slate-900 dark:text-slate-100 max-h-[80vh] overflow-y-auto">
            {/* Close Button */}
            <div className="flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-brand-coral-500 hover:text-white transition-all btn-premium shadow-md shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-outfit font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-coral-500" /> Definir Localização
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Pesquise bairros, ruas ou pontos turísticos para simular sua localização no Giro.</p>
            </div>

            {gpsDenied && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-[11px] text-amber-700 dark:text-amber-400 leading-snug shrink-0">
                <span className="text-sm shrink-0">⚠️</span>
                <p>Sua geolocalização está desativada. Escolha um bairro de Curitiba abaixo para continuar explorando.</p>
              </div>
            )}

            {/* Input de Busca */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </span>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full h-12 pl-10 pr-4 rounded-2xl bg-white dark:bg-brand-indigo-900/50 border border-slate-200 dark:border-white/5 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 text-sm outline-none transition-colors duration-300 focus:border-brand-coral-500 dark:focus:border-brand-coral-500" 
                placeholder="Para onde quer dar um Giro?"
              />
            </div>

            {/* Botão GPS */}
            <button 
              onClick={handleUseGPS}
              className="w-full h-11 rounded-2xl bg-brand-coral-500/10 hover:bg-brand-coral-500/20 text-brand-coral-600 dark:text-brand-coral-400 border border-brand-coral-500/20 dark:border-brand-coral-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 btn-premium"
            >
              <Locate className="w-4 h-4" /> Usar minha localização atual (GPS)
            </button>

            {/* Seletor de Raio de Busca */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Raio de busca (Distância)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { label: '500m', value: 0.5 },
                  { label: '1.5 km', value: 1.5 },
                  { label: '3 km', value: 3.0 },
                  { label: '5 km', value: 5.0 },
                  { label: '10 km', value: 10.0 },
                  { label: 'Sem limite', value: Infinity }
                ].map((opt) => {
                  const isActive = searchRadius === opt.value;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => setSearchRadius && setSearchRadius(opt.value)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                        isActive
                          ? 'bg-brand-coral-500 border-brand-coral-500 text-white shadow-md'
                          : 'bg-white dark:bg-brand-indigo-900/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/5 hover:border-brand-coral-500/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>



            {/* Sugestões ou Lista de Espera */}
            <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1">
              {isLoading && (
                <div className="flex items-center justify-center py-6 gap-2 text-xs text-slate-500">
                  <div className="w-4 h-4 border-2 border-brand-coral-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Buscando endereços...</span>
                </div>
              )}

              {!isLoading && waitingListCity && (
                <div className="p-5 bg-brand-coral-500/10 border border-brand-coral-500/20 rounded-2xl flex flex-col gap-3">
                  {isSubscribed ? (
                    <div className="text-center space-y-2 py-2">
                      <div className="text-2xl">🎉</div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Inscrição Confirmada!</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">Avisaremos você assim que o Giro chegar em <strong>{waitingListCity}</strong>!</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-coral-500/20 flex items-center justify-center shrink-0 text-brand-coral-500 font-bold text-sm">🚀</div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">O Giro ainda não chegou em {waitingListCity}!</h4>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">No momento, estamos ativos apenas em Curitiba - PR. Deixe seu e-mail para entrar na lista de espera!</p>
                        </div>
                      </div>
                      <form onSubmit={handleWaitingListSubmit} className="flex gap-2">
                        <input 
                          type="email" 
                          required 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Seu e-mail" 
                          className="flex-1 h-9 px-3 rounded-xl bg-white dark:bg-brand-indigo-900/50 border border-slate-200 dark:border-white/5 text-[11px] text-slate-900 dark:text-white outline-none"
                        />
                        <button type="submit" className="h-9 px-4 rounded-xl bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-bold text-[11px] btn-premium">Me avise</button>
                      </form>
                    </>
                  )}
                </div>
              )}

              {!isLoading && !waitingListCity && suggestions.length > 0 && (
                suggestions.map((item, idx) => {
                  const subtitle = item.address
                    ? [item.address.road, item.address.suburb || item.address.neighbourhood, item.address.city || item.address.town].filter(Boolean).join(', ')
                    : item.display_name;

                  return (
                    <div 
                      key={idx}
                      onClick={() => handleSelectLocation(item)}
                      className="p-3 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl cursor-pointer hover:border-brand-coral-500/30 transition-all flex items-start gap-3 active:scale-[0.99] duration-200"
                    >
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">{item.display_name.split(',')[0]}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{subtitle}</div>
                      </div>
                    </div>
                  );
                })
              )}

              {!isLoading && !waitingListCity && searchQuery && suggestions.length === 0 && (
                <div className="p-4 text-center text-xs text-slate-500">
                  Nenhum endereço encontrado. Tente pesquisar com termos mais simples.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
