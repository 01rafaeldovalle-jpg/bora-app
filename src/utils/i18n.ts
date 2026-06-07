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
    dados_cadastrais: "Dados Cadastrais"
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
    dados_cadastrais: "Account Details"
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
    dados_cadastrais: "Datos de la Cuenta"
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
