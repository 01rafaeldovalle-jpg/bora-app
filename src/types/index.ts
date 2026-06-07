export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // Nome do ícone do Lucide
  color: string; // Ex: 'coral', 'teal', etc.
}

export interface Place {
  id: string;
  name: string;
  description: string;
  description_en?: string; // Descrição traduzida em inglês
  description_es?: string; // Descrição traduzida em espanhol
  address: string;
  phone?: string;
  instagram_handle?: string;
  website_url?: string;
  ifood_url?: string;
  category_id: string;
  sub_category_id?: string;
  category_name?: string;
  latitude: number;
  longitude: number;
  image_url: string;
  avg_rating: number;
  review_count: number;
  price_range: '$' | '$$' | '$$$'; // Faixa de preço
  is_featured: boolean;
  is_verified: boolean;
  operating_hours?: {
    [key: string]: string;
  };
  distance?: number; // Distância calculada em km
  event_date?: string;    // Data do evento (ex: "Sáb, 13 Jun")
  event_time?: string;    // Horário do evento (ex: "20:00")
  ticket_price?: number;   // Preço do ingresso em reais (0 se gratuito)
  ticket_url?: string;     // Link para compra de ingressos (Sympla, Eventim, etc.)
  tags?: string[];         // Array de tags de vibe/estilo (ex: ['rock', 'romantico'])
}

export interface Event {
  id: string;
  name: string;
  description: string;
  place_id?: string;
  category_id: string;
  latitude: number;
  longitude: number;
  starts_at: string;
  ends_at: string;
  price: number; // 0 se gratuito
  image_url: string;
  ticket_url?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  avatar_url?: string;
  email: string;
  favorites: string[]; // Array de place_ids
}

export interface Review {
  id: string;
  place_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment: string;
  images?: string[]; // Array de URLs de fotos tiradas pelos clientes
  created_at: string;
}
