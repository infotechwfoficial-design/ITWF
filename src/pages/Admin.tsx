import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Bell,
  Plus,
  Trash2,
  Edit2,
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
  MessageSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
        await fetch(`${apiUrl}/api/send-push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'Aviso de Vencimento',
            message,
            username: client.username
          })
        });
        showToast('Notificação enviada!', 'success');
      } catch {
        showToast('Erro ao enviar notificação.', 'error');
      }
    }
  };

  const deleteClient = async (id: number | string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) {
        showToast('Erro ao excluir cliente.', 'error');
      } else {
        showToast('Cliente excluído com sucesso!', 'success');
        fetchClients();
      }
    }
  };

  const updateRequestStatus = async (id: number | string, status: string, username: string, title: string) => {
    await supabase.from('requests').update({ status }).eq('id', id);

    // Send push notification to client
    const apiUrl = import.meta.env.VITE_API_URL || '';
    await fetch(`${apiUrl}/api/send-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Status do seu Pedido',
        message: `O status do seu pedido "${title}" mudou para: ${status}`,
        username
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background-dark text-slate-900 dark:text-slate-100 p-4 md:p-8 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                <img src="/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                Painel Administrativo
              </h1>
              <p className="text-slate-500 dark:text-slate-400">Gerencie clientes e notificações do sistema.</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-rose-500 font-bold transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </header>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'clients'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-white dark:bg-slate-900/40 text-slate-500 border border-black/5 dark:border-white/10'
              }`}
          >
            <Users size={20} />
            Clientes
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'notifications'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-white dark:bg-slate-900/40 text-slate-500 border border-black/5 dark:border-white/10'
              }`}
          >
            <Bell size={20} />
            Notificações Push
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'requests'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-white dark:bg-slate-900/40 text-slate-500 border border-black/5 dark:border-white/10'
              }`}
          >
            <MessageSquare size={20} />
            Pedidos de Conteúdo
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${activeTab === 'plans'
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-white dark:bg-slate-900/40 text-slate-500 border border-black/5 dark:border-white/10'
              }`}
          >
            <DollarSign size={20} />
            Planos
          </button>
        </div>

        {activeTab === 'clients' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold">Lista de Clientes</h3>
              <button
                onClick={() => {
                  setEditingClient(null);
                  setClientForm({ username: '', name: '', email: '', expiration_date: '', balance: 0, renewal_link: '' });
                  setIsClientModalOpen(true);
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
              >
                <Plus size={18} />
                Novo Cliente
              </button>
            </div>
            <div className="overflow-x-auto">
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
                      <td className="px-6 py-4 font-black">R$ {client.balance.toFixed(2)}</td>
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
                            onClick={() => deleteClient(client.id)}
                            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-500 italic">
                        Nenhum cliente cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold">Notificações Enviadas</h3>
              <button
                onClick={() => setIsNotifModalOpen(true)}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
              >
                <Plus size={18} />
                Nova Notificação
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
            className="bg-white dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold">Pedidos de Clientes</h3>
            </div>
            <div className="overflow-x-auto">
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
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold">{req.client_name}</div>
                        <div className="text-xs text-slate-500 font-mono">@{req.username}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold">{req.content_title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          {req.content_type} • {req.content_year}
                          <a href={req.tmdb_link} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            TMDB <ExternalLink size={10} />
                          </a>
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
                          onChange={(e) => updateRequestStatus(req.id, e.target.value, req.username, req.content_title)}
                        >
                          <option value="AGUARDE">AGUARDE</option>
                          <option value="EM BUSCA DO SEU PEDIDO">EM BUSCA</option>
                          <option value="PEDIDO ADICIONADO">ADICIONADO</option>
                          <option value="NÃO DISPONIVEL PARA ADIÇÃO">NÃO DISPONÍVEL</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                        Nenhum pedido encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'plans' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold">Gerenciar Planos</h3>
              <button
                onClick={() => {
                  setEditingPlan(null);
                  setPlanForm({ name: '', price: 0, duration: '', features: '' });
                  setIsPlanModalOpen(true);
                }}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all"
              >
                <Plus size={18} />
                Novo Plano
              </button>
            </div>
            <div className="overflow-x-auto">
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
                      <td className="px-6 py-4 font-black text-primary">R$ {plan.price.toFixed(2)}</td>
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
                  {plans.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">
                        Nenhum plano cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Client Modal */}
        {isClientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-slate-900 border border-black/10 dark:border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
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
                        R$ {viewingClient.balance.toFixed(2)}
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
      </div>
    </div>
  );
}
