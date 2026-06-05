import React, { useState, useEffect } from 'react';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Favorites from './pages/Favorites';
import Profile from './pages/Profile';
import BottomNavigation from './components/layout/BottomNavigation';
import { Place } from './types';
import LeafletMap from './components/maps/LeafletMap';
import { MOCK_PLACES } from './utils/constants';
import { ArrowLeft } from 'lucide-react';
import { supabase } from './integrations/supabase/client';
import Header from './components/common/Header';
import CollectionModal from './components/common/CollectionModal';
import AuthPromptModal from './components/common/AuthPromptModal';
import ReviewsModal from './components/places/ReviewsModal';
import { Review } from './types';
import { MOCK_REVIEWS } from './utils/constants';

type Tab = 'home' | 'explore' | 'favorites' | 'profile';

export default function App() {
  const [currentTab, setTab] = useState<Tab>('home');
  const [viewMode, setViewMode] = useState<'swipe' | 'list'>('swipe');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [activeCoords, setActiveCoords] = useState<{ lat: number; lng: number }>({
    lat: -25.4290,
    lng: -49.2671
  });
  const [mapFilterFavoritesOnly, setMapFilterFavoritesOnly] = useState(false);
  const [isDesktopMapOpen, setIsDesktopMapOpen] = useState(true);
  const [searchRadius, setSearchRadius] = useState<number>(10.0);
  const [session, setSession] = useState<any>(null);
  const [mockSession, setMockSession] = useState<any>(() => {
    const saved = localStorage.getItem('giro_mock_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(() => {
    const local = localStorage.getItem('giro_reviews');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {}
    }
    return MOCK_REVIEWS;
  });
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [reviewsPlace, setReviewsPlace] = useState<Place | null>(null);

  const isLoggedIn = !!(session || mockSession);

  const [collections, setCollections] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('giro_collections');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed["Salvos"]) {
          parsed["Salvos"] = [];
        }
        return parsed;
      } catch (e) {
        console.error('Erro ao ler coleções do localStorage:', e);
      }
    }
    return { "Salvos": [] };
  });
  const [collectionModalPlaceId, setCollectionModalPlaceId] = useState<string | null>(null);

  // Sincronizar coleções com localStorage
  useEffect(() => {
    localStorage.setItem('giro_collections', JSON.stringify(collections));
  }, [collections]);

  // Ação de salvamento automático na pasta padrão "Salvos"
  const saveToDefaultCollection = (placeId: string) => {
    setCollections(prev => {
      const next = { ...prev };
      if (!next["Salvos"]) {
        next["Salvos"] = [];
      }
      if (!next["Salvos"].includes(placeId)) {
        next["Salvos"] = [...next["Salvos"], placeId];
      }
      
      // Sincronizar com os favoritos globais
      setFavorites(prevFavs => {
        if (prevFavs.includes(placeId)) return prevFavs;
        const updatedFavs = [...prevFavs, placeId];
        localStorage.setItem('giro_favorites', JSON.stringify(updatedFavs));
        
        const sb = supabase;
        if (sb) {
          sb.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
              sb.from('profiles').update({ favorites: updatedFavs }).eq('id', session.user.id)
                .then(({ error }) => {
                  if (error) console.error('Erro ao sincronizar favoritos no Supabase:', error);
                });
            }
          });
        }
        
        return updatedFavs;
      });

      return next;
    });
  };

  // Ouvir o evento de abertura do modal de coleções (com Ação Dupla autoSave)
  useEffect(() => {
    const handleOpenCollection = (e: CustomEvent<{ placeId: string; autoSave?: boolean }>) => {
      if (e.detail && e.detail.placeId) {
        if (!isLoggedIn) {
          setShowAuthPrompt(true);
          return;
        }
        const pid = e.detail.placeId;
        setCollectionModalPlaceId(pid);
        
        if (e.detail.autoSave) {
          saveToDefaultCollection(pid);
        }
      }
    };
    window.addEventListener('giro-open-collection' as any, handleOpenCollection);
    return () => {
      window.removeEventListener('giro-open-collection' as any, handleOpenCollection);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Ouvir alterações de login/logout mockados do Profile
  useEffect(() => {
    const handleLogin = () => {
      const saved = localStorage.getItem('giro_mock_session');
      if (saved) {
        try {
          setMockSession(JSON.parse(saved));
        } catch (e) {}
      }
    };
    const handleLogout = () => {
      setMockSession(null);
    };

    window.addEventListener('giro-login', handleLogin);
    window.addEventListener('giro-logout', handleLogout);

    return () => {
      window.removeEventListener('giro-login', handleLogin);
      window.removeEventListener('giro-logout', handleLogout);
    };
  }, []);

  // Carregar favoritos e preferências do Supabase ao logar
  useEffect(() => {
    const fetchUserData = async () => {
      if (!supabase || !session?.user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('favorites, preferences')
          .eq('id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Erro ao buscar perfil do Supabase:', error);
          return;
        }

        if (data) {
          if (Array.isArray(data.favorites)) {
            setFavorites(data.favorites);
            localStorage.setItem('giro_favorites', JSON.stringify(data.favorites));
          }
          if (data.preferences) {
            window.dispatchEvent(new CustomEvent('giro-preferences-sync', { detail: data.preferences }));
          }
        } else {
          // Se o perfil ainda não existe, cria um registro inicial
          const localFavs = localStorage.getItem('giro_favorites') || '[]';
          const localPrefs = localStorage.getItem('giro_preferences') || '["pet", "outdoor", "live-music"]';
          let parsedFavs = [];
          let parsedPrefs = [];
          try { parsedFavs = JSON.parse(localFavs); } catch (e) {}
          try { parsedPrefs = JSON.parse(localPrefs); } catch (e) {}

          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              full_name: session.user.user_metadata?.full_name || session.user.email || 'Usuário Giro',
              favorites: Array.isArray(parsedFavs) ? parsedFavs : [],
              preferences: Array.isArray(parsedPrefs) ? parsedPrefs : ['pet', 'outdoor', 'live-music']
            });

          if (insertError) {
            console.error('Erro ao criar perfil inicial no Supabase:', insertError);
          }
        }
      } catch (e) {
        console.error('Erro ao sincronizar dados com Supabase:', e);
      }
    };

    fetchUserData();
  }, [session]);

  // Early theme initialization
  useEffect(() => {
    const checkTheme = () => {
      const manualTheme = localStorage.getItem('giro_theme_manual');
      
      let targetTheme: 'light' | 'dark';
      if (manualTheme === 'light' || manualTheme === 'dark') {
        targetTheme = manualTheme;
      } else {
        const hour = new Date().getHours();
        targetTheme = hour >= 6 && hour < 18 ? 'light' : 'dark';
      }

      if (targetTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      window.dispatchEvent(new CustomEvent('giro-theme-change', { detail: { theme: targetTheme } }));
    };

    checkTheme();

    const interval = setInterval(checkTheme, 60000);
    return () => clearInterval(interval);
  }, []);

  // Reset filter when changing tabs to anything other than home or explore
  useEffect(() => {
    if (currentTab !== 'explore' && currentTab !== 'home') {
      setMapFilterFavoritesOnly(false);
    }
  }, [currentTab]);

  // Listen to go-home events from header logo click
  useEffect(() => {
    const handleGoHome = () => {
      setTab('home');
      setMapFilterFavoritesOnly(false);
      setSelectedPlace(null);
      window.dispatchEvent(new CustomEvent('giro-home-reset'));
    };

    window.addEventListener('giro-go-home', handleGoHome);
    return () => window.removeEventListener('giro-go-home', handleGoHome);
  }, []);

  // Haversine Distance helper
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

  const desktopPlaces = React.useMemo(() => {
    const base = mapFilterFavoritesOnly 
      ? MOCK_PLACES.filter(place => favorites.includes(place.id))
      : MOCK_PLACES;
    return base
      .map(place => {
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
      })
      .filter(place => {
        if (mapFilterFavoritesOnly) return true;
        if (!activeCoords || searchRadius === Infinity) return true;
        return (place.distance || 0) <= searchRadius;
      });
  }, [mapFilterFavoritesOnly, favorites, activeCoords, searchRadius]);

  const handlePinClick = () => {
    setMapFilterFavoritesOnly(true);
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setTab('explore');
    } else {
      setIsDesktopMapOpen(true);
    }
  };

  const handleCloseSavedPins = () => {
    setMapFilterFavoritesOnly(false);
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setTab('home');
    } else {
      setIsDesktopMapOpen(false);
    }
  };

  // Ouvir o evento de alteração de localização customizado
  useEffect(() => {
    const handleLocationChange = (e: CustomEvent<{ lat: number; lng: number }>) => {
      if (e.detail && typeof e.detail.lat === 'number' && typeof e.detail.lng === 'number') {
        setActiveCoords({ lat: e.detail.lat, lng: e.detail.lng });
      }
    };

    window.addEventListener('giro-location-change' as any, handleLocationChange);
    return () => {
      window.removeEventListener('giro-location-change' as any, handleLocationChange);
    };
  }, []);

  // Carregar favoritos salvos do localStorage
  useEffect(() => {
    const savedFavs = localStorage.getItem('giro_favorites') || localStorage.getItem('bora_favorites');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {
        console.error('Erro ao carregar favoritos:', e);
      }
    }
  }, []);

  // Migração retroativa: garantir que todos os favoritos estejam em pelo menos uma coleção (padrão "Salvos")
  useEffect(() => {
    if (favorites.length === 0) return;
    
    setCollections(prev => {
      let changed = false;
      const next = { ...prev };
      if (!next["Salvos"]) {
        next["Salvos"] = [];
        changed = true;
      }
      
      favorites.forEach(favId => {
        const isInAny = Object.values(next).some(list => list.includes(favId));
        if (!isInAny) {
          next["Salvos"] = [...next["Salvos"], favId];
          changed = true;
        }
      });
      
      return changed ? next : prev;
    });
  }, [favorites]);

  // Carregar e injetar o estabelecimento do parceiro do localStorage
  useEffect(() => {
    try {
      const savedMerchant = localStorage.getItem('giro_merchant_place');
      if (savedMerchant) {
        const merchantPlace = JSON.parse(savedMerchant);
        if (merchantPlace && merchantPlace.id) {
          const exists = MOCK_PLACES.some(p => p.id === merchantPlace.id);
          if (!exists) {
            MOCK_PLACES.push(merchantPlace);
          }
        }
      }
    } catch (e) {
      console.error('Erro ao injetar o estabelecimento comercial no MOCK_PLACES:', e);
    }
  }, []);

  // Ouvinte para o evento de abrir avaliações
  useEffect(() => {
    const handleOpenReviews = (e: Event) => {
      const customEvent = e as CustomEvent<{ place: Place }>;
      if (customEvent.detail && customEvent.detail.place) {
        setReviewsPlace(customEvent.detail.place);
        setIsReviewsOpen(true);
      }
    };

    window.addEventListener('giro-open-reviews', handleOpenReviews);
    return () => window.removeEventListener('giro-open-reviews', handleOpenReviews);
  }, []);

  const handleSubmitReview = (placeId: string, rating: number, comment: string, images: string[]) => {
    const newReview: Review = {
      id: `r_user_${Date.now()}`,
      place_id: placeId,
      user_name: session?.user?.user_metadata?.full_name || mockSession?.user?.full_name || 'Usuário Giro',
      user_avatar: session?.user?.user_metadata?.avatar_url || mockSession?.user?.avatar_url || undefined,
      rating,
      comment,
      images: images.length > 0 ? images : undefined,
      created_at: new Date().toISOString()
    };

    setReviews(prev => {
      const updated = [newReview, ...prev];
      localStorage.setItem('giro_reviews', JSON.stringify(updated));
      return updated;
    });

    // Atualizar a média local de estrelas e a contagem de avaliações do local em tempo real
    const targetPlace = MOCK_PLACES.find(p => p.id === placeId);
    if (targetPlace) {
      const localReviews = [newReview, ...reviews.filter(r => r.place_id === placeId)];
      const sum = localReviews.reduce((acc, r) => acc + r.rating, 0);
      targetPlace.avg_rating = sum / localReviews.length;
      targetPlace.review_count = localReviews.length;
      
      // Também atualiza o state do reviewsPlace para refletir no modal imediatamente
      setReviewsPlace(prev => prev ? { ...prev, avg_rating: targetPlace.avg_rating, review_count: targetPlace.review_count } : null);
    }
  };

  // Alternar favoritos (com sincronização de coleções)
  const handleFavoriteToggle = async (id: string) => {
    if (!isLoggedIn) {
      setShowAuthPrompt(true);
      return;
    }
    const isCurrentlyFav = favorites.includes(id);
    let updated = isCurrentlyFav
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];
    
    setFavorites(updated);
    localStorage.setItem('giro_favorites', JSON.stringify(updated));

    if (isCurrentlyFav) {
      setCollections(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(name => {
          if (next[name]?.includes(id)) {
            next[name] = next[name].filter(item => item !== id);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }

    if (supabase && session?.user) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ favorites: updated })
          .eq('id', session.user.id);
        if (error) {
          console.error('Erro ao salvar favoritos no Supabase:', error);
        }
      } catch (e) {
        console.error('Erro ao salvar favoritos no Supabase:', e);
      }
    }
  };

  // Métodos de gerenciamento de coleções
  const toggleCollectionItem = async (collectionName: string, placeId: string) => {
    setCollections(prev => {
      const next = { ...prev };
      const list = next[collectionName] || [];
      const isIn = list.includes(placeId);
      
      if (isIn) {
        next[collectionName] = list.filter(id => id !== placeId);
      } else {
        next[collectionName] = [...list, placeId];
      }

      // Sincronizar com os favoritos globais
      const willBeIn = !isIn;
      setFavorites(prevFavs => {
        let updatedFavs = [...prevFavs];
        if (willBeIn) {
          if (!prevFavs.includes(placeId)) {
            updatedFavs = [...prevFavs, placeId];
          }
        } else {
          // Se foi removido, checa se ainda pertence a qualquer outra coleção
          const existsInOther = Object.keys(next).some(
            name => next[name]?.includes(placeId)
          );
          if (!existsInOther && prevFavs.includes(placeId)) {
            updatedFavs = prevFavs.filter(id => id !== placeId);
          }
        }
        
        localStorage.setItem('giro_favorites', JSON.stringify(updatedFavs));
        
        // Sincroniza Supabase
        if (supabase && session?.user) {
          supabase.from('profiles').update({ favorites: updatedFavs }).eq('id', session.user.id)
            .then(({ error }) => {
              if (error) console.error('Erro ao sincronizar favoritos no Supabase:', error);
            });
        }
        
        return updatedFavs;
      });

      return next;
    });
  };

  const createCollection = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCollections(prev => {
      if (prev[trimmed]) return prev; // já existe
      return {
        ...prev,
        [trimmed]: []
      };
    });
  };

  const deleteCollection = async (collectionName: string) => {
    setCollections(prev => {
      const next = { ...prev };
      delete next[collectionName];
      return next;
    });
  };

  const renameCollection = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;
    
    setCollections(prev => {
      const next = { ...prev };
      if (next[trimmed]) {
        next[trimmed] = Array.from(new Set([...(next[trimmed] || []), ...(next[oldName] || [])]));
      } else {
        next[trimmed] = next[oldName] || [];
      }
      delete next[oldName];
      return next;
    });
  };

  const removeFromAllCollections = (placeId: string) => {
    setCollections(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(name => {
        if (next[name]?.includes(placeId)) {
          next[name] = next[name].filter(id => id !== placeId);
        }
      });
      return next;
    });

    setFavorites(prevFavs => {
      const updatedFavs = prevFavs.filter(id => id !== placeId);
      localStorage.setItem('giro_favorites', JSON.stringify(updatedFavs));

      if (supabase && session?.user) {
        supabase
          .from('profiles')
          .update({ favorites: updatedFavs })
          .eq('id', session.user.id)
          .then(({ error }) => {
            if (error) console.error('Erro ao sincronizar favoritos no Supabase:', error);
          });
      }
      return updatedFavs;
    });
  };

  // Função para transição direta da Home para o Mapa (Explorar) ao clicar no card
  const handleSelectPlaceFromHome = (place: Place) => {
    setSelectedPlace(place);
    setTab('explore');
  };

  // Renderizar a tela com base na aba ativa
  const renderTabContent = () => {
    switch (currentTab) {
      case 'home':
        return (
          <Home 
            viewMode={viewMode}
            setViewMode={setViewMode}
            onSelectPlace={handleSelectPlaceFromHome}
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            activeCoords={activeCoords}
            onPinClick={handlePinClick}
            searchRadius={searchRadius}
            setSearchRadius={setSearchRadius}
            collections={collections}
            onDeleteCollection={deleteCollection}
            onRenameCollection={renameCollection}
          />
        );
      case 'explore':
        return (
          <Explore 
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            selectedPlace={selectedPlace}
            setSelectedPlace={setSelectedPlace}
            activeCoords={activeCoords}
            showOnlyFavoritesOnMap={mapFilterFavoritesOnly}
            onCloseOnlyFavorites={handleCloseSavedPins}
            searchRadius={searchRadius}
          />
        );
      case 'favorites':
        return (
          <Favorites 
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            onSelectPlace={handleSelectPlaceFromHome}
            setTab={setTab}
            activeCoords={activeCoords}
            collections={collections}
            onDeleteCollection={deleteCollection}
          />
        );
      case 'profile':
        return (
          <Profile 
            favoritesCount={favorites.length}
          />
        );
      default:
        return (
          <Home 
            viewMode={viewMode}
            setViewMode={setViewMode}
            onSelectPlace={handleSelectPlaceFromHome}
            favorites={favorites}
            onFavoriteToggle={handleFavoriteToggle}
            activeCoords={activeCoords}
            onPinClick={handlePinClick}
            collections={collections}
            onDeleteCollection={deleteCollection}
            onRenameCollection={renameCollection}
          />
        );
    }
  };

  return (
    <div className="h-dvh w-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-brand-indigo-950 dark:to-slate-950 font-sans overflow-hidden transition-colors duration-300">
      <main id="main-app-container" className="w-full h-full flex flex-col relative overflow-hidden bg-slate-50/50 dark:bg-brand-indigo-950/40">
        <Header 
          title={
            currentTab === 'profile' 
              ? 'Meu Perfil' 
              : currentTab === 'favorites' 
                ? 'Meus Favoritos' 
                : 'Giro'
          }
          showLocationSelector={currentTab === 'home' || currentTab === 'explore'}
          searchRadius={searchRadius}
          setSearchRadius={setSearchRadius}
        />
        <div className={`flex-1 w-full relative bg-transparent pb-16 h-full flex flex-col min-h-0 ${
          (currentTab === 'home' && viewMode === 'swipe') || currentTab === 'explore'
            ? 'overflow-hidden'
            : 'overflow-y-auto'
        }`}>
          {renderTabContent()}
        </div>
        <BottomNavigation 
          currentTab={currentTab} 
          setTab={(tab) => {
            if (tab === 'home') {
              setViewMode('swipe');
            }
            setTab(tab);
          }} 
        />
      </main>

      {collectionModalPlaceId && (
        <CollectionModal
          placeId={collectionModalPlaceId}
          collections={collections}
          onToggleCollectionItem={toggleCollectionItem}
          onCreateCollection={createCollection}
          onClose={() => setCollectionModalPlaceId(null)}
          onRemoveFromAll={removeFromAllCollections}
        />
      )}

      <AuthPromptModal
        isOpen={showAuthPrompt}
        onClose={() => setShowAuthPrompt(false)}
        onAccept={() => {
          setShowAuthPrompt(false);
          setTab('profile');
        }}
      />

      {isReviewsOpen && reviewsPlace && (
        <ReviewsModal
          place={reviewsPlace}
          isLoggedIn={isLoggedIn}
          reviews={reviews}
          onRequireAuth={() => {
            setIsReviewsOpen(false);
            setShowAuthPrompt(true);
          }}
          onSubmitReview={handleSubmitReview}
          onClose={() => {
            setIsReviewsOpen(false);
            setReviewsPlace(null);
          }}
        />
      )}
    </div>
  );
}
