import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Lock, CheckCircle2, Save } from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function UpdatePassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // The user lands here after clicking the email link.
        // Supabase will automatically process the hash in the URL and establish a session.
        // We just need to check if we actually have an active session to allow password update.
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                setErrorMsg('Sessão de recuperação inválida ou expirada. Tente recuperar a senha novamente.');
            }
        });

        // Supabase also fires this event when processing the recovery link
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // Ready to update password
                setErrorMsg('');
            } else if (event === 'SIGNED_OUT' || !session) {
                setErrorMsg('Sessão expirada. Por favor, solicite a recuperação de senha novamente.');
            }
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password || !confirmPassword) return;

        if (password !== confirmPassword) {
            setErrorMsg('As senhas não coincidem. Tente novamente.');
            return;
        }

        if (password.length < 6) {
            setErrorMsg('A nova senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            setSuccess(true);
            // Wait a few seconds and redirect to login
            setTimeout(() => {
                navigate('/');
            }, 3000);

        } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao atualizar a senha.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative overflow-hidden font-sans">
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
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-10 shadow-2xl border border-black/5 dark:border-white/10">
                    <div className="flex flex-col items-center text-center">

                        {!success ? (
                            <>
                                <div className="mb-6">
                                    <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/10">
                                        <Lock className="text-primary w-8 h-8" />
                                    </div>
                                </div>

                                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Crie sua nova senha</h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">Digite sua nova senha abaixo para acessar sua conta novamente.</p>

                                <form onSubmit={handleSubmit} className="w-full space-y-4">
                                    {errorMsg && (
                                        <div className="bg-rose-500/10 text-rose-500 p-3 rounded-xl text-center text-xs font-bold border border-rose-500/20">
                                            {errorMsg}
                                        </div>
                                    )}

                                    <div className="space-y-1.5 text-left">
                                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Nova Senha</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="text-primary w-5 h-5" />
                                            </div>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-black/5 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                                placeholder="Mínimo de 6 caracteres"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 text-left pb-4">
                                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Confirmar Senha</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="text-primary w-5 h-5" />
                                            </div>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 border border-black/5 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                                placeholder="Digite a senha novamente"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !!errorMsg.includes('expirada')}
                                        className="w-full bg-primary hover:bg-primary/90 text-white font-black py-3.5 px-4 rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'SALVANDO...' : 'REDEFINIR SENHA'}
                                        {!loading && <Save size={18} />}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center py-6"
                            >
                                <div className="size-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                                    <CheckCircle2 className="text-emerald-500 size-12" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Senha Atualizada!</h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-2 text-center">Sua senha foi redefinida com sucesso.</p>
                                <p className="text-slate-400 dark:text-slate-500 text-xs mb-6">Redirecionando para o Login...</p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
