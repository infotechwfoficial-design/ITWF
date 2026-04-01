import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, ShieldCheck, Instagram, Send, Lock, ArrowRight } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface LoginProps {
  onLogin: () => void;
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const referralId = searchParams.get('ref');

  // Guarda o referralId de forma segura
  React.useEffect(() => {
    if (referralId) {
      localStorage.setItem('referralId', referralId);
    }
  }, [referralId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isLogin) {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        if (data.user) {
          // If needed, we can set local state, but App.tsx will eventually listen to Auth State
          localStorage.setItem('currentUser', data.user.email || ''); // Keeping fallback for the Dashboard requests for now
          navigate('/dashboard');
        }
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password
        });

        if (error) throw error;
        
        if (data?.user) {
          // Cria registro do usuário na tabela clients para o dashboard
          const baseName = email.split('@')[0];
          const finalAdminId = referralId || localStorage.getItem('referralId') || null;

          let clientInsert = await supabase.from('clients').insert([{
            user_id: data.user.id,
            username: baseName,
            name: baseName,
            email: email,
            expiration_date: '',
            admin_id: finalAdminId
          }]);

          // Caso o trigger do Supabase já tenha criado o perfil (Erro 409/23505), ignoramos silenciosamente
          if (clientInsert.error && clientInsert.error.code === '23505') {
            console.log('[SignUp] Perfil já criado via trigger ou tentativa anterior. Prosseguindo.');
          } else if (clientInsert.error) {
            console.error('Inserção na tabela clients falhou:', clientInsert.error);
            // Fallback para nome de usuário duplicado (adicionando sufixo)
            const fallbackSufix = Math.floor(Math.random() * 10000);
            const retryInsert = await supabase.from('clients').insert([{
              user_id: data.user.id,
              username: `${baseName}_${fallbackSufix}`,
              name: baseName,
              email: email,
              expiration_date: '',
              admin_id: finalAdminId
            }]);

            if (retryInsert.error && retryInsert.error.code !== '23505') {
              throw new Error(`Erro ao finalizar seu perfil: ${retryInsert.error.message}`);
            }
          }
          
          // Limpa o referral cache
          localStorage.removeItem('referralId');

          // Notificar Administrador sobre novo cadastro
          const apiUrl = import.meta.env.VITE_API_URL || '';
          fetch(`${apiUrl}/api/send-push`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Novo Cadastro! 🆕',
              message: `O usuário ${email} acabou de se cadastrar no sistema.`,
              email: 'info.tech.wf.oficial@gmail.com'
            })
          })
          .then(async (res) => {
            if (!res.ok) {
              const text = await res.text().catch(() => '');
              console.warn('[Push Notification] Erro ao notificar admin:', res.status, text);
            }
          })
          .catch(err => console.error('[Push Notification] Falha na rede:', err));
        }

        setSuccessMsg('Conta criada com sucesso! Você já pode fazer login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      let msg = err.message || 'Ocorreu um erro durante a autenticação.';
      if (msg.includes('Invalid login credentials')) msg = 'E-mail ou senha incorretos.';
      if (msg.includes('already registered')) msg = 'Este e-mail já está cadastrado no sistema.';
      if (msg.includes('Password should be at least')) msg = 'A senha deve ter no mínimo 6 caracteres.';
      if (msg.includes('Email not confirmed')) msg = 'Por favor, confirme seu e-mail antes de entrar.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark relative overflow-hidden font-sans">
      {/* Background Gradient Otimizado */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-950 dark:to-slate-900" />
      <div className="absolute inset-0 opacity-30 dark:opacity-20 z-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-primary/20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-6"
      >
        <div className="bg-white dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl p-8 shadow-2xl flex flex-col items-center border border-black/5 dark:border-white/10">
          <div className="mb-6">
            <motion.img
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              src="/logo.png"
              alt="ITWF Logo"
              className="w-44 h-44 object-contain drop-shadow-2xl"
            />
          </div>

          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 text-center">Sistema de renovação de assinatura</p>

          <h1 className="text-2xl font-bold text-center mb-6 leading-tight text-slate-900 dark:text-white">
            {isLogin ? (
              <>Bem-vindo! Identifique-se<br />abaixo.</>
            ) : (
              <>Crie sua Conta<br />agora mesmo.</>
            )}
          </h1>

          <div className="flex w-full mb-6 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Entrar
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-4 mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="text-primary w-5 h-5" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800/60 border border-black/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Seu E-mail"
                required
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-primary w-5 h-5" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-800/60 border border-black/5 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                placeholder="Sua Senha"
                required
                minLength={6}
              />
            </div>

            {isLogin && (
              <div className="flex justify-end pt-1">
                <Link to="/forgot-password" className="text-sm font-bold text-primary hover:underline transition-all">
                  Esqueceu a senha?
                </Link>
              </div>
            )}

            {errorMsg && (
              <p className="text-rose-500 text-xs font-bold text-center mt-2">{errorMsg}</p>
            )}
            {successMsg && (
              <p className="text-emerald-500 text-xs font-bold text-center mt-2">{successMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-blue-600 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-500/30 mt-2"
            >
              {loading ? 'Aguarde...' : isLogin ? 'ENTRAR NO PAINEL' : 'CRIAR CONTA'}
            </button>
          </form>

          <div className="w-full border-t border-black/5 dark:border-white/10 my-4" />

          <Link 
            to="/revenda"
            className="w-full group p-4 border border-primary/20 bg-primary/5 rounded-2xl flex items-center justify-between transition-all hover:bg-primary/10 mb-2"
          >
            <div className="flex flex-col items-start">
              <span className="text-xs font-black text-primary uppercase tracking-widest">Oportunidade</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">Seja nosso revendedor</span>
            </div>
            <ArrowRight size={20} className="text-primary group-hover:translate-x-1 transition-transform" />
          </Link>

          <div className="w-full border-t border-black/5 dark:border-white/10 my-4" />

          <div className="w-full flex flex-col items-center space-y-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm text-center">Sistema de renovação de assinatura</p>

            <div className="flex flex-col items-center space-y-3 w-full">
              <a href="https://www.instagram.com/infotechwf" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-primary hover:text-blue-400 transition-colors group">
                <Instagram className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">@infotechwf</span>
              </a>
              <a href="https://t.me/+gyZZmBgM8YBkYjkx" target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-primary hover:text-blue-400 transition-colors group">
                <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Canal do Telegram</span>
              </a>
            </div>

            <p className="text-slate-400 dark:text-slate-500 text-xs text-center mt-2">Nos siga no Instagram e Telegram</p>

            <div
              onClick={() => navigate('/admin/login')}
              className="flex items-center space-x-1.5 text-slate-400 dark:text-slate-500 text-xs mt-6 opacity-80 cursor-pointer hover:text-primary transition-colors"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Site Seguro</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
