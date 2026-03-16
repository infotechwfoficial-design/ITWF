import React, { useState, useEffect, useCallback } from 'react';
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
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Client, Notification, Plan } from '../types';
import { supabase } from '../utils/supabase';
import Toast from '../components/Toast';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export default function Admin() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState<'clients' | 'notifications' | 'requests' | 'plans'>('clients');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Plan Form State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: 0,
    duration: '',
    features: ''
  });

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  // Client Form State
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

  // Notification Form State
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    type: 'info' as Notification['type']
  });

  useEffect(() => {
    fetchClients();
    fetchNotifications();
    fetchRequests();
    fetchPlans();
  }, []);

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

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setClients(data);
  };

  const fetchNotifications = async () => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const res = await fetch(`${apiUrl}/api/notifications`);
    const data = await res.json();
    setNotifications(data);
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false });
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
          .insert([clientForm]);

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

      await fetch(`${apiUrl}/api/send-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: notifForm.title,
          message: notifForm.message
        })
      });

      setIsNotifModalOpen(false);
      setNotifForm({ title: '', message: '', type: 'info' });
      fetchNotifications();
      showToast('Notificação enviada com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const sendDirectPush = async (client: Client) => {
    const message = window.prompt(`Enviar notificação direta para ${client.name}:`, `Olá ${client.name}, sua assinatura vence em ${client.expiration_date}.`);
    if (message) {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${apiUrl}/api/send-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Aviso de Vencimento',
            message,
            email: client.email
          })
        });
        
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || 'Falha ao enviar push');
        
        showToast('Notificação enviada!', 'success');
      } catch (err: any) {
        showToast(`Erro ao enviar notificação: ${err.message}`, 'error');
      }
    }
  };

  const deleteClient = async (client: Client) => {
    if (window.confirm(`Tem certeza que deseja excluir o cliente ${client.name}? Esta ação apagará permanentemente todos os pedidos, faturas e registros de notificação vinculados.`)) {
      try {
        // 1. Delete push subscriptions
        await supabase.from('push_subscriptions').delete().eq('email', client.email);
        
        // 2. Delete requests
        await supabase.from('requests').delete().eq('username', client.username);
        
        // 3. Delete invoices
        if (client.user_id) {
          await supabase.from('invoices').delete().eq('user_id', client.user_id);
        }

        // 4. Delete the client itself
        const { error } = await supabase.from('clients').delete().eq('id', client.id);
        
        if (error) throw error;

        showToast('Cliente e acesso ao App completamente excluídos!', 'success');
        fetchClients();
      } catch (err: any) {
        showToast('Erro crítico ao excluir conta do cliente: ' + err.message, 'error');
      }

    }
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
        email
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

  const openEditClient = (client: Client) => {
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

  const openEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      features: JSON.parse(plan.features || '[]').join(', ')
    });
    setIsPlanModalOpen(true);
  };

  const openViewClient = (client: Client) => {
    setViewingClient(client);
    setIsViewModalOpen(true);
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
                    <tr
                      key={client.id}
                      className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors cursor-pointer group"
                      onClick={() => openViewClient(client)}
                    >
                      <td className="px-6 py-4 font-mono text-sm text-primary">{client.username}</td>
                      <td className="px-6 py-4 font-bold">{client.name}</td>
                      <td className="px-6 py-4 text-slate-500">{client.expiration_date}</td>
                      <td className="px-6 py-4 font-black">R$ {Number(client.balance || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => sendDirectPush(client)}
                            className="p-2 text-slate-400 hover:text-amber-500 transition-colors"
                            title="Enviar Notificação Push"
                          >
                            <Bell size={18} />
                          </button>
                          <button
                            onClick={() => openEditClient(client)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteClient(client)}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-black/5 dark:divide-white/5">
              {clients.map((client, idx) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={client.id}
                  className="p-5 active:bg-black/5 dark:active:bg-white/5 transition-colors cursor-pointer relative overflow-hidden"
                  onClick={() => openViewClient(client)}
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
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditClient(client); }}
                        className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-600 dark:text-slate-400"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteClient(client.id); }}
                        className="p-2 bg-rose-500/10 rounded-xl text-rose-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {clients.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500 italic">
                Nenhum cliente cadastrado.
              </div>
            )}
          </motion.div>
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
              <button
                onClick={() => setIsNotifModalOpen(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-wider shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                <Plus size={18} />
                Criar
              </button>
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
                <h3 className="text-xl font-bold tracking-tight font-display">Envio de Notificação</h3>
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
                    <tr key={plan.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 font-bold">{plan.name}</td>
                      <td className="px-6 py-4 font-black text-primary">R$ {Number(plan.price || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-500">{plan.duration}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditPlan(plan)}
                            className="p-2 text-slate-400 hover:text-primary transition-colors"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => deletePlan(plan.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-black/5 dark:divide-white/5">
              {plans.map((plan) => (
                <div key={plan.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-base">{plan.name}</h4>
                    <p className="text-sm font-black text-primary">R$ {Number(plan.price || 0).toFixed(2)} <span className="text-[10px] text-slate-400 font-normal">/ {plan.duration}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditPlan(plan)}
                      className="p-2 bg-primary/10 text-primary rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deletePlan(plan.id)}
                      className="p-2 bg-rose-500/10 text-rose-500 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {plans.length === 0 && (
              <div className="px-6 py-12 text-center text-slate-500 italic">
                Nenhum plano cadastrado.
              </div>
            )}
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
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Duração</label>
                    <input
                      type="text"
                      required
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-black/5 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      value={planForm.duration}
                      onChange={(e) => setPlanForm({ ...planForm, duration: e.target.value })}
                      placeholder="Ex: 1 Mês"
                    />
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
    </Layout>
  );
}
