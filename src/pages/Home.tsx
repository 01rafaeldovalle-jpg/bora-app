import React, { useState } from 'react';
import { Place, Category } from '../types';
import { CATEGORIES, MOCK_PLACES, MOCK_EVENTS } from '../utils/constants';
import PlaceCard from '../components/places/PlaceCard';
import SearchBar from '../components/common/SearchBar';
import * as Icons from 'lucide-react';
import { Calendar, Clock, MapPin, Sparkles, Search, Check } from 'lucide-react';

// Helper dinâmico para renderizar ícones do Lucide por nome
const IconRenderer = ({ name, className }: { name: string; className: string }) => {
  const LucideIcon = (Icons as any)[name];
  if (!LucideIcon) return <Icons.HelpCircle className={className} />;
  return <LucideIcon className={className} />;
};

interface HomeProps {
  viewMode: 'swipe' | 'list';
  setViewMode: (mode: 'swipe' | 'list') => void;
  onSelectPlace: (place: Place) => void;
  favorites: string[];
  onFavoriteToggle: (id: string) => void;
  activeCoords?: { lat: number; lng: number };
  onPinClick?: () => void;
  searchRadius?: number;
  setSearchRadius?: (radius: number) => void;
  collections: Record<string, string[]>;
  onDeleteCollection: (name: string) => void;
  onRenameCollection: (oldName: string, newName: string) => void;
}

// Fórmula matemática de Haversine para distâncias em km
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

const SYNONYM_MAP: Record<string, string[]> = {
  // ── Preferências e Vibes Globais (Tags do Perfil) ─────────
  pet: ['cachorro', 'dog', 'pet', 'pets', 'animais', 'animal', 'gato', 'gatinho', 'filhote', 'cão', 'cães', 'petfriendly', 'pet-friendly'],
  outdoor: ['sol', 'calor', 'ar livre', 'externa', 'externo', 'rua', 'gramado', 'ceu aberto', 'ventilado', 'sombra', 'dia bonito', 'ensaolarado', 'varanda', 'quintal'],
  'live-music': ['musica', 'show', 'ao vivo', 'musica ao vivo', 'banda', 'cantor', 'acustico', 'sertanejo', 'rock', 'samba', 'jazz'],
  work: ['trabalhar', 'estudar', 'wifi', 'internet', 'tomada', 'tomadas', 'notebook', 'computador', 'calmo', 'silencioso', 'co-working', 'coworking'],
  date: ['encontro', 'romantico', 'romantica', 'namorado', 'namorada', 'casal', 'casais', 'luz de velas', 'intimista', 'clima'],
  kids: ['crianca', 'criancas', 'filho', 'filhos', 'kids', 'infantil', 'brinquedo', 'brinquedos', 'playground', 'recreação', 'familia'],
  vegan: ['vegan', 'vegano', 'vegana', 'vegetariano', 'fit', 'saudavel', 'salada', 'sem carne'],

  // ── Gastronomia (ID '2') ──────────────────────────────────
  massas_italiana: ['pizza', 'pizzaria', 'massa', 'massas', 'italiana', 'italiano', 'macarrao', 'lasanha', 'nhoque', 'risoto', 'cantina'],
  hamburgueres: ['hamburguer', 'hamburgueria', 'lanche', 'lanches', 'burger', 'burgers', 'hotdog', 'pastel', 'porcao', 'batata', 'fritas'],
  asiatica: ['japa', 'sushi', 'temaki', 'sashimi', 'japonesa', 'japones', 'yakisoba', 'hot-roll', 'oriental', 'chinesa', 'tailandesa', 'poke', 'lamen'],
  carnes_churrasco: ['churrasco', 'churrascaria', 'espetinho', 'espeto', 'carne', 'carnes', 'churrasqueira', 'picanha', 'costela', 'grelhado'],
  arabe: ['arabe', 'esfiha', 'kibe', 'shawarma', 'hummus', 'falafel', 'coalhada', 'cafta', 'quibe'],
  mexicana: ['mexicana', 'mexicano', 'taco', 'burrito', 'nacho', 'guacamole', 'quesadilla', 'chilli'],
  brasileira: ['brasileira', 'brasileiro', 'prato feito', 'pf', 'feijoada', 'caseira', 'marmita', 'virado', 'arroz', 'feijao'],
  frutos_do_mar: ['frutos do mar', 'mar', 'peixe', 'peixes', 'camarao', 'ostra', 'siri', 'lagosta', 'paella'],
  saudavel_vegana: ['fit', 'saudavel', 'funcional', 'salada', 'saladas', 'suco', 'sucos', 'leve', 'sem gluten'],

  // ── Cafés e Doces (ID '3') ────────────────────────────────
  cafeterias: ['cafe', 'cafes', 'espresso', 'cafeteria', 'coado', 'cappuccino', 'mocha', 'grao', 'filtrado', 'prensa', 'infusao'],
  padarias: ['padaria', 'panificadora', 'pao', 'croissant', 'brunch', 'cafe-da-manha', 'salgados', 'coxinha', 'folhado', 'pao de queijo'],
  docerias: ['doce', 'doces', 'bolo', 'bolos', 'torta', 'tortas', 'confeitaria', 'chocolate', 'brownie', 'sobremesa', 'brigadeiro', 'macaron'],
  sorveterias: ['sorvete', 'sorvetes', 'gelato', 'gelateria', 'acai', 'milkshake', 'picole', 'sorveteria'],

  // ── Vida Noturna (ID '4') ─────────────────────────────────
  bar_pub: ['chope', 'chopp', 'cerveja', 'cervejas', 'breja', 'choperia', 'bar', 'bares', 'pub', 'pubs', 'boteco', 'bera', 'beras', 'gelada'],
  adegas_drinks: ['vinho', 'vinhos', 'adega', 'coquetel', 'coqueteis', 'drinks', 'drink', 'gin', 'espumante', 'lounge', 'whisky', 'bartender'],
  karaokes: ['karaoke', 'cantoria', 'cantar', 'microfone', 'videoke', 'musica', 'palco'],
  baladas: ['balada', 'baladas', 'clube', 'club', 'shows', 'show', 'pista', 'dancar', 'boate', 'festa', 'baladinha'],

  // ── Parques e Lazer (ID '1') ──────────────────────────────
  parques: ['parque', 'parques', 'bosque', 'bosques', 'floresta', 'verde', 'natureza', 'lago', 'lagos', 'capivara'],
  jardins: ['jardim', 'jardins', 'botanico', 'flores', 'estufa', 'jardim botanico'],
  pracas: ['praca', 'praça', 'pracinha', 'pracinhas', 'praças', 'largo', 'parquinho', 'balanco', 'skate', 'pista de skate'],
  turismo: ['turismo', 'turistico', 'ponto turistico', 'monumento', 'mirante', 'vista', 'torre', 'cartao postal', 'atracao'],
  lazer_privado: ['boliche', 'kart', 'escape', 'diversao', 'jogos', 'entretenimento', 'fliperama', 'parque de trampolim'],
  mercados_feiras: ['mercado', 'mercados', 'feira', 'feiras', 'feirinha', 'municipal', 'mercado municipal', 'foodhall', 'food hall', 'gastronomico', 'pastel de feira'],
  shoppings: ['shopping', 'shoppings', 'mall', 'malls', 'shopping center', 'shopping-center', 'galeria de compras'],

  // ── Cultura & Arte (ID '5') ───────────────────────────────
  museus: ['museu', 'museus', 'galeria de arte', 'exposicao', 'exposicoes', 'quadros', 'esculturas', 'mon', 'monumentos'],
  teatros: ['teatro', 'teatros', 'opera', 'peca', 'pecas', 'cultura', 'cultural', 'auditório', 'sala de concerto'],
  historia: ['historia', 'historico', 'historica', 'ruinas', 'casarao', 'antigo', 'monumento', 'centro historico', 'largo da ordem'],
  shows_eventos: ['show', 'shows', 'evento', 'eventos', 'festival', 'festivais', 'concerto', 'concertos', 'temporario', 'temporarios', 'festa', 'festas'],
  forro: ['forro', 'xote', 'baiao', 'xaxado', 'sanfona', 'rastape', 'pe-de-serra', 'arrasta-pe'],
  pop_funk: ['pop', 'funk', 'funk rj', 'funks', 'hits', 'reggaeton', 'pop-rock', 'anitta', 'pop/funk'],
  acustico_mpb: ['mpb', 'acustico', 'acústica', 'voz e violao', 'violao', 'cover', 'covers', 'pop rock nacional'],
  descontraido: ['descontraido', 'descontraida', 'casual', 'simples', 'boteco', 'chinelo', 'cerveja de garrafa', 'pao na chapa', 'sem frescura', 'raiz']
};

