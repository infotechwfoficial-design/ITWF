import React, { useState, useEffect } from 'react';
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
  User
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Client } from '../types';
import { subscribeUserToPush } from '../utils/push';
import { supabase } from '../utils/supabase';
import Toast from '../components/Toast';
import WelcomeModal from '../components/WelcomeModal';

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
        req.status === 'NÃO DISPONIVEL PARA ADIÇÃO' ? 'bg-rose-500/10 text-rose-500' :
          req.status === 'EM BUSCA DO SEU PEDIDO' ? 'bg-amber-500/10 text-amber-500' :
            'bg-primary/10 text-primary'
        }`}>
        {req.status}
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
  const [client, setClient] = useState<Client | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportsAgenda, setSportsAgenda] = useState<string | null>(null);
  
  // Quick Edit States
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toastConfig, setToastConfig] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPushBanner, setShowPushBanner] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastConfig({ message, type });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch Client Data
        const { data: clientData } = await supabase
          .from('clients')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (clientData) {
          setClient(clientData);
          
          // Verifica se precisa mostrar o banner de notificações
          if ('Notification' in window && Notification.permission === 'default') {
            setShowPushBanner(true);
          } else if ('Notification' in window && Notification.permission === 'granted') {
            subscribeUserToPush(clientData.email, clientData.username, clientData.admin_id);
          }

          // Verifica Onboarding
          if (!clientData.onboarding_completed) {
            setShowWelcomeModal(true);
          }
        }

        // Fetch Requests
        const { data: userRequests } = await supabase
          .from('requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (userRequests) setRequests(userRequests);

        // Fetch Latest Sports Agenda
        const { data: agendaData } = await supabase
          .from('notifications')
          .select('message')
          .eq('title', '⚽ Agenda Esportiva')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (agendaData) setSportsAgenda(agendaData.message);
      }
      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleUpdateName = async () => {
    if (!client || !newName.trim()) return;
    try {
      const { error } = await supabase
        .from('clients')
        .update({ name: newName.trim() })
        .eq('user_id', client.user_id);

      if (error) throw error;
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
      const fileName = `${client.user_id}-${Math.random()}.${fileExt}`;
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
    if (!client) return;
    try {
      await supabase
        .from('clients')
        .update({ onboarding_completed: true })
        .eq('user_id', client.user_id);
      
      setClient({ ...client, onboarding_completed: true });
    } catch (err) {
      console.warn('Erro ao salvar status de onboarding:', err);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="animate-spin text-primary" size={48} />
        </div>
      </Layout>
    );
  }

  // Calculated values based on expiration date
  const daysRemaining = getDaysRemaining(client?.expiration_date || '');
  const subStatus = getSubscriptionStatus(daysRemaining);
  const progressPct = client?.expiration_date
    ? Math.max(0, Math.min(100, (daysRemaining / 30) * 100))
    : 0;
  const progressColor = daysRemaining < 0 ? 'from-rose-400 to-rose-500'
    : daysRemaining <= 3 ? 'from-orange-400 to-red-400'
      : daysRemaining <= 7 ? 'from-yellow-400 to-orange-400'
        : 'from-green-400 to-orange-400';

  return (
    <Layout>
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleCloseWelcome}
        clientName={client?.name || ''}
      />
      <div className="flex flex-col gap-8">
        <AnimatePresence>
          {showPushBanner && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-gradient-to-r from-primary to-indigo-600 p-6 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-primary/20">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <Bell className="animate-bounce" size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight">Ative as Notificações! 🔔</h3>
                    <p className="text-white/80 text-sm">Receba avisos de vencimento e novidades direto no seu celular.</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <button
                    onClick={handleEnablePush}
                    className="flex-1 md:flex-none bg-white text-primary px-8 py-3 rounded-xl font-black uppercase tracking-wider text-xs shadow-lg transition-transform active:scale-95"
                  >
                    Ativar Agora
                  </button>
                  <button
                    onClick={() => setShowPushBanner(false)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex items-center justify-between pb-6 border-b border-black/5 dark:border-white/5">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Olá, {client?.name || 'Visitante'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Bem-vindo de volta ao seu painel de controle.</p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/notifications" className="relative text-slate-400 hover:text-primary transition-colors p-2 bg-black/5 dark:bg-white/5 rounded-xl">
              <Bell size={24} />
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full animate-pulse"></span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      type="text"
                      className="text-sm font-bold bg-white dark:bg-slate-800 border border-primary/30 rounded px-2 py-1 outline-none text-slate-900 dark:text-white"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUpdateName()}
                    />
                    <button onClick={handleUpdateName} className="text-green-500 hover:scale-110 transition-transform"><Check size={16} /></button>
                    <button onClick={() => setIsEditingName(false)} className="text-rose-500 hover:scale-110 transition-transform"><X size={16} /></button>
                  </div>
                ) : (
                  <div 
                    className="group cursor-pointer flex items-center gap-2 justify-end"
                    onClick={() => {
                      setNewName(client?.name || '');
                      setIsEditingName(true);
                    }}
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{client?.name || 'Visitante'}</p>
                    <Edit3 size={12} className="text-slate-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                )}
                <p className="text-xs text-slate-500">{client?.email || 'sem-email@empresa.com'}</p>
              </div>
              
              <div 
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="size-10 md:size-12 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-primary/50 overflow-hidden relative shadow-lg shadow-primary/10">
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                      <RefreshCw className="animate-spin text-white" size={16} />
                    </div>
                  )}
                  <img
                    src={client?.avatar_url || `https://ui-avatars.com/api/?name=${client?.name || 'V'}&background=random`}
                    alt="Avatar"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={18} className="text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
          </div>
        </header>

        {/* Card de Status e Lista de Serviços */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-3 rounded-3xl bg-slate-50 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 p-8 flex flex-col justify-center relative overflow-hidden shadow-sm dark:shadow-xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="flex justify-between items-center z-10 mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Serviços e Renovação</h3>
              <Link to="/plans" className="text-sm font-bold text-primary hover:underline transition-colors">Ver todos</Link>
            </div>
            <div className="z-10 relative">
              {[{ name: 'Assinatura', plan: client?.name || 'Renovação', price: client?.balance ? Number(client.balance).toFixed(2).replace('.', ',') : '0,00', icon: Cloud, color: 'text-blue-500', bg: 'bg-blue-500/10' }].map((item, idx) => (
                <div key={idx} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">

                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className={`size-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center shrink-0`}>
                      <item.icon size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{item.name}</p>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide">{item.plan}</h4>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto justify-between">
                    <div className="text-center md:text-right">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Valor do Plano</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">R$ {item.price}</p>
                    </div>

                    <div className="w-full md:w-auto mt-4 md:mt-0">
                      {client?.renewal_link ? (
                        <a href={client.renewal_link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 w-full">
                          Renovar Agora <ExternalLink size={18} />
                        </a>
                      ) : (
                        <button onClick={() => navigate('/checkout')} className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95 w-full">
                          Renovar Agora <ExternalLink size={18} />
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </motion.div>

          {sportsAgenda && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="md:col-span-3 rounded-3xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-6 relative overflow-hidden group shadow-lg shadow-amber-500/5"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={80} className="text-amber-500" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Zap size={20} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Agenda Esportiva do Dia ⚽</h3>
              </div>
              <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm rounded-2xl p-5 border border-amber-500/10">
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                  {sportsAgenda}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <Link to="/sports" className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                  Ver Arena Completa <ExternalLink size={12} />
                </Link>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="md:col-span-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="size-3 bg-emerald-500 rounded-full animate-ping absolute inset-0"></div>
                <div className="size-3 bg-emerald-500 rounded-full relative"></div>
              </div>
              <div>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Radar Esportivo ITWF Ativado:</span>
                <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">Notificações de gols em tempo real estão ligadas.</span>
              </div>
            </div>
            <Zap size={16} className="text-emerald-500 animate-pulse" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 rounded-3xl bg-slate-50 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 p-8 flex flex-col justify-center relative overflow-hidden shadow-sm dark:shadow-xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="flex justify-between items-start z-10">
              <div>
                <h3 className="text-lg font-medium text-slate-500 dark:text-slate-300 mb-1">Status da Assinatura</h3>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`flex h-3 w-3 rounded-full ${subStatus.dot} ${subStatus.shadow}`}></span>
                  <span className={`text-4xl font-black ${subStatus.color}`}>{subStatus.label}</span>
                </div>
                {daysRemaining < 0 && (
                  <p className="mt-2 text-rose-500 text-sm font-bold flex items-center gap-1">
                    <AlertTriangle size={14} /> Assinatura vencida há {Math.abs(daysRemaining)} dia(s)
                  </p>
                )}
                {daysRemaining >= 0 && daysRemaining <= 7 && (
                  <p className="mt-2 text-orange-500 text-sm font-bold flex items-center gap-1">
                    <AlertTriangle size={14} /> Apenas {daysRemaining} dia(s) restante(s)!
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-sm font-bold border border-orange-500/20">
                  <Timer size={16} />
                  Vence em: {client?.expiration_date || 'N/A'}
                </span>
              </div>
            </div>
            <div className="mt-10 z-10 w-full bg-slate-200 dark:bg-slate-700/50 rounded-full h-3">
              <div
                className={`bg-gradient-to-r ${progressColor} h-3 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(34,197,94,0.3)]`}
                style={{ width: `${progressPct}%` }}
              ></div>
            </div>
            <p className="mt-2 text-xs text-slate-400 z-10">
              {daysRemaining > 0 ? `${daysRemaining} dias restantes` : daysRemaining === 0 ? 'Vence hoje!' : `Vencida há ${Math.abs(daysRemaining)} dia(s)`}
            </p>
          </motion.div>

          <div className="flex flex-col gap-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl bg-slate-50 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 p-6 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">Valor do Plano</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">R$ {client?.balance?.toFixed(2).replace('.', ',') || '0,00'}</p>
              </div>
              <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Wallet size={28} />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-3xl bg-slate-50 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 p-6 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">Pedidos Feitos</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{requests.length}</p>
              </div>
              <div className="size-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <MessageSquare size={28} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Seção Meus Pedidos */}
        <section className="mt-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare className="text-primary" size={24} />
              Meus Pedidos de Conteúdo
            </h3>
            <Link to="/request-content" className="text-sm font-bold text-primary hover:underline">
              Fazer Novo Pedido
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.map((req) => (
              <RequestCard key={req.id} req={req} />
            ))}
            {requests.length === 0 && (
              <div className="col-span-full py-10 bg-slate-50 dark:bg-white/5 rounded-3xl border border-dashed border-black/10 dark:border-white/10 text-center">
                <p className="text-slate-500 text-sm italic">Você ainda não fez nenhum pedido de conteúdo.</p>
                <Link to="/request-content" className="text-primary text-sm font-bold hover:underline mt-2 inline-block">
                  Começar a pedir agora
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>

      {toastConfig && (
        <Toast
          message={toastConfig.message}
          type={toastConfig.type}
          onClose={() => setToastConfig(null)}
        />
      )}
    </Layout>
  );
}
