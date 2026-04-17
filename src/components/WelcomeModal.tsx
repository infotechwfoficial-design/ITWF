import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, X, Sparkles, PlayCircle } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, clientName }) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isVideoFinished, setIsVideoFinished] = React.useState(false);
  const playerRef = React.useRef<any>(null);

  const steps = [
    { title: 'Veja como renovar sua assinatura em segundos' },
    { title: 'Aprenda a fazer pedidos de novos conteúdos' },
    { title: 'Saiba como entrar em contato com o suporte' }
  ];

  // Logic for the text steps timer
  React.useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsVideoFinished(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 8000); 

    return () => clearInterval(interval);
  }, [isOpen, steps.length]);

  // YouTube API Integration
  React.useEffect(() => {
    if (!isOpen) return;

    const initPlayer = () => {
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: 'MbwzRQr5-iA',
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          controls: 1,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === 0) { // ENDED
              setIsVideoFinished(true);
            }
          }
        }
      });
    };

    if (!window.YT || !window.YT.Player) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-[95%] max-w-6xl h-auto max-h-[90vh] bg-white dark:bg-[#0B1120] rounded-[2.5rem] md:rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden flex flex-col md:flex-row"
          >
            <div className="md:flex-[0.8] relative flex flex-col h-full border-b md:border-b-0 md:border-r border-white/5 overflow-y-auto custom-scrollbar">
              <div className="absolute -top-12 -left-12 size-48 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>
              
              <div className="relative p-6 sm:p-8 md:p-12 flex flex-col gap-6 md:gap-10">
                <div className="flex items-center gap-3">
                  <div className="size-8 md:size-12 rounded-xl md:rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group">
                    <Sparkles size={16} className="md:size-6 group-hover:rotate-12 transition-transform" />
                  </div>
                  <span className="text-primary font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-[8px] md:text-[11px]">Seja Muito Bem-Vindo</span>
                </div>
                
                <div className="space-y-2 md:space-y-4">
                  <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white leading-[1.1] tracking-tight">
                    Olá, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-400 to-primary animate-gradient-x">
                      {clientName || 'Campeão'}!
                    </span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base md:text-lg font-medium leading-relaxed max-w-sm">
                    Preparamos um guia interativo para seu novo painel ITWF.
                  </p>
                </div>

                <div className="grid gap-3 md:gap-4 py-2">
                  {steps.map((item, i) => {
                    const isActive = i === currentStep;
                    const isCompleted = i < currentStep;
                    return (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                          scale: isActive ? 1.05 : 1,
                        }}
                        className={`flex gap-3 md:gap-5 p-3 md:p-4 rounded-2xl border transition-all cursor-default group ${
                          isActive 
                            ? 'border-primary/30 shadow-lg shadow-primary/5 bg-primary/5' 
                            : 'bg-slate-50 dark:bg-white/[0.03] border-black/[0.04] dark:border-white/[0.06]'
                        }`}
                      >
                        <div className={`size-6 md:size-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ring-4 md:ring-8 transition-colors ${
                          isCompleted 
                            ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/5' 
                            : isActive 
                              ? 'bg-primary text-white ring-primary/20 animate-pulse' 
                              : 'bg-slate-200 dark:bg-white/10 text-slate-400 dark:text-white/20 ring-transparent'
                        }`}>
                          {isCompleted ? <CheckCircle2 size={12} className="md:size-5" /> : <PlayCircle size={12} className="md:size-5" />}
                        </div>
                        <p className={`font-bold text-xs sm:text-sm md:text-base leading-tight uppercase tracking-tight transition-colors ${
                          isActive ? 'text-primary' : isCompleted ? 'text-emerald-500/80' : 'text-slate-900 dark:text-white'
                        }`}>
                          {item.title}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  {isVideoFinished ? (
                    <button
                      onClick={onClose}
                      className="w-full bg-primary hover:bg-primary/90 text-white px-4 md:px-8 py-4 md:py-6 rounded-xl md:rounded-[1.5rem] font-black uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-sm shadow-[0_15px_40px_-10px_rgba(var(--primary-rgb),0.5)] transition-all active:scale-[0.97] flex items-center justify-center gap-2 md:gap-3 relative overflow-hidden group animate-pulse-subtle"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        ENTRAR NO PAINEL <span className="text-xs">▶</span>
                      </span>
                    </button>
                  ) : (
                    <div className="w-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 text-slate-400 dark:text-slate-500 px-4 md:px-8 py-4 md:py-6 rounded-xl md:rounded-[1.5rem] font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-sm flex items-center justify-center gap-2 md:gap-3 cursor-not-allowed">
                      <PlayCircle size={18} className="animate-pulse" />
                      Assista ao vídeo para entrar
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="md:flex-[1.2] bg-slate-100 dark:bg-[#070B14] p-4 sm:p-6 md:p-12 flex items-center justify-center relative min-h-[400px] md:min-h-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-32 md:size-64 bg-primary/20 rounded-full blur-[60px] md:blur-[100px]"></div>
              <div className="w-full max-w-[400px] mx-auto z-10 transition-transform hover:scale-[1.02] duration-500">
                <div className="relative w-full shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden rounded-[2rem] border-2 md:border-4 border-slate-900 dark:border-slate-800 bg-black aspect-[9/16]">
                  <div id="youtube-player" className="absolute inset-0 w-full h-full" />
                </div>
                <div className="mt-4 text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    TUTORIAL ITWF RENOVAÇÕES (VIA YOUTUBE)
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeModal;