export default function Home({ 
  viewMode,
  setViewMode,
  onSelectPlace, 
  favorites, 
  onFavoriteToggle, 
  activeCoords, 
  onPinClick,
  searchRadius,
  setSearchRadius,
  collections,
  onDeleteCollection,
  onRenameCollection
}: HomeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const exists = prev.includes(categoryId);
      if (exists && (categoryId === '1' || categoryId === '2' || categoryId === '3' || categoryId === '4' || categoryId === '5')) {
        const subcategoriesToClear = 
          categoryId === '1'
            ? ['parques', 'pracas', 'mirantes', 'turismo', 'lazer_privado', 'mercados_feiras', 'shoppings']
            : categoryId === '2' 
            ? ['massas_italiana', 'hamburgueres', 'asiatica', 'carnes_churrasco', 'arabe', 'mexicana', 'brasileira', 'frutos_do_mar', 'saudavel_vegana']
            : categoryId === '3'
            ? ['cafeterias', 'padarias', 'docerias', 'sorveterias']
            : categoryId === '4'
            ? ['bar_pub', 'adegas_drinks', 'karaokes', 'baladas']
            : ['museus', 'teatros', 'shows_eventos'];
        setSelectedSubCategories(subPrev => subPrev.filter(id => !subcategoriesToClear.includes(id)));
      }
      return exists
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId];
    });
  };

  const toggleSubCategory = (subId: string) => {
    setSelectedSubCategories(prev =>
      prev.includes(subId)
        ? prev.filter(id => id !== subId)
        : [...prev, subId]
    );
  };

  // Refs de Swipe Físico
  const cardRef = React.useRef<HTMLDivElement>(null);
  const badgeLikeRef = React.useRef<HTMLDivElement>(null);
  const badgeNopeRef = React.useRef<HTMLDivElement>(null);
  const startXRef = React.useRef(0);
  const currentXRef = React.useRef(0);
  const isDraggingRef = React.useRef(false);

  const getX = (e: any) => {
    return e.touches ? e.touches[0].clientX : e.clientX;
  };

  const handleDragStart = (e: any) => {
    if (e.target.closest('button') || e.target.closest('a')) return;
    startXRef.current = getX(e);
    currentXRef.current = startXRef.current;
    isDraggingRef.current = true;
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
  };

  const handleDragMove = (e: any) => {
    if (!isDraggingRef.current) return;
    const card = cardRef.current;
    const badgeLike = badgeLikeRef.current;
    const badgeNope = badgeNopeRef.current;
    if (!card) return;

    currentXRef.current = getX(e);
    const deltaX = currentXRef.current - startXRef.current;
    const rotation = deltaX * 0.08;

    card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;

    if (badgeLike && badgeNope) {
      if (deltaX > 20) {
        badgeLike.style.opacity = String(Math.min(deltaX / 100, 1));
        badgeNope.style.opacity = '0';
      } else if (deltaX < -20) {
        badgeNope.style.opacity = String(Math.min(Math.abs(deltaX) / 100, 1));
        badgeLike.style.opacity = '0';
      } else {
        badgeLike.style.opacity = '0';
        badgeNope.style.opacity = '0';
      }
    }
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const card = cardRef.current;
    const badgeLike = badgeLikeRef.current;
    const badgeNope = badgeNopeRef.current;
    if (!card) return;

    const deltaX = currentXRef.current - startXRef.current;
    const threshold = 120;

    card.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease';

    if (deltaX > threshold) {
      card.style.transform = 'translateX(400px) rotate(45deg)';
      card.style.opacity = '0';
      setTimeout(() => {
        if (activePlace) {
          onFavoriteToggle(activePlace.id);
        }
        setActiveCardIndex((prev) => (prev + 1) % swipeQueue.length);
        resetCardStyles();
      }, 300);
    } else if (deltaX < -threshold) {
      card.style.transform = 'translateX(-400px) rotate(-45deg)';
      card.style.opacity = '0';
      setTimeout(() => {
        setActiveCardIndex((prev) => (prev + 1) % swipeQueue.length);
        resetCardStyles();
      }, 300);
    } else {
      card.style.transform = 'translateX(0) rotate(0)';
      if (badgeLike) badgeLike.style.opacity = '0';
      if (badgeNope) badgeNope.style.opacity = '0';
    }
  };

  const resetCardStyles = () => {
    const card = cardRef.current;
    const badgeLike = badgeLikeRef.current;
    const badgeNope = badgeNopeRef.current;
    if (card) {
      card.style.transform = 'translateX(0) rotate(0)';
      card.style.opacity = '1';
      card.style.transition = 'none';
    }
    if (badgeLike) badgeLike.style.opacity = '0';
    if (badgeNope) badgeNope.style.opacity = '0';
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    handleDragStart(e);

    const onMouseMove = (moveEvent: MouseEvent) => {
      handleDragMove(moveEvent);
    };

    const onMouseUp = () => {
      handleDragEnd();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const animateSwipe = (liked: boolean) => {
    if (!activePlace) return;
    const card = cardRef.current;
    const badgeLike = badgeLikeRef.current;
    const badgeNope = badgeNopeRef.current;
    if (!card) {
      if (liked) handleSwipeLike();
      else handleSwipeNope();
      return;
    }

    card.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
    if (liked) {
      if (badgeLike) badgeLike.style.opacity = '1';
      card.style.transform = 'translateX(400px) rotate(45deg)';
    } else {
      if (badgeNope) badgeNope.style.opacity = '1';
      card.style.transform = 'translateX(-400px) rotate(-45deg)';
    }
    card.style.opacity = '0';

    setTimeout(() => {
      if (liked) {
        onFavoriteToggle(activePlace.id);
      }
      setActiveCardIndex((prev) => (prev + 1) % swipeQueue.length);
      resetCardStyles();
    }, 350);
  };

  // Injetar distâncias nos locais em tempo real
  const placesWithDistance = React.useMemo(() => {
    return MOCK_PLACES.map(place => {
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
    });
  }, [activeCoords]);

  // Filtrar locais com base na busca e categoria selecionada e ordenar por proximidade
  const filteredPlaces = React.useMemo(() => {
    const filtered = placesWithDistance.filter(place => {
      const matchesSearch = (() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        // 1. Matches direct text (name, description, address)
        if (place.name.toLowerCase().includes(query) || 
            place.description.toLowerCase().includes(query) ||
            place.address.toLowerCase().includes(query)) {
          return true;
        }

        // 2. Matches synonyms mapping
        for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
          const matchesSynonym = synonyms.some(syn => syn.includes(query) || query.includes(syn));
          if (matchesSynonym) {
            // Se for uma subcategoria e o place pertence a ela
            if (place.sub_category_id === key) {
              return true;
            }
            // Se for uma tag/vibe (ex: pet, outdoor, etc.), verificamos se o nome ou descrição a descreve
            if (['pet', 'outdoor', 'live-music', 'work', 'date', 'kids', 'vegan'].includes(key)) {
              const matchesVibe = synonyms.some(keyword => 
                place.name.toLowerCase().includes(keyword) || 
                place.description.toLowerCase().includes(keyword)
              );
              if (matchesVibe) return true;
            }
          }
        }

        // 3. Matches place tags (vibe / music style)
        if (place.tags?.some(tag => {
          const normTag = tag.toLowerCase();
          return query.includes(normTag) || normTag.includes(query);
        })) {
          return true;
        }
        
        return false;
      })();

      const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(place.category_id) : true;
      const matchesRadius = (!activeCoords || searchRadius === undefined || searchRadius === Infinity) ? true : (place.distance || 0) <= searchRadius;
      const matchesSubCategory = selectedSubCategories.length > 0 ? selectedSubCategories.includes(place.sub_category_id || '') : true;
      
      const matchesTags = selectedTags.length > 0 
        ? selectedTags.some(tag => place.tags?.includes(tag))
        : true;

      return matchesSearch && matchesCategory && matchesRadius && matchesSubCategory && matchesTags;
    });

    if (activeCoords) {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return filtered;
  }, [placesWithDistance, searchQuery, selectedCategories, selectedSubCategories, selectedTags, activeCoords, searchRadius]);

  const featuredPlaces = React.useMemo(() => {
    const featured = placesWithDistance.filter(p => {
      const matchesRadius = (!activeCoords || searchRadius === undefined || searchRadius === Infinity) ? true : (p.distance || 0) <= searchRadius;
      return p.is_featured && matchesRadius;
    });
    if (activeCoords) {
      featured.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return featured;
  }, [placesWithDistance, activeCoords, searchRadius]);

  // Helpers para gerenciamento de pastas e coleções na aba Lista
  const folderList = React.useMemo(() => {
    const list = [
      {
        name: 'Todos os Salvos',
        ids: favorites,
        isDefault: true
      }
    ];

    Object.keys(collections).forEach(name => {
      if (name === 'Salvos' || name === 'Todos os Salvos') return;
      list.push({
        name,
        ids: collections[name] || [],
        isDefault: false
      });
    });

    return list;
  }, [collections, favorites]);

  const folderPlaceIds = React.useMemo(() => {
    if (!activeFolder) return [];
    if (activeFolder === 'Salvos' || activeFolder === 'Todos os Salvos') {
      return favorites;
    }
    return collections[activeFolder] || [];
  }, [activeFolder, collections, favorites]);

  const filteredFolderPlaces = React.useMemo(() => {
    if (!activeFolder) return [];
    
    const basePlaces = placesWithDistance.filter(place => folderPlaceIds.includes(place.id));
    const filtered = basePlaces.filter(place => {
      const matchesSearch = (() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return true;

        // 1. Matches direct text (name, description, address)
        if (place.name.toLowerCase().includes(query) || 
            place.description.toLowerCase().includes(query) ||
            place.address.toLowerCase().includes(query)) {
          return true;
        }

        // 2. Matches synonyms mapping
        for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
          const matchesSynonym = synonyms.some(syn => syn.includes(query) || query.includes(syn));
          if (matchesSynonym) {
            // Se for uma subcategoria e o place pertence a ela
            if (place.sub_category_id === key) {
              return true;
            }
            // Se for uma tag/vibe (ex: pet, outdoor, etc.), verificamos se o nome ou descrição a descreve
            if (['pet', 'outdoor', 'live-music', 'work', 'date', 'kids', 'vegan'].includes(key)) {
              const matchesVibe = synonyms.some(keyword => 
                place.name.toLowerCase().includes(keyword) || 
                place.description.toLowerCase().includes(keyword)
              );
              if (matchesVibe) return true;
            }
          }
        }

        // 3. Matches place tags (vibe / music style)
        if (place.tags?.some(tag => {
          const normTag = tag.toLowerCase();
          return query.includes(normTag) || normTag.includes(query);
        })) {
          return true;
        }
        
        return false;
      })();

      const matchesCategory = selectedCategories.length > 0 ? selectedCategories.includes(place.category_id) : true;
      const matchesRadius = (!activeCoords || searchRadius === undefined || searchRadius === Infinity) ? true : (place.distance || 0) <= searchRadius;
      const matchesSubCategory = selectedSubCategories.length > 0 ? selectedSubCategories.includes(place.sub_category_id || '') : true;
      
      const matchesTags = selectedTags.length > 0 
        ? selectedTags.some(tag => place.tags?.includes(tag))
        : true;

      return matchesSearch && matchesCategory && matchesRadius && matchesSubCategory && matchesTags;
    });

    if (activeCoords) {
      filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return filtered;
  }, [placesWithDistance, folderPlaceIds, activeFolder, searchQuery, selectedCategories, selectedSubCategories, selectedTags, activeCoords, searchRadius]);

  const getFolderCover = (placeIds: string[]) => {
    if (placeIds && placeIds.length > 0) {
      const place = MOCK_PLACES.find(p => p.id === placeIds[0]);
      if (place) return place.image_url;
    }
    return null;
  };

  // Reset active card index when filter changes
  React.useEffect(() => {
    setActiveCardIndex(0);
  }, [searchQuery, selectedCategories, selectedSubCategories]);

  // Listen to home reset events (e.g. from header logo click)
  React.useEffect(() => {
    const handleReset = () => {
      setSearchQuery('');
      setSelectedCategories([]);
      setSelectedSubCategories([]);
      setExpandedCategory(null);
      setViewMode('swipe');
      setActiveFolder(null);
      setActiveCardIndex(0);
    };

    window.addEventListener('giro-home-reset', handleReset);
    return () => window.removeEventListener('giro-home-reset', handleReset);
  }, []);

  const handleRename = () => {
    const trimmed = tempName.trim();
    if (!trimmed || trimmed === activeFolder) {
      setIsEditingName(false);
      return;
    }
    onRenameCollection(activeFolder!, trimmed);
    setActiveFolder(trimmed);
    setIsEditingName(false);
  };

  const handleDeleteClick = () => {
    if (!activeFolder) return;
    const confirmDelete = window.confirm("Tem certeza que deseja excluir esta pasta? Os locais salvos não serão apagados da lista geral.");
    if (confirmDelete) {
      onDeleteCollection(activeFolder);
      setActiveFolder(null);
    }
  };

  const swipeQueue = filteredPlaces;
  const activePlace = swipeQueue[activeCardIndex] || null;
  const nextPlace = swipeQueue[(activeCardIndex + 1) % swipeQueue.length] || null;

  const handleSwipeLike = () => {
    if (!activePlace) return;
    onFavoriteToggle(activePlace.id);
    setActiveCardIndex((prev) => (prev + 1) % swipeQueue.length);
  };

  const handleSwipeNope = () => {
    if (!activePlace) return;
    setActiveCardIndex((prev) => (prev + 1) % swipeQueue.length);
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPinClick) {
      onPinClick();
    }
  };

  return (
    <div className="pb-24 text-slate-100 w-full flex flex-col items-center">

      {/* Barra de Busca */}
      {!(viewMode === 'list' && activeFolder === null) && (
        <div className="px-6 pt-4 max-w-6xl mx-auto w-full animate-fade-in">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      )}

      {/* Switch View Selectors */}
      {!(viewMode === 'list' && activeFolder === null) && (
        <div className="px-6 py-2 flex justify-between items-center mt-2 max-w-6xl mx-auto w-full gap-2">
          {/* Seletor Radar / Salvos */}
          <div className="bg-slate-100 dark:bg-brand-indigo-950/85 border border-slate-200/60 dark:border-white/5 p-1 rounded-xl flex gap-1 shadow-inner transition-colors duration-300">
            <button 
              onClick={() => {
                setActiveFolder(null);
                setViewMode('swipe');
              }} 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'swipe' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:white'}`}
            >
              <Search className="w-3.5 h-3.5" /> Radar
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${viewMode === 'list' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:white'}`}
            >
              <Icons.Bookmark className="w-3.5 h-3.5" /> Salvos
            </button>
          </div>

          {/* Botão de Filtros */}
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all bg-brand-coral-500 hover:bg-brand-coral-600 active:scale-95 text-white shadow-md shadow-brand-coral-500/20 border border-transparent"
          >
            <Icons.Filter className="w-3.5 h-3.5 text-white" />
            <span>
              {selectedCategories.length === 0 
                ? 'Filtros' 
                : `Filtros (${selectedCategories.length})`}
            </span>
          </button>
        </div>
      )}

      {(viewMode === 'list' && activeFolder === null) && (
        <div className="px-6 py-2 flex justify-start items-center mt-2 max-w-6xl mx-auto w-full">
          {/* Seletor Radar / Salvos na lista de pastas (sem filtro) */}
          <div className="bg-slate-100 dark:bg-brand-indigo-950/85 border border-slate-200/60 dark:border-white/5 p-1 rounded-xl flex gap-1 shadow-inner transition-colors duration-300">
            <button 
              onClick={() => {
                setActiveFolder(null);
                setViewMode('swipe');
              }} 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${(viewMode as string) === 'swipe' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:white'}`}
            >
              <Search className="w-3.5 h-3.5" /> Radar
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${(viewMode as string) === 'list' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:white'}`}
            >
              <Icons.Bookmark className="w-3.5 h-3.5" /> Salvos
            </button>
          </div>
        </div>
      )}

      {viewMode === 'swipe' ? (
        <div className="flex-1 flex flex-col justify-center items-center py-2 px-6 relative max-w-md mx-auto animate-fade-in w-full min-h-0">
          {swipeQueue.length > 0 && activePlace ? (
            <div className="w-full flex-1 flex flex-col justify-center items-center min-h-0">
              {/* Card Container */}
              <div className="w-full flex-1 min-h-[300px] max-h-[500px] h-[60vh] relative select-none">
                {/* Background Card (Next Card) */}
                {swipeQueue.length > 1 && nextPlace && (
                  <div className="absolute inset-x-2 bottom-[-16px] h-full rounded-[32px] overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-brand-indigo-900/40 opacity-60 scale-[0.93] translate-y-4 -z-10 pointer-events-none flex flex-col shadow-lg">
                    <img src={nextPlace.image_url} alt={nextPlace.name} className="w-full h-full object-cover animate-pulse" />
                  </div>
                )}

                {/* Active Card */}
                <div 
                  ref={cardRef}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleDragStart}
                  onTouchMove={handleDragMove}
                  onTouchEnd={handleDragEnd}
                  className="w-full h-full relative cursor-grab active:cursor-grabbing select-none"
                >
                  {/* Swipe overlays */}
                  <div 
                    ref={badgeLikeRef}
                    className="absolute top-8 left-8 border-4 border-brand-teal-500 text-brand-teal-500 dark:border-brand-teal-400 dark:text-brand-teal-400 px-4 py-2 rounded-xl text-xl font-black uppercase tracking-wider -rotate-12 opacity-0 z-20 pointer-events-none transition-opacity duration-100"
                  >
                    Giro!
                  </div>
                  <div 
                    ref={badgeNopeRef}
                    className="absolute top-8 right-8 border-4 border-brand-coral-500 text-brand-coral-500 px-4 py-2 rounded-xl text-xl font-black uppercase tracking-wider rotate-12 opacity-0 z-20 pointer-events-none transition-opacity duration-100"
                  >
                    Nem...
                  </div>

                  <PlaceCard
                    place={activePlace}
                    isFavorited={favorites.includes(activePlace.id)}
                    onFavoriteToggle={onFavoriteToggle}
                    onSelect={onSelectPlace}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-[32px] p-8 text-center border border-white/5 w-full">
              <div className="w-16 h-16 rounded-full bg-brand-indigo-900/50 border border-white/5 flex items-center justify-center mb-4 text-brand-coral-500 mx-auto">
                <Icons.Compass className="w-8 h-8 animate-spin-slow" />
              </div>
              <h3 className="text-lg font-outfit font-bold text-white mb-2">Sem locais nesta categoria</h3>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed mx-auto">Selecione outra categoria ou limpe filtros para continuar combinando.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategories([]);
                  setSelectedSubCategories([]);
                  setSelectedTags([]);
                }}
                className="mt-4 text-xs font-semibold text-brand-coral-400 border border-brand-coral-500/20 px-4 py-2 rounded-full hover:bg-brand-coral-500/10 transition-all"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      ) : (
        activeFolder === null ? (
          <div className="w-full flex flex-col animate-fade-in">
            {/* Lista de Pastas/Coleções */}
            <div className="py-4 px-6 max-w-6xl mx-auto w-full">
              <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest mb-4">
                Minhas Coleções
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {folderList.map((folder) => {
                  const coverUrl = getFolderCover(folder.ids);
                  return (
                    <div 
                      key={folder.name}
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategories([]);
                        setActiveFolder(folder.name);
                      }}
                      className="group cursor-pointer flex flex-col h-full rounded-[24px] overflow-hidden glass-card border border-slate-200/15 p-3 hover:border-brand-coral-500/20 dark:hover:border-white/10 transition-all duration-300 hover:scale-[1.02] active:scale-[0.99] bg-white/70 dark:bg-brand-indigo-950/40"
                    >
                      {/* Capa */}
                      <div className="relative aspect-video w-full rounded-[18px] overflow-hidden bg-brand-indigo-950 flex items-center justify-center mb-3">
                        {coverUrl ? (
                          <img src={coverUrl} alt={folder.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-brand-coral-500/10 to-brand-indigo-950 flex items-center justify-center">
                            <Icons.FolderHeart className="w-8 h-8 text-brand-coral-500/80" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                      </div>

                      {/* Textos */}
                      <div className="px-1.5 pb-1 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-sm font-outfit font-black text-slate-900 dark:text-white group-hover:text-brand-coral-500 transition-colors line-clamp-1 mb-0.5">
                            {folder.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                            {folder.ids.length} {folder.ids.length === 1 ? 'local' : 'locais'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col animate-fade-in">
            {/* Locais da Pasta Ativa */}
            <div className="py-4 px-6 max-w-6xl mx-auto w-full">
              {/* Cabeçalho com botão voltar e título */}
              <div className="flex items-center justify-between mb-6 border-b border-slate-200/50 dark:border-white/5 pb-4 gap-4 flex-wrap">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategories([]);
                    setActiveFolder(null);
                    setIsEditingName(false);
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-coral-500 dark:hover:text-brand-coral-400 py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 active:scale-[0.98] transition-all text-slate-800 dark:text-white"
                >
                  <Icons.ArrowLeft className="w-3.5 h-3.5" />
                  Voltar para Pastas
                </button>
                
                {isEditingName ? (
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRename();
                    }}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="h-9 px-3 rounded-xl text-xs font-bold bg-white dark:bg-white/5 border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white focus:outline-none focus:border-brand-coral-500"
                      autoFocus
                      maxLength={30}
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-emerald-550 text-white hover:bg-emerald-600 active:scale-95 transition-all"
                      title="Confirmar"
                    >
                      <Icons.Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 text-slate-650 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
                      title="Cancelar"
                    >
                      <Icons.X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Icons.FolderHeart className="w-4 h-4 text-brand-coral-500" />
                      <h3 className="text-sm font-outfit font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        {activeFolder}
                      </h3>
                    </div>
                    {!(activeFolder === 'Todos os Salvos' || activeFolder === 'Salvos') && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setTempName(activeFolder || '');
                            setIsEditingName(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-coral-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-all"
                          title="Editar nome"
                        >
                          <Icons.Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={handleDeleteClick}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Excluir pasta"
                        >
                          <Icons.Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Listagem */}
              {folderPlaceIds.length === 0 ? (
                <div className="glass-card rounded-[32px] p-8 text-center border border-slate-200/50 dark:border-white/5 w-full max-w-md mx-auto my-8 bg-white/70 dark:bg-brand-indigo-950/40">
                  <div className="w-16 h-16 rounded-full bg-brand-indigo-900/50 border border-white/5 flex items-center justify-center mb-4 text-brand-coral-500 mx-auto">
                    <Icons.FolderHeart className="w-8 h-8 text-brand-coral-500/80" />
                  </div>
                  <h3 className="text-base font-outfit font-bold text-slate-950 dark:text-white mb-2">Pasta vazia</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Nenhum local nesta pasta. Use o Swipe para salvar locais aqui!
                  </p>
                </div>
              ) : filteredFolderPlaces.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredFolderPlaces.map((place) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      isFavorited={favorites.includes(place.id)}
                      onFavoriteToggle={onFavoriteToggle}
                      onSelect={onSelectPlace}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-card rounded-3xl p-8 text-center border border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-brand-indigo-950/40">
                  <p className="text-sm text-slate-550 dark:text-slate-400">Nenhum local encontrado para a sua seleção nesta pasta.</p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                      setSelectedSubCategories([]);
                      setSelectedTags([]);
                    }}
                    className="mt-4 text-xs font-semibold text-brand-coral-400 border border-brand-coral-500/20 px-4 py-2 rounded-full hover:bg-brand-coral-500/10 transition-all"
                  >
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Modal de Categorias (Múltipla Seleção) */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-[11000] backdrop-blur-md bg-black/60 flex items-center justify-center p-4 animate-fade-in">
          {/* Background click to close */}
          <div className="absolute inset-0" onClick={() => setIsCategoryModalOpen(false)} />
          
          {/* Modal Container */}
          <div className="bg-white dark:bg-brand-indigo-950 w-full max-w-sm rounded-[32px] p-6 border border-slate-200 dark:border-white/10 shadow-2xl relative z-10 animate-[zoomIn_0.2s_ease-out] flex flex-col text-slate-900 dark:text-slate-100 max-h-[80vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-5 shrink-0">
              <div className="flex items-center gap-2">
                <Icons.Filter className="w-5 h-5 text-brand-coral-500" />
                <h3 className="text-base font-outfit font-black text-slate-900 dark:text-white">Filtros</h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
              >
                <Icons.X className="w-4 h-4" />
              </button>
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 mb-5 scrollbar-thin">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <React.Fragment key={cat.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        const hasSubcategories = cat.id === '1' || cat.id === '2' || cat.id === '3' || cat.id === '4' || cat.id === '5';
                        if (hasSubcategories) {
                          const isOpening = expandedCategory !== cat.id;
                          setExpandedCategory(isOpening ? cat.id : null);
                          if (isOpening && !isSelected) {
                            toggleCategory(cat.id);
                          }
                        } else {
                          toggleCategory(cat.id);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          const hasSubcategories = cat.id === '1' || cat.id === '2' || cat.id === '3' || cat.id === '4' || cat.id === '5';
                          if (hasSubcategories) {
                            const isOpening = expandedCategory !== cat.id;
                            setExpandedCategory(isOpening ? cat.id : null);
                            if (isOpening && !isSelected) {
                                toggleCategory(cat.id);
                            }
                          } else {
                            toggleCategory(cat.id);
                          }
                        }
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-brand-coral-500/40 ${
                        isSelected
                          ? 'bg-brand-coral-500/10 border-brand-coral-500 text-brand-coral-600 dark:text-brand-coral-400 font-bold'
                          : 'bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl transition-colors ${
                          isSelected ? 'bg-brand-coral-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-450'
                        }`}>
                          <IconRenderer name={cat.icon} className="w-4 h-4" />
                        </div>
                        <span className="truncate text-xs">{cat.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {(cat.id === '1' || cat.id === '2' || cat.id === '3' || cat.id === '4' || cat.id === '5') && (
                          <div className="text-slate-400 dark:text-slate-500">
                            {expandedCategory === cat.id ? (
                              <Icons.ChevronUp className="w-4 h-4" />
                            ) : (
                              <Icons.ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        )}
                        <div 
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(cat.id);
                            if (!isSelected) {
                              setExpandedCategory(cat.id);
                            } else {
                              setExpandedCategory(null);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              e.preventDefault();
                              toggleCategory(cat.id);
                              if (!isSelected) {
                                setExpandedCategory(cat.id);
                              } else {
                                setExpandedCategory(null);
                              }
                            }
                          }}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-coral-500 ${
                            isSelected
                              ? 'bg-brand-coral-500 border-brand-coral-500'
                              : 'border-slate-300 dark:border-white/20'
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Subcategorias de Parques e Lazer (ID '1') */}
                    {cat.id === '1' && expandedCategory === '1' && (
                      <div className="pl-6 pr-2 py-1.5 space-y-1.5 animate-[fadeInUp_0.2s_ease-out] border-l-2 border-brand-coral-500/30 ml-5 my-1">
                        {[
                          { id: 'parques', name: 'Parques', emoji: '🌳' },
                          { id: 'pracas', name: 'Praças', emoji: '🌸' },
                          { id: 'mirantes', name: 'Mirantes', emoji: '👁️' },
                          { id: 'turismo', name: 'Pontos Turísticos', emoji: '🗺️' },
                          { id: 'lazer_privado', name: 'Lazer & Diversão', emoji: '🎡' },
                          { id: 'mercados_feiras', name: 'Mercados & Feiras', emoji: '🏛️' },
                          { id: 'shoppings', name: 'Shoppings', emoji: '🛍️' }
                        ].map((sub) => {
                          const isSubSelected = selectedSubCategories.includes(sub.id);
                          return (
                            <button
                              type="button"
                              key={sub.id}
                              onClick={() => toggleSubCategory(sub.id)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                isSubSelected
                                  ? 'bg-brand-coral-500/5 border-brand-coral-500/60 text-brand-coral-600 dark:text-brand-coral-400 font-semibold'
                                  : 'bg-slate-50/50 dark:bg-white/3 border-slate-200/40 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100/55 dark:hover:bg-white/8'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{sub.emoji}</span>
                                <span className="text-xs">{sub.name}</span>
                              </div>
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                isSubSelected
                                  ? 'bg-brand-coral-500 border-brand-coral-500 text-white'
                                  : 'border-slate-300 dark:border-white/20'
                              }`}>
                                {isSubSelected && (
                                  <Check className="w-2.5 h-2.5 text-white" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Subcategorias de Gastronomia (Apenas ID '2' por enquanto) */}
                    {cat.id === '2' && expandedCategory === '2' && (
                      <div className="pl-6 pr-2 py-1.5 space-y-1.5 animate-[fadeInUp_0.2s_ease-out] border-l-2 border-brand-coral-500/30 ml-5 my-1">
                        {[
                          { id: 'massas_italiana', name: 'Pizzas & Massas', emoji: '🍕' },
                          { id: 'hamburgueres', name: 'Hambúrgueres & Lanches', emoji: '🍔' },
                          { id: 'asiatica', name: 'Asiática', emoji: '🍣' },
                          { id: 'carnes_churrasco', name: 'Carnes & Churrasco', emoji: '🥩' },
                          { id: 'arabe', name: 'Comida Árabe', emoji: '🧆' },
                          { id: 'mexicana', name: 'Comida Mexicana', emoji: '🌮' },
                          { id: 'brasileira', name: 'Brasileira & Caseira', emoji: '🥘' },
                          { id: 'frutos_do_mar', name: 'Frutos do Mar', emoji: '🍤' },
                          { id: 'saudavel_vegana', name: 'Saudável & Vegana', emoji: '🥗' }
                        ].map((sub) => {
                          const isSubSelected = selectedSubCategories.includes(sub.id);
                          return (
                            <button
                              type="button"
                              key={sub.id}
                              onClick={() => toggleSubCategory(sub.id)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                isSubSelected
                                  ? 'bg-brand-coral-500/5 border-brand-coral-500/60 text-brand-coral-600 dark:text-brand-coral-400 font-semibold'
                                  : 'bg-slate-50/50 dark:bg-white/3 border-slate-200/40 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100/55 dark:hover:bg-white/8'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{sub.emoji}</span>
                                <span className="text-xs">{sub.name}</span>
                              </div>
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                isSubSelected
                                  ? 'bg-brand-coral-500 border-brand-coral-500 text-white'
                                  : 'border-slate-300 dark:border-white/20'
                              }`}>
                                {isSubSelected && (
                                  <Check className="w-2.5 h-2.5 text-white" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Subcategorias de Cafés e Doces (ID '3') */}
                    {cat.id === '3' && expandedCategory === '3' && (
                      <div className="pl-6 pr-2 py-1.5 space-y-1.5 animate-[fadeInUp_0.2s_ease-out] border-l-2 border-brand-coral-500/30 ml-5 my-1">
                        {[
                          { id: 'cafeterias', name: 'Cafés', emoji: '☕' },
                          { id: 'padarias', name: 'Padarias', emoji: '🥐' },
                          { id: 'docerias', name: 'Confeitarias', emoji: '🍰' },
                          { id: 'sorveterias', name: 'Sorveterias', emoji: '🍨' }
                        ].map((sub) => {
                          const isSubSelected = selectedSubCategories.includes(sub.id);
                          return (
                            <button
                              type="button"
                              key={sub.id}
                              onClick={() => toggleSubCategory(sub.id)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                isSubSelected
                                  ? 'bg-brand-coral-500/5 border-brand-coral-500/60 text-brand-coral-600 dark:text-brand-coral-400 font-semibold'
                                  : 'bg-slate-50/50 dark:bg-white/3 border-slate-200/40 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100/55 dark:hover:bg-white/8'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{sub.emoji}</span>
                                <span className="text-xs">{sub.name}</span>
                              </div>
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                isSubSelected
                                  ? 'bg-brand-coral-500 border-brand-coral-500 text-white'
                                  : 'border-slate-300 dark:border-white/20'
                              }`}>
                                {isSubSelected && (
                                  <Check className="w-2.5 h-2.5 text-white" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Subcategorias de Vida Noturna (ID '4') */}
                    {cat.id === '4' && expandedCategory === '4' && (
                      <div className="pl-6 pr-2 py-1.5 space-y-1.5 animate-[fadeInUp_0.2s_ease-out] border-l-2 border-brand-coral-500/30 ml-5 my-1">
                        {[
                          { id: 'bar_pub', name: 'Bares & Pubs', emoji: '🍺' },
                          { id: 'adegas_drinks', name: 'Adega & Drinks', emoji: '🍹' },
                          { id: 'karaokes', name: 'Karaokê', emoji: '🎤' },
                          { id: 'baladas', name: 'Baladas & Shows', emoji: '🕺' }
                        ].map((sub) => {
                          const isSubSelected = selectedSubCategories.includes(sub.id);
                          return (
                            <button
                              type="button"
                              key={sub.id}
                              onClick={() => toggleSubCategory(sub.id)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                isSubSelected
                                  ? 'bg-brand-coral-500/5 border-brand-coral-500/60 text-brand-coral-600 dark:text-brand-coral-400 font-semibold'
                                  : 'bg-slate-50/50 dark:bg-white/3 border-slate-200/40 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100/55 dark:hover:bg-white/8'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{sub.emoji}</span>
                                <span className="text-xs">{sub.name}</span>
                              </div>
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                isSubSelected
                                  ? 'bg-brand-coral-500 border-brand-coral-500 text-white'
                                  : 'border-slate-300 dark:border-white/20'
                              }`}>
                                {isSubSelected && (
                                  <Check className="w-2.5 h-2.5 text-white" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Subcategorias de Cultura & Arte (ID '5') */}
                    {cat.id === '5' && expandedCategory === '5' && (
                      <div className="pl-6 pr-2 py-1.5 space-y-1.5 animate-[fadeInUp_0.2s_ease-out] border-l-2 border-brand-coral-500/30 ml-5 my-1">
                        {[
                          { id: 'museus', name: 'Museus & Galerias', emoji: '🎨' },
                          { id: 'teatros', name: 'Teatros & Shows', emoji: '🎭' },
                          { id: 'shows_eventos', name: 'Shows & Eventos', emoji: '📅' }
                        ].map((sub) => {
                          const isSubSelected = selectedSubCategories.includes(sub.id);
                          return (
                            <button
                              type="button"
                              key={sub.id}
                              onClick={() => toggleSubCategory(sub.id)}
                              className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                isSubSelected
                                  ? 'bg-brand-coral-500/5 border-brand-coral-500/60 text-brand-coral-600 dark:text-brand-coral-400 font-semibold'
                                  : 'bg-slate-50/50 dark:bg-white/3 border-slate-200/40 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-100/55 dark:hover:bg-white/8'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{sub.emoji}</span>
                                <span className="text-xs">{sub.name}</span>
                              </div>
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                isSubSelected
                                  ? 'bg-brand-coral-500 border-brand-coral-500 text-white'
                                  : 'border-slate-300 dark:border-white/20'
                              }`}>
                                {isSubSelected && (
                                  <Check className="w-2.5 h-2.5 text-white" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Estilo & Vibe Section */}
              <div className="mt-4 pt-4 border-t border-slate-150 dark:border-white/5">
                <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Estilo & Vibe</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'rock', name: 'Rock', icon: '🎸' },
                    { id: 'eletronica', name: 'Eletrônica', icon: '⚡' },
                    { id: 'sertanejo', name: 'Sertanejo', icon: '🤠' },
                    { id: 'samba_pagode', name: 'Samba & Pagode', icon: '🥁' },
                    { id: 'jazz_blues', name: 'Jazz & Blues', icon: '🎷' },
                    { id: 'romantico', name: 'Romântico', icon: '🕯️' },
                    { id: 'alternativo', name: 'Alternativo/Indie', icon: '🌿' },
                    { id: 'sofisticado', name: 'Sofisticado', icon: '💎' },
                    { id: 'forro', name: 'Forró', icon: '🪗' },
                    { id: 'pop_funk', name: 'Pop & Funk', icon: '🎤' },
                    { id: 'acustico_mpb', name: 'Acústico & MPB', icon: '🎸' },
                    { id: 'descontraido', name: 'Descontraído', icon: '🍻' }
                  ].map((tag) => {
                    const isSelected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          setSelectedTags(prev => 
                            prev.includes(tag.id) 
                              ? prev.filter(t => t !== tag.id) 
                              : [...prev, tag.id]
                          );
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-semibold transition-all ${
                          isSelected
                            ? 'bg-brand-coral-500 border-brand-coral-500 text-white shadow-sm'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-655 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-white/8'
                        }`}
                      >
                        <span>{tag.icon}</span>
                        <span>{tag.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 border-t border-slate-100 dark:border-white/5 pt-4 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedSubCategories([]);
                  setExpandedCategory(null);
                  setSelectedTags([]);
                }}
                disabled={selectedCategories.length === 0 && selectedSubCategories.length === 0 && selectedTags.length === 0}
                className="flex-1 py-2.5 text-center text-xs font-bold text-slate-500 dark:text-slate-450 hover:text-brand-coral-500 dark:hover:text-brand-coral-400 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              >
                Limpar Filtros
              </button>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="flex-1 py-2.5 text-center text-xs font-bold text-white bg-brand-coral-500 hover:bg-brand-coral-600 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-brand-coral-500/10"
              >
                Aplicar
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
