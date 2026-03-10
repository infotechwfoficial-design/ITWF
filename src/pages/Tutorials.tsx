import { motion } from 'motion/react';
import { 
  Play, 
  Clock, 
  Search, 
  ChevronRight, 
  BookOpen,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function Tutorials() {
  const navigate = useNavigate();

  const videos = [
    { id: 1, title: 'Primeiros Passos no Painel ITWF', duration: '5:24', thumb: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80', category: 'Iniciante' },
    { id: 2, title: 'Como Renovar sua Assinatura via PIX', duration: '3:15', thumb: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&q=80', category: 'Financeiro' },
    { id: 3, title: 'Configurando Alertas de Expiração', duration: '4:40', thumb: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80', category: 'Configurações' },
    { id: 4, title: 'Segurança: Ativando 2FA na sua Conta', duration: '6:10', thumb: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80', category: 'Segurança' },
    { id: 5, title: 'Gerenciando Múltiplos Dispositivos', duration: '7:30', thumb: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80', category: 'Avançado' },
    { id: 6, title: 'Entendendo seu Histórico de Faturas', duration: '4:15', thumb: 'https://images.unsplash.com/photo-1454165833767-027ff33027ef?auto=format&fit=crop&q=80', category: 'Financeiro' },
  ];

  return (
    <Layout>
      <div className="max-w-6xl mx-auto flex flex-col gap-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Tutoriais em Vídeo</h1>
            <p className="text-slate-500 dark:text-slate-400">Aprenda a dominar todas as ferramentas do sistema ITWF.</p>
          </div>
          <div className="w-full md:w-80 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-500" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar tutorial..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-black/10 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Categorias</h3>
              <nav className="flex flex-col gap-1">
                <button className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                  Todos os Vídeos
                  <ChevronRight size={14} />
                </button>
                <button className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">
                  Iniciante
                  <ChevronRight size={14} />
                </button>
                <button className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">
                  Financeiro
                  <ChevronRight size={14} />
                </button>
                <button className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium">
                  Segurança
                  <ChevronRight size={14} />
                </button>
              </nav>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 border border-black/5 dark:border-white/10 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="size-10 rounded-lg bg-white/50 dark:bg-white/10 flex items-center justify-center text-primary dark:text-white shadow-sm">
                <BookOpen size={20} />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">Documentação Completa</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">Prefere ler? Acesse nosso manual técnico detalhado com todas as funções.</p>
              <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Acessar Manual</button>
            </div>
          </div>

          <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {videos.map((video) => (
              <motion.div 
                key={video.id}
                whileHover={{ y: -5 }}
                className="bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden group cursor-pointer shadow-sm dark:shadow-xl"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img 
                    src={video.thumb} 
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="size-14 rounded-full bg-primary flex items-center justify-center text-white shadow-xl shadow-primary/40">
                      <Play size={24} fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-md rounded text-[10px] font-bold text-white flex items-center gap-1">
                    <Clock size={10} />
                    {video.duration}
                  </div>
                  <div className="absolute top-3 left-3 px-2 py-1 bg-primary/80 backdrop-blur-md rounded text-[10px] font-black text-white uppercase tracking-widest">
                    {video.category}
                  </div>
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">{video.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star size={12} fill="currentColor" />
                      <span className="text-xs font-bold">4.9</span>
                    </div>
                    <span className="text-xs text-slate-500">1.2k visualizações</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
