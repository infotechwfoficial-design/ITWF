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
        
        {/* Banner de Boas-vindas Mob / Perfil Compacto */}
        <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-xl shadow-black/5 border border-black/5 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Sparkles size={120} className="text-primary rotate-12" />
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
            {/* Avatar Section */}
            <div className="relative">
              <div className="size-24 md:size-32 rounded-[2rem] overflow-hidden ring-4 ring-primary/10 bg-slate-100 dark:bg-white/5 flex items-center justify-center group/avatar">
                {uploadingAvatar ? (
                  <RefreshCw className="animate-spin text-primary" size={32} />
                ) : client?.avatar_url ? (
                  <img src={client.avatar_url} alt="Profile" className="size-full object-cover" />
                ) : (
                  <User className="text-slate-400" size={48} />
                )}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-opacity rounded-[2rem]"
                >
                  <Camera className="text-white" size={24} />
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleAvatarUpload}
              />
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-lg ${status.dot} ${status.shadow}`}>
                {status.label}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4">
                {isEditingName ? (
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-white/5 p-1 px-3 rounded-2xl border border-primary/20">
                    <input
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="bg-transparent font-black text-2xl outline-none w-48 text-center md:text-left"
                      autoFocus
                    />
                    <button onClick={handleUpdateName} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-colors">
                      <Check size={20} />
                    </button>
                    <button onClick={() => setIsEditingName(false)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    Olá, {client?.name || 'Visitante'}
                    <button onClick={() => setIsEditingName(true)} className="p-2 text-slate-400 hover:text-primary transition-colors">
                      <Edit3 size={18} />
                    </button>
                  </h1>
                )}
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm md:text-base flex items-center justify-center md:justify-start gap-2">
                <Cloud size={18} className="text-primary" />
                {client ? `Conectado como @${client.username}` : 'Sua experiência premium ITWF começa aqui.'}
              </p>
            </div>

            <div className="flex gap-3">
               <button 
                onClick={signOut}
                className="p-4 rounded-3xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                title="Sair"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>
        </section>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-lg border border-black/5 dark:border-white/5 space-y-4">
            <div className="size-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
              <Timer size={28} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Expira em</p>
              <h3 className={`text-3xl font-black ${status.color}`}>{daysRemaining} dias</h3>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-lg border border-black/5 dark:border-white/5 space-y-4">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
              <Wallet size={28} />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Saldo Atual</p>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white">{formatCurrency(client?.balance || 0)}</h3>
            </div>
          </motion.div>

          <motion.div whileHover={{ y: -5 }} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-lg border border-black/5 dark:border-white/5 space-y-4 lg:col-span-2">
             <div className="flex justify-between items-start">
               <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
                <Zap size={28} />
              </div>
              <Link to="/plans" className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase hover:bg-primary hover:text-white transition-all">
                Renovar Agora
              </Link>
             </div>
             <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Assinatura</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white truncate">
                {client?.expiration_date ? `Vence em ${client.expiration_date}` : 'Consultando plano...'}
              </h3>
            </div>
          </motion.div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Notifications Column */}
          <div className="lg:col-span-1 space-y-6">
             <section className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-black/5 dark:border-white/5 h-fit">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                  <Bell size={20} className="text-primary" />
                  Avisos ITWF
                </h2>
                {notifications.length > 0 && (
                   <span className="size-6 bg-primary text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                    {notifications.length}
                  </span>
                )}
              </div>
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <Cloud size={40} className="mx-auto text-slate-200 dark:text-slate-800" />
                    <p className="text-sm text-slate-400 font-medium">Tudo tranquilo por enquanto.</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <motion.div 
                      key={notif.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-2 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-black text-primary uppercase tracking-widest">{notif.title}</span>
                         <span className="text-[10px] text-slate-400 font-medium">{new Date(notif.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                        "{notif.message}"
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </section>

             {/* Agenda Esportiva */}
             <section className="bg-gradient-to-br from-indigo-600 to-primary rounded-[2rem] p-6 shadow-xl shadow-primary/20 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                 <RefreshCw size={100} className="animate-spin-slow" />
              </div>
              
              <h2 className="text-lg font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                <LayoutDashboard size={20} />
                Jogos Hoje
              </h2>
              
              {loadingExtras ? (
                <div className="h-24 flex items-center justify-center">
                  <RefreshCw className="animate-spin" size={24} />
                </div>
              ) : sportsAgenda ? (
                <div className="space-y-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                  <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap">{sportsAgenda}</p>
                </div>
              ) : (
                <div className="text-center py-4 space-y-2">
                  <AlertTriangle className="mx-auto" size={24} />
                  <p className="text-xs font-bold uppercase">Agenda Indisponível</p>
                </div>
              )}
            </section>
          </div>

          {/* Requests Main Column */}
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl border border-black/5 dark:border-white/5 min-h-fit relative overflow-hidden">
               <div className="absolute -top-10 -right-10 size-40 bg-primary/5 rounded-full blur-3xl" />
               
               <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                    <MessageSquare size={24} className="text-primary" />
                    Meus Pedidos
                  </h2>
                  <p className="text-xs font-medium text-slate-400">Status dos seus pedidos de filmes e séries.</p>
                </div>
                <Link to="/request-content" className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all">
                  <Plus size={24} />
                </Link>
              </div>

              {loadingExtras ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <RefreshCw className="animate-spin text-primary" size={40} />
                   <span className="text-sm font-black text-slate-400 uppercase">Consultando seu histórico...</span>
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-black/5 dark:border-white/5 group">
                  <div className="size-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="text-slate-400" size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">Nenhum Pedido</h3>
                  <p className="text-sm text-slate-500 mb-6 font-medium">Você ainda não solicitou nenhum conteúdo.</p>
                  <Link to="/request-content" className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
                    Começar Agora
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
                <div className="mt-8 flex justify-center">
                  <Link to="/request-content" className="text-xs font-black text-slate-400 hover:text-primary transition-colors flex items-center gap-2 uppercase tracking-widest">
                    Ver todos os pedidos <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </section>

            {/* Quick Support / Links Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <motion.div whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] p-6 text-white shadow-xl shadow-black/10 flex items-center justify-between group">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-tighter">
                       <Zap size={14} fill="currentColor" /> Atendimento VIP
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tight">Suporte 24h</h4>
                    <Link to="/support" className="flex items-center gap-2 text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">
                      Falar com atendente <ArrowRight size={12} />
                    </Link>
                  </div>
                  <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                     <MessageSquare size={32} />
                  </div>
               </motion.div>

               <motion.div whileHover={{ scale: 1.02 }} className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-black/5 dark:border-white/5 flex items-center justify-between group">
                  <div className="space-y-2 text-slate-900 dark:text-white">
                     <div className="flex items-center gap-2 text-amber-500 font-black uppercase text-xs tracking-tighter">
                       <Star size={14} fill="currentColor" /> Aprenda Mais
                    </div>
                    <h4 className="text-xl font-black uppercase tracking-tight">Tutoriais</h4>
                    <Link to="/tutorials" className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-primary transition-colors">
                      Ver guias em vídeo <ArrowRight size={12} />
                    </Link>
                  </div>
                   <div className="size-16 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-amber-500/10 transition-colors">
                     <HelpCircle size={32} className="text-amber-500" />
                  </div>
               </motion.div>
            </div>
          </div>
        </div>

        {/* PWA/Support Banner */}
        {showPushBanner && (
           <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="bg-primary/10 border border-primary/20 rounded-[2rem] p-6 overflow-hidden relative"
          >
             <button onClick={() => setShowPushBanner(false)} className="absolute top-4 right-4 text-primary/50 hover:text-primary transition-colors">
               <X size={20} />
             </button>
             <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="size-16 rounded-2xl bg-primary text-white flex items-center justify-center shrink-0">
                  <Bell size={32} className="animate-swing" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="font-black text-primary uppercase text-lg">Mantenha-se informado!</h4>
                  <p className="text-sm text-primary/70 font-medium">Ative as notificações para receber avisos de manutenção, promoções e prazos de vencimento diretamente no seu aparelho.</p>
                </div>
                <button 
                  onClick={handleEnablePush}
                  className="px-8 py-3 bg-primary text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Ativar Notificações
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
