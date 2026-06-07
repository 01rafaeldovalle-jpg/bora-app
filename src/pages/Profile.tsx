import React, { useState, useEffect, useRef } from 'react';
import {
  Edit2, Bookmark, Edit3, Heart, User, Bell, LogOut,
  ChevronRight, Mail, Lock, Eye, EyeOff, Save, X, Trash2,
  MapPin, ArrowRight, ArrowLeft, Camera, Sparkles, CheckCircle2, Navigation,
  Instagram, Globe, Building2, Building, BarChart3, Star, Clock, Phone, Image
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { MOCK_PLACES } from '../utils/constants';
import { getLanguage, setLanguage, t } from '../utils/i18n';


interface ProfileProps {
  favoritesCount: number;
  setTab?: (tab: 'home' | 'explore' | 'favorites' | 'profile') => void;
}

export const PREFERENCES_LIST = [
  { id: 'pet', label: '🐶 Pet Friendly' },
  { id: 'vegan', label: '🌿 Vegano' },
  { id: 'work', label: '💻 Trabalhar' },
  { id: 'outdoor', label: '☀️ Ar Livre' },
  { id: 'live-music', label: '🎶 Música ao Vivo' },
  { id: 'date', label: '🕯️ Encontro' },
  { id: 'cheap', label: '💰 Econômico' },
  { id: 'sofisticado', label: '💎 Sofisticado' },
  { id: 'descontraido', label: '🍻 Descontraído' },
  { id: 'kids', label: '🧒 Espaço Kids' },
  { id: 'lgbt', label: '🌈 LGBTQ+ Friendly' },
  { id: 'accessible-motor', label: '♿ Acessibilidade Motora' },
  { id: 'accessible-deaf', label: '🤟 Atendimento em LIBRAS' },
  { id: 'accessible-blind', label: '🔊 Cardápio Acessível' },
  { id: 'speak-en', label: '🇬🇧 Atendimento em Inglês' },
  { id: 'speak-es', label: '🇪🇸 Atendimento em Espanhol' },
];

// ─── Onboarding full-screen overlay ────────────────────────────────────────────

type OnboardingView = 'splash' | 'email-login' | 'signup-1' | 'signup-2' | 'signup-3' | 'signup-4' | 'signup-5' | 'signup-6';

function OnboardingOverlay({
  initialView = 'splash',
  onComplete,
}: {
  initialView?: OnboardingView;
  onComplete: (session: any) => void;
}) {
  const [view, setView] = useState<OnboardingView>(initialView);
  const [lang, setLangState] = useState(getLanguage());
  useEffect(() => {
    const handleLangChange = (e: any) => setLangState(e.detail.lang);
    window.addEventListener('giro-language-change', handleLangChange);
    return () => window.removeEventListener('giro-language-change', handleLangChange);
  }, []);


  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [birthday, setBirthday] = useState('');
  const [gender, setGender] = useState('');
  const [genderDetails, setGenderDetails] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Crop states
  const [cropOpen, setCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // Usado para a Galeria
  const cameraInputRef = useRef<HTMLInputElement>(null); // Usado para a Câmera

  const allPrefs = PREFERENCES_LIST;

  const togglePref = (id: string) =>
    setPrefs((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const pwdStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: '', pct: 0 };
    if (pwd.length < 6) return { label: 'Muito curta', color: 'bg-rose-500', pct: 20 };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { label: 'Fraca', color: 'bg-rose-400', pct: 40 };
    if (score === 2) return { label: 'Média', color: 'bg-amber-500', pct: 70 };
    return { label: 'Forte', color: 'bg-emerald-500', pct: 100 };
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErr('');
    localStorage.setItem('giro_google_onboarding_pending', 'true');
    if (supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: { prompt: 'select_account' },
        },
      });
      if (error) {
        // fallback mock
        localStorage.setItem('giro_google_mock_user', JSON.stringify({ name: 'Demo Giro', avatar: null }));
        setView('signup-5');
      }
    } else {
      // Mock Google Login: directly jump to interests step
      localStorage.setItem('giro_google_mock_user', JSON.stringify({ name: 'Demo Giro', avatar: null }));
      setView('signup-5');
    }
    setLoading(false);
  };

  const handleEmailLogin = async () => {
    setErr('');
    if (!email.includes('@')) { setErr('Insira um e-mail válido.'); return; }
    if (password.length < 6) { setErr('Senha muito curta.'); return; }
    setLoading(true);
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErr('E-mail ou senha inválidos.');
      } else if (data.session) {
        onComplete(data.session);
      }
    } else {
      const saved = localStorage.getItem('giro_mock_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u.email === email && u.password === password) {
          onComplete({ user: { email, user_metadata: { full_name: u.name } } });
        } else {
          setErr('E-mail ou senha inválidos.');
        }
      } else {
        setErr('Nenhuma conta encontrada.');
      }
    }
    setLoading(false);
  };

  const handleToggleLanguage = () => {
    const nextLang = lang === 'pt' ? 'en' : lang === 'en' ? 'es' : 'pt';
    setLanguage(nextLang);
  };

  const handleSignupStep1 = () => {
    setErr('');
    if (!email.includes('@')) { setErr('Insira um e-mail válido.'); return; }
    if (password.length < 6) { setErr('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (!acceptTerms) { setErr('Aceite os termos para continuar.'); return; }
    setView('signup-2');
  };

  const handleSignupStep2 = () => {
    setErr('');
    if (!name.trim()) { setErr('Informe seu nome completo.'); return; }
    if (username.replace(/^@/, '').length < 3) { setErr('Username deve ter pelo menos 3 caracteres.'); return; }
    setView('signup-3');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImageSrc(ev.target.result as string);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setCropOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinishSignup = async () => {
    setErr('');
    setLoading(true);

    // Request GPS first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          window.dispatchEvent(
            new CustomEvent('giro-location-change', {
              detail: { lat: pos.coords.latitude, lng: pos.coords.longitude },
            })
          );
        },
        () => {}
      );
    }

    // Save prefs locally
    localStorage.setItem('giro_preferences', JSON.stringify(prefs));

    if (supabase) {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession?.user) {
        // Logged in via Google OAuth
        const user = currentSession.user;
        const finalName = user.user_metadata?.full_name || user.email || 'Usuário Giro';
        const nickname = `@${finalName.toLowerCase().replace(/\s+/g, '_')}`;
        
        const { error: upsertErr } = await supabase.from('profiles').upsert({
          id: user.id,
          full_name: finalName,
          nickname: nickname,
          avatar_url: user.user_metadata?.avatar_url || null,
          preferences: prefs,
          favorites: [],
        });
        
        if (upsertErr) {
          console.error("Erro ao salvar perfil OAuth:", upsertErr);
        }
        
        onComplete(currentSession);
      } else {
        // Normal email signup
        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name, avatar_url: avatar },
          },
        });
        if (error) {
          setErr(error.message);
          setLoading(false);
          return;
        }
        if (authData?.user) {
          await supabase.from('profiles').insert({
            id: authData.user.id,
            full_name: name,
            nickname: username || `@${name.toLowerCase().replace(/\s+/g, '_')}`,
            avatar_url: avatar,
            preferences: prefs,
            favorites: [],
            birthday: birthday,
            gender: gender,
            gender_details: genderDetails,
            pronouns: pronouns,
            neighborhood: neighborhood,
          });
          onComplete(authData.session || { user: authData.user });
        }
      }
    } else {
      const googleMock = localStorage.getItem('giro_google_mock_user');
      let finalName = name;
      let finalAvatar = avatar;
      if (googleMock) {
        try {
          const parsed = JSON.parse(googleMock);
          finalName = parsed.name || name;
          finalAvatar = parsed.avatar || avatar;
        } catch (e) {}
        localStorage.removeItem('giro_google_mock_user');
      }

      localStorage.setItem(
        'giro_mock_user',
        JSON.stringify({ 
          email: email || 'demo@giro.app', 
          password, 
          name: finalName, 
          username, 
          avatar: finalAvatar, 
          preferences: prefs,
          birthday,
          gender,
          genderDetails,
          pronouns,
          neighborhood 
        })
      );
      onComplete({
        user: { 
          email: email || 'demo@giro.app', 
          user_metadata: { 
            full_name: finalName, 
            avatar_url: finalAvatar,
            birthday,
            gender,
            gender_details: genderDetails,
            pronouns,
            neighborhood 
          } 
        },
      });
    }
    setLoading(false);
  };

  // Step indicator
  const stepMap: Record<OnboardingView, number> = {
    splash: 0,
    'email-login': 0,
    'signup-1': 1,
    'signup-2': 2,
    'signup-3': 3,
    'signup-4': 4,
    'signup-5': 5,
    'signup-6': 6,
  };
  const currentStep = stepMap[view];
  const isSignup = currentStep > 0;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-slate-50 dark:bg-brand-indigo-950 text-slate-900 dark:text-white transition-colors duration-300 overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand-coral-500/10 dark:bg-brand-coral-500/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-brand-teal-500/10 dark:bg-brand-teal-500/15 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Progress bar (signup only) */}
      {isSignup && (
        <div className="relative z-10 flex items-center gap-1.5 px-6 pt-14 pb-0">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-all duration-500 ${
                s <= currentStep ? 'bg-brand-coral-500' : 'bg-white/10'
              }`}
            />
          ))}
        </div>
      )}

      {/* Back button */}
      {(view === 'email-login' || isSignup) && (
        <button
          onClick={() => {
            setErr('');
            if (view === 'email-login') setView('splash');
            else if (view === 'signup-1') setView('splash');
            else if (view === 'signup-2') setView('signup-1');
            else if (view === 'signup-3') setView('signup-2');
            else if (view === 'signup-4') setView('signup-3');
            else if (view === 'signup-5') setView('signup-4');
            else if (view === 'signup-6') setView('signup-5');
          }}
          className="absolute top-14 left-5 z-20 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}

      {/* Language Selector (Splash view only, aligned with top right header area) */}
      {view === 'splash' && (
        <div className="absolute top-14 right-5 z-20">
          <button 
            onClick={handleToggleLanguage} 
            className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-full bg-slate-100 dark:bg-brand-indigo-900/40 border border-slate-200 dark:border-white/5 text-[11px] font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-brand-indigo-900/60 active:scale-95 transition-all shadow-md"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {lang.toUpperCase()}
          </button>
        </div>
      )}

      {/* Step label */}
      {isSignup && (
        <div className="relative z-10 text-center mt-3">
          <span className="text-[10px] font-bold tracking-widest text-brand-coral-500 uppercase">
            Passo {currentStep} de 5
          </span>
        </div>
      )}

      {/* ─── Scroll content ─── */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center overflow-y-auto px-6 pb-10">

        {/* ══════════ SPLASH ══════════ */}
        {view === 'splash' && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-[fadeInUp_0.4s_ease-out] relative">
            {/* Logo Tipográfico */}
            <div className="text-center mb-6">
              <h1 className="text-6xl font-outfit font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-brand-coral-500 dark:from-white dark:to-brand-coral-300 bg-clip-text text-transparent leading-none select-none">
                Giro
              </h1>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-brand-teal-600 dark:text-brand-teal-400 mt-2">
                {t('welcome_tagline')}
              </p>
            </div>
            <div className="text-center mb-4">
              <h2 className="text-lg font-outfit font-black text-slate-800 dark:text-white">
                {t('welcome_title')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto mt-1.5 font-medium">
                {t('welcome_subtitle')}
              </p>
            </div>

            <div className="w-full space-y-3 mt-2">
              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-white text-slate-800 font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-[0.97] transition-all shadow-lg shadow-black/20 border border-slate-200 dark:border-transparent disabled:opacity-60"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('continue_google')}
              </button>

              {/* Create account */}
              <button
                onClick={() => { setErr(''); setView('signup-1'); }}
                className="w-full h-14 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-coral-500/30 active:scale-[0.97] transition-all"
              >
                {t('create_account_btn')}
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Already have an account text link */}
              <p className="text-xs text-center text-slate-500 pt-3">
                {t('ja_tem_conta')}{' '}
                <button
                  type="button"
                  onClick={() => { setErr(''); setView('email-login'); }}
                  className="text-brand-coral-500 font-bold hover:text-brand-coral-400 transition-colors"
                >
                  {t('fazer_login')}
                </button>
              </p>
            </div>

            <p className="text-[11px] text-slate-600 text-center mt-2 max-w-[260px] leading-relaxed">
              {lang === 'en' ? (
                <>
                  By signing in, you agree to our{' '}
                  <button onClick={() => setIsTermsOpen(true)} className="text-slate-500 dark:text-slate-400 underline underline-offset-2 font-semibold hover:text-brand-coral-500 transition-colors">
                    Terms & Privacy
                  </button>
                </>
              ) : lang === 'es' ? (
                <>
                  Al ingresar, aceptas nuestros{' '}
                  <button onClick={() => setIsTermsOpen(true)} className="text-slate-500 dark:text-slate-400 underline underline-offset-2 font-semibold hover:text-brand-coral-500 transition-colors">
                    Términos y Privacidad
                  </button>
                </>
              ) : (
                <>
                  Ao entrar, você concorda com nossos{' '}
                  <button onClick={() => setIsTermsOpen(true)} className="text-slate-500 dark:text-slate-400 underline underline-offset-2 font-semibold hover:text-brand-coral-500 transition-colors">
                    Termos e Privacidade
                  </button>
                </>
              )}
            </p>
          </div>
        )}

        {/* ══════════ EMAIL LOGIN ══════════ */}
        {view === 'email-login' && (
          <form 
            onSubmit={(e) => { e.preventDefault(); handleEmailLogin(); }}
            className="w-full max-w-sm flex flex-col gap-5 animate-[fadeInUp_0.35s_ease-out]"
          >
            <div className="text-center mt-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-coral-500/15 border border-brand-coral-500/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-brand-coral-500" />
              </div>
              <h2 className="text-2xl font-outfit font-black text-slate-800 dark:text-white">Entrar</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Use seu e-mail e senha do Giro</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  autoComplete="username"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                  className="w-full h-14 rounded-2xl form-input pl-11 pr-4 text-sm"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  id="login-password"
                  name="password"
                  autoComplete="current-password"
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                  className="w-full h-14 rounded-2xl form-input pl-11 pr-12 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {err && <p className="text-xs text-rose-400 font-semibold text-center">{err}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-2xl btn-primary disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-xs text-center text-slate-500">
              Não tem conta?{' '}
              <button
                type="button"
                onClick={() => { setErr(''); setView('signup-1'); }}
                className="text-brand-coral-500 font-bold hover:text-brand-coral-400 transition-colors"
              >
                Cadastre-se grátis
              </button>
            </p>
          </form>
        )}

        {/* ══════════ SIGNUP STEP 1 – Acesso ══════════ */}
        {view === 'signup-1' && (
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSignupStep1(); }}
            className="w-full max-w-sm flex flex-col gap-5 animate-[fadeInUp_0.35s_ease-out]"
          >
            <div className="text-center mt-2">
              <div className="w-14 h-14 rounded-2xl bg-brand-coral-500/15 border border-brand-coral-500/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-brand-coral-500" />
              </div>
              <h2 className="text-2xl font-outfit font-black text-slate-800 dark:text-white">{t('crie_acesso')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('email_senha_forte')}</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  id="signup-email"
                  name="email"
                  autoComplete="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 rounded-2xl form-input pl-11 pr-4 text-sm"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  id="signup-password"
                  name="password"
                  autoComplete="new-password"
                  placeholder={t('senha_min')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 rounded-2xl form-input pl-11 pr-12 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength */}
              {password && (
                <div className="space-y-1.5 px-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">{t('forca_senha')}</span>
                    <span className="font-bold text-slate-300">{pwdStrength(password).label}</span>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-400 rounded-full ${pwdStrength(password).color}`}
                      style={{ width: `${pwdStrength(password).pct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Terms */}
              <label className="flex items-start gap-3 px-1 cursor-pointer select-none group">
                <div
                  onClick={() => setAcceptTerms(!acceptTerms)}
                  className={`mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                    acceptTerms
                      ? 'bg-brand-coral-500 border-brand-coral-500'
                      : 'border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-white/5 group-hover:border-slate-400 dark:group-hover:border-white/40'
                  }`}
                >
                  {acceptTerms && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-xs text-slate-400 leading-snug pt-0.5">
                  {t('li_aceito')}{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsTermsOpen(true); }}
                    className="text-brand-coral-500 font-semibold hover:underline"
                  >
                    {t('termos_uso')}
                  </button>
                </span>
              </label>
            </div>

            {err && <p className="text-xs text-rose-400 font-semibold text-center">{err}</p>}

            <button
              type="submit"
              disabled={!email || password.length < 6 || !acceptTerms}
              className="w-full h-14 rounded-2xl btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              {t('continuar')}
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-xs text-center text-slate-500">
              {t('ja_tem_conta')}{' '}
              <button
                type="button"
                onClick={() => { setErr(''); setView('email-login'); }}
                className="text-brand-coral-500 font-bold"
              >
                {t('fazer_login')}
              </button>
            </p>
          </form>
        )}

        {/* ══════════ SIGNUP STEP 2 – Identidade ══════════ */}
        {view === 'signup-2' && (
          <div className="w-full max-w-sm flex flex-col gap-5 animate-[fadeInUp_0.35s_ease-out]">
            <div className="text-center mt-2">
              <div className="w-14 h-14 rounded-2xl bg-brand-coral-500/15 border border-brand-coral-500/30 flex items-center justify-center mx-auto mb-4">
                <User className="w-7 h-7 text-brand-coral-500" />
              </div>
              <h2 className="text-2xl font-outfit font-black text-slate-800 dark:text-white">{t('quem_e_voce')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('como_ser_chamado')}</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t('nome_completo')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-14 rounded-2xl form-input pl-11 pr-4 text-sm"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={username.replace(/^@/, '')}
                  onChange={(e) => {
                    const clean = e.target.value
                      .replace(/^@/, '')
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "")
                      .toLowerCase()
                      .replace(/\s+/g, '_')
                      .replace(/[^a-z0-9_]/g, '');
                    setUsername(`@${clean}`);
                  }}
                  className="w-full h-14 rounded-2xl form-input pl-11 pr-4 text-sm"
                />
              </div>
            </div>

            {err && <p className="text-xs text-rose-400 font-semibold text-center">{err}</p>}

            <button
              onClick={handleSignupStep2}
              disabled={!name.trim() || username.replace(/^@/, '').length < 3}
              className="w-full h-14 rounded-2xl btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              {t('continuar')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ══════════ SIGNUP STEP 3 – Dados de Conexão ══════════ */}
        {view === 'signup-3' && (
          <div className="w-full max-w-sm flex flex-col gap-5 animate-[fadeInUp_0.35s_ease-out]">
            <div className="text-center mt-2">
              <div className="w-14 h-14 rounded-2xl bg-brand-coral-500/15 border border-brand-coral-500/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-brand-coral-500" />
              </div>
              <h2 className="text-2xl font-outfit font-black text-slate-800 dark:text-white">Sobre você</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Dados rápidos para liberar benefícios e localização.</p>
            </div>

            <div className="space-y-4 text-left">
              {/* Aniversário */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Data de Nascimento</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="DD/MM/AAAA"
                  maxLength={10}
                  value={birthday}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    let formatted = clean;
                    if (clean.length > 2) {
                      formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
                    }
                    if (clean.length > 4) {
                      formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
                    }
                    setBirthday(formatted);
                  }}
                  className="w-full h-14 rounded-2xl form-input px-4 text-sm bg-white dark:bg-brand-indigo-950 text-slate-900 dark:text-white border border-slate-200 dark:border-white/5"
                />
              </div>

              {/* Gênero */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Gênero</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Feminino', 'Masculino', 'Não-binário', 'Prefiro não dizer'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setGender(g);
                        if (g !== 'Não-binário') setGenderDetails('');
                      }}
                      className={`h-11 rounded-xl text-xs font-bold border active:scale-95 transition-all select-none ${
                        gender === g
                          ? 'bg-brand-coral-500 border-brand-coral-500 text-white shadow-md'
                          : 'bg-white dark:bg-brand-indigo-950 border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-350'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detalhes de Gênero (Apenas se Não-binário/Outro) */}
              {gender === 'Não-binário' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Como você se descreve? (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Trans, Gênero Fluido, Agênero"
                    value={genderDetails}
                    onChange={(e) => setGenderDetails(e.target.value)}
                    className="w-full h-12 rounded-xl form-input px-4 text-xs bg-white dark:bg-brand-indigo-950 text-slate-900 dark:text-white border border-slate-200 dark:border-white/5"
                  />
                </div>
              )}

              {/* Pronomes */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Pronomes (Exibido no perfil)</label>
                <select
                  value={pronouns}
                  onChange={(e) => setPronouns(e.target.value)}
                  className="w-full h-14 rounded-2xl form-input px-4 text-sm cursor-pointer bg-white dark:bg-brand-indigo-950 text-slate-900 dark:text-white border border-slate-200 dark:border-white/5"
                >
                  <option value="">Selecione seus pronomes...</option>
                  <option value="ela/dela">Ela / Dela (She/Her)</option>
                  <option value="ele/dele">Ele / Dele (He/Him)</option>
                  <option value="elu/delu">Elu / Delu (Neutro)</option>
                  <option value="não-exibir">Prefiro não exibir pronomes</option>
                </select>
              </div>

              {/* Bairro */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Onde você mora em Curitiba?</label>
                <select
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  className="w-full h-14 rounded-2xl form-input px-4 text-sm cursor-pointer bg-white dark:bg-brand-indigo-950 text-slate-900 dark:text-white border border-slate-200 dark:border-white/5"
                >
                  <option value="" className="text-slate-400">Selecione seu Bairro...</option>
                  {['Água Verde', 'Batel', 'Bigorrilho', 'Boqueirão', 'Cabral', 'Cajuru', 'Centro', 'Cristo Rei', 'Juvevê', 'Mercês', 'Novo Mundo', 'Portão', 'Prado Velho', 'Santa Felicidade', 'Outro'].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>

            {err && <p className="text-xs text-rose-400 font-semibold text-center">{err}</p>}

            <button
              type="button"
              onClick={() => {
                setErr('');
                if (!birthday) { setErr('A data de nascimento é obrigatória.'); return; }
                if (!gender) { setErr('A seleção de gênero é obrigatória.'); return; }
                if (!neighborhood) { setErr('Por favor, informe seu bairro.'); return; }
                setView('signup-4');
              }}
              className="w-full h-14 rounded-2xl btn-primary text-sm flex items-center justify-center gap-2 mt-2"
            >
              Avançar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ══════════ SIGNUP STEP 4 – Foto ══════════ */}
        {view === 'signup-4' && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-[fadeInUp_0.35s_ease-out]">
            <div className="text-center mt-2">
              <h2 className="text-2xl font-outfit font-black text-slate-800 dark:text-white">{t('sua_foto')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('escolha_avatar')}</p>
            </div>

            {/* Avatar picker */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-coral-500/40 bg-slate-200 dark:bg-brand-indigo-950 flex items-center justify-center shadow-2xl shadow-brand-coral-500/20">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-brand-coral-500 to-amber-500 flex items-center justify-center">
                    <span className="text-5xl font-outfit font-black text-white">
                      {name ? name.charAt(0).toUpperCase() : '?'}
                    </span>
                  </div>
                )}
              </div>
              <label 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-brand-coral-500 border-4 border-slate-50 dark:border-brand-indigo-950 flex items-center justify-center cursor-pointer hover:bg-brand-coral-600 active:scale-95 transition-all shadow-lg"
              >
                <Camera className="w-4 h-4 text-white" />
              </label>

              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleAvatarUpload} />
            </div>

            <div className="w-full space-y-3">
              <div className="w-full flex gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-brand-indigo-900/40 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-brand-indigo-900/60 active:scale-95 transition-all btn-premium shadow-md"
                >
                  <Camera className="w-4 h-4 text-brand-coral-500" />
                  {t('tirar_foto')}
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-14 rounded-2xl bg-slate-100 dark:bg-brand-indigo-900/40 border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-brand-indigo-900/60 active:scale-95 transition-all btn-premium shadow-md"
                >
                  <Image className="w-4 h-4 text-brand-coral-500" />
                  {t('galeria')}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setView('signup-5')}
                className="w-full h-14 rounded-2xl btn-primary text-sm flex items-center justify-center gap-2"
              >
                {t('continuar')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════ SIGNUP STEP 5 – Interesses ══════════ */}
        {view === 'signup-5' && (
          <div className="w-full max-w-sm flex flex-col gap-6 animate-[fadeInUp_0.35s_ease-out]">
            <div className="text-center mt-2">
              <div className="w-14 h-14 rounded-2xl bg-brand-coral-500/15 border border-brand-coral-500/30 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7 text-brand-coral-500 animate-pulse fill-brand-coral-500" />
              </div>
              <h2 className="text-2xl font-outfit font-black text-slate-800 dark:text-white">{t('seus_interesses')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-[260px] mx-auto">
                {t('escolha_tres')}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[40vh] pr-1 scrollbar-thin">
              <div className="grid grid-cols-2 gap-3 pb-4">
                {allPrefs.map((pref) => {
                  const isActive = prefs.includes(pref.id);
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => togglePref(pref.id)}
                      className={`h-14 rounded-2xl border text-xs font-bold transition-all flex items-center px-4 gap-3 select-none ${
                        isActive
                          ? 'bg-brand-coral-500 border-brand-coral-500 text-white shadow-lg shadow-brand-coral-500/15 scale-[1.02]'
                          : 'bg-white dark:bg-brand-indigo-950 border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-white/10 active:scale-98'
                      }`}
                    >
                      <span className="text-sm">{(() => {
                        let key = `pref_${pref.id.replace(/-/g, '_')}`;
                        if (pref.id === 'accessible-motor') key = 'pref_acc_motor';
                        else if (pref.id === 'accessible-deaf') key = 'pref_acc_deaf';
                        else if (pref.id === 'accessible-blind') key = 'pref_acc_blind';
                        return t(key as any) || pref.label;
                      })()}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
              {prefs.length}/3 {t('minimo')}
            </div>

            <button
              type="button"
              onClick={() => { if (prefs.length >= 3) setView('signup-6'); }}
              disabled={prefs.length < 3}
              className="w-full h-14 rounded-2xl btn-primary disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              {t('continuar')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ══════════ SIGNUP STEP 6 – GPS ══════════ */}
        {view === 'signup-6' && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center animate-[fadeInUp_0.35s_ease-out]">
            <div className="w-24 h-24 rounded-full bg-brand-teal-500/15 border-2 border-brand-teal-500/30 flex items-center justify-center mx-auto shadow-2xl shadow-brand-teal-500/10">
              <MapPin className="w-12 h-12 text-brand-teal-400 animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl font-outfit font-black text-slate-800 dark:text-white">{t('ativar_localizacao')}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed max-w-[260px] mx-auto">
                {t('gps_desc')}
              </p>
            </div>

            {err && <p className="text-xs text-rose-400 font-semibold">{err}</p>}

            <div className="w-full space-y-3">
              <button
                type="button"
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        window.dispatchEvent(
                          new CustomEvent('giro-location-change', {
                            detail: { lat: pos.coords.latitude, lng: pos.coords.longitude },
                          })
                        );
                        handleFinishSignup();
                      },
                      () => handleFinishSignup()
                    );
                  } else {
                    handleFinishSignup();
                  }
                }}
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-brand-teal-500 hover:bg-brand-teal-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-teal-500/20 active:scale-[0.97] transition-all"
              >
                <MapPin className="w-5 h-5 shrink-0" />
                {loading ? t('criando_conta') : t('ativar_gps')}
              </button>

              <button
                type="button"
                onClick={handleFinishSignup}
                disabled={loading}
                className="w-full h-14 rounded-2xl btn-secondary text-sm"
              >
                {loading ? t('criando_conta') : t('sem_gps')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ TERMS MODAL ══════════ */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-white dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/10 rounded-[28px] p-6 shadow-2xl flex flex-col text-slate-900 dark:text-slate-100" style={{ maxHeight: '80vh' }}>
            <button
              onClick={() => setIsTermsOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-outfit font-bold text-slate-900 dark:text-white mb-1 text-center">
              {lang === 'en' ? 'Terms & Privacy' : lang === 'es' ? 'Términos y Privacidad' : 'Termos e Privacidade'}
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-4 text-center">
              {lang === 'en' ? 'Your privacy and compliance with LGPD ⚖️' : lang === 'es' ? 'Su privacidad y conformidad con la LGPD ⚖️' : 'Sua privacidade e conformidade com a LGPD ⚖️'}
            </p>
            <div className="flex-1 overflow-y-auto text-xs text-slate-650 dark:text-slate-400 space-y-4 leading-relaxed pr-1 mb-5 scrollbar-thin">
              {lang === 'en' ? (
                <>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">1. Acceptance of Terms & Legislation</h4>
                    <p>By creating an account or using Giro, you agree to these Terms of Use and Privacy Policy, governed by the Brazilian Civil Rights Framework for the Internet and General Data Protection Law (LGPD).</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">2. Age Limit</h4>
                    <p>The Giro app features venues and events including nightlife. Registration is allowed only for users 18 years of age or older.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">3. Data Collection & Purpose</h4>
                    <p>We collect: full name, email, profile picture, and geolocation. These are used only for account setup and the proximity radar. We do not sell data.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">4. Geolocation Services</h4>
                    <p>Giro requires GPS access to show nearby places. You can disable this in your settings, limiting the radar to manual neighborhood searches.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">5. Total Disclaimer of Liability</h4>
                    <p>Giro is an information curation platform. We do not guarantee prices, hours, security, or service quality of third-party venues. The user holds Giro harmless from any event incident.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">6. User Conduct & Reviews</h4>
                    <p>You are solely liable for any review, photo, or comment you post. Offensive or unlawful content will be removed, and accounts may be banned.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">7. Storage Security</h4>
                    <p>Your data is encrypted on secure cloud servers. We take high-level measures, but Giro is not liable for data leaks caused by unforeseen hacks.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">8. Your Rights & Deletion</h4>
                    <p>Under LGPD, you have the right to access, edit, and delete your data. You can delete your account permanently in your profile or email: suporte@giroapp.com.br.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">9. Jurisdiction</h4>
                    <p>Any disputes arising under this agreement will be settled under the jurisdiction of Curitiba, Paraná, Brazil.</p>
                  </div>
                </>
              ) : lang === 'es' ? (
                <>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">1. Aceptación de los Términos</h4>
                    <p>Al crear una cuenta o usar Giro, usted acepta estos Términos de Uso y Política de Privacidad, regidos por el Marco Civil de Internet y la Ley General de Protección de Datos (LGPD) de Brasil.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">2. Edad Mínima</h4>
                    <p>El Giro muestra lugares y eventos incluyendo vida nocturna. El registro está permitido únicamente para mayores de 18 años.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">3. Recopilación de Datos y Finalidad</h4>
                    <p>Recopilamos: nombre, email, foto de perfil y geolocalización para configurar la cuenta, prevenir fraudes y el radar. No vendemos sus datos.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">4. Servicios de Geolocalización</h4>
                    <p>Giro requiere acceso GPS para mostrar lugares cercanos. Puede desactivarlo en sus ajustes, limitando el radar a búsquedas manuales.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">5. Exención Total de Responsabilidad</h4>
                    <p>Giro es una plataforma de curación de información. No garantizamos precios, horarios o seguridad de los locales indicados. El usuario exime a Giro de incidentes.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">6. Conducta del Usuario y Reseñas</h4>
                    <p>Usted es responsable legal por sus comentarios o fotos. Se eliminará contenido ofensivo y se banearán cuentas infractoras.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">7. Seguridad del Almacenamiento</h4>
                    <p>Sus datos se encriptan en servidores en la nube seguros. Giro no se responsabiliza por filtraciones causadas por hackers fuera de nuestro control.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">8. Sus Derechos y Eliminación</h4>
                    <p>Bajo la LGPD, tiene derecho a acceder y borrar sus datos. Puede eliminar su cuenta en el perfil o enviar un correo a: suporte@giroapp.com.br.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">9. Jurisdicción</h4>
                    <p>Cualquier disputa se resolverá bajo la jurisdicción de la Comarca de Curitiba, Paraná, Brasil.</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">1. Aceitação dos Termos e Legislação</h4>
                    <p>Ao criar uma conta ou utilizar os serviços do Giro, você declara estar ciente e concordar integralmente com este Termo de Uso e Política de Privacidade, regidos pelo Marco Civil da Internet (Lei nº 12.965/14) e pela LGPD (Lei nº 13.709/18).</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">2. Elegibilidade e Faixa Etária</h4>
                    <p>O aplicativo Giro possui curadoria de locais e eventos voltados ao público geral, incluindo vida noturna e consumo de bebidas alcoólicas por terceiros. O cadastro é permitido apenas para usuários com capacidade civil plena (maiores de 18 anos ou menores emancipados conforme a lei civil brasileira).</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">3. Coleta e Finalidade do Tratamento de Dados</h4>
                    <p>Sob a base legal do consentimento e execução de contrato, coletamos: nome completo, endereço de e-mail, fotografia de perfil e dados de geolocalização. Estes dados são utilizados exclusivamente para criação de conta, prevenção de fraudes, customização do perfil e funcionamento do radar dinâmico do app. Não comercializamos dados pessoais com terceiros.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">4. Uso de Serviços de Geolocalização</h4>
                    <p>O Giro requer acesso aos dados de GPS do dispositivo para mapear e indicar estabelecimentos e eventos próximos. Você pode revogar essa permissão a qualquer momento nas configurações do seu aparelho, ciente de que algumas funções de radar serão limitadas à busca manual.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">5. Isenção Total de Responsabilidade</h4>
                    <p>O Giro funciona unicamente como plataforma de facilitação e curadoria de informações de entretenimento. Não garantimos a veracidade de preços, horários de funcionamento, segurança, lotação, integridade física ou qualidade dos serviços prestados pelos locais parceiros ou indicados no app. O usuário isenta o Giro de qualquer dano, perda ou acidente ocorrido em eventos e estabelecimentos listados.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">6. Responsabilidade pelo Conteúdo e Avaliações</h4>
                    <p>Você é civil e penalmente responsável por qualquer conteúdo (texto, fotos ou notas) que publicar no Giro. É terminantemente proibido publicar conteúdo difamatório, ofensivo, ilícito ou mentiroso. O Giro se reserva o direito de excluir postagens e banir contas de usuários que violarem as diretrizes de comunidade, sem aviso prévio.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">7. Segurança de Armazenamento</h4>
                    <p>Seus dados são criptografados e hospedados em servidores de banco de dados em nuvem de alta segurança. Embora adotemos rígidos padrões técnicos de segurança, não há garantia absoluta contra invasões, e o Giro não será responsável por vazamentos decorrentes de ataques de terceiros fora do nosso controle razoável.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">8. Seus Direitos de Titular e Exclusão</h4>
                    <p>Em conformidade com o Art. 18 da LGPD, você possui direito de acesso, retificação e portabilidade de dados. A exclusão definitiva de sua conta, com a eliminação permanente de todos os seus dados coletados e preferências dos nossos servidores ativos, pode ser solicitada diretamente no seu perfil ou pelo e-mail: suporte@giroapp.com.br.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1">9. Foro de Eleição</h4>
                    <p>Para dirimir quaisquer controvérsias oriundas deste contrato, fica eleito o Foro da Comarca de Curitiba, Estado do Paraná, com renúncia expressa a qualquer outro, por mais privilegiado que seja.</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setIsTermsOpen(false)}
              className="w-full h-12 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-bold text-sm active:scale-95 transition-all shrink-0"
            >
              {lang === 'en' ? 'Understand' : lang === 'es' ? 'Entendido' : 'Entendido'}
            </button>
          </div>
        </div>
      )}

      {/* ══════════ CROP MODAL ══════════ */}
      {cropOpen && imageSrc && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-brand-indigo-950 border border-white/10 rounded-[28px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 text-center">
              <h3 className="text-sm font-outfit font-bold text-white">Ajustar Foto</h3>
            </div>
            <div className="relative w-full h-64 bg-black/30">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, px) => setCroppedAreaPixels(px)}
              />
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Zoom</span>
                <input
                  type="range" min={1} max={3} step={0.1} value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-brand-coral-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setCropOpen(false); setImageSrc(null); }}
                  className="flex-1 h-11 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-xs font-bold hover:bg-white/10 transition-all"
                >Cancelar</button>
                <button
                  onClick={async () => {
                    if (imageSrc && croppedAreaPixels) {
                      try {
                        const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
                        setAvatar(cropped);
                      } catch (e) { console.error(e); }
                    }
                    setCropOpen(false);
                    setImageSrc(null);
                  }}
                  className="flex-1 h-11 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-white text-xs font-bold active:scale-95 transition-all"
                >Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Profile Page ──────────────────────────────────────────────────────────

export default function Profile({ favoritesCount, setTab }: ProfileProps) {
  const [profileSubTab, setProfileSubTab] = useState<'personal' | 'business'>('personal');
  const [isMyReviewsOpen, setIsMyReviewsOpen] = useState(false);
  const [isHelpedLogOpen, setIsHelpedLogOpen] = useState(false);
  const [isRewardsWalletOpen, setIsRewardsWalletOpen] = useState(false);
  const [lang, setLangState] = useState(getLanguage());
  useEffect(() => {
    const handleLangChange = (e: any) => setLangState(e.detail.lang);
    window.addEventListener('giro-language-change', handleLangChange);
    return () => window.removeEventListener('giro-language-change', handleLangChange);
  }, []);

  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [badgeLevel, setBadgeLevel] = useState<'gold' | 'silver' | 'bronze'>('gold');
  const [badgeProgress, setBadgeProgress] = useState(65);
  const [wazePoints, setWazePoints] = useState(80);
  const [helpedCount, setHelpedCount] = useState(142);
  const [pendingWazeQuestion, setPendingWazeQuestion] = useState(true);
  const [wazeNotification, setWazeNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setWazeNotification(msg);
    setTimeout(() => {
      setWazeNotification(null);
    }, 4000);
  };
  const [userPreferences, setUserPreferences] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('giro_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { console.error(e); }
    return ['pet', 'outdoor', 'live-music'];
  });
  const [isPrefsSheetOpen, setIsPrefsSheetOpen] = useState(false);

  // Auth
  const [session, setSession] = useState<any>(null);
  const [mockSession, setMockSession] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('giro_mock_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Estados do "Meu Negócio"
  const [merchantPlace, setMerchantPlace] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('giro_merchant_place');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isCreatingBusiness, setIsCreatingBusiness] = useState(false);
  const [businessStep, setBusinessStep] = useState(1);
  const [cropType, setCropType] = useState<'avatar' | 'business'>('avatar');

  // Formulário do Negócio
  const [bizName, setBizName] = useState('');
  const [bizCategory, setBizCategory] = useState('🍕 Pizzaria');
  const [bizPrice, setBizPrice] = useState<'$' | '$$' | '$$$'>('$$');
  const [bizDescription, setBizDescription] = useState('');
  
  const [bizCep, setBizCep] = useState('');
  const [bizStreet, setBizStreet] = useState('');
  const [bizNumber, setBizNumber] = useState('');
  const [bizComplement, setBizComplement] = useState('');
  const [bizNeighborhood, setBizNeighborhood] = useState('');
  const [bizLat, setBizLat] = useState(-25.4290);
  const [bizLng, setBizLng] = useState(-49.2671);
  const [cepLoading, setCepLoading] = useState(false);

  const [bizPhone, setBizPhone] = useState('');
  const [bizInstagram, setBizInstagram] = useState('');
  const [bizWebsite, setBizWebsite] = useState('');
  const [bizImage, setBizImage] = useState<string | null>(null);
  const [bizHours, setBizHours] = useState('Diariamente, das 09h às 22h');
  
  // Event-specific fields
  const [bizEventDate, setBizEventDate] = useState('Sáb, 13 Jun');
  const [bizEventTime, setBizEventTime] = useState('20:00');
  const [bizTicketPrice, setBizTicketPrice] = useState<number>(0);
  const [bizTicketUrl, setBizTicketUrl] = useState('');
  const [bizTags, setBizTags] = useState<string[]>([]);

  // Toggles de simulação no Dashboard
  const [isOpenNow, setIsOpenNow] = useState(true);
  const [isLiveMusicToday, setIsLiveMusicToday] = useState(false);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleCepChange = async (val: string) => {
    const cleanCep = val.replace(/\D/g, '');
    setBizCep(val);
    if (cleanCep.length === 8) {
      setCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (data && !data.erro) {
          setBizStreet(data.logradouro || '');
          setBizNeighborhood(data.bairro || '');
          
          const fullAddress = `${data.logradouro || ''}, Curitiba, PR, Brasil`;
          fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`)
            .then(res => res.json())
            .then(geoData => {
              if (geoData && geoData[0]) {
                setBizLat(parseFloat(geoData[0].lat));
                setBizLng(parseFloat(geoData[0].lon));
              }
            }).catch(console.error);
        }
      } catch (e) {
        console.error('Erro ao buscar CEP:', e);
      } finally {
        setCepLoading(false);
      }
    }
  };

  const getCategoryId = (cat: string) => {
    const normalized = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (
      normalized.includes('turistico') ||
      normalized.includes('turismo') ||
      normalized.includes('atracao') ||
      normalized.includes('boliche') ||
      normalized.includes('kart') ||
      normalized.includes('escape') ||
      normalized.includes('lazer') ||
      normalized.includes('mercado') ||
      normalized.includes('feira') ||
      normalized.includes('shopping') ||
      normalized.includes('mall')
    ) {
      return '1'; // Parques e Lazer
    }
    if (
      normalized.includes('museu') ||
      normalized.includes('galeria') ||
      normalized.includes('exposicao') ||
      normalized.includes('cultura') ||
      normalized.includes('teatro') ||
      normalized.includes('espaco') ||
      normalized.includes('art') ||
      normalized.includes('festival') ||
      normalized.includes('evento')
    ) {
      return '5'; // Cultura & Arte
    }
    if (
      normalized.includes('cafeteria') ||
      normalized.includes('cafe') ||
      normalized.includes('doces') ||
      normalized.includes('bolos') ||
      normalized.includes('padaria') ||
      normalized.includes('sorveteria') ||
      normalized.includes('gelateria') ||
      normalized.includes('acai') ||
      normalized.includes('panificadora')
    ) {
      return '3'; // Cafés e Doces
    }
    if (
      normalized.includes('cervejaria') ||
      normalized.includes('pub') ||
      normalized.includes('adega') ||
      normalized.includes('vinhos') ||
      normalized.includes('drinks') ||
      normalized.includes('coqueteis') ||
      normalized.includes('bar') ||
      normalized.includes('balada') ||
      normalized.includes('show') ||
      normalized.includes('karaoke')
    ) {
      return '4'; // Vida Noturna
    }
    return '2'; // Gastronomia (default fallback)
  };

  const getSubCategoryId = (cat: string) => {
    const norm = cat.toLowerCase();
    
    // Gastronomia
    if (norm.includes('pizzaria') || norm.includes('italiana') || norm.includes('massas')) return 'massas_italiana';
    if (norm.includes('hamburgueria') || norm.includes('lanches') || norm.includes('pastelaria') || norm.includes('cachorro-quente') || norm.includes('sanduiche')) return 'hamburgueres';
    if (norm.includes('japonesa') || norm.includes('asiatica') || norm.includes('chinesa') || norm.includes('oriental') || norm.includes('sushi') || norm.includes('poke')) return 'asiatica';
    if (norm.includes('churrascaria') || norm.includes('carnes')) return 'carnes_churrasco';
    if (norm.includes('arabe')) return 'arabe';
    if (norm.includes('mexicana')) return 'mexicana';
    if (norm.includes('brasileira')) return 'brasileira';
    if (norm.includes('mar') || norm.includes('peixes') || norm.includes('frutos')) return 'frutos_do_mar';
    if (norm.includes('saudavel') || norm.includes('vegana') || norm.includes('vegetariana')) return 'saudavel_vegana';
    
    // Cafés e Doces (Novos Mapeamentos)
    if (norm.includes('cafeteria') || norm.includes('cafe')) return 'cafeterias';
    if (norm.includes('padaria') || norm.includes('panificadora')) return 'padarias';
    if (norm.includes('doces') || norm.includes('bolos') || norm.includes('confeitaria')) return 'docerias';
    if (norm.includes('sorveteria') || norm.includes('gelateria') || norm.includes('acai')) return 'sorveterias';
    
    // Vida Noturna (Mapeamentos)
    if (norm.includes('cervejaria') || norm.includes('pub') || norm.includes('bar_pub')) return 'bar_pub';
    if (norm.includes('adega') || norm.includes('vinho') || norm.includes('drinks') || norm.includes('coquetel')) return 'adegas_drinks';
    if (norm.includes('karaoke')) return 'karaokes';
    if (norm.includes('balada') || norm.includes('show') || norm.includes('clube')) return 'baladas';
    
    // Parques e Lazer (Mapeamentos)
    if (norm.includes('turistico') || norm.includes('turismo') || norm.includes('atracao')) return 'turismo';
    if (norm.includes('boliche') || norm.includes('kart') || norm.includes('escape') || norm.includes('lazer')) return 'lazer_privado';
    if (norm.includes('mercado') || norm.includes('feira') || norm.includes('food hall') || norm.includes('foodhall')) return 'mercados_feiras';
    if (norm.includes('shopping') || norm.includes('mall')) return 'shoppings';
    
    // Cultura & Arte (Mapeamentos)
    if (norm.includes('museu') || norm.includes('galeria') || norm.includes('exposição') || norm.includes('exposicao') || norm.includes('cultura')) return 'museus';
    if (norm.includes('teatro') || norm.includes('espaço cultural') || norm.includes('espaco cultural')) return 'teatros';
    if (norm.includes('show') || norm.includes('festival') || norm.includes('evento')) return 'shows_eventos';
    
    return undefined;
  };

  const handleFinishBusinessSignup = async () => {
    const id = `biz_${Date.now()}`;
    const newPlace = {
      id,
      name: bizName,
      description: bizDescription,
      address: `${bizStreet}, ${bizNumber}${bizComplement ? ` - ${bizComplement}` : ''} - ${bizNeighborhood}, Curitiba - PR`,
      phone: bizPhone || undefined,
      instagram_handle: bizInstagram || undefined,
      website_url: bizWebsite || undefined,
      category_id: getCategoryId(bizCategory),
      sub_category_id: getSubCategoryId(bizCategory),
      category_name: bizCategory,
      latitude: bizLat,
      longitude: bizLng,
      image_url: bizImage || 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=60',
      avg_rating: 5.0,
      review_count: 1,
      price_range: bizPrice,
      is_featured: false,
      is_verified: true,
      operating_hours: {
        "Seg-Dom": bizHours
      },
      event_date: getSubCategoryId(bizCategory) === 'shows_eventos' ? bizEventDate : undefined,
      event_time: getSubCategoryId(bizCategory) === 'shows_eventos' ? bizEventTime : undefined,
      ticket_price: getSubCategoryId(bizCategory) === 'shows_eventos' ? bizTicketPrice : undefined,
      ticket_url: getSubCategoryId(bizCategory) === 'shows_eventos' ? bizTicketUrl : undefined,
      tags: bizTags,
    };

    localStorage.setItem('giro_merchant_place', JSON.stringify(newPlace));
    setMerchantPlace(newPlace);

    const exists = MOCK_PLACES.some(p => p.id === newPlace.id);
    if (!exists) {
      MOCK_PLACES.push(newPlace);
    }

    if (supabase && session?.user) {
      try {
        await supabase.from('places').insert({
          id: newPlace.id,
          name: newPlace.name,
          description: newPlace.description,
          address: newPlace.address,
          phone: newPlace.phone,
          instagram_handle: newPlace.instagram_handle,
          website_url: newPlace.website_url,
          category_id: newPlace.category_id,
          sub_category_id: newPlace.sub_category_id,
          latitude: newPlace.latitude,
          longitude: newPlace.longitude,
          image_url: newPlace.image_url,
          avg_rating: newPlace.avg_rating,
          review_count: newPlace.review_count,
          price_range: newPlace.price_range,
          is_featured: newPlace.is_featured,
          is_verified: newPlace.is_verified,
          operating_hours: newPlace.operating_hours,
          event_date: newPlace.event_date,
          event_time: newPlace.event_time,
          ticket_price: newPlace.ticket_price,
          ticket_url: newPlace.ticket_url,
          tags: newPlace.tags,
        });
      } catch (e) {
        console.error("Erro ao salvar negócio no Supabase:", e);
      }
    }

    setIsCreatingBusiness(false);
    setBusinessStep(1);
  };

  const handleDeleteBusiness = async () => {
    if (!merchantPlace) return;
    const id = merchantPlace.id;

    localStorage.removeItem('giro_merchant_place');
    setMerchantPlace(null);

    const index = MOCK_PLACES.findIndex(p => p.id === id);
    if (index > -1) {
      MOCK_PLACES.splice(index, 1);
    }

    if (supabase && session?.user) {
      try {
        await supabase.from('places').delete().eq('id', id);
      } catch (e) {
        console.error("Erro ao deletar do Supabase:", e);
      }
    }
  };

  const handleBizImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImageSrc(ev.target.result as string);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setCropType('business');
          setCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Modals
  const [isCadastraisOpen, setIsCadastraisOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editBirthday, setEditBirthday] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editGenderDetails, setEditGenderDetails] = useState('');
  const [editPronouns, setEditPronouns] = useState('');
  const [editNeighborhood, setEditNeighborhood] = useState('');
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Crop
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch(() => setLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handle = (e: CustomEvent<string[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setUserPreferences(e.detail);
        localStorage.setItem('giro_preferences', JSON.stringify(e.detail));
      }
    };
    window.addEventListener('giro-preferences-sync' as any, handle);
    return () => window.removeEventListener('giro-preferences-sync' as any, handle);
  }, []);

  const activeSession = session || mockSession;
  const user = activeSession?.user;
  const metadata = user?.user_metadata || {};
  const userName = metadata?.full_name || user?.email || 'Usuário Giro';
  const userNickname = metadata?.full_name
    ? `@${metadata.full_name.toLowerCase().replace(/\s+/g, '_')}`
    : user?.email ? `@${user.email.split('@')[0]}` : '@usuario_giro';
  const profilePhotoUrl = metadata?.avatar_url || null;
  const firstLetter = userName.charAt(0).toUpperCase();
  const avatarToShow = userAvatar || profilePhotoUrl;

  const prefs = PREFERENCES_LIST;

  const userBirthday = metadata?.birthday || '';
  const userGender = metadata?.gender || '';
  const userGenderDetails = metadata?.gender_details || '';
  const userPronouns = metadata?.pronouns || '';
  const userNeighborhood = metadata?.neighborhood || '';

  const openCadastrais = () => {
    setEditName(userName);
    setEditNickname(userNickname);
    setEditBirthday(userBirthday);
    setEditGender(userGender);
    setEditGenderDetails(userGenderDetails);
    setEditPronouns(userPronouns);
    setEditNeighborhood(userNeighborhood);
    setIsPasswordSectionOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setIsCadastraisOpen(true);
  };

  const saveCadastrais = async () => {
    if (supabase && session) {
      await supabase.auth.updateUser({ 
        data: { 
          full_name: editName,
          birthday: editBirthday,
          gender: editGender,
          gender_details: editGenderDetails,
          pronouns: editPronouns,
          neighborhood: editNeighborhood
        } 
      });
      await supabase.from('profiles').update({ 
        full_name: editName, 
        nickname: editNickname,
        birthday: editBirthday,
        gender: editGender,
        gender_details: editGenderDetails,
        pronouns: editPronouns,
        neighborhood: editNeighborhood
      }).eq('id', session.user.id);
    }
    const saved = localStorage.getItem('giro_mock_user');
    if (saved) {
      const u = JSON.parse(saved);
      u.name = editName;
      u.username = editNickname;
      u.birthday = editBirthday;
      u.gender = editGender;
      u.gender_details = editGenderDetails;
      u.pronouns = editPronouns;
      u.neighborhood = editNeighborhood;
      localStorage.setItem('giro_mock_user', JSON.stringify(u));
    }
    if (mockSession) {
      const updatedSess = { 
        ...mockSession, 
        user: { 
          ...mockSession.user, 
          user_metadata: { 
            ...mockSession.user.user_metadata, 
            full_name: editName,
            birthday: editBirthday,
            gender: editGender,
            gender_details: editGenderDetails,
            pronouns: editPronouns,
            neighborhood: editNeighborhood
          } 
        } 
      };
      setMockSession(updatedSess);
      localStorage.setItem('giro_mock_session', JSON.stringify(updatedSess));
    }
    
    // Mudança de Senha
    if (newPassword) {
      if (newPassword.length < 6) {
        alert('A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        alert('A confirmação da nova senha não confere.');
        return;
      }
      if (supabase && session) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          alert(`Erro ao alterar senha: ${error.message}`);
          return;
        }
      }
      if (saved) {
        const u = JSON.parse(saved);
        u.password = newPassword;
        localStorage.setItem('giro_mock_user', JSON.stringify(u));
      }
      triggerNotification('Senha alterada com sucesso!');
    }
    setIsCadastraisOpen(false);
  };

  const savePreferences = async (p: string[]) => {
    localStorage.setItem('giro_preferences', JSON.stringify(p));
    if (supabase && session) {
      await supabase.from('profiles').update({ preferences: p }).eq('id', session.user.id);
    }
    setIsPrefsSheetOpen(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setImageSrc(ev.target.result as string);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setCropType('avatar');
          setCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem('giro_mock_session');
    localStorage.removeItem('giro_google_onboarding_pending');
    setMockSession(null);
    window.dispatchEvent(new CustomEvent('giro-logout'));
  };

  const handleDeleteAccount = async () => {
    if (!activeSession?.user) return;
    try {
      if (supabase && !mockSession) {
        const { error } = await supabase.from('profiles').delete().eq('id', activeSession.user.id);
        if (error) { alert('Não foi possível excluir os dados. Tente novamente.'); return; }
      }
      localStorage.removeItem('giro_preferences');
      localStorage.removeItem('giro_favorites');
      localStorage.removeItem('giro_mock_session');
      localStorage.removeItem('giro_google_onboarding_pending');
      await handleLogout();
      setIsDeleteConfirmOpen(false);
    } catch (e) { console.error(e); }
  };

  const renderBusinessTabContent = () => {
    // 1. Dashboard de Parceiro (Negócio Cadastrado)
    if (merchantPlace) {
      return (
        <div className="flex flex-col gap-6 text-left animate-fadeIn">
          {/* Header Card */}
          <div className="relative h-44 rounded-[32px] overflow-hidden border border-slate-100 dark:border-white/5 shadow-xl bg-slate-100 dark:bg-brand-indigo-950/40">
            <img 
              src={merchantPlace.image_url} 
              alt={merchantPlace.name} 
              className="w-full h-full object-cover"
            />
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-brand-indigo-950/90 via-brand-indigo-950/40 to-transparent" />
            
            {/* Status Tag */}
            <div className="absolute top-4 right-4 flex gap-2">
              <span className={`px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider shadow-sm transition-all duration-300 ${
                isOpenNow ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}>
                {isOpenNow ? 'Aberto Agora' : 'Fechado'}
              </span>
              {isLiveMusicToday && (
                <span className="px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-brand-teal-500/20 text-brand-teal-400 border border-brand-teal-500/30 shadow-sm animate-pulse">
                  Ao Vivo Hoje
                </span>
              )}
            </div>

            {/* Info overlay */}
            <div className="absolute bottom-5 left-6 right-6">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2 py-0.5 rounded bg-brand-coral-500/20 text-brand-coral-400 border border-brand-coral-500/20 text-[9px] font-bold uppercase tracking-wider">
                  {merchantPlace.category_name || merchantPlace.category_id}
                </span>
                <span className="text-[10px] text-slate-300">•</span>
                <div className="flex items-center gap-0.5 text-brand-gold-400">
                  <Star className="w-3 h-3 fill-brand-gold-400" />
                  <span className="text-xs font-bold font-outfit">5.0</span>
                </div>
              </div>
              <h2 className="text-xl font-outfit font-black text-white line-clamp-1">{merchantPlace.name}</h2>
            </div>
          </div>

          {/* Métricas Mockadas */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <Eye className="w-4 h-4 text-brand-teal-400 mb-1.5" />, val: "242", label: 'Views' },
              { icon: <Heart className="w-4 h-4 text-brand-coral-500 mb-1.5" />, val: "88", label: 'Swipes' },
              { icon: <Bookmark className="w-4 h-4 text-brand-gold-400 mb-1.5" />, val: "14", label: 'Salvos' },
            ].map((m, idx) => (
              <div key={idx} className="glass-card p-4 rounded-[24px] flex flex-col items-center justify-center border border-slate-100 dark:border-white/5 text-center bg-white/5">
                {m.icon}
                <span className="text-lg font-outfit font-black text-slate-900 dark:text-white">{m.val}</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Toggles Rápidos */}
          <div className="glass-card rounded-[28px] border border-slate-100 dark:border-white/5 p-5 flex flex-col gap-4 bg-white/5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-coral-400" /> Painel Operacional
            </h3>
            
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-white/5">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Status de Funcionamento</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Controla se o local aparece aberto agora</p>
              </div>
              <button 
                onClick={() => setIsOpenNow(!isOpenNow)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isOpenNow ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-white/10'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOpenNow ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Música ao Vivo Hoje?</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Ativa a etiqueta de atração musical em tempo real</p>
              </div>
              <button 
                onClick={() => setIsLiveMusicToday(!isLiveMusicToday)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isLiveMusicToday ? 'bg-brand-coral-500' : 'bg-slate-200 dark:bg-white/10'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isLiveMusicToday ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Informações de Cadastro */}
          <div className="glass-card rounded-[28px] border border-slate-100 dark:border-white/5 p-5 flex flex-col gap-4 bg-white/5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-teal-400" /> Dados do Estabelecimento
            </h3>

            <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Endereço comercial</span>
                  <span>{merchantPlace.address}</span>
                </div>
              </div>

              {merchantPlace.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">WhatsApp comercial</span>
                    <span>{formatPhone(merchantPlace.phone)}</span>
                  </div>
                </div>
              )}

              {merchantPlace.instagram_handle && (
                <div className="flex items-start gap-2.5">
                  <Instagram className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Instagram comercial</span>
                    <span>@{merchantPlace.instagram_handle}</span>
                  </div>
                </div>
              )}

              {merchantPlace.website_url && (
                <div className="flex items-start gap-2.5">
                  <Globe className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Link de cardápio / Site</span>
                    <a href={merchantPlace.website_url.startsWith('http') ? merchantPlace.website_url : `https://${merchantPlace.website_url}`} target="_blank" rel="noopener noreferrer" className="text-brand-coral-400 hover:underline">
                      {merchantPlace.website_url}
                    </a>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Horário de funcionamento</span>
                  <span>{merchantPlace.operating_hours["Seg-Dom"]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Painel de Analytics & Interações Waze */}
          <div className="glass-card rounded-[28px] border border-slate-100 dark:border-white/5 p-5 flex flex-col gap-5 bg-white/5 text-left animate-[fadeIn_0.35s_ease-out]">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-brand-coral-400" />
              {lang === 'en' ? 'Advanced Analytics & Crowdsourcing' : lang === 'es' ? 'Análisis Avanzado y Crowdsourcing' : 'Analytics Avançado & Crowdsourcing'}
            </h3>

            {/* Swipes ratio progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>{lang === 'en' ? 'Liked (Swipe Right) • 82%' : lang === 'es' ? 'Gustó (Derecha) • 82%' : 'Gostaram (Swipe Direita) • 82%'}</span>
                <span>{lang === 'en' ? 'Ignored • 18%' : lang === 'es' ? 'Ignorado • 18%' : 'Ignoraram • 18%'}</span>
              </div>
              <div className="w-full h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden flex">
                <div className="h-full bg-gradient-to-r from-brand-teal-500 to-emerald-400" style={{ width: '82%' }} />
                <div className="h-full bg-rose-500" style={{ width: '18%' }} />
              </div>
            </div>

            {/* Click stats grid */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {lang === 'en' ? 'Detailed Clicks Grid' : lang === 'es' ? 'Matriz de Clics Detallados' : 'Métricas de Cliques no Perfil'}
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'metric_instagram', val: '765', icon: <Instagram className="w-3.5 h-3.5 text-pink-500" /> },
                  { key: 'metric_whatsapp', val: '342', icon: <Phone className="w-3.5 h-3.5 text-emerald-500" /> },
                  { key: 'metric_maps', val: '210', icon: <MapPin className="w-3.5 h-3.5 text-brand-teal-400" /> },
                  { key: 'metric_uber99', val: '154', icon: <Navigation className="w-3.5 h-3.5 text-brand-coral-400" /> },
                  { key: 'metric_website', val: '98', icon: <Globe className="w-3.5 h-3.5 text-blue-400" /> }
                ].map((item) => (
                  <div key={item.key} className="p-3 rounded-2xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex items-center justify-between animate-fadeIn">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.icon}
                      <span className="text-[10px] font-bold text-slate-750 dark:text-slate-350 truncate">{t(item.key as any)}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white shrink-0 ml-1">{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Loyalty and Waze Crowd Social Reward */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/5">
              <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {lang === 'en' ? 'Customer Loyalty & Waze Collaborators' : lang === 'es' ? 'Fidelidad y Colaboradores Waze' : 'Fidelidade & Colaboradores Waze'}
              </h4>

              <div className="space-y-2.5">
                {[
                  { username: '@renatomoreira', answers: 8, points: 80, coupon: 'Chopp Grátis', couponEn: 'Free Beer', couponEs: 'Cerveza Gratis' },
                  { username: '@joaoalves', answers: 3, points: 30, coupon: 'Café Cortesia', couponEn: 'Complimentary Coffee', couponEs: 'Café Cortesia' }
                ].map((user) => (
                  <div key={user.username} className="p-3.5 rounded-2xl bg-slate-100/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-brand-coral-500">{user.username}</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[8px] font-bold text-amber-500 uppercase">Top Contributor</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                        {lang === 'en' ? `${user.answers} answers • ${user.points} pts accumulated` : lang === 'es' ? `${user.answers} respuestas • ${user.points} pts acumulados` : `${user.answers} respostas • ${user.points} pts acumulados`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const couponName = lang === 'en' ? user.couponEn : lang === 'es' ? user.couponEs : user.coupon;
                        const sentCouponMsg = lang === 'en' ? 'Coupon successfully sent to' : lang === 'es' ? '¡Cupón enviado con éxito a' : 'Cupom enviado com sucesso para';
                        triggerNotification(`${sentCouponMsg} ${user.username}! (${couponName})`);
                      }}
                      className="py-2 px-3.5 rounded-xl bg-brand-coral-500 hover:bg-brand-coral-600 text-[10px] font-extrabold text-white active:scale-95 transition-all text-center shrink-0 cursor-pointer shadow-md shadow-brand-coral-500/15"
                    >
                      {lang === 'en' ? `Send ${user.couponEn} Coupon` : lang === 'es' ? `Enviar Cupón ${user.couponEs}` : `Enviar Cupom ${user.coupon}`}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Excluir Registro */}
          <button
            onClick={() => {
              if (window.confirm("Deseja realmente excluir permanentemente o cadastro do seu negócio? Isso removerá o local do Swipe e do Mapa de forma imediata.")) {
                handleDeleteBusiness();
              }
            }}
            className="w-full py-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-xs font-bold text-rose-400 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4" /> Excluir Registro do Negócio
          </button>
        </div>
      );
    }

    // 2. Wizard de Cadastro (Durante a Criação)
    if (isCreatingBusiness) {
      const isStep1Valid = bizName.trim().length >= 3 && bizDescription.trim().length >= 5;
      const isStep2Valid = bizCep.replace(/\D/g, '').length === 8 && bizStreet.trim().length > 0 && bizNeighborhood.trim().length > 0 && bizNumber.trim().length > 0;
      const isStep3Valid = bizPhone.trim().length > 0 || bizInstagram.trim().length > 0 || bizWebsite.trim().length > 0;
      const isStep4Valid = !!bizImage;
      const isStep5Valid = bizHours.trim().length >= 5;

      return (
        <div className="glass-card rounded-[32px] border border-slate-100 dark:border-white/5 p-6 text-left bg-white/5 flex flex-col gap-5 animate-fadeIn">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-extrabold text-brand-coral-400 uppercase tracking-widest block">Cadastrar Estabelecimento</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                {businessStep === 1 && "Informações Básicas"}
                {businessStep === 2 && "Endereço Comercial"}
                {businessStep === 3 && "Canais de Contato"}
                {businessStep === 4 && "Foto de Capa"}
                {businessStep === 5 && "Horário de Funcionamento"}
              </h3>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1 w-5 rounded-full transition-all duration-300 ${
                    s <= businessStep ? 'bg-brand-coral-500' : 'bg-slate-200 dark:bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-white/5 pt-5 min-h-[220px]">
            {/* Passo 1: Informações Básicas */}
            {businessStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Nome Comercial</label>
                  <input
                    type="text"
                    placeholder="Ex: Giro Café & Co."
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Categoria</label>
                    <select
                      value={bizCategory}
                      onChange={(e) => setBizCategory(e.target.value)}
                      className="w-full h-12 rounded-2xl form-input px-4 text-xs cursor-pointer"
                    >
                      {[
                        '🍕 Pizzaria',
                        '🍔 Hamburgueria',
                        '🥩 Carnes & Churrascaria',
                        '🍝 Italiana & Massas',
                        '🍣 Japonesa & Asiática',
                        '🌮 Mexicana',
                        '🥙 Árabe',
                        '🥡 Asiática & Chinesa',
                        '🍤 Frutos do Mar',
                        '🥘 Brasileira & PF',
                        '🥪 Lanches & Sanduíches',
                        '🥟 Pastelaria',
                        '🌭 Cachorro-Quente',
                        '🌯 Tapiocaria & Creparia',
                        '🍟 Porções & Petiscos',
                        '☕ Cafeteria & Café Especial',
                        '🥐 Padaria & Panificadora',
                        '🍰 Doces & Bolos',
                        '🍦 Sorveteria & Gelateria',
                        '🍇 Açaí',
                        '🌿 Vegetariana & Vegana',
                        '🥗 Saudável & Fit',
                        '🍺 Cervejaria & Pub',
                        '🍷 Adega & Bar de Vinhos',
                        '🍹 Drinks & Coquetéis',
                        '🕺 Balada & Casa de Show',
                        '🎤 Karaokê',
                        '🗺️ Ponto Turístico ou Atração de Turismo',
                        '🎡 Boliche, Kart & Escape (Lazer)',
                        '🎨 Museu, Galeria ou Exposição (Cultura)',
                        '🎭 Teatro ou Espaço Cultural',
                        '📅 Show, Festival ou Evento',
                        '🏛️ Mercado Gastronômico, Municipal ou Feira',
                        '🛍️ Shopping Center / Mall'
                      ].map((cat) => (
                        <option key={cat} value={cat} className="bg-white dark:bg-brand-indigo-950 text-slate-900 dark:text-white">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Faixa de Preço</label>
                    <select
                      value={bizPrice}
                      onChange={(e) => setBizPrice(e.target.value as any)}
                      className="w-full h-12 rounded-2xl form-input px-4 text-xs cursor-pointer"
                    >
                      {['$', '$$', '$$$'].map((p) => (
                        <option key={p} value={p} className="bg-white dark:bg-brand-indigo-950 text-slate-900 dark:text-white">{p} ({p === '$' ? 'Econômico' : p === '$$' ? 'Moderado' : 'Premium'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Descrição Curta</label>
                  <textarea
                    placeholder="Conte o que torna o seu local incrível em poucas palavras..."
                    value={bizDescription}
                    onChange={(e) => setBizDescription(e.target.value)}
                    maxLength={150}
                    className="w-full h-24 rounded-2xl form-input p-4 text-xs resize-none"
                  />
                  <div className="text-right text-[9px] text-slate-500 font-semibold">{bizDescription.length}/150 caracteres</div>
                </div>
              </div>
            )}

            {/* Passo 2: Endereço Comercial */}
            {businessStep === 2 && (
              <div className="space-y-3.5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">CEP</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: 80010-010"
                        maxLength={9}
                        value={bizCep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                      />
                      {cepLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-coral-500 border-t-transparent" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Cidade</label>
                    <input
                      type="text"
                      value="Curitiba"
                      readOnly
                      className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-slate-400 px-4 text-xs cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Rua / Logradouro</label>
                  <input
                    type="text"
                    placeholder="Logradouro autocompletado pelo CEP"
                    value={bizStreet}
                    onChange={(e) => setBizStreet(e.target.value)}
                    className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Bairro</label>
                    <input
                      type="text"
                      placeholder="Bairro autocompletado"
                      value={bizNeighborhood}
                      onChange={(e) => setBizNeighborhood(e.target.value)}
                      className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Número</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={bizNumber}
                      onChange={(e) => setBizNumber(e.target.value)}
                      className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Complemento (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Bloco A, Sala 4 / Ao lado da praça"
                    value={bizComplement}
                    onChange={(e) => setBizComplement(e.target.value)}
                    className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Passo 3: Contatos */}
            {businessStep === 3 && (
              <div className="space-y-4">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 leading-relaxed">
                  Insira ao menos um canal de contato. Eles ficarão visíveis como botões de atalho rápido direto nos cards de estabelecimentos.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    placeholder="(41) 99999-9999"
                    value={bizPhone}
                    onChange={(e) => setBizPhone(formatPhone(e.target.value))}
                    className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram (@usuario)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">@</span>
                    <input
                      type="text"
                      placeholder="nomedonegocio"
                      value={bizInstagram.replace(/^@/, '')}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        // clean URL prefixes if they copy-paste whole instagram url
                        let clean = val.replace(/(https?:\/\/)?(www\.)?instagram\.com\//i, '').replace(/\/$/, '').replace(/^@/, '');
                        setBizInstagram(clean);
                      }}
                      className="w-full h-12 rounded-2xl form-input pl-8 pr-4 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-brand-teal-400" /> Site / Link do Cardápio
                  </label>
                  <input
                    type="text"
                    placeholder="https://linktr.ee/seunegocio"
                    value={bizWebsite}
                    onChange={(e) => setBizWebsite(e.target.value)}
                    className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Passo 4: Foto de Capa */}
            {businessStep === 4 && (
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 leading-relaxed mb-1">
                  Adicione uma foto chamativa para representar o seu local. Ela será exibida no card do feed de Swipes e na capa dos detalhes do local.
                </p>

                <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 hover:border-brand-coral-500/50 rounded-[28px] bg-white/5 transition-all text-center">
                  {bizImage ? (
                    <div className="w-full relative aspect-video rounded-[20px] overflow-hidden group border border-white/5 shadow-inner">
                      <img src={bizImage} alt="Capa do local" className="w-full h-full object-cover" />
                      <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300">
                        <Camera className="w-6 h-6 text-white mb-1.5" />
                        <span className="text-[11px] font-bold text-white">Alterar Foto de Capa</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleBizImageUpload} />
                      </label>
                    </div>
                  ) : (
                    <label className="w-full flex flex-col items-center justify-center cursor-pointer py-10">
                      <div className="w-12 h-12 rounded-full bg-brand-coral-500/10 flex items-center justify-center mb-3">
                        <Camera className="w-5 h-5 text-brand-coral-500 animate-pulse" />
                      </div>
                      <span className="text-xs font-bold text-white">Adicionar Foto de Capa</span>
                      <span className="text-[9px] text-slate-500 mt-1">Imagens retangulares (16:9) funcionam melhor</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleBizImageUpload} />
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Passo 5: Horários / Detalhes do Evento */}
            {businessStep === 5 && (
              <div className="space-y-4">
                {getSubCategoryId(bizCategory) === 'shows_eventos' ? (
                  <>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                      Preencha os detalhes da data, hora e ingressos para o seu show, festival ou evento.
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Data do Evento</label>
                        <input
                          type="text"
                          placeholder="Ex: Sáb, 13 Jun"
                          value={bizEventDate}
                          onChange={(e) => setBizEventDate(e.target.value)}
                          className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Horário de Início</label>
                        <input
                          type="text"
                          placeholder="Ex: 20:00"
                          value={bizEventTime}
                          onChange={(e) => setBizEventTime(e.target.value)}
                          className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Preço do Ingresso (R$)</label>
                      <input
                        type="number"
                        placeholder="Ex: 50 (digite 0 se gratuito)"
                        value={bizTicketPrice || ''}
                        onChange={(e) => setBizTicketPrice(Number(e.target.value))}
                        className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Link para Comprar Ingressos</label>
                      <input
                        type="text"
                        placeholder="Ex: https://sympla.com.br/meu-evento"
                        value={bizTicketUrl}
                        onChange={(e) => setBizTicketUrl(e.target.value)}
                        className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
                      Escreva de forma simples os horários em que seu estabelecimento fica aberto para os clientes.
                    </p>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Horários de Funcionamento</label>
                      <input
                        type="text"
                        placeholder="Ex: Terça a Domingo, das 17h às 23h"
                        value={bizHours}
                        onChange={(e) => setBizHours(e.target.value)}
                        className="w-full h-12 rounded-2xl form-input px-4 text-xs"
                      />
                    </div>
                  </>
                )}

                {/* Seleção de Tags do Estabelecimento */}
                <div className="space-y-4 mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                  
                  {/* Categoria 1: Música & Vibe */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Música & Vibe do seu local
                    </label>
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
                        const isSelected = bizTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              setBizTags(prev => 
                                prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]
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

                  {/* Categoria 2: Diferenciais & Acessibilidade */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Diferenciais & Acessibilidade
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: 'pet', name: 'Pet Friendly', icon: '🐶' },
                        { id: 'vegan', name: 'Vegano/Saudável', icon: '🌿' },
                        { id: 'work', name: 'Trabalhar/Estudar', icon: '💻' },
                        { id: 'outdoor', name: 'Ao Ar Livre', icon: '☀️' },
                        { id: 'live-music', name: 'Música ao Vivo', icon: '🎶' },
                        { id: 'date', name: 'Encontro Romântico', icon: '🕯️' },
                        { id: 'cheap', name: 'Econômico/Barato', icon: '💰' },
                        { id: 'kids', name: 'Espaço Kids', icon: '🧒' },
                        { id: 'lgbt', name: 'LGBTQ+ Friendly', icon: '🌈' },
                        { id: 'accessible-motor', name: 'Acessibilidade Motora', icon: '♿' },
                        { id: 'accessible-deaf', name: 'Atendimento em LIBRAS', icon: '🤟' },
                        { id: 'accessible-blind', name: 'Cardápio Acessível', icon: '🔊' }
                      ].map((tag) => {
                        const isSelected = bizTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => {
                              setBizTags(prev => 
                                prev.includes(tag.id) ? prev.filter(t => t !== tag.id) : [...prev, tag.id]
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

                <div className="p-4 rounded-2xl bg-slate-200/50 dark:bg-white/5 border border-slate-300/50 dark:border-white/5 text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
                  💡 <strong>Pronto para decolar!</strong> Ao publicar, o Giro irá incluir o seu local diretamente no feed de Swipes de todos os usuários em Curitiba. Você pode alterar as configurações ou excluir o cadastro quando quiser através deste painel.
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 border-t border-slate-200 dark:border-white/5 pt-5">
            {businessStep > 1 ? (
              <button
                type="button"
                onClick={() => setBusinessStep(prev => prev - 1)}
                className="flex-1 py-3.5 rounded-2xl btn-secondary text-xs flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreatingBusiness(false)}
                className="flex-1 py-3.5 rounded-2xl btn-secondary text-xs flex items-center justify-center gap-1.5 text-rose-500 dark:text-rose-400"
              >
                Cancelar
              </button>
            )}

            {businessStep < 5 ? (
              <button
                type="button"
                onClick={() => setBusinessStep(prev => prev + 1)}
                disabled={
                  (businessStep === 1 && !isStep1Valid) ||
                  (businessStep === 2 && !isStep2Valid) ||
                  (businessStep === 3 && !isStep3Valid) ||
                  (businessStep === 4 && !isStep4Valid)
                }
                className="flex-[2] py-3.5 rounded-2xl btn-primary disabled:opacity-40 text-xs flex items-center justify-center gap-1.5"
              >
                Avançar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishBusinessSignup}
                disabled={!isStep5Valid}
                className="flex-[2] py-3.5 rounded-2xl btn-primary disabled:opacity-40 text-xs flex items-center justify-center gap-1.5"
              >
                Publicar e Integrar <CheckCircle2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      );
    }

    // 3. Tela de Conversão (Sem Negócio)
    return (
      <div className="flex flex-col gap-6 animate-fadeIn">
        {/* Banner Premium */}
        <div className="glass-card rounded-[32px] border border-brand-coral-500/20 bg-gradient-to-tr from-brand-coral-500/20 via-brand-indigo-950/20 to-amber-500/10 p-6 text-left relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full bg-brand-coral-500/10 blur-2xl" />
          
          <div className="w-12 h-12 rounded-2xl bg-brand-coral-500/10 flex items-center justify-center mb-5 border border-brand-coral-500/20">
            <Building2 className="w-6 h-6 text-brand-coral-500" />
          </div>

          <h2 className="text-xl font-outfit font-black text-white tracking-tight leading-snug">
            Promova seu Estabelecimento no Giro Curitiba
          </h2>
          <p className="text-[11px] text-slate-300 mt-2.5 leading-relaxed">
            Cadastre seu café, bar, pub, hamburgueria ou restaurante e apareça imediatamente no feed de matches do Swipe e no mapa de exploração dos clientes.
          </p>

          <div className="mt-5 space-y-3.5 border-t border-white/5 pt-5">
            {[
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />, title: "Visibilidade Instantânea", desc: "Seu local entra direto no rodízio de cartas no Swipe." },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />, title: "Mapeamento Proximidade", desc: "Apareça nos pins do mapa baseado na geolocalização do usuário." },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />, title: "Métricas de Desempenho", desc: "Acompanhe visualizações, curtidas e salvos em tempo real." },
              { icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />, title: "Canais Diretos de Contato", desc: "Atalhos rápidos para o WhatsApp, Instagram ou seu cardápio." },
            ].map((f, idx) => (
              <div key={idx} className="flex gap-3 text-xs leading-tight">
                {f.icon}
                <div>
                  <h4 className="font-bold text-white text-[11px]">{f.title}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setIsCreatingBusiness(true);
              setBusinessStep(1);
              setBizTags([]);
            }}
            className="w-full py-4 mt-6 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-coral-500/25 active:scale-[0.98]"
          >
            <Building className="w-4 h-4" /> Cadastrar Meu Estabelecimento
          </button>
        </div>
      </div>
    );
  };

  // ── Show onboarding overlay when not logged in, or when Google onboarding is pending ──
  const isGoogleOnboardingPending = activeSession && localStorage.getItem('giro_google_onboarding_pending') === 'true';

  if (!loading && (!activeSession || isGoogleOnboardingPending)) {
    return (
      <OnboardingOverlay
        initialView={isGoogleOnboardingPending ? 'signup-4' : 'splash'}
        onComplete={(sess) => {
          localStorage.removeItem('giro_google_onboarding_pending');
          if (sess?.user) {
            if (!supabase) {
              localStorage.setItem('giro_mock_session', JSON.stringify(sess));
            }
            setMockSession(sess);
            window.dispatchEvent(new CustomEvent('giro-login'));
          }
        }}
      />
    );
  }

  return (
    <div className="pb-24 text-slate-900 dark:text-slate-100 w-full flex flex-col items-center">
      {/* Toast Notification */}
      {wazeNotification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100000] w-full max-w-xs p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-2xl flex items-center justify-between animate-[fadeInDown_0.3s_ease-out]">
          <div className="flex items-center gap-2">
            <span className="text-sm">✓</span>
            <span>{wazeNotification}</span>
          </div>
          <button onClick={() => setWazeNotification(null)} className="text-white hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      <div className="px-6 py-6 max-w-md mx-auto w-full flex flex-col">
        {/* Segmented Control */}
        <div className="flex bg-slate-100 dark:bg-brand-indigo-950/85 p-1 rounded-2xl w-full gap-1 border border-slate-200/60 dark:border-white/5 transition-colors duration-300 shrink-0">
          <button
            onClick={() => setProfileSubTab('personal')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              profileSubTab === 'personal' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('meu_perfil')}
          </button>
          <button
            onClick={() => setProfileSubTab('business')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              profileSubTab === 'business' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t('meu_negocio')}
          </button>
        </div>

        <div className="w-full">
          {profileSubTab === 'personal' ? (
            loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-coral-500" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Avatar */}
                <div className="relative group avatar-container mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-coral-500/30 bg-slate-100 dark:bg-brand-indigo-900/50 flex items-center justify-center relative transition-all duration-300 avatar-pulse">
                    {avatarToShow ? (
                      <img src={avatarToShow} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-brand-coral-500 to-amber-500 flex items-center justify-center">
                        <span className="text-3xl font-outfit font-extrabold text-white">{firstLetter}</span>
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-coral-500 border-2 border-slate-50 dark:border-brand-indigo-950 flex items-center justify-center cursor-pointer hover:bg-brand-coral-600 transition-all hover:scale-110 active:scale-95 shadow-lg">
                    <Edit2 className="w-3.5 h-3.5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>

                <h2 className="text-xl font-outfit font-extrabold text-slate-900 dark:text-white">
                  {userName} {userPronouns && userPronouns !== 'não-exibir' && (
                    <span className="text-xs font-normal text-slate-450 dark:text-slate-400">({userPronouns})</span>
                  )}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{userNickname}</p>

                {/* Warning Alert if gold badge progress is < 100% */}
                {badgeLevel === 'gold' && badgeProgress < 100 && (
                  <div className="w-full mb-3 mt-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-start gap-2.5 animate-[fadeIn_0.3s_ease-out]">
                    <span className="shrink-0 text-base">⚠️</span>
                    <p className="text-left leading-relaxed">{t('selo_decaindo_aviso')}</p>
                  </div>
                )}

                {/* Selo */}
                <div
                  className="glass-card rounded-3xl p-4 w-full border border-slate-100 dark:border-white/5 flex items-center gap-4 mt-4 select-none hover:border-brand-coral-500/30 transition-all"
                >
                  <div className="relative shrink-0 overflow-hidden rounded-xl">
                    <svg className="w-14 h-14 drop-shadow-md" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFE082" /><stop offset="30%" stopColor="#FFB300" />
                          <stop offset="70%" stopColor="#FF8F00" /><stop offset="100%" stopColor="#FFE082" />
                        </linearGradient>
                        <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ECEFF1" /><stop offset="50%" stopColor="#B0BEC5" /><stop offset="100%" stopColor="#90A4AE" />
                        </linearGradient>
                        <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#D7CCC8" /><stop offset="50%" stopColor="#8D6E63" /><stop offset="100%" stopColor="#5D4037" />
                        </linearGradient>
                      </defs>
                      <path
                        fill={badgeLevel === 'gold' ? 'url(#goldGrad)' : badgeLevel === 'silver' ? 'url(#silverGrad)' : 'url(#bronzeGrad)'}
                        d="M 10 10 Q 18 18 26 10 Q 34 18 42 10 Q 50 18 58 10 Q 66 18 74 10 Q 82 18 90 10 Q 82 18 90 26 Q 82 34 90 42 Q 82 50 90 58 Q 82 66 90 74 Q 82 82 90 90 Q 82 82 74 90 Q 66 82 58 90 Q 50 82 42 90 Q 34 82 26 90 Q 18 82 10 90 Q 18 82 10 74 Q 18 66 10 58 Q 18 50 10 42 Q 18 34 10 26 Q 18 18 10 10 Z"
                      />
                      <text x="50" y="61" fontFamily="'Outfit', sans-serif" fontSize="34" fontWeight="900" textAnchor="middle" fill="rgba(255,255,255,0.22)">G</text>
                      <text x="50" y="60" fontFamily="'Outfit', sans-serif" fontSize="34" fontWeight="900" textAnchor="middle" fill="rgba(0,0,0,0.55)">G</text>
                    </svg>
                    <div className="shimmer-badge-overlay" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                        {t('selo')} {badgeLevel === 'gold' ? t('selo_ouro') : badgeLevel === 'silver' ? t('selo_prata') : t('selo_bronze')}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {badgeLevel === 'gold' ? `${badgeProgress}%` : badgeLevel === 'silver' ? '60%' : '30%'} {t('ativo')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {t('ciclar_selos')}
                    </p>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-brand-indigo-950 rounded-full overflow-hidden mt-2">
                      <div className={`h-full rounded-full transition-all duration-500 ${badgeLevel === 'gold' ? 'bg-amber-500' : badgeLevel === 'silver' ? 'bg-slate-300' : 'bg-amber-700'}`} style={{ width: badgeLevel === 'gold' ? `${badgeProgress}%` : badgeLevel === 'silver' ? '60%' : '30%' }} />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-2 w-full mt-4">
                  {[
                    { icon: <Bookmark className="w-4 h-4 text-brand-teal-400 mb-1.5" />, val: favoritesCount, label: t('salvos'), onClick: () => setTab?.('favorites') },
                    { icon: <Edit3 className="w-4 h-4 text-brand-gold-400 mb-1.5" />, val: 12, label: t('reviews'), onClick: () => setIsMyReviewsOpen(true) },
                    { icon: <Heart className="w-4 h-4 text-brand-coral-500 mb-1.5" />, val: helpedCount, label: t('ajudou'), onClick: () => setIsHelpedLogOpen(true) },
                    { icon: <Sparkles className="w-4 h-4 text-amber-500 mb-1.5" />, val: wazePoints, label: lang === 'en' ? 'POINTS' : lang === 'es' ? 'PUNTOS' : 'PONTOS', onClick: () => setIsRewardsWalletOpen(true) },
                  ].map((s, i) => (
                    <div 
                      key={i} 
                      onClick={s.onClick}
                      className="glass-card p-2.5 rounded-2xl flex flex-col items-center justify-center border border-slate-100 dark:border-white/5 shadow-inner text-center cursor-pointer active:scale-95 transition-all hover:border-brand-coral-500/20"
                    >
                      {s.icon}
                      <span className="text-sm font-outfit font-extrabold text-slate-900 dark:text-white transition-all duration-300">{s.val}</span>
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 whitespace-nowrap">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Pending Waze Questions */}
                {pendingWazeQuestion && (
                  <div className="glass-card rounded-3xl p-5 w-full border border-slate-100 dark:border-white/5 mt-4 text-left bg-white/5 animate-[fadeInUp_0.4s_ease-out]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-brand-coral-500 animate-ping" />
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        {lang === 'en' ? 'Pending Waze Questions' : lang === 'es' ? 'Preguntas Waze Pendientes' : 'Perguntas Waze Pendentes'}
                      </h3>
                    </div>
                    <p className="text-xs font-semibold text-slate-750 dark:text-slate-350 mb-3 leading-relaxed">
                      {lang === 'en' ? 'Someone is asking: How is Sheridan\'s Irish Pub right now?' : lang === 'es' ? 'Alguien está preguntando: ¿Cómo está Sheridan\'s Irish Pub ahora?' : 'Alguém perguntando: Como está o Sheridan\'s Irish Pub agora?'}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'tranquilo', label: t('waze_tranquilo') },
                        { id: 'cheio', label: t('waze_cheio') },
                        { id: 'lotado', label: t('waze_lotado') }
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setBadgeProgress(100);
                            setWazePoints(prev => prev + 10);
                            setHelpedCount(prev => prev + 1);
                            setPendingWazeQuestion(false);
                            triggerNotification(
                              lang === 'en' 
                                ? 'Thanks! +10 points. Gold Badge restored!' 
                                : lang === 'es' 
                                  ? '¡Gracias! +10 puntos. ¡Sello de Oro restaurado!' 
                                  : 'Obrigado! +10 pontos. Selo Ouro restaurado!'
                            );
                          }}
                          className="py-2 px-1 text-center text-[10px] font-bold rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-350 hover:border-brand-coral-500 hover:bg-brand-coral-500/5 active:scale-95 transition-all cursor-pointer"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preferências */}
                {/* Preferências */}
                <div className="glass-card rounded-3xl p-5 w-full border border-slate-100 dark:border-white/5 mt-4 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('minhas_preferencias')}</h3>
                    {userPreferences.length > 0 && (
                      <button onClick={() => setIsPrefsSheetOpen(true)} className="text-xs text-brand-coral-500 hover:text-brand-coral-600 flex items-center gap-1 font-semibold transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />{t('editar')}
                      </button>
                    )}
                  </div>
                  {userPreferences.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {prefs.filter((p) => userPreferences.includes(p.id)).map((p) => (
                        <span key={p.id} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-brand-coral-500 bg-brand-coral-500 text-white shadow-md shadow-brand-coral-500/20">
                          {(() => {
                            let key = `pref_${p.id.replace(/-/g, '_')}`;
                            if (p.id === 'accessible-motor') key = 'pref_acc_motor';
                            else if (p.id === 'accessible-deaf') key = 'pref_acc_deaf';
                            else if (p.id === 'accessible-blind') key = 'pref_acc_blind';
                            return t(key as any) || p.label;
                          })()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <button onClick={() => setIsPrefsSheetOpen(true)} className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mt-3 transition-colors">
                      {t('nenhuma_preferencia')} <span className="text-brand-coral-500">{t('adicionar')}</span>
                    </button>
                  )}
                </div>

                {/* Menu */}
                <div className="glass-card rounded-3xl w-full border border-slate-100 dark:border-white/5 mt-4 overflow-hidden">
                  {[
                    { icon: <User className="w-4 h-4 text-slate-400" />, label: t('dados_cadastrais'), onClick: openCadastrais, danger: false },
                    { icon: <Bell className="w-4 h-4 text-slate-400" />, label: t('gerenciar_notificacoes'), onClick: () => alert('Em breve!'), danger: false },
                    { icon: <Trash2 className="w-4 h-4 text-rose-400" />, label: t('excluir_conta_definitiva'), onClick: () => setIsDeleteConfirmOpen(true), danger: true },
                  ].map((item, idx, arr) => (
                    <button
                      key={idx}
                      onClick={item.onClick}
                      className={`w-full flex items-center justify-between px-5 py-4 ${idx < arr.length - 1 ? 'border-b border-slate-100 dark:border-white/5' : ''} ${item.danger ? 'hover:bg-rose-500/10' : 'hover:bg-slate-100 dark:hover:bg-white/5'} transition-all text-left group`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className={`text-xs font-bold ${item.danger ? 'text-rose-400' : 'text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white'} transition-colors`}>
                          {item.label}
                        </span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${item.danger ? 'text-rose-400' : 'text-slate-500'}`} />
                    </button>
                  ))}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-rose-500/10 transition-all text-left"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-rose-400">{t('sair_conta')}</span>
                    </div>
                  </button>
                </div>
              </div>
            )
          ) : (
            renderBusinessTabContent()
          )}
        </div>
      </div>

      {/* Crop Modal */}
      {cropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-card w-full max-w-md rounded-[32px] border border-white/5 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-white/5 text-center">
              <h3 className="text-base font-outfit font-bold text-white">{cropType === 'avatar' ? 'Ajustar Foto de Perfil' : 'Ajustar Foto de Capa'}</h3>
            </div>
            <div className="relative w-full h-72 bg-brand-indigo-950/40">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} 
                aspect={cropType === 'avatar' ? 1 : 16 / 9} 
                cropShape={cropType === 'avatar' ? 'round' : 'rect'} 
                showGrid={cropType === 'business'}
                onCropChange={setCrop} onZoomChange={setZoom}
                onCropComplete={(_a, px) => setCroppedAreaPixels(px)} />
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Zoom</span>
                <input type="range" min={1} max={3} step={0.1} value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-brand-coral-500 bg-white/10 rounded-lg h-1.5 cursor-pointer" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setCropModalOpen(false); setImageSrc(null); }}
                  className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-slate-300 active:scale-95 transition-all">
                  Cancelar
                </button>
                <button onClick={async () => {
                  try {
                    if (imageSrc && croppedAreaPixels) {
                      const cropped = await getCroppedImg(imageSrc, croppedAreaPixels);
                      if (cropType === 'avatar') {
                        setUserAvatar(cropped);
                        if (!supabase) {
                          const saved = localStorage.getItem('giro_mock_user');
                          if (saved) {
                            const u = JSON.parse(saved);
                            u.avatar = cropped;
                            localStorage.setItem('giro_mock_user', JSON.stringify(u));
                          }
                          if (mockSession) {
                            const updatedSess = {
                              ...mockSession,
                              user: {
                                ...mockSession.user,
                                user_metadata: {
                                  ...mockSession.user.user_metadata,
                                  avatar_url: cropped
                                }
                              }
                            };
                            setMockSession(updatedSess);
                            localStorage.setItem('giro_mock_session', JSON.stringify(updatedSess));
                          }
                        }
                      } else {
                        setBizImage(cropped);
                      }
                      setCropModalOpen(false);
                      setImageSrc(null);
                    }
                  } catch (e) { console.error(e); }
                }}
                  className="flex-1 py-3 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-xs font-bold text-white active:scale-95 transition-all">
                  Confirmar Corte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Sheet */}
      {isPrefsSheetOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
          <div className="absolute inset-0" onClick={() => savePreferences(userPreferences)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-2xl z-10 animate-[slideUp_0.3s_ease-out] flex flex-col text-slate-900 dark:text-slate-100 max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-5 shrink-0">
              <h3 className="text-base font-outfit font-extrabold text-slate-900 dark:text-white">Editar Preferências</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Calibre seu Swipe ⚡</p>
            </div>
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2 mb-6 min-h-0">
              {prefs.map((pref) => {
                const isActive = userPreferences.includes(pref.id);
                const translatedLabel = (() => {
                  let key = `pref_${pref.id.replace(/-/g, '_')}`;
                  if (pref.id === 'accessible-motor') key = 'pref_acc_motor';
                  else if (pref.id === 'accessible-deaf') key = 'pref_acc_deaf';
                  else if (pref.id === 'accessible-blind') key = 'pref_acc_blind';
                  return t(key as any) || pref.label;
                })();
                const emoji = translatedLabel.split(' ')[0];
                const text = translatedLabel.split(' ').slice(1).join(' ');
                
                return (
                  <button key={pref.id}
                    onClick={() => setUserPreferences((prev) => prev.includes(pref.id) ? prev.filter((p) => p !== pref.id) : [...prev, pref.id])}
                    className={`px-4 py-3 rounded-2xl text-xs font-semibold border flex items-center gap-2.5 transition-all duration-200 active:scale-95 ${
                      isActive ? 'bg-brand-coral-500 border-brand-coral-500 text-white shadow-md shadow-brand-coral-500/20'
                        : 'border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm shrink-0">{emoji}</span>
                    <span className="truncate">{text}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={() => savePreferences(userPreferences)}
              className="w-full py-3.5 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-xs font-bold text-white active:scale-95 shadow-md shadow-brand-coral-500/20 shrink-0">
              Confirmar Alterações
            </button>
          </div>
        </div>
      )}

      {/* Dados Cadastrais Sheet */}
      {isCadastraisOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
          <div className="absolute inset-0" onClick={() => setIsCadastraisOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-2xl z-10 animate-[slideUp_0.3s_ease-out] flex flex-col text-slate-900 dark:text-slate-100 max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6 shrink-0">
              <h3 className="text-base font-outfit font-extrabold text-slate-900 dark:text-white">Dados Cadastrais</h3>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-12 rounded-2xl form-input pl-10 pr-4 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Nickname</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">@</span>
                  <input type="text" value={editNickname.replace('@', '')} 
                    onChange={(e) => {
                      const clean = e.target.value
                        .replace(/^@/, '')
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .toLowerCase()
                        .replace(/\s+/g, '_')
                        .replace(/[^a-z0-9_]/g, '');
                      setEditNickname(`@${clean}`);
                    }}
                    className="w-full h-12 rounded-2xl form-input pl-10 pr-4 text-sm" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                  <input type="email" value={user?.email || ''} readOnly
                    className="w-full h-12 rounded-2xl form-input pl-10 pr-10 cursor-not-allowed opacity-60" />
                </div>
                <p className="text-[9px] text-slate-455 mt-1 pl-1">
                  * Por questões de segurança, o e-mail não pode ser alterado diretamente.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Aniversário</label>
                  <input 
                    type="text" 
                    inputMode="numeric" 
                    placeholder="DD/MM/AAAA"
                    maxLength={10}
                    value={editBirthday} 
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '');
                      let formatted = clean;
                      if (clean.length > 2) {
                        formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
                      }
                      if (clean.length > 4) {
                        formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4, 8)}`;
                      }
                      setEditBirthday(formatted);
                    }}
                    className="w-full h-12 rounded-2xl form-input px-3.5 text-xs bg-white dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/5" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-550 dark:text-slate-450 uppercase block">Como você se identifica? (Gênero)</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Feminino', 'Masculino', 'Não-binário', 'Prefiro não dizer'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        setEditGender(g);
                        if (g !== 'Não-binário') setEditGenderDetails('');
                      }}
                      className={`h-9 rounded-xl text-xs font-bold border active:scale-95 transition-all select-none ${
                        editGender === g
                          ? 'bg-brand-coral-500 border-brand-coral-500 text-white shadow-md'
                          : 'bg-white dark:bg-brand-indigo-950 border-slate-200/60 dark:border-white/5 text-slate-700 dark:text-slate-350'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {editGender === 'Não-binário' && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-[10px] font-bold text-slate-550 dark:text-slate-450 uppercase block">Descreva seu gênero (Opcional)</label>
                  <input type="text" value={editGenderDetails} onChange={(e) => setEditGenderDetails(e.target.value)} placeholder="Ex: Transgênero, Gênero Fluido"
                    className="w-full h-11 rounded-xl form-input px-3.5 text-xs bg-white dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/5" />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-550 dark:text-slate-455 uppercase block mb-1.5">Pronomes no Perfil</label>
                <select value={editPronouns} onChange={(e) => setEditPronouns(e.target.value)}
                  className="w-full h-11 rounded-xl form-input px-3 text-xs bg-white dark:bg-brand-indigo-950 text-slate-900 dark:text-white border border-slate-200 dark:border-white/5"
                >
                  <option value="">Selecione seus pronomes...</option>
                  <option value="ela/dela">Ela / Dela (She/Her)</option>
                  <option value="ele/dele">Ele / Dele (He/Him)</option>
                  <option value="elu/delu">Elu / Delu (Neutro)</option>
                  <option value="não-exibir">Prefiro não exibir</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Bairro de Residência</label>
                <select value={editNeighborhood} onChange={(e) => setEditNeighborhood(e.target.value)}
                  className="w-full h-12 rounded-2xl form-input px-4 text-xs bg-white dark:bg-brand-indigo-950 text-slate-900 dark:text-white border border-slate-200 dark:border-white/5"
                >
                  <option value="">Selecione seu Bairro...</option>
                  {['Água Verde', 'Batel', 'Bigorrilho', 'Boqueirão', 'Cabral', 'Cajuru', 'Centro', 'Cristo Rei', 'Juvevê', 'Mercês', 'Novo Mundo', 'Portão', 'Prado Velho', 'Santa Felicidade', 'Outro'].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Seção Expansível de Alterar Senha */}
              <div className="border-t border-slate-100 dark:border-white/5 pt-3.5 mt-1">
                <button
                  type="button"
                  onClick={() => setIsPasswordSectionOpen(!isPasswordSectionOpen)}
                  className="text-xs font-bold text-brand-coral-500 hover:text-brand-coral-600 transition-colors flex items-center gap-1.5"
                >
                  {isPasswordSectionOpen ? '✕ Cancelar alteração de senha' : '🔑 Deseja alterar sua senha?'}
                </button>
                
                {isPasswordSectionOpen && (
                  <div className="space-y-3 mt-3 animate-fadeIn">
                    <div>
                      <label className="text-[9px] font-bold text-slate-550 dark:text-slate-400 uppercase block mb-1">Nova Senha</label>
                      <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres"
                        className="w-full h-11 rounded-xl form-input px-3.5 text-xs bg-white dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/5" />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-550 dark:text-slate-400 uppercase block mb-1">Confirmar Nova Senha</label>
                      <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="Repita a nova senha"
                        className="w-full h-11 rounded-xl form-input px-3.5 text-xs bg-white dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/5" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <button onClick={saveCadastrais}
              className="w-full py-3.5 rounded-2xl btn-primary text-xs shrink-0 flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-[4px] p-6">
          <div className="absolute inset-0" onClick={() => setIsDeleteConfirmOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-brand-indigo-950 border border-slate-100 dark:border-rose-500/20 rounded-[32px] p-6 shadow-2xl z-10 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-outfit font-extrabold text-slate-900 dark:text-white mb-2">Excluir Conta?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Ação irreversível. Todos os seus dados serão excluídos em conformidade com a LGPD.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={handleDeleteAccount}
                className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-xs font-bold text-white active:scale-95 shadow-md shadow-rose-500/20">
                Sim, excluir minha conta
              </button>
              <button onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-full py-3.5 rounded-2xl btn-secondary text-xs"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Minhas Reviews */}
      {isMyReviewsOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
          <div className="absolute inset-0" onClick={() => setIsMyReviewsOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-2xl z-10 animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[75vh]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-sm font-outfit font-extrabold">{lang === 'en' ? 'My Reviews' : lang === 'es' ? 'Mis Reseñas' : 'Minhas Avaliações'}</h3>
              <button onClick={() => setIsMyReviewsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto space-y-3.5 pr-1 text-left">
              {[
                { 
                  place: "Sheridan's Irish Pub", 
                  rating: 3, 
                  date: lang === 'en' ? '2 days ago' : 'há 2 dias', 
                  text: lang === 'en' ? 'Great atmosphere, but the line was huge on Saturday and service was slow.' : 'O local é muito legal, mas a fila estava gigante no sábado e o atendimento demorou bastante.',
                  reply: lang === 'en' ? 'Owner: Hello! We apologize for the delay. We had a record crowd on Saturday due to a special concert, but we are already reinforcing our bar staff for the next weekends. We hope to see you again!' : 'Resposta do Estabelecimento: Olá! Lamentamos pela demora no sábado. Tivemos uma lotação recorde devido ao show especial, mas já estamos reforçando nossa equipe de bar para os próximos fins de semana para agilizar o atendimento. Esperamos sua visita de novo!'
                },
                { 
                  place: "Paco Cafeteria", 
                  rating: 5, 
                  date: lang === 'en' ? '1 week ago' : 'há 1 semana', 
                  text: lang === 'en' ? 'Espresso was amazing, pistachio cookie is divine.' : 'Café expresso estava maravilhoso e o cookie de pistache é divino!',
                  reply: lang === 'en' ? 'Owner: Thank you so much! It is always a pleasure to serve you our specialty coffee.' : 'Resposta do Estabelecimento: Muito obrigado pela avaliação! É sempre um prazer servir nosso café especial para você, volte sempre!'
                },
                { 
                  place: "Barigui Café", 
                  rating: 5, 
                  date: lang === 'en' ? '2 weeks ago' : 'há 2 semanas', 
                  text: lang === 'en' ? 'Cozy place, nice staff and rib sandwich is spectacular.' : 'Local muito gostoso, atendimento atencioso e o sanduíche de costela é sensacional.',
                  reply: null
                }
              ].map((rev, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col gap-1.5">
                  <div>
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-xs font-bold text-slate-800 dark:text-white truncate">{rev.place}</span>
                      <span className="text-[9px] text-slate-450 shrink-0">{rev.date}</span>
                    </div>
                    <div className="flex gap-0.5 text-brand-gold-400 my-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className={`w-3 h-3 ${idx < rev.rating ? 'fill-brand-gold-400 text-brand-gold-400' : 'text-slate-355 dark:text-slate-600'}`} />
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{rev.text}</p>
                  </div>
                  
                  {rev.reply && (
                    <div className="mt-1.5 p-2.5 rounded-xl bg-slate-200/50 dark:bg-brand-indigo-950/60 border-l-2 border-brand-coral-500 text-[9px] text-slate-705 dark:text-slate-355 leading-relaxed font-semibold">
                      <span className="text-[9px] font-black text-brand-coral-500 block mb-0.5">💬 {rev.reply.split(': ')[0]}</span>
                      {rev.reply.split(': ').slice(1).join(': ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Histórico Waze Social */}
      {isHelpedLogOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
          <div className="absolute inset-0" onClick={() => setIsHelpedLogOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-2xl z-10 animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[70vh]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-sm font-outfit font-extrabold">{lang === 'en' ? 'Waze Social Activity' : lang === 'es' ? 'Actividad Waze Social' : 'Histórico de Ajuda (Waze)'}</h3>
              <button onClick={() => setIsHelpedLogOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto space-y-3 pr-1 text-left">
              {[
                { type: 'status', place: "Sheridan's Irish Pub", detail: lang === 'en' ? "Answered: 'Chill'" : "Informou: 'Tranquilo'", pts: "+10 pts", time: lang === 'en' ? '10m ago' : 'há 10 min' },
                { type: 'status', place: "Barigui Café", detail: lang === 'en' ? "Answered: 'Busy / No Line'" : "Informou: 'Cheio / Sem Fila'", pts: "+10 pts", time: lang === 'en' ? '2d ago' : 'há 2 dias' },
                { type: 'thanks', place: "@joaoalves", detail: lang === 'en' ? "Sent you a thank you note!" : "Te enviou um agradecimento!", pts: "+5 pts", time: lang === 'en' ? '3d ago' : 'há 3 dias' },
                { type: 'status', place: "Paco Cafeteria", detail: lang === 'en' ? "Answered: 'Packed / Long Line'" : "Informou: 'Lotado / Fila Longa'", pts: "+10 pts", time: lang === 'en' ? '5d ago' : 'há 5 dias' }
              ].map((log, i) => (
                <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {log.type === 'thanks' ? '💬 ' : '📍 '} {log.place}
                    </span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 block truncate">{log.detail}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-black text-brand-teal-500 block">{log.pts}</span>
                    <span className="text-[8px] text-slate-450 mt-0.5 block">{log.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Carteira de Recompensas */}
      {isRewardsWalletOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[4px]">
          <div className="absolute inset-0" onClick={() => setIsRewardsWalletOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-brand-indigo-950 border border-slate-200 dark:border-white/10 rounded-[32px] p-6 shadow-2xl z-10 animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-sm font-outfit font-extrabold">{lang === 'en' ? 'Loyalty Rewards' : lang === 'es' ? 'Recompensas de Fidelidad' : 'Carteira de Recompensas'}</h3>
              <button onClick={() => setIsRewardsWalletOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="overflow-y-auto space-y-4 pr-1 text-left flex-1 min-h-0">
              
              {/* Pontos Atuais */}
              <div className="p-4 rounded-3xl bg-gradient-to-tr from-brand-coral-500 to-amber-500 text-white flex items-center justify-between shadow-lg shadow-brand-coral-500/15">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-80">{lang === 'en' ? 'Waze Points Balance' : 'Seus Pontos Acumulados'}</span>
                  <h4 className="text-2xl font-outfit font-black mt-1">{wazePoints} <span className="text-sm font-bold">pts</span></h4>
                </div>
                <Sparkles className="w-8 h-8 opacity-45 animate-pulse" />
              </div>

              {/* Seus Cupons Ativos */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{lang === 'en' ? 'Active Coupons' : 'Cupons Ativos'}</h5>
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block truncate">🎟️ Café Expresso Cortesia</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-455 mt-0.5 block">{lang === 'en' ? 'Sent by Giro Café & Co.' : 'Enviado por Giro Café & Co.'}</span>
                  </div>
                  <span className="px-2 py-1 rounded bg-emerald-500 text-white text-[8px] font-black uppercase shrink-0">Ativo</span>
                </div>
              </div>

              {/* Troca de Pontos */}
              <div>
                <h5 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{lang === 'en' ? 'Redeem Points' : 'Resgatar Benefícios'}</h5>
                <div className="space-y-2">
                  {[
                    { item: lang === 'en' ? 'Free Draft Beer' : '1 Chopp Cortesia', place: "Sheridan's", cost: 100 },
                    { item: lang === 'en' ? 'Free Espresso' : '1 Espresso Cortesia', place: "Barigui Café", cost: 50 },
                    { item: lang === 'en' ? 'Free French Fries' : '1 Batata Rápida Cortesia', place: "Sheridan's", cost: 150 }
                  ].map((reward, i) => {
                    const canRedeem = wazePoints >= reward.cost;
                    return (
                      <div key={i} className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">{reward.item}</span>
                          <span className="text-[9px] text-slate-500 mt-0.5 block">{reward.place}</span>
                        </div>
                        <button
                          disabled={!canRedeem}
                          onClick={() => {
                            setWazePoints(prev => prev - reward.cost);
                            triggerNotification(
                              lang === 'en' 
                                ? `Redeemed ${reward.item}! Coupon added.` 
                                : `Resgatado: ${reward.item}! Cupom adicionado à carteira.`
                            );
                          }}
                          className={`py-1.5 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all shrink-0 cursor-pointer ${
                            canRedeem 
                              ? 'bg-brand-coral-500 text-white shadow-md shadow-brand-coral-500/10' 
                              : 'bg-slate-200 dark:bg-white/10 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          {reward.cost} pts
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
