import { Category, Place, Event } from '../types';

export const CATEGORIES: Category[] = [
  { id: '1', name: 'Parques e Lazer', slug: 'parques', icon: 'Trees', color: 'teal' },
  { id: '2', name: 'Gastronomia', slug: 'gastronomia', icon: 'Utensils', color: 'coral' },
  { id: '3', name: 'Cafés e Doces', slug: 'cafes', icon: 'Coffee', color: 'gold' },
  { id: '4', name: 'Vida Noturna', slug: 'noite', icon: 'Wine', color: 'indigo' },
  { id: '5', name: 'Cultura & Arte', slug: 'cultura', icon: 'Sparkles', color: 'teal' }
];

export const MOCK_PLACES: Place[] = [
  {
    id: 'p1',
    name: 'Jardim Botânico de Curitiba',
    description: 'Um dos principais cartões-postais da cidade. Possui uma estufa icônica inspirada no Palácio de Cristal de Londres, jardins geométricos e o Museu Botânico.',
    address: 'R. Eng. Ostoja Roguski, s/n - Jardim Botânico, Curitiba - PR',
    phone: '(41) 3264-6994',
    instagram_handle: 'jardimbotanicocuritiba',
    website_url: 'https://www.curitiba.pr.gov.br',
    category_id: '1',
    latitude: -25.4431,
    longitude: -49.2397,
    image_url: 'https://images.unsplash.com/photo-1599839462784-5f50a8a6ba20?auto=format&fit=crop&w=800&q=80',
    avg_rating: 4.8,
    review_count: 1420,
    price_range: '$',
    is_featured: true,
    is_verified: true,
    operating_hours: {
      'Seg - Dom': '06:00 - 19:30'
    }
  },
  {
    id: 'p2',
    name: 'Ópera de Arame',
    description: 'Teatro tubular construído com estrutura de aço e teto de policarbonato, integrado a um cenário natural de pedreira desativada, lagos e cachoeira.',
    address: 'R. João Gava, 970 - Abranches, Curitiba - PR',
    phone: '(41) 3354-2662',
    instagram_handle: 'operadearameoficial',
    website_url: 'https://parqueoperadearame.com.br',
    category_id: '5',
    latitude: -25.3853,
    longitude: -49.2766,
    image_url: 'https://images.unsplash.com/photo-1549693578-d683be217e58?auto=format&fit=crop&w=800&q=80',
    avg_rating: 4.7,
    review_count: 980,
    price_range: '$$',
    is_featured: true,
    is_verified: true,
    operating_hours: {
      'Ter - Dom': '10:00 - 18:00'
    }
  },
  {
    id: 'p3',
    name: 'Parque Barigui',
    description: 'O maior e mais frequentado parque de Curitiba. Conta com pistas de corrida, churrasqueiras, lagos imensos e as famosas capivaras residentes da cidade.',
    address: 'Av. Cândido Hartmann, s/n - Bigorrilho, Curitiba - PR',
    category_id: '1',
    latitude: -25.4248,
    longitude: -49.3075,
    image_url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&w=800&q=80',
    avg_rating: 4.8,
    review_count: 2450,
    price_range: '$',
    is_featured: true,
    is_verified: true,
    operating_hours: {
      'Seg - Dom': '24 horas (aberto)'
    }
  },
  {
    id: 'p4',
    name: 'Bar do Alemão (Schwarzwald)',
    description: 'Tradicional taberna germânica no coração do Centro Histórico. Famosa pelo chopp Submarino e pelo gigantesco Eisbein (joelho de porco).',
    address: 'R. Dr. Claudino dos Santos, 63 - São Francisco, Curitiba - PR',
    phone: '(41) 3223-2585',
    instagram_handle: 'bardoalemaocuritiba',
    website_url: 'https://bardoalemao.com.br',
    category_id: '4',
    latitude: -25.4267,
    longitude: -49.2721,
    image_url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=80',
    avg_rating: 4.6,
    review_count: 1890,
    price_range: '$$',
    is_featured: false,
    is_verified: true,
    operating_hours: {
      'Seg - Dom': '11:00 - 02:00'
    }
  },
  {
    id: 'p5',
    name: 'Terrazza 40',
    description: 'Restaurante panorâmico no topo do Edifício Champagnat. Oferece alta gastronomia italiana e uruguaia com uma vista de 360 graus espetacular de Curitiba.',
    address: 'R. Padre Anchieta, 1287 - Bigorrilho, Curitiba - PR',
    phone: '(41) 3010-1287',
    instagram_handle: 'terrazza40',
    website_url: 'https://terrazza40.com.br',
    category_id: '2',
    latitude: -25.4309,
    longitude: -49.2931,
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    avg_rating: 4.7,
    review_count: 670,
    price_range: '$$$',
    is_featured: true,
    is_verified: true,
    operating_hours: {
      'Seg - Sáb': '12:00 - 16:00, 19:00 - 23:30',
      'Dom': '12:00 - 17:00'
    }
  },
  {
    id: 'p6',
    name: 'Lucca Cafés Especiais',
    description: 'Uma das cafeterias mais premiadas do Brasil, pioneira em cafés especiais de micro-lotes torrados no local e acompanhados de excelente confeitaria.',
    address: 'Alameda Pres. Taunay, 40 - Batel, Curitiba - PR',
    phone: '(41) 3016-6675',
    instagram_handle: 'luccacafesespeciais',
    category_id: '3',
    latitude: -25.4378,
    longitude: -49.2825,
    image_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    avg_rating: 4.5,
    review_count: 530,
    price_range: '$$',
    is_featured: false,
    is_verified: true,
    operating_hours: {
      'Seg - Sáb': '09:00 - 20:00',
      'Dom': '10:00 - 20:00'
    }
  },
  {
    id: 'p7',
    name: 'Museu Oscar Niemeyer (MON)',
    description: 'Mais conhecido como "Museu do Olho". Abriga exposições incríveis de artes visuais, design e arquitetura, em uma estrutura futurista icônica.',
    address: 'R. Marechal Hermes, 999 - Centro Cívico, Curitiba - PR',
    phone: '(41) 3350-4400',
    instagram_handle: 'museuoscarniemeyer',
    website_url: 'https://www.museuoscarniemeyer.org.br',
    category_id: '5',
    latitude: -25.4098,
    longitude: -49.2669,
    image_url: 'https://images.unsplash.com/photo-1561055657-b9e0bf0fa360?auto=format&fit=crop&w=800&q=80',
    avg_rating: 4.8,
    review_count: 1560,
    price_range: '$$',
    is_featured: true,
    is_verified: true,
    operating_hours: {
      'Ter - Dom': '10:00 - 18:00'
    }
  }
];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    name: 'Feira do Largo da Ordem',
    description: 'A tradicional feira de artesanato e culinária que acontece todos os domingos no Centro Histórico de Curitiba. Um passeio imperdível e vibrante.',
    latitude: -25.4278,
    longitude: -49.2718,
    starts_at: '2026-06-07T09:00:00',
    ends_at: '2026-06-07T14:00:00',
    price: 0,
    image_url: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?auto=format&fit=crop&w=800&q=80',
    category_id: '5'
  },
  {
    id: 'e2',
    name: 'Festival de Jazz no MON',
    description: 'Show de jazz ao ar livre nos gramados atrás do Museu Oscar Niemeyer. Evento com foodtrucks, cervejas artesanais e música instrumental premium.',
    place_id: 'p7',
    latitude: -25.4098,
    longitude: -49.2669,
    starts_at: '2026-06-13T14:00:00',
    ends_at: '2026-06-13T22:00:00',
    price: 25,
    image_url: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&w=800&q=80',
    category_id: '4'
  }
];
