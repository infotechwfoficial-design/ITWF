import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../utils/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;
      setIsSent(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao enviar o e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-background-dark relative overflow-hidden font-sans">
      {/* Background Image with Blur */}
      <div
        className="absolute inset-0 z-0 opacity-10 dark:opacity-30 bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80)' }}
      />
      <div className="absolute inset-0 bg-white/50 dark:bg-black/70 z-0" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md p-6"
      >
        <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-black/5 dark:border-white/10">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/10">
                <ShieldCheck className="text-primary w-12 h-12" />
              </div>
            </div>

            {!isSent ? (
              <>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Esqueceu sua senha?</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">Não se preocupe! Insira seu e-mail abaixo e enviaremos as instruções para você criar uma nova senha.</p>

                <form onSubmit={handleSubmit} className="w-full space-y-6">
                  {errorMsg && (
                    <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl text-center text-xs font-bold border border-rose-500/20">
                      {errorMsg}
                    </div>
                  )}
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">E-mail de Recuperação</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="text-primary w-5 h-5" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-slate-100 dark:bg-slate-800/50 border border-black/5 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="exemplo@email.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 px-4 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? 'ENVIANDO...' : 'RECUPERAR SENHA'}
                    {!loading && <Send size={18} className="group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <div className="size-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                  <CheckCircle2 className="text-emerald-500 size-10" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">E-mail Enviado!</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Enviamos um link de recuperação para <strong className="text-slate-900 dark:text-white">{email}</strong>. Verifique sua caixa de entrada e spam.</p>
                <button
                  onClick={() => setIsSent(false)}
                  className="text-primary font-bold hover:underline"
                >
                  Não recebeu? Tentar novamente
                </button>
              </motion.div>
            )}

            <div className="mt-10 pt-8 border-t border-black/5 dark:border-white/5 w-full">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-medium text-sm group"
              >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Voltar para o Login
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
