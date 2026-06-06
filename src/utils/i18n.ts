export type Language = 'pt' | 'en';

export const TRANSLATIONS = {
  pt: {
    welcome_title: "Bem-vindo",
    welcome_tagline: "Tudo ao seu redor",
    welcome_subtitle: "Encontre o que procura, rápido e preciso.",
    continue_google: "Continuar com o Google",
    enter_email: "Entrar com E-mail",
    create_account_btn: "Criar Conta Grátis",
    terms_footer: "Ao entrar, você concorda com nossos Termos e Privacidade",
    search_placeholder: "Escreva como quiser, o Giro acha...",
    search_on_map: "Pesquisar no mapa...",
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
  },
  en: {
    welcome_title: "Welcome",
    welcome_tagline: "Everything around you",
    welcome_subtitle: "Find what you're looking for, fast and precise.",
    continue_google: "Continue with Google",
    enter_email: "Sign in with Email",
    create_account_btn: "Create Free Account",
    terms_footer: "By signing in, you agree to our Terms & Privacy",
    search_placeholder: "Write however you want, Giro finds it...",
    search_on_map: "Search on the map...",
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
  }
};

export const getLanguage = (): Language => {
  const saved = localStorage.getItem('giro_lang');
  if (saved === 'pt' || saved === 'en') return saved;
  // Detecção automática do sistema
  return navigator.language.toLowerCase().startsWith('pt') ? 'pt' : 'en';
};

export const setLanguage = (lang: Language) => {
  localStorage.setItem('giro_lang', lang);
  window.dispatchEvent(new CustomEvent('giro-language-change', { detail: { lang } }));
};

export const t = (key: keyof typeof TRANSLATIONS['pt']): string => {
  const lang = getLanguage();
  return TRANSLATIONS[lang][key] || TRANSLATIONS['pt'][key] || key;
};
