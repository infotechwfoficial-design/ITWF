import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Bell, X, Share, PlusSquare, ArrowUp, ChevronRight } from 'lucide-react';
import { subscribeUserToPush } from '../utils/push';
import { supabase } from '../utils/supabase';

interface PWAInstallModalProps {
    deferredPrompt: any;
    onClose: () => void;
}

export default function PWAInstallModal({ deferredPrompt, onClose }: PWAInstallModalProps) {
    const [isIOS, setIsIOS] = useState(false);
    const [step, setStep] = useState(1); // 1: Welcome/Install, 2: Push, 3: Success

    useEffect(() => {
        // iOS Detection
        const userAgent = window.navigator.userAgent.toLowerCase();
        const ios = /iphone|ipad|ipod/.test(userAgent);
        const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

        setIsIOS(ios && !isStandalone);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`Install outcome: ${outcome}`);
        }
        setStep(2);
    };

    const handleNotifications = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                await subscribeUserToPush(session.user.email);
            }
            setStep(3);
            setTimeout(onClose, 2000);
        } catch (error) {
            console.error('Error enabling notifications:', error);
            onClose();
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10"
                >
                    <div className="relative p-8 flex flex-col items-center text-center">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
                            <img src="/logo.png" alt="Logo" className="size-14 object-contain animate-float" />
                        </div>

                        {step === 1 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-4"
                            >
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    Tenha o ITWF na sua tela inicial!
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400">
                                    Instale nosso Web App para um acesso mais rápido e uma experiência fluida de aplicativo nativo.
                                </p>

                                {isIOS ? (
                                    <div className="bg-slate-50 dark:bg-white/5 p-5 rounded-2xl border border-primary/20 space-y-4">
                                        <p className="text-sm font-bold text-primary flex items-center justify-center gap-2">
                                            <Share size={18} /> Instruções para iPhone:
                                        </p>
                                        <ul className="text-left text-xs space-y-3 text-slate-600 dark:text-slate-300">
                                            <li className="flex items-center gap-3">
                                                <div className="size-6 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-[10px]">1</div>
                                                <span>Toque no ícone de <strong>Compartilhar</strong> na barra do Safari.</span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <div className="size-6 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-[10px]">2</div>
                                                <span>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>. <PlusSquare size={14} className="inline ml-1" /></span>
                                            </li>
                                            <li className="flex items-center gap-3">
                                                <div className="size-6 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold text-[10px]">3</div>
                                                <span>Toque em <strong>Adicionar</strong> no canto superior.</span>
                                            </li>
                                        </ul>
                                        <button
                                            onClick={() => setStep(2)}
                                            className="w-full bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            Já instalei, continuar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleInstall}
                                        className="w-full flex items-center justify-center gap-3 bg-primary text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        <Download size={24} />
                                        INSTALAR AGORA
                                    </button>
                                )}
                                <button
                                    onClick={() => setStep(2)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-medium transition-colors"
                                >
                                    Fazer isso mais tarde
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="size-16 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                                    <Bell size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">Ativar Notificações?</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                                        Não perca seus prazos de renovação e avisos importantes de manutenção. Prometemos não incomodar!
                                    </p>
                                </div>
                                <div className="space-y-3 pt-2">
                                    <button
                                        onClick={handleNotifications}
                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        SIM, ME AVISE!
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-900 dark:hover:text-white transition-colors"
                                    >
                                        PULAR POR ENQUANTO
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="space-y-4 py-6"
                            >
                                <div className="size-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                                <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">Tudo pronto!</h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">
                                    Você agora terá uma experiência completa. Aproveite!
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
