import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Calendar, Table, Info } from 'lucide-react';
import Layout from '../components/Layout';

const Sports = () => {
  const [activeTab, setActiveTab] = React.useState<'fixtures' | 'standings'>('fixtures');

  return (
    <Layout>
      <div className="flex flex-col gap-8 pb-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black/5 dark:border-white/5 pb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Trophy className="text-primary" size={32} />
              Arena Esportiva
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe rodadas, classificação e resultados ao vivo.</p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20 text-xs font-bold">
            <Info size={14} />
            Atualizado em Tempo Real
          </div>
        </header>

        {/* Categories / Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 p-1 overflow-hidden shadow-xl flex flex-col"
          >
            {/* TABS HEADERS */}
            <div className="flex p-2 gap-2 bg-black/5 dark:bg-white/5 rounded-t-[2.4rem] border-b border-black/5 dark:border-white/5">
              <button
                onClick={() => setActiveTab('fixtures')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all font-bold text-sm ${
                  activeTab === 'fixtures' 
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Calendar size={18} />
                Rodadas
              </button>
              <button
                onClick={() => setActiveTab('standings')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl transition-all font-bold text-sm ${
                  activeTab === 'standings' 
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Table size={18} />
                Classificação
              </button>
            </div>

            {/* API FUTEBOL WIDGET CONTAINER */}
            <div className="w-full h-[450px] md:h-[800px] overflow-hidden bg-white/5 bg-slate-50 dark:bg-slate-950/20">
              {activeTab === 'fixtures' ? (
                <iframe 
                  key="fixtures"
                  src="https://widget.api-futebol.com.br/render/widget_d86471d5fec5717c"
                  width="100%" 
                  height="100%" 
                  frameBorder="0"
                  title="API Futebol - Rodadas"
                  className="w-full h-full"
                  loading="lazy"
                  referrerPolicy="unsafe-url"
                  sandbox="allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
                ></iframe>
              ) : (
                <iframe 
                  key="standings"
                  src="https://widget.api-futebol.com.br/render/widget_b1cf3b2e31b67dd1"
                  width="100%" 
                  height="100%" 
                  frameBorder="0"
                  title="API Futebol - Classificação"
                  className="w-full h-full"
                  loading="lazy"
                  referrerPolicy="unsafe-url"
                  sandbox="allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
                ></iframe>
              )}
            </div>
          </motion.div>

          {/* Sidebar / Info */}
          <div className="flex flex-col gap-6">
             <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl bg-primary/10 border border-primary/20 p-6 flex flex-col gap-4"
            >
              <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center">
                <Calendar size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">Rodadas e Jogos</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Use o seletor ao lado para navegar entre as rodadas do seu campeonato favorito.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/5 p-6 flex flex-col gap-4 shadow-sm"
            >
              <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Table size={24} />
              </div>
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">Classificação</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Acompanhe a subida do seu time na tabela em tempo real.</p>
              </div>
            </motion.div>
            
            <div className="mt-auto p-6 rounded-3xl bg-black/5 dark:bg-white/5 italic text-xs text-slate-400 text-center">
              Dados fornecidos por api-futebol.com.br
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Sports;
