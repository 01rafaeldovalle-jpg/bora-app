import React, { useState } from 'react';
import Header from '../components/common/Header';
import { User, LogIn, Settings, Bell, HelpCircle, Shield, Languages, Moon, Trash2, Heart, Award, MapPin } from 'lucide-react';

interface ProfileProps {
  favoritesCount: number;
}

export default function Profile({ favoritesCount }: ProfileProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({
    name: 'Rafael do Valle',
    email: '01rafaeldovalle@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    checkins: 4,
    reviews: 2
  });

  const handleLogin = (provider: 'google' | 'apple') => {
    // Simulação do login social Supabase
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  return (
    <div className="pb-24 text-slate-100">
      <Header title="Meu Perfil" showLocationSelector={false} />

      <div className="px-6 py-4 max-w-md mx-auto">
        {isLoggedIn ? (
          /* USUÁRIO LOGADO */
          <div className="space-y-6">
            {/* Cartão de Perfil */}
            <div className="glass-card rounded-3xl p-5 border border-white/5 flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-brand-coral-500/10 blur-xl -z-10" />
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-brand-coral-500 shadow-md shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-outfit font-bold text-white line-clamp-1 leading-snug">{user.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-1 mb-2">{user.email}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-brand-teal-400 font-semibold tracking-wide uppercase">
                  <Award className="w-3.5 h-3.5" /> Explorador Iniciante
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card rounded-2xl p-3 border border-white/5 text-center">
                <span className="block text-lg font-outfit font-black text-brand-coral-500">{favoritesCount}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Favoritos</span>
              </div>
              <div className="glass-card rounded-2xl p-3 border border-white/5 text-center">
                <span className="block text-lg font-outfit font-black text-brand-teal-400">{user.checkins}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Check-ins</span>
              </div>
              <div className="glass-card rounded-2xl p-3 border border-white/5 text-center">
                <span className="block text-lg font-outfit font-black text-brand-gold-400">{user.reviews}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reviews</span>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="glass-card rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/10 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-coral-500/10 text-brand-coral-500"><Bell className="w-4 h-4" /></div>
                  <span className="text-xs font-semibold text-slate-200">Notificações</span>
                </div>
                <div className="w-8 h-5 rounded-full bg-brand-coral-500/20 flex items-center p-0.5 justify-end"><div className="w-4 h-4 rounded-full bg-brand-coral-500" /></div>
              </button>

              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/10 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-teal-500/10 text-brand-teal-400"><Languages className="w-4 h-4" /></div>
                  <span className="text-xs font-semibold text-slate-200">Idioma</span>
                </div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Português</span>
              </button>

              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 active:bg-white/10 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gold-500/10 text-brand-gold-400"><Moon className="w-4 h-4" /></div>
                  <span className="text-xs font-semibold text-slate-200">Tema Claro / Escuro</span>
                </div>
                <div className="w-8 h-5 rounded-full bg-brand-gold-500/20 flex items-center p-0.5 justify-end"><div className="w-4 h-4 rounded-full bg-brand-gold-400" /></div>
              </button>
            </div>

            {/* Suporte e Segurança */}
            <div className="glass-card rounded-3xl border border-white/5 divide-y divide-white/5 overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 text-slate-400"><Shield className="w-4 h-4" /></div>
                  <span className="text-xs font-semibold text-slate-200">Políticas & LGPD</span>
                </div>
              </button>
              
              <button className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 text-slate-400"><HelpCircle className="w-4 h-4" /></div>
                  <span className="text-xs font-semibold text-slate-200">Central de Ajuda</span>
                </div>
              </button>
            </div>

            {/* Sair da Conta e Excluir */}
            <div className="space-y-2 pt-2">
              <button 
                onClick={handleLogout}
                className="w-full h-11 rounded-2xl border border-white/10 text-xs font-bold text-slate-300 hover:bg-white/5 transition-all active:scale-98 btn-premium"
              >
                Sair da Conta
              </button>
              
              <button className="w-full h-11 rounded-2xl border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-500/10 transition-all active:scale-98 btn-premium flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Excluir Minha Conta (LGPD)
              </button>
            </div>
          </div>
        ) : (
          /* USUÁRIO DESLOGADO */
          <div className="space-y-8 py-10 text-center">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-coral-500 to-amber-500 shadow-md flex items-center justify-center mb-6">
                <User className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-outfit font-extrabold text-white mb-2">Participe da comunidade</h2>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Crie uma conta para salvar seus locais favoritos, fazer check-ins, avaliar experiências e receber recomendações sob medida.
              </p>
            </div>

            {/* Botões de Login Social (Únicos permitidos - Google / Apple) */}
            <div className="space-y-3">
              <button
                onClick={() => handleLogin('google')}
                className="w-full h-12 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center gap-3 hover:bg-slate-100 transition-all active:scale-98 btn-premium shadow-md"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span>Entrar com o Google</span>
              </button>

              <button
                onClick={() => handleLogin('apple')}
                className="w-full h-12 rounded-2xl bg-black text-white border border-white/10 font-semibold text-sm flex items-center justify-center gap-3 hover:bg-slate-900 transition-all active:scale-98 btn-premium shadow-md"
              >
                <svg className="w-4.5 h-4.5 shrink-0 -translate-y-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.74-1.2 1.88-1.05 3 .12.01.24.02.35.02.96 0 2.1-.61 2.65-1.46z" />
                </svg>
                <span>Entrar com a Apple</span>
              </button>
            </div>
            
            <div className="pt-8">
              <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                Ao continuar, você concorda com nossos Termos de Uso e Política de Privacidade de acordo com a LGPD.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
