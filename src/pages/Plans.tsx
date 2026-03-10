import { motion } from 'motion/react';
import {
  Check,
  Zap,
  Star,
  Crown,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import React, { useState, useEffect } from 'react';
import { Plan } from '../types';

export default function Plans() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    fetch(`${apiUrl}/api/plans`)
      .then(res => res.json())
      .then(data => setPlans(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex flex-col gap-12">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Escolha o Plano Ideal para Você</h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">Potencialize sua experiência com recursos exclusivos e suporte dedicado.</p>

          <div className="flex items-center justify-center gap-4 mt-8">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Mensal</span>
            <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 size-4 bg-white rounded-full shadow-md"></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Anual</span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-500/20">Economize 20%</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => {
            const isPopular = i === 1; // Highlight the middle plan
            const planFeatures = plan.features ? JSON.parse(plan.features) : [];
            const Icons = [<Zap className="text-blue-500" key="1" />, <Star className="text-amber-500" key="2" />, <Crown className="text-purple-500" key="3" />];
            const PlanIcon = Icons[i % Icons.length];

            return (
              <motion.div
                key={plan.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-slate-50 dark:bg-slate-900/40 backdrop-blur-xl border ${isPopular ? 'border-primary shadow-[0_0_40px_rgba(59,130,246,0.1)]' : 'border-black/5 dark:border-white/10'} rounded-3xl p-8 flex flex-col h-full`}
              >
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-primary/30">
                    Mais Popular
                  </div>
                )}

                <div className="flex items-center gap-3 mb-6">
                  <div className={`size-12 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center`}>
                    {PlanIcon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">R$</span>
                    <span className="text-5xl font-black text-slate-900 dark:text-white">{Number(plan.price).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1">{plan.duration}</p>
                </div>

                <div className="space-y-4 mb-10 flex-1 mt-4">
                  {planFeatures.map((feature: string, j: number) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="size-5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center shrink-0">
                        <Check size={12} />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => navigate('/checkout', { state: { plan } })}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 ${isPopular
                    ? 'bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-900 dark:text-white border border-black/5 dark:border-white/10'
                    }`}
                >
                  Assinar Agora
                </button>
              </motion.div>
            );
          })}
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-3xl p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Precisa de um plano personalizado?</h3>
            <p className="text-slate-500 dark:text-slate-400">Para grandes volumes ou necessidades específicas, fale com nosso time comercial.</p>
          </div>
          <button className="flex items-center gap-2 text-primary font-bold hover:underline group">
            Falar com Consultor
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </Layout>
  );
}
