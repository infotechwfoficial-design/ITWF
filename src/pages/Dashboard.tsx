import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  Timer,
  Wallet,
  RefreshCw,
  Cloud,
  Zap,
  Clock,
  MessageSquare,
  ExternalLink,
  AlertTriangle,
  Camera,
  Edit3,
  Check,
  X,
  User,
  LogOut,
  ChevronRight,
  Settings as SettingsIcon,
  CreditCard,
  LayoutDashboard,
  HelpCircle,
  Plus,
  ArrowRight,
  Star,
  TrendingUp,
  Calendar,
  Menu,
  Sparkles,
  LogIn,
  ChevronLeft,
  Tv,
  Gamepad2,
  Info,
  Send,
  Instagram,
  Search
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Client, Notification as NotificationType, isClient } from '../types';
import { subscribeUserToPush } from '../utils/push';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import WelcomeModal from '../components/WelcomeModal';
import { formatCurrency } from '../utils/format';

// Calcula dias restantes a partir de uma data no formato DD/MM/AAAA
function getDaysRemaining(expirationDate: string): number {
  if (!expirationDate) return 0;
  const parts = expirationDate.split('/');
  if (parts.length !== 3) return 0;
  const [day, month, year] = parts;
  const expDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = expDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getSubscriptionStatus(daysRemaining: number) {
  if (daysRemaining < 0) return { label: 'Vencida', color: 'text-rose-500', dot: 'bg-rose-500', shadow: 'shadow-[0_0_10px_rgba(239,68,68,0.6)]' };
  if (daysRemaining <= 3) return { label: 'Crítica', color: 'text-orange-500', dot: 'bg-orange-500', shadow: 'shadow-[0_0_10px_rgba(249,115,22,0.6)]' };
  if (daysRemaining <= 7) return { label: 'Expirando', color: 'text-yellow-500', dot: 'bg-yellow-400', shadow: 'shadow-[0_0_10px_rgba(234,179,8,0.6)]' };
  return { label: 'Ativa', color: 'text-green-500', dot: 'bg-green-500', shadow: 'shadow-[0_0_10px_rgba(34,197,94,0.6)]' };
}

const RequestCard = React.memo(({ req }: { req: any }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-white dark:bg-slate-900/40 border border-black/5 dark:border-white/10 p-5 rounded-3xl shadow-sm"
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <h4 className="font-bold text-lg truncate max-w-[180px]">{req.content_title}</h4>
        <p className="text-xs text-slate-500">{req.content_type} • {req.content_year}</p>
      </div>
      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${req.status === 'PEDIDO ADICIONADO' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
        req.status === 'NÃO DISPONÍVEL PARA ADIÇÃO' ? 'bg-rose-500/10 text-rose-500' :
          req.status === 'EM BUSCA DO SEU PEDIDO' ? 'bg-amber-500/10 text-amber-500' :
            'bg-primary/10 text-primary'
        }`}>
        {req.status === 'NÃO DISPONÍVEL PARA ADIÇÃO' ? 'NÃO DISPONÍVEL' : req.status}
      </span>
    </div>
    <div className="flex items-center justify-between pt-4 border-t border-black/5 dark:border-white/5">
      <div className="flex items-center gap-2 text-slate-400">
        <Clock size={14} />
        <span className="text-[10px] font-medium">
          {new Date(req.created_at).toLocaleDateString()}
        </span>
      </div>
      <a
        href={req.tmdb_link}
        target="_blank"
        rel="noreferrer"
        className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
      >
        Ver no TMDB <ExternalLink size={10} />
      </a>
    </div>
  </motion.div>
));

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile: contextProfile, signOut, refreshProfile } = useAuth();
  
  const [client, setClient] = useState<Client | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [sportsAgenda, setSportsAgenda] = useState<string | null>(null);
  
  // Quick Edit States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toastConfig, setToastConfig] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToastConfig({ message, type });
  }, []);

  // Sicroniza o perfil do contexto com o estado local do Dashboard
  useEffect(() => {
    if (contextProfile) {
      if (!isClient(contextProfile)) {
        // Segurança extra: Se for Admin tentando acessar Dashboard, manda pro lugar certo
        navigate('/admin');
        return;
      }

      setClient(contextProfile);
      setNewName(contextProfile.name || '');
      setLoading(false);
      
      // Notificações Push - Checagem inicial
      if ('Notification' in window && Notification.permission === 'default') {
        setShowPushBanner(true);
      } else if ('Notification' in window && Notification.permission === 'granted') {
        subscribeUserToPush(contextProfile.email, contextProfile.username, contextProfile.admin_id);
      }

      // Onboarding
      if (!contextProfile.onboarding_completed) {
        setShowWelcomeModal(true);
      } else {
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        const pwaTutorialSeen = localStorage.getItem('pwa_tutorial_seen') === 'true';
        if (isStandalone && !pwaTutorialSeen) setShowWelcomeModal(true);
      }
    } else {
      // Se não houver perfil após o loading do contexto, liberamos a tela (será mostrada como visitante)
      setLoading(false);
    }
  }, [contextProfile, navigate]);

  // Carrega dados secundários e realtime
  useEffect(() => {
    if (!contextProfile) return;

    let channel: any;

    const fetchSecondaryData = async () => {
      setLoadingExtras(true);
      try {
        // Pedidos
        const { data: reqs } = await supabase
          .from('requests')
          .select('*')
          .eq('user_id', contextProfile.user_id)
          .order('created_at', { ascending: false })
          .limit(6);
        if (reqs) setRequests(reqs);

        // Notificações
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .or(`client_id.eq.${contextProfile.id},is_global.eq.true`)
          .order('created_at', { ascending: false })
          .limit(10);
        if (notifs) setNotifications(notifs);

        // Agenda Esportiva
        const { data: agenda } = await supabase
          .from('notifications')
          .select('message')
          .eq('title', '⚽ Agenda Esportiva')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (agenda) setSportsAgenda(agenda.message);

        // Realtime Subscription
        channel = supabase
          .channel(`dashboard_realtime_${contextProfile.user_id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'notifications' },
            (payload) => {
              const newNotif = payload.new as any;
              if (newNotif.client_id === contextProfile.id || newNotif.is_global) {
                if (payload.eventType === 'INSERT') {
                   setNotifications(prev => [newNotif as NotificationType, ...prev].slice(0, 10));
                }
              }
            }
          )
          .subscribe();

      } catch (err) {
        console.error('Dashboard: Erro ao carregar extras:', err);
      } finally {
        setLoadingExtras(false);
      }
    };

    fetchSecondaryData();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [contextProfile]);

  const handleUpdateName = async () => {
    if (!client || !newName.trim()) return;
    try {
      const { error } = await supabase
        .from('clients')
        .update({ name: newName.trim() })
        .eq('user_id', client.user_id);

      if (error) throw error;
      await refreshProfile();
      setClient({ ...client, name: newName.trim() });
      setIsEditingName(false);
      showToast('Nome atualizado com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao atualizar nome: ' + err.message, 'error');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${client.user_id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('clients')
        .update({ avatar_url: publicUrl })
        .eq('user_id', client.user_id);

      if (updateError) throw updateError;
      await refreshProfile();
      setClient({ ...client, avatar_url: publicUrl });
      showToast('Foto de perfil atualizada!', 'success');
    } catch (err: any) {
      showToast('Erro ao subir foto: ' + err.message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleEnablePush = async () => {
    if (!client) return;
    try {
      await subscribeUserToPush(client.email, client.username, client.admin_id);
      setShowPushBanner(false);
      showToast('Notificações ativadas!', 'success');
    } catch (err) {
      showToast('Erro ao ativar notificações', 'error');
    }
  };

  const handleCloseWelcome = async () => {
    setShowWelcomeModal(false);
    localStorage.setItem('pwa_tutorial_seen', 'true');

    if (!client || client.onboarding_completed) return;
    
    try {
      await supabase
        .from('clients')
        .update({ onboarding_completed: true })
        .eq('user_id', client.user_id);
      
      await refreshProfile();
      setClient({ ...client, onboarding_completed: true });
    } catch (err) {
      console.warn('Erro ao salvar status de onboarding:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-6">
        <RefreshCw className="animate-spin text-primary" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Sincronizando seu painel...</p>
      </div>
    );
  }

  const daysRemaining = client ? getDaysRemaining(client.expiration_date) : 0;
  const status = getSubscriptionStatus(daysRemaining);

  return (
    <Layout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        
        {/* NOVO CABEÇALHO UNIFICADO E COMPACTO (Sugestão 1) */}
        <section className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-xl border border-black/5 dark:border-white/5 overflow-hidden transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />
          
          <div className="flex flex-col lg:flex-row items-center gap-6 relative z-10">
            {/* Perfil Compacto */}
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="relative group/avatar shrink-0">
                <div className="size-16 rounded-2xl overflow-hidden ring-2 ring-primary/10 bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                  {uploadingAvatar ? (
                    <RefreshCw className="animate-spin text-primary" size={20} />
                  ) : client?.avatar_url ? (
                    <img src={client.avatar_url} alt="Profile" className="size-full object-cover" />
                  ) : (
                    <User className="text-slate-400" size={24} />
                  )}
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity rounded-2xl"
                  >
                    <Camera className="text-white" size={16} />
                  </button>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase truncate">
                    {client?.name || 'Visitante'}
                  </h1>
                  <button onClick={() => setIsEditingName(true)} className="text-slate-400 hover:text-primary transition-colors">
                    <Edit3 size={14} />
                  </button>
                </div>
                <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1 uppercase tracking-tight">
                  <Cloud size={12} className="text-primary" />
                  @{client?.username || 'itwf.user'}
                </p>
              </div>
            </div>

            {/* Status Rápido Unificado */}
            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-3 w-full lg:w-auto">
              <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Timer size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Expira em</p>
                  <p className={`text-sm font-black ${status.color}`}>{daysRemaining} dias</p>
                </div>
              </div>

              <div className="px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 flex items-center gap-3">
                <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Wallet size={18} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Valor do Plano</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{formatCurrency(client?.balance || 0)}</p>
                </div>
              </div>

              <button 
                onClick={() => {
                  if (client?.renewal_link && client.renewal_link.trim() !== '') {
                    window.open(client.renewal_link, '_blank');
                  } else {
                    navigate('/plans');
                  }
                }}
                className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-center"
              >
                Renovar
              </button>
            </div>
          </div>
        </section>

        {/* Banner de Aviso Dinâmico (Letreiro) */}
        {notifications.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-primary/5 border border-primary/10 rounded-2xl p-2 px-4 flex items-center gap-4 overflow-hidden"
          >
            <div className="flex items-center gap-2 text-primary shrink-0 font-black text-[10px] uppercase tracking-tighter">
              <Bell size={14} className="animate-bounce" /> Informativo:
            </div>
            <div className="flex-1 overflow-hidden relative h-5">
              <div className="absolute whitespace-nowrap animate-marquee flex items-center gap-8">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {notifications[0].title}: {notifications[0].message}
                </span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  {notifications[0].title}: {notifications[0].message}
                </span>
              </div>
            </div>
          </motion.div>
        )}


        {/* Main Content Area */}
        {/* Área de Conteúdo Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Coluna Lateral: Agenda Esportiva (Mais estreita e compacta) */}
          <div className="lg:col-span-1 space-y-6">
             <section className="bg-gradient-to-br from-indigo-600 to-primary rounded-[2rem] p-5 shadow-xl shadow-primary/20 text-white relative overflow-hidden group h-full max-h-[500px]">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                 <RefreshCw size={80} className="animate-spin-slow" />
              </div>
              
              <h2 className="text-sm font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <LayoutDashboard size={18} />
                Jogos Hoje
              </h2>
              
              {loadingExtras ? (
                <div className="h-24 flex items-center justify-center">
                  <RefreshCw className="animate-spin" size={24} />
                </div>
              ) : sportsAgenda ? (
                <div className="space-y-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 h-[calc(100%-4rem)] overflow-y-auto custom-scrollbar">
                  <p className="text-[11px] font-bold leading-relaxed whitespace-pre-wrap">{sportsAgenda}</p>
                </div>
              ) : (
                <div className="text-center py-8 space-y-2">
                  <AlertTriangle className="mx-auto text-white/50" size={24} />
                  <p className="text-[10px] font-black uppercase">Sem Jogos no Momento</p>
                </div>
              )}
            </section>
          </div>

          {/* Coluna Principal: Meus Pedidos (Expandida para ocupar o resto) */}
          <div className="lg:col-span-3 space-y-6">
            <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-black/5 dark:border-white/5 min-h-fit relative overflow-hidden h-full">
               <div className="absolute -top-10 -right-10 size-40 bg-primary/5 rounded-full blur-3xl" />
               
               <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <MessageSquare size={20} className="text-primary" />
                    Meus Pedidos
                  </h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status dos seus conteúdos solicitados.</p>
                </div>
                <Link to="/request-content" className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                  <Plus size={20} />
                </Link>
              </div>

              {loadingExtras ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <RefreshCw className="animate-spin text-primary" size={32} />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando pedidos...</span>
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-slate-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-black/5 dark:border-white/5 group">
                  <div className="size-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="text-slate-400" size={24} />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">Nenhum Pedido</h3>
                  <p className="text-xs text-slate-500 mb-6 font-medium">Você ainda não solicitou nenhum conteúdo.</p>
                  <Link to="/request-content" className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                    Novo Pedido
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {requests.map(req => (
                    <RequestCard key={req.id} req={req} />
                  ))}
                </div>
              )}
              
              {requests.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <Link to="/request-content" className="text-[10px] font-black text-slate-400 hover:text-primary transition-colors flex items-center gap-2 uppercase tracking-widest leading-none">
                    Ver todos os pedidos <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Links de Acesso Rápido / Suporte (Fila única compacta) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div whileHover={{ scale: 1.01 }} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-5 text-white shadow-xl shadow-black/10 flex items-center justify-between group">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-tighter">
                    <Zap size={12} fill="currentColor" /> Atendimento VIP
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight">Suporte 24h</h4>
                <Link to="/support" className="flex items-center gap-2 text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">
                  Falar com atendente <ArrowRight size={10} />
                </Link>
              </div>
              <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <MessageSquare size={24} />
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.01 }} className="bg-white dark:bg-slate-900 rounded-[2rem] p-5 shadow-xl border border-black/5 dark:border-white/5 flex items-center justify-between group">
              <div className="space-y-2 text-slate-900 dark:text-white">
                  <div className="flex items-center gap-2 text-amber-500 font-black uppercase text-[10px] tracking-tighter">
                    <Star size={12} fill="currentColor" /> Aprenda Mais
                </div>
                <h4 className="text-lg font-black uppercase tracking-tight">Tutoriais</h4>
                <Link to="/tutorials" className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors">
                  Ver guias em vídeo <ArrowRight size={10} />
                </Link>
              </div>
                <div className="size-14 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                  <HelpCircle size={24} className="text-amber-500" />
              </div>
            </motion.div>
        </div>

        {/* PWA/Support Banner (Mais minimalista) */}
        {showPushBanner && (
           <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-primary/5 border border-primary/10 rounded-[2rem] p-5 overflow-hidden relative"
          >
             <button onClick={() => setShowPushBanner(false)} className="absolute top-4 right-4 text-primary/30 hover:text-primary">
               <X size={16} />
             </button>
             <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="size-12 rounded-xl bg-primary text-white flex items-center justify-center shrink-0">
                  <Bell size={20} className="animate-swing" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-black text-primary uppercase text-sm">Notificações Ativas</h4>
                  <p className="text-xs text-primary/70 font-medium">Receba avisos de manutenção e prazos diretamente no seu aparelho.</p>
                </div>
                <button 
                  onClick={handleEnablePush}
                  className="px-6 py-2 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Ativar
                </button>
             </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {toastConfig && (
          <Toast
            message={toastConfig.message}
            type={toastConfig.type}
            onClose={() => setToastConfig(null)}
          />
        )}
      </AnimatePresence>

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcome}
        clientName={client?.name || ''}
      />
    </Layout>
  );
}
