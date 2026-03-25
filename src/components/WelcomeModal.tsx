import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Play, X } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, clientName }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden flex flex-col md:flex-row"
          >
            {/* Left Side: Content */}
            <div className="flex-1 p-8 md:p-12 flex flex-col justify-center gap-6">
              <div className="flex items-center gap-3 text-primary font-black uppercase tracking-widest text-xs">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-ping"></span>
                Seja bem-vindo
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                Olá, <span className="text-primary">{clientName}!</span> 👋
              </h2>
              
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                Preparamos um guia rápido para você dominar todas as ferramentas do seu novo painel ITWF. 
              </p>

              <div className="space-y-4 my-4">
                {[
                  'Veja como renovar sua assinatura em segundos',
                  'Aprenda a fazer pedidos de novos conteúdos',
                  'Saiba como entrar em contato com o suporte'
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-medium">
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                    {text}
                  </div>
                ))}
              </div>

              <button
                onClick={onClose}
                className="w-full md:w-fit bg-primary hover:bg-primary/90 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4"
              >
                Começar agora <Play size={18} fill="currentColor" />
              </button>
            </div>

            {/* Right Side: Video Embed */}
            <div className="flex-1 bg-slate-50 dark:bg-black/20 p-4 md:p-8 flex items-center justify-center">
              <div className="w-full aspect-[9/16] rounded-[2rem] overflow-hidden shadow-2xl relative border-4 border-black/5 dark:border-white/5">
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

            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-slate-400"
            >
              <X size={24} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
