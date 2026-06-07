export type Language = 'pt' | 'en' | 'es';

export const TRANSLATIONS = {
  pt: {
    // Navegação Inferior
    nav_home: "Início",
    nav_explore: "Explorar",
    nav_favorites: "Favoritos",
    nav_profile: "Perfil",

    // Cabeçalho / Títulos
    header_profile: "Meu Perfil",
    header_favorites: "Favoritos",
    header_giro: "Giro",

    // Welcome / Login / Splash
    welcome_title: "Bem-vindo",
    welcome_tagline: "Tudo ao seu redor",
    welcome_subtitle: "Encontre o que procura, rápido e preciso.",
    continue_google: "Continuar com o Google",
    enter_email: "Entrar com E-mail",
    create_account_btn: "Criar Conta Grátis",
    terms_footer: "Ao entrar, você concorda com nossos Termos e Privacidade",
    search_placeholder: "Escreva como quiser, o Giro acha...",
    search_on_map: "Pesquisar no mapa...",

    // Tela de Registro
    crie_acesso: "Crie seu acesso",
    email_senha_forte: "E-mail e uma senha forte",
    senha_min: "Senha (mín. 6 caracteres)",
    forca_senha: "Força da senha",
    termos_uso: "Li e aceito os Termos de Uso e Política de Privacidade",
    continuar: "Continuar",
    ja_tem_conta: "Já tem conta?",
    fazer_login: "Fazer login",
    quem_e_voce: "Quem é você?",
    como_ser_chamado: "Como você quer ser chamado no Giro",

    // Perfil do Cliente
    meu_negocio: "Meu Negócio",
    selo_ouro: "SELO OURO",
    ciclar_selos: "Clique para ciclar selos • Nível de atividade",
    salvos: "SALVOS",
    reviews: "REVIEWS",
    ajudou: "AJUDOU",
    minhas_preferencias: "Minhas Preferências",
    editar: "Editar",
    dados_cadastrais: "Dados Cadastrais",

    // Header Location Modal
    loc_modal_title: "Definir Localização",
    loc_modal_desc: "Pesquise bairros, ruas ou pontos turísticos para simular sua localização no Giro.",
    loc_gps_denied: "Sua geolocalização está desativada. Escolha um bairro de Curitiba abaixo para continuar explorando.",
    loc_search_placeholder: "Para onde quer dar um Giro?",
    loc_use_gps: "Usar minha localização atual (GPS)",
    loc_radius_label: "Raio de busca (Distância)",
    loc_no_limit: "Sem limite",
    loc_searching: "Buscando endereços...",
    loc_not_arrived: "O Giro ainda não chegou em ",
    loc_only_curitiba: "No momento, estamos ativos apenas em Curitiba - PR. Deixe seu e-mail para entrar na lista de espera!",
    loc_email_placeholder: "Seu e-mail",
    loc_notify_me: "Me avise",
    loc_subscribed_title: "Inscrição Confirmada!",
    loc_subscribed_desc: "Avisaremos você assim que o Giro chegar em ",
    loc_not_found: "Nenhum endereço encontrado. Tente pesquisar com termos mais simples.",
    loc_curitiba_fallback: "Curitiba - PR",

    // Home / Feed page
    home_radar: "Radar",
    home_saved: "Salvos",
    home_filters: "Filtros",
    home_clear_filters: "Limpar Filtros",
    home_apply: "Aplicar",
    home_vibe_style: "Estilo & Vibe",
    home_empty_feed_title: "Sem locais nesta categoria",
    home_empty_feed_desc: "Selecione outra categoria ou limpe filtros para continuar combinando.",
    home_my_collections: "Minhas Coleções",
    home_local_singular: "local",
    home_local_plural: "locais",
    home_back_folders: "Voltar para Pastas",
    home_confirm_delete_folder: "Tem certeza que deseja excluir esta pasta? Os locais salvos não serão apagados da lista geral.",
    home_edit_name: "Editar nome",
    home_delete_folder: "Excluir pasta",
    home_empty_folder_title: "Pasta vazia",
    home_empty_folder_desc: "Nenhum local nesta pasta. Use o Swipe para salvar locais aqui!",
    home_no_places_found: "Nenhum local encontrado para a sua seleção nesta pasta.",
    home_all_saved: "Todos os Salvos",
    home_back_matches: "Voltar para os Matches",
    home_swipe_like: "Giro!",
    home_swipe_nope: "Nem...",

    // Favorites page
    fav_back_collections: "Voltar para Coleções",
    fav_saved_singular: "local salvo",
    fav_saved_plural: "locais salvos",
    fav_confirm_delete: "Tem certeza que deseja excluir a coleção ",
    fav_empty_collection_title: "Coleção Vazia",
    fav_empty_collection_desc: "Não há locais salvos nesta coleção ainda.",
    fav_tab_places: "Locais (Todos)",
    fav_tab_collections: "Coleções (Pastas)",
    fav_no_favorites_title: "Nenhum favorito salvo",
    fav_no_favorites_desc: "Marque locais incríveis de Curitiba com a bandeirinha para salvá-los aqui e planejar seu rolê com facilidade.",
    fav_explore_btn: "Explorar Locais",
    fav_no_collections_title: "Nenhuma coleção",
    fav_no_collections_desc: "Você ainda não criou pastas. Use o botão de salvar nos cards de locais para criar suas pastas temáticas!",

    // Collection Modal
    col_save_in: "Salvar em...",
    col_no_folders: "Nenhuma pasta criada ainda.",
    col_create_first: "Crie sua primeira pasta abaixo!",
    col_remove_all: "Remover de todos os salvos",
    col_new_placeholder: "Nova coleção (ex: Cafés fofos)",

    // Explore / Map page
    exp_search_map: "Pesquisar no mapa...",
    exp_back_matches: "Voltar para os Matches",

    // Categorias
    cat_1: "Parques e Lazer",
    cat_2: "Gastronomia",
    cat_3: "Cafés e Doces",
    cat_4: "Vida Noturna",
    cat_5: "Cultura & Arte",

    // Subcategorias
    sub_parques: "Parques",
    sub_pracas: "Praças",
    sub_mirantes: "Mirantes",
    sub_turismo: "Pontos Turísticos",
    sub_lazer_privado: "Lazer & Diversão",
    sub_mercados_feiras: "Mercados & Feiras",
    sub_shoppings: "Shoppings",
    sub_massas_italiana: "Pizzas & Massas",
    sub_hamburgueres: "Hambúrgueres & Lanches",
    sub_asiatica: "Asiática",
    sub_carnes_churrasco: "Carnes & Churrasco",
    sub_arabe: "Comida Árabe",
    sub_mexicana: "Comida Mexicana",
    sub_brasileira: "Brasileira & Caseira",
    sub_frutos_do_mar: "Frutos do Mar",
    sub_saudavel_vegana: "Saudável & Vegana",
    sub_cafeterias: "Cafés",
    sub_padarias: "Padarias",
    sub_docerias: "Confeitarias",
    sub_sorveterias: "Sorveterias",
    sub_bar_pub: "Bares & Pubs",
    sub_adegas_drinks: "Adega & Drinks",
    sub_karaokes: "Karaokê",
    sub_baladas: "Baladas & Shows",
    sub_museus: "Museus & Galerias",
    sub_teatros: "Teatros & Shows",
    sub_shows_eventos: "Shows & Eventos",

    // Tags / Vibes
    tag_rock: "Rock",
    tag_eletronica: "Eletrônica",
    tag_sertanejo: "Sertanejo",
    tag_samba_pagode: "Samba & Pagode",
    tag_jazz_blues: "Jazz & Blues",
    tag_romantico: "Romântico",
    tag_alternativo: "Alternativo/Indie",
    tag_sofisticado: "Sofisticado",
    tag_forro: "Forró",
    tag_pop_funk: "Pop & Funk",
    tag_acustico_mpb: "Acústico & MPB",
    tag_descontraido: "Descontraído"
  },
  en: {
    // Navegação Inferior
    nav_home: "Home",
    nav_explore: "Explore",
    nav_favorites: "Favorites",
    nav_profile: "Profile",

    // Cabeçalho / Títulos
    header_profile: "My Profile",
    header_favorites: "Favorites",
    header_giro: "Giro",

    // Welcome / Login / Splash
    welcome_title: "Welcome",
    welcome_tagline: "Everything around you",
    welcome_subtitle: "Find what you're looking for, fast and precise.",
    continue_google: "Continue with Google",
    enter_email: "Sign in with Email",
    create_account_btn: "Create Free Account",
    terms_footer: "By signing in, you agree to our Terms & Privacy",
    search_placeholder: "Write however you want, Giro finds it...",
    search_on_map: "Search on the map...",

    // Tela de Registro
    crie_acesso: "Create your login",
    email_senha_forte: "Email and a strong password",
    senha_min: "Password (min. 6 characters)",
    forca_senha: "Password strength",
    termos_uso: "I read and accept the Terms of Use & Privacy Policy",
    continuar: "Continue",
    ja_tem_conta: "Already have an account?",
    fazer_login: "Sign in",
    quem_e_voce: "Who are you?",
    como_ser_chamado: "How you want to be called on Giro",

    // Perfil do Cliente
    meu_negocio: "My Business",
    selo_ouro: "GOLD SEAL",
    ciclar_selos: "Click to cycle seals • Activity level",
    salvos: "SAVED",
    reviews: "REVIEWS",
    ajudou: "HELPED",
    minhas_preferencias: "My Preferences",
    editar: "Edit",
    dados_cadastrais: "Account Details",

    // Header Location Modal
    loc_modal_title: "Set Location",
    loc_modal_desc: "Search neighborhoods, streets, or landmarks to simulate your location on Giro.",
    loc_gps_denied: "Your geolocation is disabled. Choose a neighborhood in Curitiba below to keep exploring.",
    loc_search_placeholder: "Where do you want to take a Giro?",
    loc_use_gps: "Use my current location (GPS)",
    loc_radius_label: "Search radius (Distance)",
    loc_no_limit: "No limit",
    loc_searching: "Searching addresses...",
    loc_not_arrived: "Giro hasn't arrived in ",
    loc_only_curitiba: "Currently, we are only active in Curitiba - PR. Leave your email to join the waiting list!",
    loc_email_placeholder: "Your email",
    loc_notify_me: "Notify me",
    loc_subscribed_title: "Subscription Confirmed!",
    loc_subscribed_desc: "We will notify you as soon as Giro arrives in ",
    loc_not_found: "No address found. Try searching with simpler terms.",
    loc_curitiba_fallback: "Curitiba - PR",

    // Home / Feed page
    home_radar: "Radar",
    home_saved: "Saved",
    home_filters: "Filters",
    home_clear_filters: "Clear Filters",
    home_apply: "Apply",
    home_vibe_style: "Style & Vibe",
    home_empty_feed_title: "No places in this category",
    home_empty_feed_desc: "Select another category or clear filters to keep matching.",
    home_my_collections: "My Collections",
    home_local_singular: "place",
    home_local_plural: "places",
    home_back_folders: "Back to Folders",
    home_confirm_delete_folder: "Are you sure you want to delete this folder? Saved places will not be deleted from the general list.",
    home_edit_name: "Edit name",
    home_delete_folder: "Delete folder",
    home_empty_folder_title: "Empty folder",
    home_empty_folder_desc: "No places in this folder. Use Swipe to save places here!",
    home_no_places_found: "No places found for your selection in this folder.",
    home_all_saved: "All Saved",
    home_back_matches: "Back to Matches",
    home_swipe_like: "Giro!",
    home_swipe_nope: "Skip...",

    // Favorites page
    fav_back_collections: "Back to Collections",
    fav_saved_singular: "saved place",
    fav_saved_plural: "saved places",
    fav_confirm_delete: "Are you sure you want to delete the collection ",
    fav_empty_collection_title: "Empty Collection",
    fav_empty_collection_desc: "There are no saved places in this collection yet.",
    fav_tab_places: "Places (All)",
    fav_tab_collections: "Collections (Folders)",
    fav_no_favorites_title: "No favorites saved",
    fav_no_favorites_desc: "Bookmark amazing places in Curitiba with the flag to save them here and plan your hangout easily.",
    fav_explore_btn: "Explore Places",
    fav_no_collections_title: "No collections",
    fav_no_collections_desc: "You haven't created folders yet. Use the save button on the places cards to create your themed folders!",

    // Collection Modal
    col_save_in: "Save in...",
    col_no_folders: "No folders created yet.",
    col_create_first: "Create your first folder below!",
    col_remove_all: "Remove from all saved",
    col_new_placeholder: "New collection (e.g. Cozy Cafes)",

    // Explore / Map page
    exp_search_map: "Search on the map...",
    exp_back_matches: "Back to Matches",

    // Categorias
    cat_1: "Parks & Leisure",
    cat_2: "Gastronomy",
    cat_3: "Cafes & Sweets",
    cat_4: "Nightlife",
    cat_5: "Culture & Art",

    // Subcategorias
    sub_parques: "Parks",
    sub_pracas: "Squares",
    sub_mirantes: "Viewpoints",
    sub_turismo: "Tourist Spots",
    sub_lazer_privado: "Leisure & Fun",
    sub_mercados_feiras: "Markets & Fairs",
    sub_shoppings: "Malls",
    sub_massas_italiana: "Pizzas & Pasta",
    sub_hamburgueres: "Burgers & Snacks",
    sub_asiatica: "Asian",
    sub_carnes_churrasco: "Meats & BBQ",
    sub_arabe: "Arab Food",
    sub_mexicana: "Mexican Food",
    sub_brasileira: "Brazilian & Homemade",
    sub_frutos_do_mar: "Seafood",
    sub_saudavel_vegana: "Healthy & Vegan",
    sub_cafeterias: "Cafes",
    sub_padarias: "Bakeries",
    sub_docerias: "Confectioneries",
    sub_sorveterias: "Ice Cream Parlors",
    sub_bar_pub: "Bars & Pubs",
    sub_adegas_drinks: "Winery & Drinks",
    sub_karaokes: "Karaoke",
    sub_baladas: "Clubs & Shows",
    sub_museus: "Museums & Galleries",
    sub_teatros: "Theaters & Shows",
    sub_shows_eventos: "Shows & Events",

    // Tags / Vibes
    tag_rock: "Rock",
    tag_eletronica: "Electronic",
    tag_sertanejo: "Country",
    tag_samba_pagode: "Samba & Pagode",
    tag_jazz_blues: "Jazz & Blues",
    tag_romantico: "Romantic",
    tag_alternativo: "Alternative/Indie",
    tag_sofisticado: "Sophisticated",
    tag_forro: "Forró",
    tag_pop_funk: "Pop & Funk",
    tag_acustico_mpb: "Acoustic & MPB",
    tag_descontraido: "Casual"
  },
  es: {
    // Navegação Inferior
    nav_home: "Inicio",
    nav_explore: "Explorar",
    nav_favorites: "Favoritos",
    nav_profile: "Perfil",

    // Cabeçalho / Títulos
    header_profile: "Mi Perfil",
    header_favorites: "Favoritos",
    header_giro: "Giro",

    // Welcome / Login / Splash
    welcome_title: "Bienvenido",
    welcome_tagline: "Todo a tu alrededor",
    welcome_subtitle: "Encuentra lo que buscas, rápido y preciso.",
    continue_google: "Continuar con Google",
    enter_email: "Iniciar sesión con E-mail",
    create_account_btn: "Crear Cuenta Gratis",
    terms_footer: "Ao entrar, você concorda com nossos Termos e Privacidade",
    search_placeholder: "Escribe como quieras, Giro lo encuentra...",
    search_on_map: "Buscar en el mapa...",

    // Tela de Registro
    crie_acesso: "Crea tu acceso",
    email_senha_forte: "E-mail y una contraseña fuerte",
    senha_min: "Contraseña (mín. 6 caracteres)",
    forca_senha: "Fuerza de la contraseña",
    termos_uso: "Leí e acepto los Términos de Uso y Política de Privacidad",
    continuar: "Continuar",
    ja_tem_conta: "¿Ya tienes cuenta?",
    fazer_login: "Iniciar sesión",
    quem_e_voce: "¿Quién eres?",
    como_ser_chamado: "Cómo quieres ser llamado en Giro",

    // Perfil do Cliente
    meu_negocio: "Mi Negocio",
    selo_ouro: "SELLO DE ORO",
    ciclar_selos: "Clic para rotar sellos • Nivel de actividad",
    salvos: "GUARDADOS",
    reviews: "RESEÑAS",
    ajudou: "AYUDÓ",
    minhas_preferencias: "Mis Preferencias",
    editar: "Editar",
    dados_cadastrais: "Datos de la Cuenta",

    // Header Location Modal
    loc_modal_title: "Definir Ubicación",
    loc_modal_desc: "Busca barrios, calles o puntos de interés para simular tu ubicación en Giro.",
    loc_gps_denied: "Tu geolocalización está desactivada. Elige un barrio de Curitiba a continuación para seguir explorando.",
    loc_search_placeholder: "¿A dónde quieres dar un Giro?",
    loc_use_gps: "Usar mi ubicación actual (GPS)",
    loc_radius_label: "Radio de búsqueda (Distancia)",
    loc_no_limit: "Sin límite",
    loc_searching: "Buscando direcciones...",
    loc_not_arrived: "Giro aún no ha llegado a ",
    loc_only_curitiba: "Por el momento, solo estamos activos en Curitiba - PR. ¡Deja tu correo para entrar en la lista de espera!",
    loc_email_placeholder: "Tu e-mail",
    loc_notify_me: "Avísame",
    loc_subscribed_title: "¡Inscripción Confirmada!",
    loc_subscribed_desc: "¡Te avisaremos tan pronto como Giro llegue a ",
    loc_not_found: "No se encontró ninguna dirección. Intenta buscar con términos más simples.",
    loc_curitiba_fallback: "Curitiba - PR",

    // Home / Feed page
    home_radar: "Radar",
    home_saved: "Guardados",
    home_filters: "Filtros",
    home_clear_filters: "Limpiar Filtros",
    home_apply: "Aplicar",
    home_vibe_style: "Estilo y Vibe",
    home_empty_feed_title: "Sin lugares en esta categoría",
    home_empty_feed_desc: "Selecciona otra categoría o limpia los filtros para seguir combinando.",
    home_my_collections: "Mis Colecciones",
    home_local_singular: "lugar",
    home_local_plural: "lugares",
    home_back_folders: "Volver a Carpetas",
    home_confirm_delete_folder: "¿Está seguro de que desea eliminar esta carpeta? Los lugares guardados no se eliminarán de la lista general.",
    home_edit_name: "Editar nombre",
    home_delete_folder: "Eliminar carpeta",
    home_empty_folder_title: "Carpeta vacía",
    home_empty_folder_desc: "Ningún lugar en esta carpeta. ¡Usa el Swipe para guardar lugares aquí!",
    home_no_places_found: "No se encontraron lugares para tu selección en esta carpeta.",
    home_all_saved: "Todos los Guardados",
    home_back_matches: "Volver a los Matches",
    home_swipe_like: "¡Giro!",
    home_swipe_nope: "Nop...",

    // Favorites page
    fav_back_collections: "Volver a Colecciones",
    fav_saved_singular: "lugar guardado",
    fav_saved_plural: "lugares guardados",
    fav_confirm_delete: "¿Estás seguro de que deseas eliminar la colección ",
    fav_empty_collection_title: "Colección Vacía",
    fav_empty_collection_desc: "No hay lugares guardados en esta colección todavía.",
    fav_tab_places: "Lugares (Todos)",
    fav_tab_collections: "Colecciones (Carpetas)",
    fav_no_favorites_title: "Ningún favorito guardado",
    fav_no_favorites_desc: "Marca lugares increíbles de Curitiba con la banderita para guardarlos aquí y planificar tu salida con facilidad.",
    fav_explore_btn: "Explorar Lugares",
    fav_no_collections_title: "Ninguna colección",
    fav_no_collections_desc: "Aún no has creado carpetas. ¡Usa el botón de guardar en las tarjetas de lugares para crear tus carpetas temáticas!",

    // Collection Modal
    col_save_in: "Guardar en...",
    col_no_folders: "Ninguna carpeta creada todavía.",
    col_create_first: "¡Crea tu primera carpeta a continuación!",
    col_remove_all: "Eliminar de todos los guardados",
    col_new_placeholder: "Nueva colección (ej: Cafés bonitos)",

    // Explore / Map page
    exp_search_map: "Buscar en el mapa...",
    exp_back_matches: "Volver a los Matches",

    // Categorias
    cat_1: "Parques y Ocio",
    cat_2: "Gastronomía",
    cat_3: "Cafés y Dulces",
    cat_4: "Vida Nocturna",
    cat_5: "Cultura y Arte",

    // Subcategorias
    sub_parques: "Parques",
    sub_pracas: "Plazas",
    sub_mirantes: "Miradores",
    sub_turismo: "Lugares Turísticos",
    sub_lazer_privado: "Ocio y Diversión",
    sub_mercados_feiras: "Mercados y Ferias",
    sub_shoppings: "Centros Comerciales",
    sub_massas_italiana: "Pizzas y Pastas",
    sub_hamburgueres: "Hamburguesas y Snacks",
    sub_asiatica: "Asiática",
    sub_carnes_churrasco: "Carnes y Barbacoa",
    sub_arabe: "Comida Árabe",
    sub_mexicana: "Comida Mexicana",
    sub_brasileira: "Brasileña y Casera",
    sub_frutos_do_mar: "Mariscos",
    sub_saudavel_vegana: "Saludable y Vegana",
    sub_cafeterias: "Cafés",
    sub_padarias: "Panaderías",
    sub_docerias: "Confiterías",
    sub_sorveterias: "Heladerías",
    sub_bar_pub: "Bares y Pubs",
    sub_adegas_drinks: "Bodegas y Copas",
    sub_karaokes: "Karaoke",
    sub_baladas: "Discotecas y Conciertos",
    sub_museus: "Museos y Galerías",
    sub_teatros: "Teatros y Espectáculos",
    sub_shows_eventos: "Conciertos y Eventos",

    // Tags / Vibes
    tag_rock: "Rock",
    tag_eletronica: "Electrónica",
    tag_sertanejo: "Country",
    tag_samba_pagode: "Samba y Pagode",
    tag_jazz_blues: "Jazz y Blues",
    tag_romantico: "Romántico",
    tag_alternativo: "Alternativo/Indie",
    tag_sofisticado: "Sofisticado",
    tag_forro: "Forró",
    tag_pop_funk: "Pop y Funk",
    tag_acustico_mpb: "Acústico y MPB",
    tag_descontraido: "Descontraído"
  }
};

export const getLanguage = (): Language => {
  const saved = localStorage.getItem('giro_lang');
  if (saved === 'pt' || saved === 'en' || saved === 'es') return saved;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith('pt')) return 'pt';
  if (browser.startsWith('es')) return 'es';
  return 'en'; // Default mundial
};

export const setLanguage = (lang: Language) => {
  localStorage.setItem('giro_lang', lang);
  window.dispatchEvent(new CustomEvent('giro-language-change', { detail: { lang } }));
};

export const t = (key: keyof typeof TRANSLATIONS['pt']): string => {
  const lang = getLanguage();
  return TRANSLATIONS[lang][key] || TRANSLATIONS['pt'][key] || key;
};
