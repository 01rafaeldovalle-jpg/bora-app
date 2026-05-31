import React, { useState, useEffect } from 'react';
import { Edit2, Bookmark, Edit3, Heart, User, Bell, LogOut, ChevronRight, Mail, Lock, Eye, EyeOff, Save, X, Trash2, MapPin } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

interface ProfileProps {
  favoritesCount: number;
}

export default function Profile({ favoritesCount }: ProfileProps) {
  const [profileSubTab, setProfileSubTab] = useState<'personal' | 'business'>('personal');
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [badgeLevel, setBadgeLevel] = useState<'gold' | 'silver' | 'bronze'>('gold');
  const [userPreferences, setUserPreferences] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('giro_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erro ao ler giro_preferences:', e);
    }
    return ['pet', 'outdoor', 'live-music'];
  });
  const [isPrefsSheetOpen, setIsPrefsSheetOpen] = useState(false);
  
  // Real session and mock session state for offline dogfooding
  const [session, setSession] = useState<any>(null);
  const [mockSession, setMockSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Auth flow states
  const [authView, setAuthView] = useState<'options' | 'email-login' | 'email-signup'>('options');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Onboarding wizard states
  const [signupStep, setSignupStep] = useState<number>(1);
  const [googleOnboardingStep, setGoogleOnboardingStep] = useState<number>(0);
  const [usernameInput, setUsernameInput] = useState('');

  // Dados Cadastrais bottom sheet states
  const [isCadastraisOpen, setIsCadastraisOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');

  // Profile Image crop states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    }).catch((err) => {
      console.error("Erro ao carregar sessão:", err);
      setLoading(false);
    });

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Escutar eventos de sincronização de preferências vindo do App.tsx
  useEffect(() => {
    const handleSync = (e: CustomEvent<string[]>) => {
      if (e.detail && Array.isArray(e.detail)) {
        setUserPreferences(e.detail);
        localStorage.setItem('giro_preferences', JSON.stringify(e.detail));
      }
    };

    window.addEventListener('giro-preferences-sync' as any, handleSync);
    return () => {
      window.removeEventListener('giro-preferences-sync' as any, handleSync);
    };
  }, []);

  // Detectar login do Google para onboarding remanescente (passos 4 e 5)
  useEffect(() => {
    const activeSession = session || mockSession;
    if (activeSession?.user) {
      const isPending = localStorage.getItem('giro_google_onboarding_pending') === 'true';
      if (isPending) {
        setGoogleOnboardingStep(4);
      }
    }
  }, [session, mockSession]);

  // Helper para verificar força da senha
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', color: '', pct: 0 };
    if (pwd.length < 6) return { label: 'Muito Curta', color: 'bg-rose-500', pct: 20 };
    
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { label: 'Fraca', color: 'bg-rose-400', pct: 40 };
    if (score === 2) return { label: 'Média', color: 'bg-amber-500', pct: 70 };
    return { label: 'Forte', color: 'bg-brand-teal-500', pct: 100 };
  };

  const handleGoogleLogin = async () => {
    localStorage.setItem('giro_google_onboarding_pending', 'true');
    if (supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (error) {
        console.error('Erro ao fazer login com o Google:', error.message);
        // Fallback to mock session if Supabase throws error (e.g. invalid keys / offline)
        setMockSession({
          user: {
            email: 'rafael@giro.app',
            user_metadata: {
              full_name: 'Rafael do Valle',
            }
          }
        });
      }
    } else {
      // Offline fallback
      setMockSession({
        user: {
          email: 'rafael@giro.app',
          user_metadata: {
            full_name: 'Rafael do Valle',
          }
        }
      });
    }
  };

  const handleEmailLogin = async () => {
    setAuthError('');
    setAuthLoading(true);
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
      });
      if (error) {
        setAuthError(error.message === 'Invalid login credentials' ? 'E-mail ou senha inválidos.' : error.message);
      }
    } else {
      const savedUser = localStorage.getItem('giro_mock_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.email === emailInput && parsed.password === passwordInput) {
          setMockSession({ user: { email: parsed.email, user_metadata: { full_name: parsed.name } } });
        } else {
          setAuthError('E-mail ou senha inválidos.');
        }
      } else {
        setAuthError('Nenhuma conta encontrada. Crie uma conta primeiro.');
      }
    }
    setAuthLoading(false);
  };

  const handleCompleteEmailSignup = async () => {
    setAuthError('');
    if (!nameInput.trim()) { setAuthError('Preencha seu nome completo.'); return; }
    if (!emailInput.trim()) { setAuthError('Preencha o e-mail.'); return; }
    if (passwordInput.length < 6) { setAuthError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setAuthLoading(true);
    
    if (supabase) {
      const { data: authData, error } = await supabase.auth.signUp({
        email: emailInput,
        password: passwordInput,
        options: { 
          data: { 
            full_name: nameInput,
            avatar_url: userAvatar
          } 
        },
      });
      if (error) {
        setAuthError(error.message);
      } else if (authData?.user) {
        // Criar perfil correspondente no banco de dados profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            full_name: nameInput,
            nickname: usernameInput || `@${nameInput.toLowerCase().replace(/\s+/g, '_')}`,
            avatar_url: userAvatar,
            preferences: userPreferences,
            favorites: []
          });
        
        if (profileError) {
          console.error('Erro ao cadastrar perfil no profiles:', profileError);
        }
        setAuthError('');
        setAuthView('email-login');
        setSignupStep(1);
      }
    } else {
      // Mock local
      localStorage.setItem('giro_mock_user', JSON.stringify({ 
        email: emailInput, 
        password: passwordInput, 
        name: nameInput,
        nickname: usernameInput || `@${nameInput.toLowerCase().replace(/\s+/g, '_')}`,
        avatar: userAvatar,
        preferences: userPreferences
      }));
      setMockSession({ 
        user: { 
          email: emailInput, 
          user_metadata: { 
            full_name: nameInput,
            avatar_url: userAvatar
          } 
        } 
      });
      setSignupStep(1);
    }
    setAuthLoading(false);
  };

  const handleCompleteGoogleOnboarding = async () => {
    setAuthLoading(true);
    const activeSession = session || mockSession;
    if (supabase && activeSession?.user && !mockSession) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            preferences: userPreferences
          })
          .eq('id', activeSession.user.id);
        if (error) {
          console.error('Erro ao atualizar preferências Google no Supabase:', error);
        }
      } catch (e) {
        console.error('Erro ao atualizar preferências Google:', e);
      }
    }
    localStorage.removeItem('giro_google_onboarding_pending');
    setGoogleOnboardingStep(0);
    setAuthLoading(false);
  };

  const openCadastrais = () => {
    setEditName(userName);
    setEditNickname(userNickname);
    setIsCadastraisOpen(true);
  };

  const saveCadastrais = async () => {
    if (supabase && session) {
      await supabase.auth.updateUser({ data: { full_name: editName } });
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ full_name: editName, nickname: editNickname })
          .eq('id', session.user.id);
        if (error) {
          console.error('Erro ao atualizar dados cadastrais no Supabase profiles:', error);
        }
      } catch (e) {
        console.error('Erro ao atualizar dados cadastrais no profiles:', e);
      }
    }
    const savedUser = localStorage.getItem('giro_mock_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      parsed.name = editName;
      localStorage.setItem('giro_mock_user', JSON.stringify(parsed));
    }
    if (mockSession) {
      setMockSession({ ...mockSession, user: { ...mockSession.user, user_metadata: { ...mockSession.user.user_metadata, full_name: editName } } });
    }
    setIsCadastraisOpen(false);
  };

  const savePreferences = async (prefsToSave: string[]) => {
    localStorage.setItem('giro_preferences', JSON.stringify(prefsToSave));
    const activeSession = session || mockSession;
    if (supabase && activeSession?.user && !mockSession) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ preferences: prefsToSave })
          .eq('id', activeSession.user.id);
        if (error) {
          console.error('Erro ao salvar preferências no Supabase:', error);
        }
      } catch (e) {
        console.error('Erro ao salvar preferências no Supabase:', e);
      }
    }
    setIsPrefsSheetOpen(false);
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setImageSrc(e.target.result as string);
          setCrop({ x: 0, y: 0 });
          setZoom(1);
          setCropModalOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const cycleBadgeLevel = () => {
    if (badgeLevel === 'gold') setBadgeLevel('silver');
    else if (badgeLevel === 'silver') setBadgeLevel('bronze');
    else setBadgeLevel('gold');
  };

  const togglePreference = (pref: string) => {
    setUserPreferences((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setMockSession(null);
    window.dispatchEvent(new CustomEvent('giro-logout'));
  };

  const handleDeleteAccount = async () => {
    const activeSession = session || mockSession;
    if (!activeSession?.user) return;

    try {
      if (supabase && !mockSession) {
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', activeSession.user.id);
        
        if (error) {
          console.error("Erro ao deletar perfil do Supabase:", error);
          alert("Não foi possível excluir os dados do servidor. Tente novamente.");
          return;
        }
      }
      
      localStorage.removeItem('giro_preferences');
      localStorage.removeItem('giro_favorites');
      
      await handleLogout();
      setIsDeleteConfirmOpen(false);
      alert("Sua conta e todos os seus dados foram permanentemente excluídos do Giro.");
    } catch (e) {
      console.error("Erro ao processar exclusão de conta:", e);
    }
  };

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
    { id: 'accessible', label: '♿ Acessível' }
  ];

  const activeSession = session || mockSession;
  const user = activeSession?.user;
  const metadata = user?.user_metadata || {};
  const userName = metadata?.full_name || user?.email || "Usuário Giro";
  const userNickname = metadata?.full_name 
    ? `@${metadata.full_name.toLowerCase().replace(/\s+/g, '_')}` 
    : user?.email 
      ? `@${user.email.split('@')[0]}` 
      : "@usuario_giro";
  const profilePhotoUrl = metadata?.avatar_url || null;
  const firstLetter = userName.charAt(0).toUpperCase();
  const avatarToShow = userAvatar || profilePhotoUrl;

  return (
    <div className="pb-24 text-slate-100 w-full flex flex-col items-center">
      <div className="px-6 py-6 max-w-md mx-auto w-full flex flex-col">
        {/* Segmented Control */}
        <div className="bg-brand-indigo-950/80 border border-white/5 p-1 rounded-2xl flex gap-1 shadow-inner w-full mb-6">
          <button
            onClick={() => setProfileSubTab('personal')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              profileSubTab === 'personal'
                ? 'bg-brand-coral-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Meu Perfil
          </button>
          <button
            onClick={() => setProfileSubTab('business')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              profileSubTab === 'business'
                ? 'bg-brand-coral-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Meu Negócio
          </button>
        </div>

        {/* Subtab Content */}
        <div className="w-full">
          {profileSubTab === 'personal' ? (
            loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-brand-coral-500 animate-pulse"></div>
              </div>
            ) : !activeSession ? (
              <div className="glass-card rounded-[32px] p-8 text-center border border-white/5 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-brand-indigo-900/50 border border-white/5 flex items-center justify-center mb-4 text-brand-coral-500">
                  {authView === 'options' ? <User className="w-8 h-8" /> : <Mail className="w-8 h-8" />}
                </div>
                <h3 className="text-lg font-outfit font-bold text-slate-900 dark:text-white mb-2">
                  {authView === 'options' ? 'Acesse sua Conta' : authView === 'email-login' ? 'Entrar com E-mail' : 'Criar Conta'}
                </h3>
                {authView !== 'email-signup' && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-6">
                    {authView === 'options'
                      ? 'Entre no Giro para calibrar seu Swipe, salvar seus locais favoritos e ganhar selos de atividade.'
                      : 'Use seu e-mail e senha para acessar sua conta.'}
                  </p>
                )}

                {authView === 'options' ? (
                  <div className="w-full max-w-[280px] space-y-3">
                    <button
                      onClick={handleGoogleLogin}
                      className="w-full h-12 rounded-2xl bg-white text-slate-800 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-100 transition-all btn-premium shadow-md border border-slate-100"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Entrar com o Google
                    </button>
                    <button
                      onClick={() => { setAuthView('email-login'); setAuthError(''); }}
                      className="w-full h-12 rounded-2xl bg-brand-indigo-900 text-white border border-white/10 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-brand-indigo-900/80 transition-all btn-premium"
                    >
                      <Mail className="w-5 h-5 text-slate-300" />
                      Entrar com e-mail
                    </button>
                  </div>
                ) : authView === 'email-login' ? (
                  <div className="w-full max-w-[300px] space-y-3">
                    <button
                      onClick={() => { setAuthView('options'); setAuthError(''); }}
                      className="text-xs text-brand-coral-500 hover:text-brand-coral-600 font-semibold mb-1 flex items-center gap-1 transition-colors"
                    >
                      ← Voltar
                    </button>

                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        placeholder="seu@email.com"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-4 focus:outline-none focus:border-brand-coral-500 transition-colors"
                      />
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Senha"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-11 focus:outline-none focus:border-brand-coral-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {authError && (
                      <p className="text-xs text-rose-500 font-semibold text-center">{authError}</p>
                    )}

                    <button
                      onClick={handleEmailLogin}
                      disabled={authLoading}
                      className="w-full h-12 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-bold text-sm transition-all btn-premium shadow-md shadow-brand-coral-500/20 disabled:opacity-50"
                    >
                      {authLoading ? 'Carregando...' : 'Entrar'}
                    </button>

                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                      Não tem conta? <button onClick={() => { setAuthView('email-signup'); setAuthError(''); setSignupStep(1); }} className="text-brand-coral-500 font-bold hover:underline">Cadastre-se</button>
                    </p>
                  </div>
                ) : (
                  /* Wizard de Cadastro Passo a Passo */
                  <div className="w-full max-w-[320px] space-y-4">
                    {/* Indicador de Passo */}
                    <div className="flex flex-col items-center mb-2">
                      <span className="text-[10px] uppercase font-bold text-brand-coral-500 tracking-widest">Passo {signupStep} de 5</span>
                      <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div 
                            key={s} 
                            className={`h-full flex-1 transition-all duration-300 rounded-full ${
                              s <= signupStep ? 'bg-brand-coral-500' : 'bg-white/10'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>

                    {signupStep === 1 && (
                      <div className="space-y-3">
                        <div className="text-center mb-1">
                          <h3 className="text-sm font-outfit font-bold text-slate-900 dark:text-white">Defina seu Acesso</h3>
                          <p className="text-[10px] text-slate-400">Insira seu e-mail e crie uma senha forte.</p>
                        </div>

                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            placeholder="seu@email.com"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-4 focus:outline-none focus:border-brand-coral-500 transition-colors"
                          />
                        </div>

                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Senha"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                            className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-11 focus:outline-none focus:border-brand-coral-500 transition-colors"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        {passwordInput && (
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="text-slate-400">Força da senha:</span>
                              <span className="font-bold text-slate-300">{getPasswordStrength(passwordInput).label}</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-300 ${getPasswordStrength(passwordInput).color}`}
                                style={{ width: `${getPasswordStrength(passwordInput).pct}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-start gap-2 px-1 py-1 text-left">
                          <input
                            id="terms-checkbox"
                            type="checkbox"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="mt-1 rounded border-slate-300 text-brand-coral-500 focus:ring-brand-coral-500 cursor-pointer w-4 h-4 shrink-0"
                          />
                          <label htmlFor="terms-checkbox" className="text-[11px] leading-snug text-slate-500 dark:text-slate-400 select-none">
                            Li e aceito os{' '}
                            <button
                              type="button"
                              onClick={() => setIsTermsModalOpen(true)}
                              className="text-brand-coral-500 font-bold hover:underline bg-transparent border-0 p-0 cursor-pointer inline"
                            >
                              Termos de Uso e a Política de Privacidade
                            </button>
                            .
                          </label>
                        </div>

                        {authError && <p className="text-xs text-rose-500 font-semibold text-center">{authError}</p>}

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => { setAuthView('options'); setAuthError(''); }}
                            className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all text-slate-300 border border-white/10"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              if (!emailInput.trim() || !emailInput.includes('@')) {
                                setAuthError('Insira um e-mail válido.');
                                return;
                              }
                              if (passwordInput.length < 6) {
                                setAuthError('A senha deve ter pelo menos 6 caracteres.');
                                return;
                              }
                              if (!acceptTerms) {
                                setAuthError('Você deve aceitar os termos para continuar.');
                                return;
                              }
                              setAuthError('');
                              setSignupStep(2);
                            }}
                            disabled={!acceptTerms || !emailInput || passwordInput.length < 6}
                            className="flex-1 h-12 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-brand-coral-500/10"
                          >
                            Avançar
                          </button>
                        </div>
                      </div>
                    )}

                    {signupStep === 2 && (
                      <div className="space-y-3">
                        <div className="text-center mb-1">
                          <h3 className="text-sm font-outfit font-bold text-slate-900 dark:text-white">Quem é você?</h3>
                          <p className="text-[10px] text-slate-400">Como você deseja ser chamado.</p>
                        </div>

                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Nome completo"
                            value={nameInput}
                            onChange={(e) => setNameInput(e.target.value)}
                            className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-4 focus:outline-none focus:border-brand-coral-500 transition-colors"
                          />
                        </div>

                        <div className="relative">
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">@</span>
                          <input
                            type="text"
                            placeholder="username"
                            value={usernameInput.replace(/^@/, '')}
                            onChange={(e) => {
                              const clean = e.target.value.replace(/^@/, '').replace(/\s+/g, '_').toLowerCase();
                              setUsernameInput(`@${clean}`);
                            }}
                            className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-4 focus:outline-none focus:border-brand-coral-500 transition-colors"
                          />
                        </div>

                        {authError && <p className="text-xs text-rose-500 font-semibold text-center">{authError}</p>}

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setSignupStep(1)}
                            className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all text-slate-300 border border-white/10"
                          >
                            Voltar
                          </button>
                          <button
                            onClick={() => {
                              if (!nameInput.trim()) {
                                setAuthError('Preencha seu nome completo.');
                                return;
                              }
                              if (usernameInput.replace(/^@/, '').length < 3) {
                                setAuthError('O apelido deve ter pelo menos 3 caracteres.');
                                return;
                              }
                              setAuthError('');
                              setSignupStep(3);
                            }}
                            disabled={!nameInput.trim() || usernameInput.replace(/^@/, '').length < 3}
                            className="flex-1 h-12 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-brand-coral-500/10"
                          >
                            Avançar
                          </button>
                        </div>
                      </div>
                    )}

                    {signupStep === 3 && (
                      <div className="space-y-4 flex flex-col items-center">
                        <div className="text-center mb-1 w-full">
                          <h3 className="text-sm font-outfit font-bold text-slate-900 dark:text-white">Escolha sua Foto</h3>
                          <p className="text-[10px] text-slate-400">Uma imagem para o seu perfil (opcional).</p>
                        </div>

                        <div className="relative group avatar-container mt-1">
                          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-brand-coral-500/30 bg-brand-indigo-900/50 flex items-center justify-center relative shadow-lg">
                            {userAvatar ? (
                              <img src={userAvatar} alt="Avatar Preview" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-tr from-brand-coral-500 to-amber-500 flex items-center justify-center">
                                <span className="text-3xl font-outfit font-extrabold text-white">
                                  {nameInput ? nameInput.charAt(0).toUpperCase() : '?'}
                                </span>
                              </div>
                            )}
                          </div>
                          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-coral-500 border-2 border-brand-indigo-950 flex items-center justify-center cursor-pointer hover:bg-brand-coral-600 transition-all hover:scale-110 active:scale-95 shadow-md">
                            <Edit2 className="w-3.5 h-3.5 text-white" />
                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                          </label>
                        </div>

                        <div className="flex gap-2 pt-2 w-full">
                          <button
                            onClick={() => setSignupStep(2)}
                            className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all text-slate-300 border border-white/10"
                          >
                            Voltar
                          </button>
                          <button
                            onClick={() => setSignupStep(4)}
                            className="flex-1 h-12 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-white font-bold text-xs transition-all shadow-md shadow-brand-coral-500/10"
                          >
                            {userAvatar ? 'Avançar' : 'Pular'}
                          </button>
                        </div>
                      </div>
                    )}

                    {signupStep === 4 && (
                      <div className="space-y-4">
                        <div className="text-center mb-1">
                          <h3 className="text-sm font-outfit font-bold text-slate-900 dark:text-white">Escolha suas Preferências</h3>
                          <p className="text-[10px] text-slate-400">Selecione no mínimo 3 tags para calibrar seu Swipe ⚡</p>
                        </div>

                        {/* Grid de Tags */}
                        <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1 text-left">
                          {prefs.map((pref) => {
                            const isActive = userPreferences.includes(pref.id);
                            return (
                              <button
                                key={pref.id}
                                onClick={() => togglePreference(pref.id)}
                                className={`px-3 py-2.5 rounded-xl text-[10px] font-semibold border flex items-center gap-2 transition-all duration-200 active:scale-95 ${
                                  isActive
                                    ? 'bg-brand-coral-500 border-brand-coral-500 text-white shadow-md shadow-brand-coral-500/10'
                                    : 'border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'
                                }`}
                              >
                                <span className="text-xs shrink-0">{pref.label.split(' ')[0]}</span>
                                <span className="truncate">{pref.label.split(' ').slice(1).join(' ')}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="text-center">
                          <span className="text-[10px] font-bold text-slate-400">
                            Selecionadas: {userPreferences.length}/3 obrigatórias
                          </span>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => setSignupStep(3)}
                            className="flex-1 h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold transition-all text-slate-300 border border-white/10"
                          >
                            Voltar
                          </button>
                          <button
                            onClick={() => {
                              if (userPreferences.length < 3) return;
                              setSignupStep(5);
                            }}
                            disabled={userPreferences.length < 3}
                            className="flex-1 h-12 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-brand-coral-500/10"
                          >
                            Avançar
                          </button>
                        </div>
                      </div>
                    )}

                    {signupStep === 5 && (
                      <div className="space-y-4 text-center">
                        <div className="w-12 h-12 rounded-full bg-brand-teal-500/10 flex items-center justify-center mx-auto text-brand-teal-500 animate-pulse">
                          <MapPin className="w-6 h-6" />
                        </div>

                        <div className="space-y-1">
                          <h3 className="text-sm font-outfit font-bold text-slate-900 dark:text-white">Ativar Localização</h3>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                            O Giro utiliza geolocalização para te recomendar os estabelecimentos a poucos metros de distância.
                          </p>
                        </div>

                        {authError && <p className="text-xs text-rose-500 font-semibold text-center">{authError}</p>}

                        <div className="flex flex-col gap-2 pt-2 w-full">
                          <button
                            onClick={() => {
                              if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                  () => { handleCompleteEmailSignup(); },
                                  () => { handleCompleteEmailSignup(); }
                                );
                              } else {
                                handleCompleteEmailSignup();
                              }
                            }}
                            disabled={authLoading}
                            className="w-full h-12 rounded-2xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white font-bold text-xs transition-all shadow-md shadow-brand-teal-500/10 flex items-center justify-center gap-2"
                          >
                            {authLoading ? 'Criando Conta...' : 'Ativar GPS (Recomendado)'}
                          </button>
                          <button
                            onClick={handleCompleteEmailSignup}
                            disabled={authLoading}
                            className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all"
                          >
                            {authLoading ? 'Criando Conta...' : 'Continuar sem GPS'}
                          </button>
                          <button
                            onClick={() => setSignupStep(4)}
                            disabled={authLoading}
                            className="text-xs text-slate-500 hover:text-white font-semibold mt-2 bg-transparent border-none p-0 cursor-pointer"
                          >
                            ← Voltar
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-4">
                      Já tem conta? <button onClick={() => { setAuthView('email-login'); setAuthError(''); }} className="text-brand-coral-500 font-bold hover:underline">Faça login</button>
                    </p>
                  </div>
                )}
              </div>
            ) : googleOnboardingStep > 0 ? (
              /* Modal Google Onboarding passos 4 e 5 */
              <div className="glass-card rounded-[32px] p-8 text-center border border-white/5 flex flex-col items-center">
                <div className="w-full max-w-[320px] space-y-4">
                  <div className="flex flex-col items-center mb-2">
                    <span className="text-[10px] uppercase font-bold text-brand-coral-500 tracking-widest">Completar Cadastro - Passo {googleOnboardingStep === 4 ? '1' : '2'} de 2</span>
                    <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden flex gap-1">
                      <div className="h-full flex-1 bg-brand-coral-500 rounded-full" />
                      <div className={`h-full flex-1 transition-all duration-300 rounded-full ${googleOnboardingStep === 5 ? 'bg-brand-coral-500' : 'bg-white/10'}`} />
                    </div>
                  </div>

                  {googleOnboardingStep === 4 && (
                    <div className="space-y-4">
                      <div className="text-center mb-1">
                        <h3 className="text-sm font-outfit font-bold text-slate-900 dark:text-white">Escolha suas Preferências</h3>
                        <p className="text-[10px] text-slate-400">Selecione no mínimo 3 tags para calibrar seu Swipe ⚡</p>
                      </div>

                      {/* Grid de Tags */}
                      <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto pr-1 text-left">
                        {prefs.map((pref) => {
                          const isActive = userPreferences.includes(pref.id);
                          return (
                            <button
                              key={pref.id}
                              onClick={() => togglePreference(pref.id)}
                              className={`px-3 py-2.5 rounded-xl text-[10px] font-semibold border flex items-center gap-2 transition-all duration-200 active:scale-95 ${
                                isActive
                                  ? 'bg-brand-coral-500 border-brand-coral-500 text-white shadow-md shadow-brand-coral-500/10'
                                  : 'border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'
                              }`}
                            >
                              <span className="text-xs shrink-0">{pref.label.split(' ')[0]}</span>
                              <span className="truncate">{pref.label.split(' ').slice(1).join(' ')}</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] font-bold text-slate-400">
                          Selecionadas: {userPreferences.length}/3 obrigatórias
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          if (userPreferences.length < 3) return;
                          setGoogleOnboardingStep(5);
                        }}
                        disabled={userPreferences.length < 3}
                        className="w-full h-12 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-brand-coral-500/10"
                      >
                        Avançar
                      </button>
                    </div>
                  )}

                  {googleOnboardingStep === 5 && (
                    <div className="space-y-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-brand-teal-500/10 flex items-center justify-center mx-auto text-brand-teal-500 animate-pulse">
                        <MapPin className="w-6 h-6" />
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-outfit font-bold text-slate-900 dark:text-white">Ativar Localização</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                          O Giro utiliza geolocalização para te recomendar os estabelecimentos a poucos metros de distância.
                        </p>
                      </div>

                      {authError && <p className="text-xs text-rose-500 font-semibold text-center">{authError}</p>}

                      <div className="flex flex-col gap-2 pt-2 w-full">
                        <button
                          onClick={() => {
                            if (navigator.geolocation) {
                              navigator.geolocation.getCurrentPosition(
                                () => { handleCompleteGoogleOnboarding(); },
                                () => { handleCompleteGoogleOnboarding(); }
                              );
                            } else {
                              handleCompleteGoogleOnboarding();
                            }
                          }}
                          disabled={authLoading}
                          className="w-full h-12 rounded-2xl bg-brand-teal-500 hover:bg-brand-teal-600 text-white font-bold text-xs transition-all shadow-md shadow-brand-teal-500/10 flex items-center justify-center gap-2"
                        >
                          {authLoading ? 'Salvando...' : 'Ativar GPS (Recomendado)'}
                        </button>
                        <button
                          onClick={handleCompleteGoogleOnboarding}
                          disabled={authLoading}
                          className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all"
                        >
                          {authLoading ? 'Salvando...' : 'Continuar sem GPS'}
                        </button>
                        <button
                          onClick={() => setGoogleOnboardingStep(4)}
                          disabled={authLoading}
                          className="text-xs text-slate-500 hover:text-white font-semibold mt-2 bg-transparent border-none p-0 cursor-pointer"
                        >
                          ← Voltar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                {/* Avatar Section */}
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
                  {/* Upload Button */}
                  <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-brand-coral-500 border-2 border-brand-indigo-950 flex items-center justify-center cursor-pointer hover:bg-brand-coral-600 transition-all hover:scale-110 active:scale-95 shadow-lg">
                    <Edit2 className="w-3.5 h-3.5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>

                {/* Name and Username */}
                <h2 className="text-xl font-outfit font-extrabold text-slate-900 dark:text-white">{userName}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{userNickname}</p>

                {/* Selo Giro Visual Card */}
                <div
                  onClick={cycleBadgeLevel}
                  className="glass-card rounded-3xl p-4 w-full border border-white/5 flex items-center gap-4 mt-5 cursor-pointer select-none hover:border-brand-coral-500/30 transition-all"
                >
                  <div className="relative shrink-0 overflow-hidden rounded-xl">
                    {/* SVG Stamp Badge */}
                    <svg className="w-14 h-14 drop-shadow-md" viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFE082" />
                          <stop offset="30%" stopColor="#FFB300" />
                          <stop offset="70%" stopColor="#FF8F00" />
                          <stop offset="100%" stopColor="#FFE082" />
                        </linearGradient>
                        <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ECEFF1" />
                          <stop offset="50%" stopColor="#B0BEC5" />
                          <stop offset="100%" stopColor="#90A4AE" />
                        </linearGradient>
                        <linearGradient id="bronzeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#D7CCC8" />
                          <stop offset="50%" stopColor="#8D6E63" />
                          <stop offset="100%" stopColor="#5D4037" />
                        </linearGradient>
                      </defs>
                      {/* Stamp Path with Scalloped Edge */}
                      <path
                        fill={
                          badgeLevel === 'gold'
                            ? 'url(#goldGrad)'
                            : badgeLevel === 'silver'
                            ? 'url(#silverGrad)'
                            : 'url(#bronzeGrad)'
                        }
                        d="M 10 10 Q 18 18 26 10 Q 34 18 42 10 Q 50 18 58 10 Q 66 18 74 10 Q 82 18 90 10 Q 82 18 90 26 Q 82 34 90 42 Q 82 50 90 58 Q 82 66 90 74 Q 82 82 90 90 Q 82 82 74 90 Q 66 82 58 90 Q 50 82 42 90 Q 34 82 26 90 Q 18 82 10 90 Q 18 82 10 74 Q 18 66 10 58 Q 18 50 10 42 Q 18 34 10 26 Q 18 18 10 10 Z"
                      />
                      {/* Letter G in debossed 3D styling */}
                      <text x="50" y="61" fontFamily="'Outfit', 'Inter', sans-serif" fontSize="34" fontWeight="900" textAnchor="middle" fill="rgba(255,255,255,0.22)">G</text>
                      <text x="50" y="60" fontFamily="'Outfit', 'Inter', sans-serif" fontSize="34" fontWeight="900" textAnchor="middle" fill="rgba(0,0,0,0.55)">G</text>
                    </svg>
                    <div className="shimmer-badge-overlay"></div>
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
                      Clique para ciclar selos • Nível de atividade para manter o selo atual.
                    </p>
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-brand-indigo-950 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          badgeLevel === 'gold'
                            ? 'bg-amber-500 w-[85%]'
                            : badgeLevel === 'silver'
                            ? 'bg-slate-300 w-[60%]'
                            : 'bg-amber-700 w-[30%]'
                        }`}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Estatísticas Rápidas (Cards de Métrica) */}
                <div className="grid grid-cols-3 gap-3 w-full mt-4">
                  <div className="glass-card p-3 rounded-2xl flex flex-col items-center justify-center border border-white/5 shadow-inner">
                    <Bookmark className="w-4 h-4 text-brand-teal-400 mb-1.5" />
                    <span className="text-base font-outfit font-extrabold text-slate-900 dark:text-white">
                      {favoritesCount}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                      Salvos
                    </span>
                  </div>
                  <div className="glass-card p-3 rounded-2xl flex flex-col items-center justify-center border border-white/5 shadow-inner">
                    <Edit3 className="w-4 h-4 text-brand-gold-400 mb-1.5" />
                    <span className="text-base font-outfit font-extrabold text-slate-900 dark:text-white">12</span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Reviews</span>
                  </div>
                  <div className="glass-card p-3 rounded-2xl flex flex-col items-center justify-center border border-white/5 shadow-inner">
                    <Heart className="w-4 h-4 text-brand-coral-500 mb-1.5" />
                    <span className="text-base font-outfit font-extrabold text-slate-900 dark:text-white">142</span>
                    <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">Ajudou</span>
                  </div>
                </div>

                {/* Seleção de Preferências (Exibição Limpa) */}
                <div className="glass-card rounded-3xl p-5 w-full border border-white/5 mt-4 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Minhas Preferências
                    </h3>
                    {userPreferences.length > 0 && (
                      <button
                        onClick={() => setIsPrefsSheetOpen(true)}
                        className="text-xs text-brand-coral-500 hover:text-brand-coral-600 flex items-center gap-1 font-semibold transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                    )}
                  </div>
                  
                  {userPreferences.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-3 justify-start">
                      {prefs
                        .filter((pref) => userPreferences.includes(pref.id))
                        .map((pref) => (
                          <span
                            key={pref.id}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold border border-brand-coral-500 bg-brand-coral-500 text-white shadow-md shadow-brand-coral-500/20"
                          >
                            {pref.label}
                          </span>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <button
                        onClick={() => setIsPrefsSheetOpen(true)}
                        className="text-xs text-slate-400 hover:text-white font-semibold transition-colors flex items-center justify-center gap-1 w-full"
                      >
                        Nenhuma preferência selecionada. <span className="text-brand-coral-500">[+ Adicionar]</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Configurações e Menu da Conta */}
                <div className="glass-card rounded-3xl w-full border border-white/5 mt-4 overflow-hidden">
                  <button
                    onClick={openCadastrais}
                    className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Dados Cadastrais
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-950 dark:group-hover:text-white transition-colors" />
                  </button>
                  <button
                    onClick={() => alert('Configurações de Notificação (Em breve!)')}
                    className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 hover:bg-white/5 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                        Gerenciar Notificações
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-950 dark:group-hover:text-white transition-colors" />
                  </button>
                  <button
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 hover:bg-rose-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <Trash2 className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      <span className="text-xs font-bold text-rose-500 dark:text-rose-400">
                        Excluir Conta Definitivamente
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-rose-500/10 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                      <span className="text-xs font-bold text-rose-500 dark:text-rose-400">Sair da Conta</span>
                    </div>
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="glass-card rounded-[32px] p-8 text-center border border-white/5">
              <p className="text-sm font-semibold text-slate-300">
                Painel do Estabelecimento e Cadastro (Em breve)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Crop Image Modal */}
      {cropModalOpen && imageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="glass-card w-full max-w-md rounded-[32px] border border-white/5 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-white/5 text-center">
              <h3 className="text-base font-outfit font-bold text-white">Ajustar Foto de Perfil</h3>
              <p className="text-[10px] text-slate-400 mt-1">Mova e aproxime a foto para centralizá-la no círculo</p>
            </div>

            {/* Cropper Container */}
            <div className="relative w-full h-72 bg-brand-indigo-950/40">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_croppedArea, croppedAreaPixels) => {
                  setCroppedAreaPixels(croppedAreaPixels);
                }}
              />
            </div>

            {/* Controls */}
            <div className="p-5 flex flex-col gap-4">
              {/* Zoom Slider */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Zoom</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 accent-brand-coral-500 bg-white/10 rounded-lg h-1.5 cursor-pointer"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCropModalOpen(false);
                    setImageSrc(null);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold transition-all text-slate-300 active:scale-95"
                >
                  Cancelar
                </button>
                <button
                  onClick={async () => {
                    try {
                      if (imageSrc && croppedAreaPixels) {
                        const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels);
                        setUserAvatar(croppedBase64);
                        setCropModalOpen(false);
                        setImageSrc(null);
                      }
                    } catch (e) {
                      console.error('Erro ao recortar imagem:', e);
                    }
                  }}
                  className="flex-1 py-3 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-xs font-bold transition-all text-white active:scale-95 btn-premium shadow-md shadow-brand-coral-500/10"
                >
                  Confirmar Corte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preferences Bottom Sheet Drawer */}
      {isPrefsSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[4px]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0" 
            onClick={() => {
              savePreferences(userPreferences);
            }} 
          />
          
          {/* Drawer Body */}
          <div className="relative w-full max-w-md bg-white dark:bg-brand-indigo-950 border-t border-slate-100 dark:border-white/10 rounded-t-[32px] p-6 shadow-2xl z-10 animate-[slideUp_0.3s_ease-out] flex flex-col" style={{ maxHeight: '80vh' }}>
            {/* Handle bar */}
            <div 
              className="w-12 h-1.5 bg-slate-300 dark:bg-white/15 rounded-full mx-auto cursor-pointer mb-5 shrink-0" 
              onClick={() => {
                savePreferences(userPreferences);
              }}
            />
            
            <div className="text-center mb-5 shrink-0">
              <h3 className="text-base font-outfit font-extrabold text-slate-900 dark:text-white">Editar Preferências</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Selecione o que você busca para calibrar seu Swipe ⚡</p>
            </div>

            {/* Scrollable preferences grid */}
            <div className="flex-1 overflow-y-auto pr-1 grid grid-cols-2 gap-2 mb-6 min-h-0">
              {prefs.map((pref) => {
                const isActive = userPreferences.includes(pref.id);
                return (
                  <button
                    key={pref.id}
                    onClick={() => {
                      setUserPreferences((prev) => {
                        const updated = prev.includes(pref.id)
                          ? prev.filter((p) => p !== pref.id)
                          : [...prev, pref.id];
                        return updated;
                      });
                    }}
                    className={`px-4 py-3 rounded-2xl text-xs font-semibold border flex items-center gap-2.5 transition-all duration-200 active:scale-95 ${
                      isActive 
                        ? 'bg-brand-coral-500 border-brand-coral-500 text-white shadow-md shadow-brand-coral-500/20' 
                        : 'border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10'
                    }`}
                  >
                    <span className="text-sm shrink-0">{pref.label.split(' ')[0]}</span>
                    <span className="truncate">{pref.label.split(' ').slice(1).join(' ')}</span>
                  </button>
                );
              })}
            </div>

            {/* Confirm button */}
            <button
              onClick={() => {
                savePreferences(userPreferences);
              }}
              className="w-full py-3.5 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-xs font-bold transition-all text-white active:scale-95 btn-premium shadow-md shadow-brand-coral-500/20 shrink-0"
            >
              Confirmar Alterações
            </button>
          </div>
        </div>
      )}

      {/* Dados Cadastrais Bottom Sheet */}
      {isCadastraisOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-[4px]">
          <div className="absolute inset-0" onClick={() => setIsCadastraisOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-brand-indigo-950 border-t border-slate-100 dark:border-white/10 rounded-t-[32px] p-6 shadow-2xl z-10 animate-[slideUp_0.3s_ease-out] flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/15 rounded-full mx-auto cursor-pointer mb-5 shrink-0" onClick={() => setIsCadastraisOpen(false)} />

            <div className="text-center mb-6 shrink-0">
              <h3 className="text-base font-outfit font-extrabold text-slate-900 dark:text-white">Dados Cadastrais</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Edite seus dados pessoais</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-4 focus:outline-none focus:border-brand-coral-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Nickname</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-bold">@</span>
                  <input
                    type="text"
                    value={editNickname.replace('@', '')}
                    onChange={(e) => setEditNickname(`@${e.target.value.replace('@', '')}`)}
                    className="w-full h-12 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-900 dark:text-white placeholder-slate-400 pl-10 pr-4 focus:outline-none focus:border-brand-coral-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    className="w-full h-12 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 text-sm text-slate-400 pl-10 pr-10 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={saveCadastrais}
              className="w-full py-3.5 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-xs font-bold transition-all text-white active:scale-95 btn-premium shadow-md shadow-brand-coral-500/20 shrink-0 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
          </div>
        </div>
      )}

      {/* LGPD Terms Modal */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[4px] p-6">
          <div className="absolute inset-0" onClick={() => setIsTermsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-brand-indigo-950 border border-slate-100 dark:border-white/10 rounded-[32px] p-6 shadow-2xl z-10 flex flex-col" style={{ maxHeight: '80vh' }}>
            <button 
              onClick={() => setIsTermsModalOpen(false)} 
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4 shrink-0">
              <h3 className="text-base font-outfit font-extrabold text-slate-900 dark:text-white">Termos e Privacidade</h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">Sua privacidade e conformidade com a LGPD ⚖️</p>
            </div>

            <div className="flex-1 overflow-y-auto text-slate-600 dark:text-slate-300 text-xs space-y-4 pr-1 leading-relaxed mb-6">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">1. Coleta de Dados Pessoais</h4>
                <p>O Giro coleta seu nome completo, e-mail e foto de perfil no momento do cadastro para criar sua conta única e permitir a identificação. Coletamos também as preferências que você seleciona para calibrar as recomendações.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">2. Geolocalização por GPS</h4>
                <p>Nossa plataforma solicita permissão de geolocalização do seu dispositivo para mostrar os locais, cafés, bares e atrações mais próximos de você. Caso decida não compartilhar seu GPS, você poderá selecionar manualmente qualquer bairro de Curitiba na tela inicial para ver as recomendações daquela região.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">3. Favoritos e Sincronização</h4>
                <p>Os estabelecimentos que você curte ou adiciona aos favoritos e as configurações do seu perfil são armazenados na nuvem através do nosso banco de dados seguro do Supabase. Isso garante que sua experiência seja salva e sincronizada entre diferentes dispositivos.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">4. Direito ao Esquecimento e Exclusão</h4>
                <p>Respeitamos a LGPD integralmente. A qualquer momento, você pode excluir permanentemente seu perfil e todos os dados associados através da opção "Excluir conta definitivamente" disponível nas configurações do seu perfil. Essa ação deleta seus favoritos, preferências e informações cadastrais do nosso servidor de forma definitiva e irreversível.</p>
              </div>
            </div>

            <button
              onClick={() => setIsTermsModalOpen(false)}
              className="w-full py-3.5 rounded-2xl bg-brand-coral-500 hover:bg-brand-coral-600 text-xs font-bold transition-all text-white active:scale-95 btn-premium shadow-md shadow-brand-coral-500/20 shrink-0"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-[4px] p-6">
          <div className="absolute inset-0" onClick={() => setIsDeleteConfirmOpen(false)} />
          <div className="relative w-full max-w-sm bg-white dark:bg-brand-indigo-950 border border-slate-100 dark:border-rose-500/20 rounded-[32px] p-6 shadow-2xl z-10 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-outfit font-extrabold text-slate-900 dark:text-white mb-2">Excluir Conta Permanentemente?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
              Esta ação é **irreversível**. Todos os seus dados pessoais, preferências personalizadas e locais favoritos serão excluídos do nosso banco de dados do Supabase em conformidade com a LGPD.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleDeleteAccount}
                className="w-full py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-xs font-bold transition-all text-white active:scale-95 shadow-md shadow-rose-500/20"
              >
                Sim, excluir minha conta
              </button>
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-xs font-bold transition-all text-slate-700 dark:text-slate-300 active:scale-95"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
