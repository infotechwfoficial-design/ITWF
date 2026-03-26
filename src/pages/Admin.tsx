import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  Users,
  Bell,
  Plus,
  Trash2,
  Edit2,
  Edit,
  Save,
  X,
  ArrowLeft,
  LogOut,
  Link as LinkIcon,
  Calendar,
  DollarSign,
  User as UserIcon,
  Mail,
  ExternalLink,
  MessageSquare,
  Film,
  Zap,
  ShieldCheck,
  UserCheck,
  CreditCard,
  Globe,
  Wallet,
  CheckCircle2,
  Lock,
  Smartphone,
  Download,
  Copy,
  Check,
  Settings as SettingsIcon,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Client, Notification, Plan } from '../types';
import { supabase } from '../utils/supabase';
import Toast from '../components/Toast';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warning';
}

// --- Componentes Memoizados para Performance ---

const ClientRow = React.memo(({ client, onView, onDirectPush, onEdit, onCopy, onDelete }: {
  client: Client;
  onView: (c: Client) => void;
  onDirectPush: (c: Client) => void;
  onEdit: (c: Client) => void;
  onCopy: (c: Client) => void;
  onDelete: (c: Client) => void;
}) => (
  <tr
    className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors cursor-pointer group"
    onClick={() => onView(client)}
  >
    <td className="px-6 py-4 font-mono text-sm text-primary">{client.username}</td>
    <td className="px-6 py-4 font-bold">{client.name}</td>
    <td className="px-6 py-4 text-slate-500">{client.expiration_date}</td>
    <td className="px-6 py-4 font-black">R$ {Number(client.balance || 0).toFixed(2)}</td>
    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
      <div className="flex justify-end gap-2">
        <button onClick={() => onDirectPush(client)} className="p-2 text-slate-400 hover:text-amber-500 transition-colors" title="Enviar Notificação Push">
          <Bell size={18} />
        </button>
        <button onClick={() => onEdit(client)} className="p-2 text-slate-400 hover:text-primary transition-colors">
          <Edit2 size={18} />
        </button>
        <button onClick={() => onCopy(client)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors" title="Copiar Link de Acesso">
          <LinkIcon size={18} />
        </button>
        <button onClick={() => onDelete(client)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
    </td>
  </tr>
));

const ClientCard = React.memo(({ client, idx, onView, onDirectPush, onEdit, onCopy, onDelete }: {
  client: Client;
  idx: number;
  onView: (c: Client) => void;
  onDirectPush: (c: Client) => void;
  onEdit: (c: Client) => void;
  onCopy: (c: Client) => void;
  onDelete: (c: Client) => void;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: idx * 0.05 }}
    className="p-5 active:bg-black/5 dark:active:bg-white/5 transition-colors cursor-pointer relative overflow-hidden"
    onClick={() => onView(client)}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
          {client.name?.charAt(0) || client.username?.charAt(0) || 'C'}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{client.name}</h4>
          <p className="text-xs font-mono text-primary/70">{client.username}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Vence em</p>
        <p className="text-sm font-black text-slate-900 dark:text-white">{client.expiration_date}</p>
      </div>
    </div>
    <div className="flex items-center justify-between mt-4">
      <div className="flex items-center gap-2">
         <span className="text-xs font-bold text-slate-400">Saldo:</span>
         <span className="text-sm font-black text-slate-900 dark:text-white">R$ {Number(client.balance || 0).toFixed(2)}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); onDirectPush(client); }} className="p-2 bg-amber-500/10 rounded-xl text-amber-500"><Bell size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); window.open(client.renewal_link, '_blank'); }} className="p-2 bg-primary/10 rounded-xl text-primary"><LinkIcon size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); onEdit(client); }} className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-600 dark:text-slate-400"><Edit size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); onCopy(client); }} className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500"><Copy size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(client); }} className="p-2 bg-rose-500/10 rounded-xl text-rose-500"><Trash2 size={16} /></button>
      </div>
    </div>
  </motion.div>
));

