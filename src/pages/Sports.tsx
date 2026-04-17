import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Calendar, Table, Info, Zap, RefreshCw } from 'lucide-react';
import { supabase } from '../utils/supabase';
import Layout from '../components/Layout';

const Sports = () => {
  const [activeTab, setActiveTab] = React.useState<'fixtures' | 'standings'>('fixtures');
  const [agenda, setAgenda] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAgenda = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('message')
          .eq('title', '⚽ Agenda Esportiva')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (data) setAgenda(data.message);
      } catch (err) {
        console.error('Erro ao buscar agenda na Arena:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgenda();
  }, []);

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
            <p className="text-slate-500 dark:text-slate-400 mt-1">Acompanhe rodadas, tabela e a agenda oficial do dia.</p>
          </div>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-500/20 text-xs font-bold">
            <Info size={14} />
            Atualizado em Tempo Real
          </div>
        </header>

        {/* Categories / Stats Grid */}
        {/* Categories / Stats Grid - Agora ocupando largura total */}
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2.5rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 p-1 overflow-hidden shadow-xl flex flex-col"
          >
            {/* TABS HEADERS */}
            <div className="flex p-2 gap-2 bg-black/5 dark:bg-white/5 rounded-t-[2.4rem] border-b border-black/5 dark:border-white/5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setActiveTab('fixtures')}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-2xl transition-all font-bold text-sm ${
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
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 rounded-2xl transition-all font-bold text-sm ${
                  activeTab === 'standings' 
                  ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' 
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Table size={18} />
                TABELA
              </button>
            </div>

            {/* CONTENT CONTAINER */}
            <div className="w-full h-[600px] md:h-[800px] overflow-hidden bg-white/5 bg-slate-50 dark:bg-slate-950/20">
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
                  title="API Futebol - TABELA"
                  className="w-full h-full"
                  loading="lazy"
                  referrerPolicy="unsafe-url"
                  sandbox="allow-scripts allow-forms allow-popups allow-top-navigation-by-user-activation allow-popups-to-escape-sandbox"
                ></iframe>
              )}
            </div>
          </motion.div>
          
          <div className="mt-6 p-6 rounded-3xl bg-black/5 dark:bg-white/5 italic text-[10px] text-slate-400 text-center">
            Dados da agenda gerados por IA. Rodadas e Tabela fornecidos por api-futebol.com.br
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Sports;
