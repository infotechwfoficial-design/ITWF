import { motion } from 'motion/react';
import { CheckCircle, ArrowLeft, Download, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Success() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center py-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[600px] bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden p-8 sm:p-12"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="size-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <CheckCircle className="text-emerald-500 size-16" />
            </div>
            <h1 className="text-3xl font-bold mb-3 text-slate-900 dark:text-white">Pagamento Confirmado!</h1>
            <p className="text-slate-500 dark:text-slate-400 text-base max-w-[400px]">Sua assinatura foi renovada com sucesso. Você já pode continuar aproveitando todos os benefícios.</p>
          </div>

          <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl p-6 mb-10 border border-black/5 dark:border-white/5">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 border-b border-black/5 dark:border-white/5 pb-2">Detalhes da Transação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex flex-col gap-1">
                <p className="text-slate-500 text-sm">Plano:</p>
                <p className="font-medium text-base flex items-center gap-2 text-slate-900 dark:text-white">
                  <Star className="text-primary size-4" />
                  Premium - Anual
                </p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-slate-500 text-sm">Valor:</p>
                <p className="font-medium text-base text-slate-900 dark:text-white">R$ 59,90</p>
              </div>
              <div className="flex flex-col gap-1 sm:col-span-2 pt-2 sm:pt-0 sm:border-t-0 border-t border-black/5 dark:border-white/5">
                <p className="text-slate-500 text-sm">Nova Data de Expiração:</p>
                <p className="font-medium text-base text-primary">15/10/2025</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-primary hover:bg-primary/90 text-white text-base font-bold transition-all shadow-lg shadow-primary/30 w-full sm:w-auto flex-1"
            >
              <ArrowLeft size={18} />
              VOLTAR AO PAINEL
            </button>
            <button className="flex items-center justify-center gap-2 rounded-lg h-12 px-6 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white text-base font-bold transition-all w-full sm:w-auto flex-1">
              <Download size={18} />
              COMPROVANTE
            </button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
