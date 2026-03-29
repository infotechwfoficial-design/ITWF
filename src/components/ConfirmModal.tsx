import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Trash2, Info, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info' | 'warning';
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'info',
  loading = false
}) => {
  // Cores dinâmicas baseadas no tipo
  const getTypeConfig = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 size={24} />,
          iconBg: 'bg-rose-500/10 text-rose-500',
          buttonBg: 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/20',
          accentColor: 'text-rose-500'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} />,
          iconBg: 'bg-amber-500/10 text-amber-500',
          buttonBg: 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/20',
          accentColor: 'text-amber-500'
        };
      default:
        return {
          icon: <Info size={24} />,
          iconBg: 'bg-primary/10 text-primary',
          buttonBg: 'bg-primary hover:bg-primary/90 shadow-primary/20',
          accentColor: 'text-primary'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!loading ? onClose : undefined}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-white dark:bg-[#0B1120] rounded-[2rem] shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden"
          >
            {/* Header com Ícone */}
            <div className="p-8 pb-0">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${config.iconBg}`}>
                  {config.icon}
                </div>
                <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                  {title}
                </h3>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="p-8">
              <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {message}
              </p>
            </div>

            {/* Rodapé com Botões */}
            <div className="p-8 pt-0 flex flex-col sm:flex-row gap-3">
              <button
                disabled={loading}
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-95 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                disabled={loading}
                onClick={onConfirm}
                className={`flex-[1.5] px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${config.buttonBg}`}
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="size-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  confirmText
                )}
              </button>
            </div>

            {/* Fechar Flutuante */}
            {!loading && (
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                title="Fechar"
              >
                <X size={20} />
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