const ResellerRow = React.memo(({ reseller, onDelete, submitting }: {
  reseller: any;
  onDelete: (r: any) => void;
  submitting: boolean;
}) => (
  <tr className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
    <td className="px-6 py-4">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
          {reseller.name?.charAt(0) || 'R'}
        </div>
        <span className="font-bold">{reseller.name || 'Sem Nome'}</span>
      </div>
    </td>
    <td className="px-6 py-4 text-slate-500">{reseller.email}</td>
    <td className="px-6 py-4">
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Users size={12} />
        {reseller.clientCount ?? 0} cliente{reseller.clientCount !== 1 ? 's' : ''}
      </span>
    </td>
    <td className="px-6 py-4">
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${reseller.role === 'master' ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
        {reseller.role}
      </span>
    </td>
    <td className="px-6 py-4 text-xs text-slate-400">
      {new Date(reseller.created_at).toLocaleDateString()}
    </td>
    <td className="px-6 py-4 text-right">
      {reseller.role !== 'master' && (
        <button
          onClick={() => onDelete(reseller)}
          disabled={submitting}
          className="p-2 text-slate-400 hover:text-rose-500 transition-colors disabled:opacity-50"
        >
          <Trash2 size={18} />
        </button>
      )}
    </td>
  </tr>
));

const PlanRow = React.memo(({ plan, onEdit, onDelete }: {
  plan: Plan;
  onEdit: (p: Plan) => void;
  onDelete: (id: number) => void;
}) => (
  <tr className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
    <td className="px-6 py-4 font-bold">{plan.name}</td>
    <td className="px-6 py-4 font-black text-primary">R$ {Number(plan.price || 0).toFixed(2)}</td>
    <td className="px-6 py-4 text-slate-500">{plan.duration}</td>
    <td className="px-6 py-4 text-right">
      <div className="flex justify-end gap-2">
        <button onClick={() => onEdit(plan)} className="p-2 text-slate-400 hover:text-primary transition-colors">
          <Edit2 size={18} />
        </button>
        <button onClick={() => onDelete(plan.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
          <Trash2 size={18} />
        </button>
      </div>
    </td>
  </tr>
));

const PlanCard = React.memo(({ plan, onEdit, onDelete }: {
  plan: Plan;
  onEdit: (p: Plan) => void;
  onDelete: (id: number) => void;
}) => (
  <div className="p-4 flex items-center justify-between">
    <div>
      <h4 className="font-bold text-base">{plan.name}</h4>
      <p className="text-sm font-black text-primary">R$ {Number(plan.price || 0).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ {plan.duration}</span></p>
    </div>
    <div className="flex gap-2">
      <button onClick={() => onEdit(plan)} className="p-2 bg-primary/10 text-primary rounded-lg">
        <Edit2 size={16} />
      </button>
      <button onClick={() => onDelete(plan.id)} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
        <Trash2 size={16} />
      </button>
    </div>
  </div>
));


export default function Admin() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState<'clients' | 'notifications' | 'requests' | 'plans' | 'payments' | 'resellers' | 'settings'>('clients');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{ id: string; role: string } | null>(null);
  const [resellers, setResellers] = useState<any[]>([]);
  const [isResellerModalOpen, setIsResellerModalOpen] = useState(false);
  const [pushSubscribersCount, setPushSubscribersCount] = useState<number | null>(null);
  const [resellerForm, setResellerForm] = useState({
    email: '',
    name: '',
    role: 'admin'
  });

  // Admin Settings State
  const [adminSupportNumber, setAdminSupportNumber] = useState('');
  const [adminPushLogoUrl, setAdminPushLogoUrl] = useState('');
  const [adminPushLogoLink, setAdminPushLogoLink] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Payment Settings State
  const [paymentSettings, setPaymentSettings] = useState<any[]>([]);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Plan Form State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: 0,
    duration: '',
    features: ''
  });

  // Client Form State (Restaurados)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [clientForm, setClientForm] = useState({
    username: '',
    name: '',
    email: '',
    expiration_date: '',
    balance: 0,
    renewal_link: ''
  });

  // Notification Form State (Restaurados)
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isDirectPushModalOpen, setIsDirectPushModalOpen] = useState(false);
  const [directPushClient, setDirectPushClient] = useState<Client | null>(null);
  const [directPushMessage, setDirectPushMessage] = useState('');
  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    type: 'info' as Notification['type']
  });

  const openEditPlan = useCallback((plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      features: JSON.parse(plan.features || '[]').join(', ')
    });
    setIsPlanModalOpen(true);
  }, []);

  useEffect(() => {

    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const role = localStorage.getItem('adminRole') || 'admin';
        setCurrentAdmin({ id: user.id, role });
      } else {
        navigate('/admin/login');
      }
    };
    checkUser();
  }, [navigate]);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning') => {
    setToast({ message, type });
  }, []);

  const openViewClient = useCallback((client: Client) => {
    setViewingClient(client);
    setIsViewModalOpen(true);
  }, []);

  const openEditClient = useCallback((client: Client) => {
    setEditingClient(client);
    setClientForm({
      username: client.username,
      name: client.name,
      email: client.email,
      expiration_date: client.expiration_date,
      balance: client.balance,
      renewal_link: client.renewal_link
    });
    setIsClientModalOpen(true);
  }, []);

  const openDirectPushModal = useCallback((client: Client) => {
    setDirectPushClient(client);
    setDirectPushMessage(`Olá ${client.name}, sua assinatura vence em ${client.expiration_date}.`);
    setIsDirectPushModalOpen(true);
  }, []);

  const copyAccessLink = useCallback((client: Client) => {
    const loginUrl = `${window.location.origin}/login?email=${encodeURIComponent(client.email)}`;
    navigator.clipboard.writeText(loginUrl);
    showToast('Link de acesso copiado!', 'success');
  }, [showToast]);

  const deleteClient = async (client: Client) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${client.name}? Esta ação apagará permanentemente todos os pedidos, faturas e registros de notificação vinculados.`)) {
      try {
        setSubmitting(true);
        await performClientCleanup(client);
        showToast('Cliente e acesso ao App completamente excluídos!', 'success');
        fetchClients();
      } catch (err: any) {
        showToast('Erro crítico ao excluir conta do cliente: ' + err.message, 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const fetchAdminSettings = async () => {
    try {
      if (!currentAdmin?.id) return;
      const { data, error } = await supabase
        .from('clients')
        .select('support_number, push_logo_url')
        .eq('user_id', currentAdmin.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        if (data.support_number) setAdminSupportNumber(data.support_number);
        if (data.push_logo_url) {
          setAdminPushLogoUrl(data.push_logo_url);
          if (!data.push_logo_url.includes('supabase.co/storage')) {
            setAdminPushLogoLink(data.push_logo_url);
          }
        }
      }
    } catch (err: any) {
      console.error('Erro ao buscar configurações:', err);
    }
  };

  const savePushLogoLink = async () => {
    if (!currentAdmin?.id || !adminPushLogoLink) return;
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ push_logo_url: adminPushLogoLink })
        .eq('user_id', currentAdmin.id);
      if (error) throw error;
      setAdminPushLogoUrl(adminPushLogoLink);
      showToast('Link da logo salvo!', 'success');
    } catch (err: any) {
      showToast('Erro ao salvar link: ' + err.message, 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentAdmin) return;

    if (file.size > 1 * 1024 * 1024) {
      showToast('A logo deve ter no máximo 1MB.', 'error');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `push-logo-${currentAdmin.id}-${Date.now()}.${fileExt}`;
      const filePath = `push-logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicData?.publicUrl) throw new Error('Falha ao gerar URL pública da logo');

      const { error: updateError } = await supabase
        .from('clients')
        .update({ push_logo_url: publicData.publicUrl })
        .eq('user_id', currentAdmin.id);

      if (updateError) throw updateError;

      setAdminPushLogoUrl(publicData.publicUrl);
      showToast('Logo do Push atualizada!', 'success');
    } catch (err: any) {
      console.error('Erro no upload da logo:', err);
      showToast('Erro no upload: ' + (err.message || 'Erro desconhecido'), 'error');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const saveAdminSupportNumber = async () => {
    if (!currentAdmin?.id) return;
    setSubmitting(true);
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({ support_number: adminSupportNumber })
        .eq('user_id', currentAdmin.id);
      if (error) throw error;
      showToast('Configurações salvas com sucesso!', 'success');
    } catch (e: any) {
      showToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      setSubmitting(false);
      setSavingSettings(false);
    }
  };

  useEffect(() => {
    if (currentAdmin) {
      fetchClients();
      fetchNotifications();
      fetchRequests();
      fetchPlans();
      fetchAdminSettings();
      if (currentAdmin.role === 'master') {
        fetchResellers();
        fetchPaymentSettings();
      }
      fetchPushStats();
    }
  }, [currentAdmin]);

  const fetchPaymentSettings = async () => {
    const { data } = await supabase.from('payment_settings').select('*').order('provider');
    if (data) setPaymentSettings(data);
  };

  const updatePaymentSetting = async (provider: string, updates: any) => {
    try {
      setIsSavingPayment(true);
      const { error } = await supabase
        .from('payment_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('provider', provider);

      if (error) throw error;
      showToast(`${provider.toUpperCase()} atualizado com sucesso!`, 'success');
      fetchPaymentSettings();
    } catch (err: any) {
      showToast('Erro ao salvar: ' + err.message, 'error');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const fetchResellers = async () => {
    const { data: adminsData } = await supabase
      .from('admins')
      .select('*')
      .order('created_at', { ascending: false });

    if (adminsData) {
      // Para cada revendedor, busca a quantidade de clientes vinculados
      const resellersWithCount = await Promise.all(
        adminsData.map(async (admin) => {
          const { count } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true })
            .eq('admin_id', admin.user_id);
          return { ...admin, clientCount: count || 0 };
        })
      );
      setResellers(resellersWithCount);
    }
  };

  const fetchPlans = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/plans`);
      const data = await res.json();
      setPlans(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPushStats = async () => {
    if (!currentAdmin) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/push-stats?adminId=${currentAdmin.id}`);
      const data = await res.json();
      setPushSubscribersCount(data.count || 0);
    } catch (err) {
      console.error('Error fetching push stats', err);
    }
  };

  const fetchClients = async () => {
    if (!currentAdmin) return;
    
    let query = supabase.from('clients').select('*');
    
    if (currentAdmin.role === 'master') {
      // Master vê seus clientes diretos (sem vinculação) e também os que indicou
      query = query.or(`admin_id.is.null,admin_id.eq.${currentAdmin.id}`);
    } else {
      // Revendedores veem apenas os seus próprios clientes
      query = query.eq('admin_id', currentAdmin.id);
    }
    
    const { data } = await query.order('created_at', { ascending: false });
    if (data) setClients(data);
  };

  const fetchNotifications = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${apiUrl}/api/notifications`);
    const data = await res.json();
    setNotifications(data);
  };

  const fetchRequests = async () => {
    if (!currentAdmin) return;

    let query = supabase.from('requests').select('*');
    
    if (currentAdmin.role === 'master') {
      // Master vê pedidos de seus clientes diretos (sem admin_id ou indicados por ele)
      query = query.or(`admin_id.is.null,admin_id.eq.${currentAdmin.id}`);
    } else {
      query = query.eq('admin_id', currentAdmin.id);
    }

    const { data } = await query.order('created_at', { ascending: false });
    if (data) setRequests(data);
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(clientForm)
          .eq('id', editingClient.id);

        if (error) throw error;
        showToast('Cliente atualizado com sucesso!', 'success');
      } else {
        const { error } = await supabase
          .from('clients')
          .insert([{ ...clientForm, admin_id: currentAdmin?.id }]);

        if (error) throw error;
        showToast('Cliente cadastrado com sucesso!', 'success');
      }
      setIsClientModalOpen(false);
      setEditingClient(null);
      setClientForm({ username: '', name: '', email: '', expiration_date: '', balance: 0, renewal_link: '' });
      fetchClients();
    } catch (err: any) {
      showToast('Erro ao salvar: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNotifSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifForm)
      });

      if (!res.ok) throw new Error('Falha ao salvar notificação');

      const resPush = await fetch(`${apiUrl}/api/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifForm.title,
          message: notifForm.message,
          adminId: currentAdmin?.id
        })
      });

      const pushData = await resPush.json();
      
      setIsNotifModalOpen(false);
      setNotifForm({ title: '', message: '', type: 'info' });
      fetchNotifications();
      
      if (pushData.count === 0) {
        showToast('Notificação salva, mas nenhum inscrito para receber o Push agora.', 'warning');
      } else {
        showToast(`Notificação enviada com sucesso!`, 'success');
      }
    } catch (err: any) {
      showToast('Erro: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const handleDirectPushSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPushClient || !directPushMessage || submitting) return;
    
    try {
      setSubmitting(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Aviso de Vencimento',
          message: directPushMessage,
          username: directPushClient.username,
          adminId: currentAdmin?.id
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao enviar push');
      
      showToast('Notificação enviada!', 'success');
      setIsDirectPushModalOpen(false);
      setDirectPushClient(null);
      setDirectPushMessage('');
    } catch (err: any) {
      showToast(`Erro ao enviar notificação: ${err.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const performClientCleanup = async (client: Client) => {
    // 1. Delete push subscriptions
    await supabase.from('push_subscriptions').delete().eq('email', client.email);
    
    // 2. Delete requests
    await supabase.from('requests').delete().eq('username', client.username);
    
    // 3. Delete invoices
    if (client.user_id) {
      await supabase.from('invoices').delete().eq('user_id', client.user_id);
    }

    // 4. Delete the user from Supabase Auth via backend
    if (client.user_id) {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      try {
        const res = await fetch(`${apiUrl}/api/users/${client.user_id}`, { method: 'DELETE' });
        if (!res.ok) {
          const errorData = await res.json();
          console.error(`Falha ao deletar Auth do usuário ${client.email}:`, errorData.error);
        }
      } catch (backendErr) {
        console.error('Erro ao deletar da tabela auth.users no backend:', backendErr);
      }
    }

    // 5. Delete the client record
    const { error } = await supabase.from('clients').delete().eq('id', client.id);
    if (error) throw error;
  };


  const updateRequestStatus = async (id: number | string, status: string, reqUserId: string, title: string) => {
    await supabase.from('requests').update({ status }).eq('id', id);

    // Find the correct client's email based on user_id
    const targetClient = clients.find(c => c.user_id === reqUserId);
    const email = targetClient?.email;

    if (!email) {
      console.warn('Não foi possível enviar push: Cliente sem email ou não encontrado.');
      fetchRequests();
      return;
    }

    // Send push notification to client
    const apiUrl = import.meta.env.VITE_API_URL || '';
    await fetch(`${apiUrl}/api/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Status do seu Pedido',
        message: `O status do seu pedido "${title}" mudou para: ${status}`,
        username: targetClient?.username
      })
    });

    fetchRequests();
  };

  const deleteNotif = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta notificação?')) {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      await fetch(`${apiUrl}/api/notifications/${id}`, { method: 'DELETE' });
      fetchNotifications();
      showToast('Notificação excluída.', 'success');
    }
  };

  const sendSportsAgenda = async () => {
    try {
      setSubmitting(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${apiUrl}/api/send-sports-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar agenda');

      showToast('Agenda esportiva enviada com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const url = editingPlan ? `${apiUrl}/api/plans/${editingPlan.id}` : `${apiUrl}/api/plans`;
      const method = editingPlan ? 'PUT' : 'POST';

      const featuresArray = planForm.features.split(',').map(f => f.trim()).filter(Boolean);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...planForm, features: featuresArray })
      });

      if (!res.ok) throw new Error('Erro ao salvar plano');

      showToast('Plano salvo com sucesso!', 'success');
      setIsPlanModalOpen(false);
      fetchPlans();
    } catch (err: any) {
      showToast('Erro: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deletePlan = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este plano?')) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        await fetch(`${apiUrl}/api/plans/${id}`, { method: 'DELETE' });
        showToast('Plano excluído com sucesso!', 'success');
        fetchPlans();
      } catch (err) {
        showToast('Erro ao excluir plano.', 'error');
      }
    }
  };



  const handleResellerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      
      // Buscar o user_id baseado no e-mail (O usuário precisa já ter se cadastrado no sistema)
      const { data: userData, error: userError } = await supabase
        .from('clients')
        .select('user_id')
        .eq('email', resellerForm.email.trim().toLowerCase())
        .single();

      if (userError || !userData?.user_id) {
        throw new Error('Usuário não encontrado. Peça para o revendedor se cadastrar no site como cliente primeiro.');
      }

      const { error } = await supabase
        .from('admins')
        .insert([{ 
          user_id: userData.user_id, 
          email: resellerForm.email.trim().toLowerCase(),
          name: resellerForm.name,
          role: resellerForm.role 
        }]);

      if (error) throw error;

      showToast('Revendedor adicionado com sucesso!', 'success');
      setIsResellerModalOpen(false);
      setResellerForm({ email: '', name: '', role: 'admin' });
      fetchResellers();
    } catch (err: any) {
      showToast('Erro: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReseller = async (reseller: any) => {
    const warning = reseller.clientCount > 0 
      ? `ATENÇÃO: Este revendedor possui ${reseller.clientCount} clientes vinculados. Ao excluir o revendedor, TODOS os seus clientes, pedidos e faturas também serão excluídos permanentemente. Deseja continuar?`
      : `Tem certeza que deseja remover o acesso de revendedor de ${reseller.name || reseller.email}?`;

    if (window.confirm(warning)) {
      try {
        setSubmitting(true);
        
        // 1. Limpeza em Cascata: Deletar todos os clientes vinculados
        if (reseller.user_id) {
          const { data: linkedClients, error: fetchErr } = await supabase
            .from('clients')
            .select('*')
            .eq('admin_id', reseller.user_id);
          
          if (fetchErr) throw fetchErr;
          
          if (linkedClients && linkedClients.length > 0) {
            for (const client of linkedClients) {
              await performClientCleanup(client);
            }
          }

          // 2. Limpar pedidos que possam estar vinculados diretamente ao admin_id
          await supabase.from('requests').delete().eq('admin_id', reseller.user_id);
        }

        // 3. Deletar o registro de administrador
        const { error: adminErr } = await supabase.from('admins').delete().eq('id', reseller.id);
        if (adminErr) throw adminErr;

        // 3. Deletar a conta no Supabase Auth
        if (reseller.user_id) {
          const apiUrl = import.meta.env.VITE_API_URL || '';
          try {
            await fetch(`${apiUrl}/api/users/${reseller.user_id}`, { method: 'DELETE' });
          } catch (err) {
            console.error('Erro ao remover Auth do revendedor:', err);
          }
        }

        showToast('Revendedor e todos os seus vínculos foram excluídos!', 'success');
        fetchResellers();
        fetchClients(); // Atualizar lista de clientes também pois foram apagados em cascata
      } catch (err: any) {
        showToast('Erro na exclusão em cascata: ' + err.message, 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    navigate('/admin/login');
  };

  const adminItems = [
    { id: 'clients', label: 'Clientes', icon: Users, onClick: () => setActiveTab('clients') },
    { id: 'notifications', label: 'Avisos', icon: Bell, onClick: () => setActiveTab('notifications') },
    { id: 'requests', label: 'Pedidos', icon: MessageSquare, onClick: () => setActiveTab('requests') },
    { id: 'plans', label: 'Planos', icon: DollarSign, onClick: () => setActiveTab('plans') },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard, onClick: () => setActiveTab('payments') },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon, onClick: () => setActiveTab('settings') },
    ...(currentAdmin?.role === 'master' ? [
      { id: 'resellers', label: 'Revendedores', icon: ShieldCheck, onClick: () => setActiveTab('resellers' as any) }
    ] : []),
  ];

  return (
    <Layout 
      sidebarItems={adminItems}
      bottomNavItems={adminItems}
      mobileHeaderTitle="Painel Admin"
      activeTab={activeTab}
      onLogout={handleLogout}
    >
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* Referral Link Section for Resellers */}
          {currentAdmin && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-primary/5 border border-primary/20 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                  <ExternalLink size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Seu Link de Cadastro</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Envie este link para novos clientes se vincularem ao seu painel.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="flex-1 md:w-64 bg-white dark:bg-slate-800 border border-black/5 dark:border-white/10 px-4 py-2.5 rounded-xl text-xs font-mono text-slate-500 truncate">
                  {window.location.origin}/?ref={currentAdmin.id}
                </div>
                <button
                  onClick={() => {
                    const link = `${window.location.origin}/?ref=${currentAdmin.id}`;
                    navigator.clipboard.writeText(link);
                    showToast('Link copiado com sucesso!', 'success');
                  }}
                  className="bg-primary hover:bg-primary/90 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95"
                  title="Copiar Link"
                >
                  <Copy size={18} />
                </button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm dark:shadow-xl"
          >
          <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/20 dark:bg-white/5">
            <div>
              <h3 className="text-xl font-bold tracking-tight font-display">Lista de Clientes</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerencie seus usuários ativos.</p>
            </div>
            <button
              onClick={() => {
                setEditingClient(null);
                setClientForm({ username: '', name: '', email: '', expiration_date: '', balance: 0, renewal_link: '' });
                setIsClientModalOpen(true);
              }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              <Plus size={18} />
              Novo
            </button>
          </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/[0.02] dark:bg-white/5 text-slate-500 text-xs uppercase tracking-widest">
                    <th className="px-6 py-4 font-bold">Usuário</th>
                    <th className="px-6 py-4 font-bold">Nome</th>
                    <th className="px-6 py-4 font-bold">Vencimento</th>
                    <th className="px-6 py-4 font-bold">Valor</th>
                    <th className="px-6 py-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {clients.map((client) => (
                    <ClientRow
                      key={client.id}
                      client={client}
                      onView={openViewClient}
                      onDirectPush={openDirectPushModal}
                      onEdit={openEditClient}
                      onCopy={copyAccessLink}
                      onDelete={deleteClient}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-black/5 dark:divide-white/5">
              {clients.map((client, idx) => (
                <ClientCard
                  key={client.id}
                  idx={idx}
                  client={client}
                  onView={openViewClient}
                  onDirectPush={openDirectPushModal}
                  onEdit={openEditClient}
                  onCopy={copyAccessLink}
                  onDelete={deleteClient}
                />
              ))}
            </div>

            {clients.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500 italic">
                Nenhum cliente cadastrado.
              </div>
            )}
          </motion.div>
        </div>
      )}

        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm dark:shadow-xl"
          >
            <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/20 dark:bg-white/5">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Avisos e Informativos</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Envie notificações push em massa.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={sendSportsAgenda}
                  disabled={submitting}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                  title="Enviar Agenda Esportiva"
                >
                  ⚽ Agenda
                </button>
                <button
                  onClick={() => setIsNotifModalOpen(true)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  <Plus size={18} />
                  Criar
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {notifications.map((notif) => (
                <div key={notif.id} className="flex items-start justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                  <div className="flex gap-4">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${notif.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                      notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                        notif.type === 'alert' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-primary/10 text-primary'
                      }`}>
                      <Bell size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold">{notif.title}</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{notif.message}</p>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest mt-2 block">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteNotif(notif.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="py-12 text-center text-slate-500 italic">
                  Nenhuma notificação enviada.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm dark:shadow-xl"
          >
            <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5 bg-white/20 dark:bg-white/5">
              <h3 className="text-xl font-bold tracking-tight font-display">Pedidos Pendentes</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Filmes e séries solicitados pelos usuários.</p>
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/[0.02] dark:bg-white/5 text-slate-500 text-xs uppercase tracking-widest">
                    <th className="px-6 py-4 font-bold">Cliente</th>
                    <th className="px-6 py-4 font-bold">Conteúdo</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {requests.map((req) => {
                    const reqClient = clients.find(c => c.user_id === req.user_id);
                    return (
                    <tr key={req.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold">{reqClient?.name || 'Sistema'}</div>
                        <div className="text-xs text-slate-500 font-mono">@{reqClient?.username || 'user'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold">{req.content_title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          {req.content_type} • {req.content_year}
                          {req.tmdb_link && <a href={req.tmdb_link} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            TMDB <ExternalLink size={10} />
                          </a>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${req.status === 'PEDIDO ADICIONADO' ? 'bg-emerald-500/10 text-emerald-500' :
                          req.status === 'NÃO DISPONIVEL PARA ADIÇÃO' ? 'bg-rose-500/10 text-rose-500' :
                            req.status === 'EM BUSCA DO SEU PEDIDO' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-primary/10 text-primary'
                          }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <select
                          className="bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                          value={req.status}
                          onChange={(e) => updateRequestStatus(req.id, e.target.value, req.user_id, req.content_title)}
                        >
                          <option value="AGUARDE">AGUARDE</option>
                          <option value="EM BUSCA DO SEU PEDIDO">EM BUSCA</option>
                          <option value="PEDIDO ADICIONADO">ADICIONADO</option>
                          <option value="NÃO DISPONIVEL PARA ADIÇÃO">NÃO DISPONÍVEL</option>
                        </select>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-black/5 dark:divide-white/5">
              {requests.map((request, idx) => {
                const reqClient = clients.find(c => c.user_id === request.user_id);
                return (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={request.id}
                  className="p-5 active:bg-black/5 dark:active:bg-white/5 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                        {request.content_type === 'movie' ? <Film size={22} /> : <Zap size={22} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white leading-tight">{request.content_title}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${request.status === 'PEDIDO ADICIONADO' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 mt-4">
                    <div className="text-xs text-slate-500 font-medium">
                      Pedido por: <span className="font-bold text-slate-700 dark:text-slate-300">@{reqClient?.username || 'user'}</span>
                    </div>
                    <div className="flex gap-2">
                       <select
                          className="flex-1 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary font-bold"
                          value={request.status}
                          onChange={(e) => updateRequestStatus(request.id, e.target.value, request.user_id, request.content_title)}
                        >
                          <option value="AGUARDE">AGUARDE</option>
                          <option value="EM BUSCA DO SEU PEDIDO">EM BUSCA</option>
                          <option value="PEDIDO ADICIONADO">ADICIONADO</option>
                          <option value="NÃO DISPONIVEL PARA ADIÇÃO">NÃO DISPONÍVEL</option>
                        </select>
                        <button
                          onClick={() => updateRequestStatus(request.id, request.status === 'PEDIDO ADICIONADO' ? 'AGUARDE' : 'PEDIDO ADICIONADO', request.user_id, request.content_title)}
                          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all active:scale-95 ${request.status === 'PEDIDO ADICIONADO'
                            ? 'bg-slate-100 dark:bg-white/10 text-slate-500'
                            : 'bg-primary text-white shadow-lg shadow-primary/20'
                            }`}
                        >
                          {request.status === 'PEDIDO ADICIONADO' ? <X size={16} /> : <Plus size={16} />}
                        </button>
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>

            {requests.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500 italic">
                Nenhum pedido encontrado.
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'plans' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm dark:shadow-xl"
          >
            <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/20 dark:bg-white/5">
              <div>
                <h3 className="text-xl font-bold tracking-tight font-display">Planos de Assinatura</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure as ofertas do seu sistema.</p>
              </div>
              <button
                onClick={() => {
                  setEditingPlan(null);
                  setPlanForm({ name: '', price: 0, duration: '', features: '' });
                  setIsPlanModalOpen(true);
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Plus size={18} />
                Novo
              </button>
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/[0.02] dark:bg-white/5 text-slate-500 text-xs uppercase tracking-widest">
                    <th className="px-6 py-4 font-bold">Nome do Plano</th>
                    <th className="px-6 py-4 font-bold">Preço</th>
                    <th className="px-6 py-4 font-bold">Duração</th>
                    <th className="px-6 py-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {plans.map((plan) => (
                    <PlanRow
                      key={plan.id}
                      plan={plan}
                      onEdit={openEditPlan}
                      onDelete={deletePlan}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-black/5 dark:divide-white/5">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={openEditPlan}
                  onDelete={deletePlan}
                />
              ))}
            </div>

            {plans.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500 italic">
                Nenhum plano cadastrado.
              </div>
            )}
          </motion.div>
        )}

        {currentAdmin?.role === 'master' && activeTab === 'resellers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-[2rem] overflow-hidden shadow-sm dark:shadow-xl"
          >
            <div className="p-6 md:p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-white/20 dark:bg-white/5">
              <div>
                <h3 className="text-xl font-bold tracking-tight font-display text-primary">Gestão de Revendedores</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Controle quem tem acesso ao painel administrativo.</p>
              </div>
              <button
                onClick={() => setIsResellerModalOpen(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Plus size={18} />
                Novo Revendedor
              </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-black/[0.02] dark:bg-white/5 text-slate-500 text-xs uppercase tracking-widest">
                    <th className="px-6 py-4 font-bold">Revendedor</th>
                    <th className="px-6 py-4 font-bold">E-mail</th>
                    <th className="px-6 py-4 font-bold">Clientes</th>
                    <th className="px-6 py-4 font-bold">Tipo</th>
                    <th className="px-6 py-4 font-bold">Desde</th>
                    <th className="px-6 py-4 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {resellers.map((reseller) => (
                    <ResellerRow
                      key={reseller.id}
                      reseller={reseller}
                      onDelete={deleteReseller}
                      submitting={submitting}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Client Modal */}
        {isClientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm md:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 w-full h-full md:h-auto md:max-w-2xl md:rounded-3xl overflow-y-auto shadow-2xl safe-p-bottom"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-bold">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                <button onClick={() => setIsClientModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleClientSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">Usuário de Acesso</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        type="text"
                        value={clientForm.username}
                        onChange={e => setClientForm({ ...clientForm, username: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        placeholder="ex: joaosilva"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">Nome Completo</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        type="text"
                        value={clientForm.name}
                        onChange={e => setClientForm({ ...clientForm, name: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        placeholder="João da Silva"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        type="email"
                        value={clientForm.email}
                        onChange={e => setClientForm({ ...clientForm, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        placeholder="joao@email.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">Data de Vencimento</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        type="text"
                        value={clientForm.expiration_date}
                        onChange={e => setClientForm({ ...clientForm, expiration_date: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        placeholder="15/10/2025"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">Valor do Plano (R$)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={clientForm.balance}
                        onChange={e => setClientForm({ ...clientForm, balance: parseFloat(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-500">Link de Renovação</label>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        required
                        type="url"
                        value={clientForm.renewal_link}
                        onChange={e => setClientForm({ ...clientForm, renewal_link: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        placeholder="https://checkout.itwf.com/..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsClientModalOpen(false)}
                    className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    <Save size={20} />
                    {submitting ? 'Salvando...' : editingClient ? 'Salvar Alterações' : 'Cadastrar Cliente'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* View Client Modal */}
        {isViewModalOpen && viewingClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                <h3 className="text-xl font-bold">Detalhes do Cliente</h3>
                <button onClick={() => setIsViewModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="flex flex-col items-center mb-4">
                  <div className="size-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <UserIcon size={40} />
                  </div>
                  <h4 className="text-2xl font-black text-slate-900 dark:text-white">{viewingClient.name}</h4>
                  <p className="text-slate-500 font-mono text-sm">@{viewingClient.username}</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">E-mail</p>
                    <p className="font-medium flex items-center gap-2">
                      <Mail size={16} className="text-primary" />
                      {viewingClient.email}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Vencimento</p>
                      <p className="font-medium flex items-center gap-2">
                        <Calendar size={16} className="text-amber-500" />
                        {viewingClient.expiration_date}
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Valor do Plano</p>
                      <p className="font-black text-lg flex items-center gap-2">
                        <DollarSign size={16} className="text-emerald-500" />
                        R$ {Number(viewingClient.balance || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Link de Renovação</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate text-primary underline">
                        {viewingClient.renewal_link}
                      </p>
                      <button
                        onClick={() => window.open(viewingClient.renewal_link, '_blank')}
                        className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      openEditClient(viewingClient);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white py-3 rounded-xl font-bold transition-all"
                  >
                    <Edit2 size={18} />
                    Editar
                  </button>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="flex-1 bg-primary text-white py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Notification Modal */}
        {isNotifModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                <h3 className="text-xl font-bold">Nova Notificação</h3>
                <button onClick={() => setIsNotifModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleNotifSubmit} className="p-6 space-y-6">
                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Smartphone size={20} className="text-primary" />
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Inscritos para Push</span>
                  </div>
                  <span className="px-3 py-1 bg-primary text-white text-xs font-black rounded-full">
                    {pushSubscribersCount === null ? '...' : pushSubscribersCount}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500">Título</label>
                  <input
                    required
                    type="text"
                    value={notifForm.title}
                    onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                    placeholder="ex: Manutenção Programada"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500">Mensagem</label>
                  <textarea
                    required
                    rows={4}
                    value={notifForm.message}
                    onChange={e => setNotifForm({ ...notifForm, message: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Descreva o aviso para os clientes..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500">Tipo de Alerta</label>
                  <select
                    value={notifForm.type}
                    onChange={e => setNotifForm({ ...notifForm, type: e.target.value as Notification['type'] })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary appearance-none"
                  >
                    <option value="info">Informação (Azul)</option>
                    <option value="success">Sucesso (Verde)</option>
                    <option value="warning">Aviso (Laranja)</option>
                    <option value="alert">Alerta Crítico (Vermelho)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsNotifModalOpen(false)}
                    className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all"
                  >
                    <Bell size={20} />
                    Enviar Notificação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Direct Push Modal */}
        {isDirectPushModalOpen && directPushClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-black/5 dark:border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold">Enviar Aviso</h3>
                  <p className="text-xs text-slate-500 font-mono">@{directPushClient.username}</p>
                </div>
                <button
                  onClick={() => setIsDirectPushModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleDirectPushSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mensagem para {directPushClient.name}</label>
                  <textarea
                    required
                    rows={3}
                    value={directPushMessage}
                    onChange={e => setDirectPushMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm resize-none"
                    placeholder="Sua mensagem aqui..."
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDirectPushModalOpen(false)}
                    className="flex-1 px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-2xl font-black text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={18} /> : <Bell size={18} />}
                    {submitting ? 'Enviando...' : 'Enviar Push'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Plan Modal */}
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-black/5 dark:border-white/10"
            >
              <div className="flex justify-between items-center mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                <h3 className="text-xl font-bold">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h3>
                <button
                  onClick={() => setIsPlanModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handlePlanSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Nome do Plano</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="Ex: Básico Mensal"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Preço (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={planForm.price}
                      onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) })}
                      placeholder="29.90"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Duração do Plano</label>
                    <select
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none"
                      value={planForm.duration}
                      onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                    >
                      <option value="" disabled>Selecione a Duração</option>
                      <option value="Mensal">Mensal</option>
                      <option value="Anual">Anual</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Benefícios (Separados por vírgula)</label>
                  <textarea
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none h-24"
                    value={planForm.features}
                    onChange={(e) => setPlanForm({ ...planForm, features: e.target.value })}
                    placeholder="Ex: 1 Tela, Resolução HD, Suporte"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                >
                  <Save size={20} />
                  {submitting ? 'Salvando...' : 'Salvar Plano'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Reseller Modal */}
        {isResellerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                <h3 className="text-xl font-bold">Cadastrar Revendedor</h3>
                <button onClick={() => setIsResellerModalOpen(false)} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleResellerSubmit} className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500">E-mail do Revendedor</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="email"
                      value={resellerForm.email}
                      onChange={e => setResellerForm({ ...resellerForm, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                      placeholder="email@do-revendedor.com"
                    />
                  </div>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic">
                    * O revendedor já deve estar cadastrado como usuário comum no site.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500">Nome da Empresa/Revendedor</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      value={resellerForm.name}
                      onChange={e => setResellerForm({ ...resellerForm, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nome do Revendedor"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-500">Nível de Acesso</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-primary appearance-none font-bold"
                    value={resellerForm.role}
                    onChange={e => setResellerForm({ ...resellerForm, role: e.target.value })}
                  >
                    <option value="admin">Administrador (Revendedor)</option>
                    <option value="master">Super Admin (ITWF)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsResellerModalOpen(false)}
                    className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50"
                  >
                    <ShieldCheck size={20} />
                    {submitting ? 'Salvando...' : 'Liberar Acesso'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {activeTab === 'payments' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Configurações de Pagamento</h2>
              <p className="text-slate-500 dark:text-slate-400">Gerencie seus gateways de pagamento e chaves de API.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {['mercadopago', 'stripe', 'asaas'].map((provider) => {
                const setting = paymentSettings.find(s => s.provider === provider) || {
                  provider,
                  active: false,
                  is_sandbox: true,
                  credentials: {},
                  webhook_secret: ''
                };

                const providerInfo = {
                  mercadopago: { name: 'Mercado Pago', color: 'bg-blue-500', icon: CreditCard },
                  stripe: { name: 'Stripe', color: 'bg-purple-600', icon: Globe },
                  asaas: { name: 'Asaas', color: 'bg-sky-500', icon: Wallet }
                }[provider as keyof typeof providerInfo];

                return (
                  <div key={provider} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-[2.5rem] p-8 flex flex-col shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className={`size-14 rounded-2xl ${providerInfo.color} text-white flex items-center justify-center shadow-lg shadow-${providerInfo.color.split('-')[1]}/20`}>
                          <providerInfo.icon size={28} />
                        </div>
                        <div>
                          <h4 className="text-xl font-bold">{providerInfo.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`size-2 rounded-full ${setting.active ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                              {setting.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={setting.active}
                          onChange={(e) => updatePaymentSetting(provider, { active: e.target.checked })}
                        />
                        <div className="w-14 h-7 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                      </label>
                    </div>

                    <div className="space-y-6 flex-1">
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <ShieldCheck size={18} className="text-primary" />
                          <span className="text-sm font-bold">Modo Sandbox (Teste)</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={setting.is_sandbox}
                          onChange={(e) => updatePaymentSetting(provider, { is_sandbox: e.target.checked })}
                          className="size-5 rounded-lg border-black/10 dark:border-white/10 text-primary focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Chave de API / Access Token</label>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                          <input
                            type="password"
                            placeholder="Insira seu token aqui..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm"
                            value={setting.credentials?.token || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (setting.credentials?.token || '')) {
                                updatePaymentSetting(provider, {
                                  credentials: { ...setting.credentials, token: e.target.value }
                                });
                              }
                            }}
                          />
                        </div>
                      </div>

                      {provider === 'stripe' && (
                        <div className="space-y-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Public Key</label>
                          <input
                            type="text"
                            placeholder="pk_test_..."
                            className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm"
                            value={setting.credentials?.publicKey || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (setting.credentials?.publicKey || '')) {
                                updatePaymentSetting(provider, {
                                  credentials: { ...setting.credentials, publicKey: e.target.value }
                                });
                              }
                            }}
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Webhook Secret / Link</label>
                        <input
                          type="text"
                          placeholder="Secret de validação..."
                          className="w-full px-4 py-4 bg-slate-50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono text-sm"
                          value={setting.webhook_secret || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (setting.webhook_secret || '')) {
                              updatePaymentSetting(provider, { webhook_secret: e.target.value });
                            }
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-black/5 dark:border-white/5">
                      <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500" size={16} />
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                          Configurações salvas automaticamente
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

      {activeTab === 'settings' && currentAdmin && (
        <div className="space-y-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl shadow-black/5 dark:shadow-white/5 p-8">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Configurações do Negócio</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Defina os canais de atendimento e contatos para os seus clientes.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">WhatsApp para Suporte</label>
                <input
                  type="tel"
                  value={adminSupportNumber}
                  onChange={e => setAdminSupportNumber(e.target.value)}
                  placeholder="Ex: 5584999999999"
                  className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-800/50 border border-black/10 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
                <button
                  onClick={saveAdminSupportNumber}
                  disabled={savingSettings}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {savingSettings ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {savingSettings ? 'Salvando...' : 'Salvar WhatsApp'}
                </button>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Logo das Notificações Push</label>
                <div className="flex flex-col items-center gap-4 p-6 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-black/10 dark:border-white/10">
                  <div className="size-20 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border border-black/5 shadow-sm">
                    {adminPushLogoUrl ? (
                      <img src={adminPushLogoUrl} alt="Push Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Bell size={32} className="text-slate-300" />
                    )}
                  </div>
                  <input
                    id="push_logo_input"
                    type="file"
                    onChange={handleLogoUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  <label
                    htmlFor="push_logo_input"
                    className="flex items-center gap-2 text-xs font-black text-primary hover:bg-primary/10 px-4 py-2 rounded-lg cursor-pointer transition-all active:scale-95"
                  >
                    {uploadingLogo ? <Loader2 className="animate-spin" size={14} /> : <Smartphone size={14} />}
                    {uploadingLogo ? 'Subindo...' : 'Escolher Logo do Push'}
                  </label>
                  <p className="text-[10px] text-slate-400 text-center">Tamanho recomendado: 192x192px (PNG/JPG). Esta logo aparecerá nos alertas enviados aos seus clientes.</p>
                </div>

                <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Ou cole o link direto da imagem</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={adminPushLogoLink}
                      onChange={e => setAdminPushLogoLink(e.target.value)}
                      placeholder="https://exemplo.com/sua-logo.png"
                      className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-black/10 dark:border-white/10 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      onClick={savePushLogoLink}
                      disabled={savingSettings || !adminPushLogoLink}
                      className="px-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      Salvar Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

    </Layout>
  );
}
