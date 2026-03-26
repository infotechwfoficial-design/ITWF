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
            className="relative w-[95%] max-w-5xl h-auto max-h-[90vh] bg-white dark:bg-[#0B1120] rounded-[2.5rem] md:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-row custom-scrollbar"
          >
            {/* Left Side: Content area */}
            <div className="flex-1 relative flex flex-col overflow-y-auto custom-scrollbar border-r border-white/5">
              {/* Decorative Gradient Blob */}
              <div className="absolute -top-12 -left-12 size-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
              
              <div className="relative p-6 sm:p-8 md:p-12 flex flex-col gap-6 md:gap-10">
                <div className="flex items-center gap-3">
                  <div className="size-8 md:size-12 rounded-xl md:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group">
                    <Sparkles size={16} className="md:size-6 group-hover:rotate-12 transition-transform" />
                  </div>
                  <span className="text-primary font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[8px] md:text-[11px]">Seja Muito Bem-Vindo</span>
                </div>
                
                <div className="space-y-2 md:space-y-4">
                  <h2 className="text-2xl sm:text-3xl md:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                    Olá, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-primary animate-gradient-x">
                      {clientName || 'Campeão'}!
                    </span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base md:text-xl font-medium leading-relaxed max-w-sm">
                    Preparamos um guia interativo para seu novo painel ITWF.
                  </p>
                </div>

                <div className="grid gap-3 md:gap-6 py-2">
                  {[
                    { title: 'Veja como renovar sua assinatura em segundos' },
                    { title: 'Aprenda a fazer pedidos de novos conteúdos' },
                    { title: 'Saiba como entrar em contato com o suporte' }
                  ].map((item, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                      className="flex gap-3 md:gap-5 p-3 md:p-5 rounded-2xl md:rounded-3xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] hover:scale-[1.02] transition-all cursor-default group"
                    >
                      <div className="size-6 md:size-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 ring-4 md:ring-8 ring-emerald-500/5">
                        <CheckCircle2 size={12} className="md:size-5" />
                      </div>
                      <p className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm md:text-lg leading-tight uppercase tracking-tight">{item.title}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  <button
                    onClick={onClose}
                    className="w-full bg-primary hover:bg-primary/90 text-white px-4 md:px-8 py-4 md:py-6 rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-sm shadow-[0_15px_40px_-10px_rgba(var(--primary-rgb),0.5)] transition-all active:scale-[0.97] flex items-center justify-center gap-2 md:gap-3 relative overflow-hidden group"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      COMEÇAR AGORA <span className="text-xs">▶</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </button>
                  <p className="text-center text-[8px] md:text-[10px] text-slate-400 dark:text-slate-600 font-black uppercase tracking-[0.2em] md:tracking-[0.4em]">
                    Seu acesso está pronto!
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: High-Impact Video Area */}
            <div className="flex-1 bg-slate-100 dark:bg-[#070B14] p-4 sm:p-6 md:p-12 flex items-center justify-center relative min-h-0">
              {/* Massive Glow behind video */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-32 md:size-64 bg-primary/20 rounded-full blur-[60px] md:blur-[100px]"></div>
              
              <div className="w-full aspect-[9/16] max-h-[80%] rounded-2xl md:rounded-[3rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative border-4 md:border-[8px] border-slate-900 dark:border-slate-800 z-10 transition-transform hover:scale-[1.01] duration-500">
                <iframe 
                  loading="lazy" 
                  className="absolute inset-0 w-full h-full border-none"
                  src="https://www.canva.com/design/DAHD4du1Sc4/bX4V-gbFTm887xQ65zOIWA/watch?embed" 
                  allowFullScreen 
                  allow="fullscreen"
                  title="Tutorial ITWF"
                />
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
