import React, { useState, useEffect, useRef } from 'react';
import {
  Edit2, Bookmark, Edit3, Heart, User, Bell, LogOut,
  ChevronRight, Mail, Lock, Eye, EyeOff, Save, X, Trash2,
  MapPin, ArrowRight, ArrowLeft, Camera, Sparkles, CheckCircle2,
  Instagram, Globe, Building2, Building, BarChart3, Star, Clock, Phone
} from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { MOCK_PLACES } from '../utils/constants';

interface ProfileProps {
  favoritesCount: number;
}

// ─── Onboarding full-screen overlay ────────────────────────────────────────────

type OnboardingView = 'splash' | 'email-login' | 'signup-1' | 'signup-2' | 'signup-3' | 'signup-4' | 'signup-5';

function OnboardingOverlay({
  initialView = 'splash',
  onComplete,
}: {
  initialView?: OnboardingView;
  onComplete: (session: any) => void;
}) {
  const [view, setView] = useState<OnboardingView>(initialView);

  // Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<string[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Crop states
  const [cropOpen, setCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allPrefs = [
    { id: 'pet', label: '🐶 Pet Friendly' },
    { id: 'vegan', label: '🌿 Vegano' },
    { id: 'work', label: '💻 Trabalhar' },
    { id: 'outdoor', label: '☀️ Ar Livre' },
    { id: 'live-music', label: '🎶 Música ao Vivo' },
    { id: 'date', label: '🍷 Encontro' },
    { id: 'specialty-coffee', label: '☕ Café Especial' },
    { id: 'craft-beer', label: '🍺 Cerveja Artesanal' },
    { id: 'street-food', label: '🍕 Comida de Rua' },
    { id: 'cultural', label: '🎨 Cultural' },
    { id: 'kids', label: '🧒 Espaço Kids' },
    { id: 'accessible', label: '♿ Acessível' },
  ];

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
        setView('signup-4');
      }
    } else {
      // Mock Google Login: directly jump to interests step
      localStorage.setItem('giro_google_mock_user', JSON.stringify({ name: 'Demo Giro', avatar: null }));
      setView('signup-4');
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
        JSON.stringify({ email: email || 'demo@giro.app', password, name: finalName, username, avatar: finalAvatar, preferences: prefs })
      );
      onComplete({
        user: { email: email || 'demo@giro.app', user_metadata: { full_name: finalName, avatar_url: finalAvatar } },
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
  };
  const currentStep = stepMap[view];
  const isSignup = currentStep > 0;

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col bg-brand-indigo-950 overflow-hidden">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-brand-coral-500/20 rounded-full blur-[80px] animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-brand-teal-500/15 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Progress bar (signup only) */}
      {isSignup && (
        <div className="relative z-10 flex items-center gap-1.5 px-6 pt-14 pb-0">
          {[1, 2, 3, 4, 5].map((s) => (
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
          }}
          className="absolute top-14 left-5 z-20 w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
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
          <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-[fadeInUp_0.4s_ease-out]">
            {/* Logo */}
            <div className="w-20 h-20 rounded-[28px] bg-gradient-to-tr from-brand-coral-500 to-amber-500 flex items-center justify-center shadow-2xl shadow-brand-coral-500/40 mb-2">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-outfit font-black text-white mb-2 tracking-tight">
                Bem-vindo ao <span className="text-brand-coral-500">Giro</span>
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed max-w-[260px] mx-auto">
                Descubra cafés, bares e experiências incríveis em Curitiba, do seu jeito.
              </p>
            </div>

            <div className="w-full space-y-3 mt-2">
              {/* Google */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-white text-slate-800 font-bold text-sm flex items-center justify-center gap-3 hover:bg-slate-50 active:scale-[0.97] transition-all shadow-lg shadow-black/20 border border-slate-100 disabled:opacity-60"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar com o Google
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-[11px] text-slate-500 font-semibold">ou</span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              {/* Email login */}
              <button
                onClick={() => { setErr(''); setView('email-login'); }}
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-3 hover:bg-white/10 active:scale-[0.97] transition-all"
              >
                <Mail className="w-5 h-5 text-slate-300 shrink-0" />
                Entrar com E-mail
              </button>

              {/* Create account */}
              <button
                onClick={() => { setErr(''); setView('signup-1'); }}
                className="w-full h-14 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-coral-500/30 active:scale-[0.97] transition-all"
              >
                Criar Conta Grátis
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-slate-600 text-center mt-2 max-w-[260px] leading-relaxed">
              Ao entrar, você concorda com nossos{' '}
              <button onClick={() => setIsTermsOpen(true)} className="text-slate-400 underline underline-offset-2">
                Termos e Privacidade
              </button>
            </p>
          </div>
        )}

        {/* ══════════ EMAIL LOGIN ══════════ */}
        {view === 'email-login' && (
          <div className="w-full max-w-sm flex flex-col gap-5 animate-[fadeInUp_0.35s_ease-out]">
            <div className="text-center mt-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-coral-500/15 border border-brand-coral-500/30 flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-brand-coral-500" />
              </div>
              <h2 className="text-2xl font-outfit font-black text-white">Entrar</h2>
              <p className="text-sm text-slate-400 mt-1">Use seu e-mail e senha do Giro</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailLogin()}
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 pl-11 pr-12 text-sm focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {err && <p className="text-xs text-rose-400 font-semibold text-center">{err}</p>}

            <button
              onClick={handleEmailLogin}
              disabled={loading}
              className="w-full h-14 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-coral-500/30 active:scale-[0.97] transition-all"
            >
              {loading ? 'Entrando...' : 'Entrar'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>

            <p className="text-xs text-center text-slate-500">
              Não tem conta?{' '}
              <button
                onClick={() => { setErr(''); setView('signup-1'); }}
                className="text-brand-coral-500 font-bold hover:text-brand-coral-400 transition-colors"
              >
                Cadastre-se grátis
              </button>
            </p>
          </div>
        )}

        {/* ══════════ SIGNUP STEP 1 – Acesso ══════════ */}
        {view === 'signup-1' && (
          <div className="w-full max-w-sm flex flex-col gap-5 animate-[fadeInUp_0.35s_ease-out]">
            <div className="text-center mt-2">
              <div className="w-14 h-14 rounded-2xl bg-brand-coral-500/15 border border-brand-coral-500/30 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-brand-coral-500" />
              </div>
              <h2 className="text-2xl font-outfit font-black text-white">Crie seu acesso</h2>
              <p className="text-sm text-slate-400 mt-1">E-mail e uma senha forte</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Senha (mín. 6 caracteres)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 pl-11 pr-12 text-sm focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password strength */}
              {password && (
                <div className="space-y-1.5 px-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Força da senha</span>
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
                      : 'border-white/20 bg-white/5 group-hover:border-white/40'
                  }`}
                >
                  {acceptTerms && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <span className="text-xs text-slate-400 leading-snug pt-0.5">
                  Li e aceito os{' '}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setIsTermsOpen(true); }}
                    className="text-brand-coral-500 font-semibold hover:underline"
                  >
                    Termos de Uso e Política de Privacidade
                  </button>
                </span>
              </label>
            </div>

            {err && <p className="text-xs text-rose-400 font-semibold text-center">{err}</p>}

            <button
              onClick={handleSignupStep1}
              disabled={!email || password.length < 6 || !acceptTerms}
              className="w-full h-14 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-coral-500/30 active:scale-[0.97] transition-all"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </button>

            <p className="text-xs text-center text-slate-500">
              Já tem conta?{' '}
              <button
                onClick={() => { setErr(''); setView('email-login'); }}
                className="text-brand-coral-500 font-bold"
              >
                Fazer login
              </button>
            </p>
          </div>
        )}

        {/* ══════════ SIGNUP STEP 2 – Identidade ══════════ */}
        {view === 'signup-2' && (
          <div className="w-full max-w-sm flex flex-col gap-5 animate-[fadeInUp_0.35s_ease-out]">
            <div className="text-center mt-2">
              <div className="w-14 h-14 rounded-2xl bg-brand-coral-500/15 border border-brand-coral-500/30 flex items-center justify-center mx-auto mb-4">
                <User className="w-7 h-7 text-brand-coral-500" />
              </div>
              <h2 className="text-2xl font-outfit font-black text-white">Quem é você?</h2>
              <p className="text-sm text-slate-400 mt-1">Como você quer ser chamado no Giro</p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                />
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">@</span>
                <input
                  type="text"
                  placeholder="username"
                  value={username.replace(/^@/, '')}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/^@/, '').replace(/\s+/g, '_').toLowerCase();
                    setUsername(`@${clean}`);
                  }}
                  className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                />
              </div>
            </div>

            {err && <p className="text-xs text-rose-400 font-semibold text-center">{err}</p>}

            <button
              onClick={handleSignupStep2}
              disabled={!name.trim() || username.replace(/^@/, '').length < 3}
              className="w-full h-14 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-coral-500/30 active:scale-[0.97] transition-all"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ══════════ SIGNUP STEP 3 – Foto ══════════ */}
        {view === 'signup-3' && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6 animate-[fadeInUp_0.35s_ease-out]">
            <div className="text-center mt-2">
              <h2 className="text-2xl font-outfit font-black text-white">Sua foto</h2>
              <p className="text-sm text-slate-400 mt-1">Escolha um avatar para seu perfil (opcional)</p>
            </div>

            {/* Avatar picker */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-brand-coral-500/40 bg-brand-indigo-900 flex items-center justify-center shadow-2xl shadow-brand-coral-500/20">
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
              <label className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-brand-coral-500 border-4 border-brand-indigo-950 flex items-center justify-center cursor-pointer hover:bg-brand-coral-600 active:scale-95 transition-all shadow-lg">
                <Camera className="w-4 h-4 text-white" />
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>
            </div>

            <div className="w-full space-y-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-white/10 active:scale-[0.97] transition-all"
              >
                <Camera className="w-5 h-5 text-slate-300" />
                {avatar ? 'Trocar Foto' : 'Escolher Foto da Galeria'}
              </button>

              <button
                onClick={() => setView('signup-4')}
                className="w-full h-14 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-coral-500/30 active:scale-[0.97] transition-all"
              >
                {avatar ? 'Confirmar e Continuar' : 'Pular por Agora'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ══════════ SIGNUP STEP 4 – Preferências ══════════ */}
        {view === 'signup-4' && (
          <div className="w-full max-w-sm flex flex-col gap-5 animate-[fadeInUp_0.35s_ease-out]">
            <div className="text-center mt-2">
              <div className="w-14 h-14 rounded-2xl bg-brand-coral-500/15 border border-brand-coral-500/30 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-brand-coral-500" />
              </div>
              <h2 className="text-2xl font-outfit font-black text-white">Seus interesses</h2>
              <p className="text-sm text-slate-400 mt-1">Escolha pelo menos 3 para calibrar seu Swipe ⚡</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {allPrefs.map((pref) => {
                const active = prefs.includes(pref.id);
                return (
                  <button
                    key={pref.id}
                    onClick={() => togglePref(pref.id)}
                    className={`h-12 rounded-2xl text-xs font-semibold border flex items-center gap-2.5 px-3 transition-all duration-200 active:scale-95 ${
                      active
                        ? 'bg-brand-coral-500 border-brand-coral-500 text-white shadow-md shadow-brand-coral-500/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <span className="text-base shrink-0">{pref.label.split(' ')[0]}</span>
                    <span className="truncate">{pref.label.split(' ').slice(1).join(' ')}</span>
                    {active && <CheckCircle2 className="w-3.5 h-3.5 ml-auto shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-2">
              <div className={`text-xs font-bold transition-colors ${prefs.length >= 3 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {prefs.length >= 3 ? `✓ ${prefs.length} selecionadas` : `${prefs.length}/3 mínimo`}
              </div>
            </div>

            <button
              onClick={() => { if (prefs.length >= 3) setView('signup-5'); }}
              disabled={prefs.length < 3}
              className="w-full h-14 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand-coral-500/30 active:scale-[0.97] transition-all"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ══════════ SIGNUP STEP 5 – GPS ══════════ */}
        {view === 'signup-5' && (
          <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center animate-[fadeInUp_0.35s_ease-out]">
            <div className="w-24 h-24 rounded-full bg-brand-teal-500/15 border-2 border-brand-teal-500/30 flex items-center justify-center shadow-2xl shadow-brand-teal-500/10">
              <MapPin className="w-12 h-12 text-brand-teal-400 animate-bounce" />
            </div>

            <div>
              <h2 className="text-2xl font-outfit font-black text-white">Ativar Localização</h2>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-[260px] mx-auto">
                O Giro usa sua localização para recomendar os melhores lugares perto de você em tempo real.
              </p>
            </div>

            {err && <p className="text-xs text-rose-400 font-semibold">{err}</p>}

            <div className="w-full space-y-3">
              <button
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
                {loading ? 'Criando sua conta...' : 'Ativar GPS (Recomendado)'}
              </button>

              <button
                onClick={handleFinishSignup}
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-semibold text-sm active:scale-[0.97] transition-all disabled:opacity-50"
              >
                {loading ? 'Criando sua conta...' : 'Continuar sem GPS'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ TERMS MODAL ══════════ */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-sm bg-brand-indigo-950 border border-white/10 rounded-[28px] p-6 shadow-2xl flex flex-col" style={{ maxHeight: '80vh' }}>
            <button
              onClick={() => setIsTermsOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-base font-outfit font-bold text-white mb-1 text-center">Termos e Privacidade</h3>
            <p className="text-[10px] text-slate-400 mb-4 text-center">Sua privacidade e conformidade com a LGPD ⚖️</p>
            <div className="flex-1 overflow-y-auto text-xs text-slate-400 space-y-4 leading-relaxed pr-1 mb-5">
              <div>
                <h4 className="font-bold text-white mb-1">1. Coleta de Dados</h4>
                <p>O Giro coleta seu nome, e-mail e foto de perfil para criar sua conta e personalizar recomendações.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">2. Geolocalização</h4>
                <p>Solicitamos permissão de GPS para mostrar locais próximos. Você pode recusar e usar busca manual por bairro.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">3. Favoritos e Sincronização</h4>
                <p>Seus favoritos e preferências são armazenados de forma segura no Supabase e sincronizados entre dispositivos.</p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">4. Direito ao Esquecimento (LGPD)</h4>
                <p>A qualquer momento você pode excluir sua conta e todos os dados associados permanentemente via configurações do perfil.</p>
              </div>
            </div>
            <button
              onClick={() => setIsTermsOpen(false)}
              className="w-full h-12 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-bold text-sm active:scale-95 transition-all"
            >
              Entendido
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

export default function Profile({ favoritesCount }: ProfileProps) {
  const [profileSubTab, setProfileSubTab] = useState<'personal' | 'business'>('personal');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [badgeLevel, setBadgeLevel] = useState<'gold' | 'silver' | 'bronze'>('gold');
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
  const [bizCategory, setBizCategory] = useState('Café');
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
      category_id: bizCategory.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
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
      }
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
          latitude: newPlace.latitude,
          longitude: newPlace.longitude,
          image_url: newPlace.image_url,
          avg_rating: newPlace.avg_rating,
          review_count: newPlace.review_count,
          price_range: newPlace.price_range,
          is_featured: newPlace.is_featured,
          is_verified: newPlace.is_verified,
          operating_hours: newPlace.operating_hours,
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

  const prefs = [
    { id: 'pet', label: '🐶 Pet Friendly' },
    { id: 'vegan', label: '🌿 Vegano' },
    { id: 'work', label: '💻 Trabalhar' },
    { id: 'outdoor', label: '☀️ Ar Livre' },
    { id: 'live-music', label: '🎶 Música ao Vivo' },
    { id: 'date', label: '🍷 Encontro' },
    { id: 'specialty-coffee', label: '☕ Café Especial' },
    { id: 'craft-beer', label: '🍺 Cerveja Artesanal' },
    { id: 'street-food', label: '🍕 Comida de Rua' },
    { id: 'cultural', label: '🎨 Cultural' },
    { id: 'kids', label: '🧒 Espaço Kids' },
    { id: 'accessible', label: '♿ Acessível' },
  ];

  const cycleBadgeLevel = () => {
    if (badgeLevel === 'gold') setBadgeLevel('silver');
    else if (badgeLevel === 'silver') setBadgeLevel('bronze');
    else setBadgeLevel('gold');
  };

  const openCadastrais = () => {
    setEditName(userName);
    setEditNickname(userNickname);
    setIsCadastraisOpen(true);
  };

  const saveCadastrais = async () => {
    if (supabase && session) {
      await supabase.auth.updateUser({ data: { full_name: editName } });
      await supabase.from('profiles').update({ full_name: editName, nickname: editNickname }).eq('id', session.user.id);
    }
    const saved = localStorage.getItem('giro_mock_user');
    if (saved) {
      const u = JSON.parse(saved);
      u.name = editName;
      localStorage.setItem('giro_mock_user', JSON.stringify(u));
    }
    if (mockSession) {
      const updatedSess = { ...mockSession, user: { ...mockSession.user, user_metadata: { ...mockSession.user.user_metadata, full_name: editName } } };
      setMockSession(updatedSess);
      localStorage.setItem('giro_mock_session', JSON.stringify(updatedSess));
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
          <div className="relative h-44 rounded-[32px] overflow-hidden border border-white/5 shadow-xl bg-brand-indigo-950/40">
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
                  {merchantPlace.category_id.charAt(0).toUpperCase() + merchantPlace.category_id.slice(1)}
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
              <div key={idx} className="glass-card p-4 rounded-[24px] flex flex-col items-center justify-center border border-white/5 text-center bg-white/5">
                {m.icon}
                <span className="text-lg font-outfit font-black text-white">{m.val}</span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{m.label}</span>
              </div>
            ))}
          </div>

          {/* Toggles Rápidos */}
          <div className="glass-card rounded-[28px] border border-white/5 p-5 flex flex-col gap-4 bg-white/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-coral-400" /> Painel Operacional
            </h3>
            
            <div className="flex items-center justify-between py-2 border-b border-white/5">
              <div>
                <h4 className="text-xs font-bold text-white">Status de Funcionamento</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Controla se o local aparece aberto agora</p>
              </div>
              <button 
                onClick={() => setIsOpenNow(!isOpenNow)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isOpenNow ? 'bg-emerald-500' : 'bg-white/10'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isOpenNow ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <h4 className="text-xs font-bold text-white">Música ao Vivo Hoje?</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Ativa a etiqueta de atração musical em tempo real</p>
              </div>
              <button 
                onClick={() => setIsLiveMusicToday(!isLiveMusicToday)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isLiveMusicToday ? 'bg-brand-coral-500' : 'bg-white/10'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isLiveMusicToday ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Informações de Cadastro */}
          <div className="glass-card rounded-[28px] border border-white/5 p-5 flex flex-col gap-4 bg-white/5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-brand-teal-400" /> Dados do Estabelecimento
            </h3>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Endereço comercial</span>
                  <span>{merchantPlace.address}</span>
                </div>
              </div>

              {merchantPlace.phone && (
                <div className="flex items-start gap-2.5">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">WhatsApp comercial</span>
                    <span>{formatPhone(merchantPlace.phone)}</span>
                  </div>
                </div>
              )}

              {merchantPlace.instagram_handle && (
                <div className="flex items-start gap-2.5">
                  <Instagram className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Instagram comercial</span>
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
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Horário de funcionamento</span>
                  <span>{merchantPlace.operating_hours["Seg-Dom"]}</span>
                </div>
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
        <div className="glass-card rounded-[32px] border border-white/5 p-6 text-left bg-white/5 flex flex-col gap-5 animate-fadeIn">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-extrabold text-brand-coral-400 uppercase tracking-widest block">Cadastrar Estabelecimento</span>
              <h3 className="text-sm font-bold text-white mt-0.5">
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
                    s <= businessStep ? 'bg-brand-coral-500' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="border-t border-white/5 pt-5 min-h-[220px]">
            {/* Passo 1: Informações Básicas */}
            {businessStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome Comercial</label>
                  <input
                    type="text"
                    placeholder="Ex: Giro Café & Co."
                    value={bizName}
                    onChange={(e) => setBizName(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Categoria</label>
                    <select
                      value={bizCategory}
                      onChange={(e) => setBizCategory(e.target.value)}
                      className="w-full h-12 rounded-2xl bg-brand-indigo-950 border border-white/10 text-white px-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors cursor-pointer"
                    >
                      {['Café', 'Bar', 'Pub', 'Hamburgueria', 'Restaurante'].map((cat) => (
                        <option key={cat} value={cat} className="bg-brand-indigo-950 text-white">{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faixa de Preço</label>
                    <select
                      value={bizPrice}
                      onChange={(e) => setBizPrice(e.target.value as any)}
                      className="w-full h-12 rounded-2xl bg-brand-indigo-950 border border-white/10 text-white px-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors cursor-pointer"
                    >
                      {['$', '$$', '$$$'].map((p) => (
                        <option key={p} value={p} className="bg-brand-indigo-950 text-white">{p} ({p === '$' ? 'Econômico' : p === '$$' ? 'Moderado' : 'Premium'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Descrição Curta</label>
                  <textarea
                    placeholder="Conte o que torna o seu local incrível em poucas palavras..."
                    value={bizDescription}
                    onChange={(e) => setBizDescription(e.target.value)}
                    maxLength={150}
                    className="w-full h-24 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 p-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors resize-none"
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">CEP</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ex: 80010-010"
                        maxLength={9}
                        value={bizCep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                      />
                      {cepLoading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-coral-500 border-t-transparent" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cidade</label>
                    <input
                      type="text"
                      value="Curitiba"
                      readOnly
                      className="w-full h-12 rounded-2xl bg-white/5 border border-white/5 text-slate-400 px-4 text-xs cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rua / Logradouro</label>
                  <input
                    type="text"
                    placeholder="Logradouro autocompletado pelo CEP"
                    value={bizStreet}
                    onChange={(e) => setBizStreet(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bairro</label>
                    <input
                      type="text"
                      placeholder="Bairro autocompletado"
                      value={bizNeighborhood}
                      onChange={(e) => setBizNeighborhood(e.target.value)}
                      className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Número</label>
                    <input
                      type="text"
                      placeholder="123"
                      value={bizNumber}
                      onChange={(e) => setBizNumber(e.target.value)}
                      className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Complemento (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Bloco A, Sala 4 / Ao lado da praça"
                    value={bizComplement}
                    onChange={(e) => setBizComplement(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Passo 3: Contatos */}
            {businessStep === 3 && (
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                  Insira ao menos um canal de contato. Eles ficarão visíveis como botões de atalho rápido direto nos cards de estabelecimentos.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" /> WhatsApp Comercial
                  </label>
                  <input
                    type="text"
                    placeholder="(41) 99999-9999"
                    value={bizPhone}
                    onChange={(e) => setBizPhone(formatPhone(e.target.value))}
                    className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
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
                      className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 pl-8 pr-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-brand-teal-400" /> Site / Link do Cardápio
                  </label>
                  <input
                    type="text"
                    placeholder="https://linktr.ee/seunegocio"
                    value={bizWebsite}
                    onChange={(e) => setBizWebsite(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors"
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

            {/* Passo 5: Horários de Funcionamento */}
            {businessStep === 5 && (
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                  Escreva de forma simples os horários em que seu estabelecimento fica aberto para os clientes.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horários de Funcionamento</label>
                  <input
                    type="text"
                    placeholder="Ex: Terça a Domingo, das 17h às 23h"
                    value={bizHours}
                    onChange={(e) => setBizHours(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 text-xs focus:outline-none focus:border-brand-coral-500/60 transition-colors"
                  />
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] text-slate-400 leading-relaxed mt-4">
                    💡 <strong>Pronto para decolar!</strong> Ao publicar, o Giro irá incluir o seu local diretamente no feed de Swipes de todos os usuários em Curitiba. Você pode alterar as configurações ou excluir o cadastro quando quiser através deste painel.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 border-t border-white/5 pt-5">
            {businessStep > 1 ? (
              <button
                type="button"
                onClick={() => setBusinessStep(prev => prev - 1)}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-slate-300 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Voltar
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreatingBusiness(false)}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-rose-400/80 hover:text-rose-400 transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
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
                className="flex-[2] py-3.5 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 disabled:opacity-40 disabled:hover:bg-brand-coral-500 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 active:scale-[0.98]"
              >
                Avançar <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinishBusinessSignup}
                disabled={!isStep5Valid}
                className="flex-[2] py-3.5 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 disabled:opacity-40 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-brand-coral-500/25 active:scale-[0.98]"
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
          }
        }}
      />
    );
  }

  return (
    <div className="pb-24 text-slate-100 w-full flex flex-col items-center">
      <div className="px-6 py-6 max-w-md mx-auto w-full flex flex-col">
        {/* Segmented Control */}
        <div className="bg-brand-indigo-950/80 border border-white/5 p-1 rounded-2xl flex gap-1 shadow-inner w-full mb-6">
          <button
            onClick={() => setProfileSubTab('personal')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              profileSubTab === 'personal' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >Meu Perfil</button>
          <button
            onClick={() => setProfileSubTab('business')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              profileSubTab === 'business' ? 'bg-brand-coral-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >Meu Negócio</button>
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
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-coral-500/30 bg-brand-indigo-900/50 flex items-center justify-center relative transition-all duration-300 avatar-pulse">
                    {avatarToShow ? (
                      <img src={avatarToShow} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-tr from-brand-coral-500 to-amber-500 flex items-center justify-center">
                        <span className="text-3xl font-outfit font-extrabold text-white">{firstLetter}</span>
                      </div>
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-coral-500 border-2 border-brand-indigo-950 flex items-center justify-center cursor-pointer hover:bg-brand-coral-600 transition-all hover:scale-110 active:scale-95 shadow-lg">
                    <Edit2 className="w-3.5 h-3.5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>

                <h2 className="text-xl font-outfit font-extrabold text-slate-900 dark:text-white">{userName}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{userNickname}</p>

                {/* Selo */}
                <div
                  onClick={cycleBadgeLevel}
                  className="glass-card rounded-3xl p-4 w-full border border-white/5 flex items-center gap-4 mt-5 cursor-pointer select-none hover:border-brand-coral-500/30 transition-all"
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
                        Selo {badgeLevel === 'gold' ? 'Ouro' : badgeLevel === 'silver' ? 'Prata' : 'Bronze'}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {badgeLevel === 'gold' ? '85%' : badgeLevel === 'silver' ? '60%' : '30%'} ativo
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                      Clique para ciclar selos • Nível de atividade
                    </p>
                    <div className="w-full h-1.5 bg-brand-indigo-950 rounded-full overflow-hidden mt-2">
                      <div className={`h-full rounded-full transition-all duration-500 ${badgeLevel === 'gold' ? 'bg-amber-500 w-[85%]' : badgeLevel === 'silver' ? 'bg-slate-300 w-[60%]' : 'bg-amber-700 w-[30%]'}`} />
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 w-full mt-4">
                  {[
                    { icon: <Bookmark className="w-4 h-4 text-brand-teal-400 mb-1.5" />, val: favoritesCount, label: 'Salvos' },
                    { icon: <Edit3 className="w-4 h-4 text-brand-gold-400 mb-1.5" />, val: 12, label: 'Reviews' },
                    { icon: <Heart className="w-4 h-4 text-brand-coral-500 mb-1.5" />, val: 142, label: 'Ajudou' },
                  ].map((s, i) => (
                    <div key={i} className="glass-card p-3 rounded-2xl flex flex-col items-center justify-center border border-white/5 shadow-inner">
                      {s.icon}
                      <span className="text-base font-outfit font-extrabold text-slate-900 dark:text-white">{s.val}</span>
                      <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* Preferências */}
                <div className="glass-card rounded-3xl p-5 w-full border border-white/5 mt-4 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Minhas Preferências</h3>
                    {userPreferences.length > 0 && (
                      <button onClick={() => setIsPrefsSheetOpen(true)} className="text-xs text-brand-coral-500 hover:text-brand-coral-600 flex items-center gap-1 font-semibold transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />Editar
                      </button>
                    )}
                  </div>
                  {userPreferences.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {prefs.filter((p) => userPreferences.includes(p.id)).map((p) => (
                        <span key={p.id} className="px-3 py-1.5 rounded-full text-xs font-semibold border border-brand-coral-500 bg-brand-coral-500 text-white shadow-md shadow-brand-coral-500/20">
                          {p.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <button onClick={() => setIsPrefsSheetOpen(true)} className="text-xs text-slate-400 hover:text-white mt-3 transition-colors">
                      Nenhuma preferência. <span className="text-brand-coral-500">[+ Adicionar]</span>
                    </button>
                  )}
                </div>

                {/* Menu */}
                <div className="glass-card rounded-3xl w-full border border-white/5 mt-4 overflow-hidden">
                  {[
                    { icon: <User className="w-4 h-4 text-slate-400" />, label: 'Dados Cadastrais', onClick: openCadastrais, danger: false },
                    { icon: <Bell className="w-4 h-4 text-slate-400" />, label: 'Gerenciar Notificações', onClick: () => alert('Em breve!'), danger: false },
                    { icon: <Trash2 className="w-4 h-4 text-rose-400" />, label: 'Excluir Conta Definitivamente', onClick: () => setIsDeleteConfirmOpen(true), danger: true },
                  ].map((item, idx, arr) => (
                    <button
                      key={idx}
                      onClick={item.onClick}
                      className={`w-full flex items-center justify-between px-5 py-4 ${idx < arr.length - 1 ? 'border-b border-white/5' : ''} ${item.danger ? 'hover:bg-rose-500/10' : 'hover:bg-white/5'} transition-all text-left group`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span className={`text-xs font-bold ${item.danger ? 'text-rose-400' : 'text-slate-300 group-hover:text-white'} transition-colors`}>
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
                      <span className="text-xs font-bold text-rose-400">Sair da Conta</span>
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
                return (
                  <button key={pref.id}
                    onClick={() => setUserPreferences((prev) => prev.includes(pref.id) ? prev.filter((p) => p !== pref.id) : [...prev, pref.id])}
                    className={`px-4 py-3 rounded-2xl text-xs font-semibold border flex items-center gap-2.5 transition-all duration-200 active:scale-95 ${
                      isActive ? 'bg-brand-coral-500 border-brand-coral-500 text-white shadow-md shadow-brand-coral-500/20'
                        : 'border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm shrink-0">{pref.label.split(' ')[0]}</span>
                    <span className="truncate">{pref.label.split(' ').slice(1).join(' ')}</span>
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
                    className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-4 focus:outline-none focus:border-brand-coral-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Nickname</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">@</span>
                  <input type="text" value={editNickname.replace('@', '')} onChange={(e) => setEditNickname(`@${e.target.value.replace('@', '')}`)}
                    className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-4 focus:outline-none focus:border-brand-coral-500 transition-colors" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                  <input type="email" value={user?.email || ''} readOnly
                    className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-sm text-slate-400 pl-10 pr-10 cursor-not-allowed" />
                </div>
              </div>
            </div>
            <button onClick={saveCadastrais}
              className="w-full py-3.5 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-xs font-bold text-white active:scale-95 shadow-md shadow-brand-coral-500/20 shrink-0 flex items-center justify-center gap-2">
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
                className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 active:scale-95">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
