import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, X, Sparkles } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, clientName }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6">
          {/* Backdrop with stronger blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-6xl bg-white dark:bg-[#0B1120] md:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border-none md:border md:border-white/10 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row custom-scrollbar"
          >
            {/* Left Side: Content area */}
            <div className="flex-1 relative flex flex-col md:overflow-y-auto custom-scrollbar">
              {/* Decorative Gradient Blob */}
              <div className="absolute -top-24 -left-24 size-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="relative p-10 md:p-16 flex flex-col gap-10">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group">
                    <Sparkles size={24} className="group-hover:rotate-12 transition-transform" />
                  </div>
                  <span className="text-primary font-bold uppercase tracking-[0.3em] text-[11px]">Seja Muito Bem-Vindo</span>
                </div>
                
                <div className="space-y-4">
                  <h2 className="text-5xl md:text-7xl font-black text-slate-900 dark:text-white leading-[1] tracking-tight">
                    Olá, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-primary animate-gradient-x">
                      {clientName || 'Campeão'}!
                    </span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xl font-medium leading-relaxed max-w-sm">
                    Preparamos um guia interativo para você dominar sua nova plataforma ITWF.
                  </p>
                </div>

                <div className="grid gap-6 py-4">
                  {[
                    { title: 'Renovação Instantânea', desc: 'Renove seu plano em menos de 10 segundos.' },
                    { title: 'Pedidos VIP', desc: 'Peça seus filmes e séries favoritos pelo painel.' },
                    { title: 'Suporte Direto', desc: 'Botão de atalho para falar com os admins.' }
                  ].map((item, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                      className="flex gap-5 p-5 rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] hover:scale-[1.02] transition-all cursor-default group"
                    >
                      <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-1 ring-8 ring-emerald-500/5">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white font-black text-lg leading-tight uppercase tracking-tight">{item.title}</p>
                        <p className="text-slate-500 dark:text-slate-500 text-sm mt-1 leading-snug">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col gap-4 mt-6">
                  <button
                    onClick={onClose}
                    className="w-full bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-sm shadow-[0_20px_60px_-10px_rgba(var(--primary-rgb),0.5)] transition-all active:scale-[0.97] flex items-center justify-center gap-3 relative overflow-hidden group"
                  >
                    <span className="relative z-10">Conhecer o Painel Agora 🚀</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                  <p className="text-center text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.4em]">
                    Seu acesso está pronto!
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: High-Impact Video Area */}
            <div className="flex-1 bg-slate-100 dark:bg-[#070B14] p-8 md:p-16 flex items-center justify-center relative border-t md:border-t-0 md:border-l border-black/5 dark:border-white/5 min-h-[600px] md:min-h-0">
              {/* Massive Glow behind video */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[400px] bg-primary/20 rounded-full blur-[120px]"></div>
              
              <div className="w-full max-w-[320px] md:max-w-none aspect-[9/16] rounded-[3rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] relative border-[8px] border-slate-900 dark:border-slate-800 z-10 transition-transform hover:scale-[1.01] duration-500">
                <iframe 
                  loading="lazy" 
                  className="absolute inset-0 w-full h-full border-none"
                  src="https://www.canva.com/design/DAHD4du1Sc4/bX4V-gbFTm887xQ65zOIWA/watch?embed" 
                  allowFullScreen 
                  allow="fullscreen"
                  title="Tutorial ITWF"
                />
              </div>
              
              {/* Mobile Indicator */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 md:hidden">
                <div className="w-12 h-1 bg-slate-300 dark:bg-white/10 rounded-full"></div>
              </div>
            </div>

            {/* Float Close Button */}
            <button
              onClick={onClose}
              className="absolute top-8 right-8 z-30 p-4 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-2xl transition-all text-white shadow-2xl active:scale-90 group"
            >
              <X size={28} className="group-hover:rotate-180 transition-transform duration-500" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
