import { motion } from 'motion/react';
import { Settings, AlertTriangle, RefreshCw, Clock, ShieldCheck } from 'lucide-react';

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[120px] animate-pulse"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-lg bg-white dark:bg-slate-900/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-10 text-center shadow-2xl"
      >
        <div className="flex justify-center mb-8 relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="text-primary opacity-20 absolute inset-0 flex items-center justify-center"
          >
            <Settings size={120} />
          </motion.div>
          <div className="size-24 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10 relative z-10">
            <AlertTriangle className="text-amber-500 size-12" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Sistema em Manutenção</h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed">Estamos realizando melhorias técnicas para oferecer uma experiência ainda melhor. Voltaremos em breve!</p>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
            <Clock className="text-primary" size={24} />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Previsão</span>
            <span className="text-slate-900 dark:text-white font-bold">15:00 (Brasília)</span>
          </div>
          <div className="bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2">
            <RefreshCw className="text-emerald-500" size={24} />
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</span>
            <span className="text-slate-900 dark:text-white font-bold">85% Concluído</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '85%' }}
              transition={{ duration: 2, ease: "easeOut" }}
              className="bg-primary h-full rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            ></motion.div>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Atualizando banco de dados e protocolos de segurança...</p>
        </div>

        <div className="mt-12 pt-8 border-t border-black/5 dark:border-white/5 flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-sm">
          <ShieldCheck size={16} className="text-primary" />
          <span>InfoTech WF - Suporte Técnico</span>
        </div>
      </motion.div>
    </div>
  );
}
