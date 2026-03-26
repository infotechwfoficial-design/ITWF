import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'warning';
    onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.95 }}
                className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border max-w-sm ${
                    type === 'success'
                        ? 'bg-emerald-500 border-emerald-400 text-white'
                        : type === 'warning'
                            ? 'bg-amber-500 border-amber-400 text-white'
                            : 'bg-rose-500 border-rose-400 text-white'
                    }`}
            >
                {type === 'success' ? <CheckCircle size={20} /> : type === 'warning' ? <AlertCircle size={20} /> : <XCircle size={20} />}
                <p className="text-sm font-semibold flex-1">{message}</p>
                <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                    <X size={16} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
