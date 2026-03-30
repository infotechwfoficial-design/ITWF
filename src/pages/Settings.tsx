import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Camera,
  Save,
  ChevronRight,
  Loader2,
  LogOut,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  X,
  Smartphone as PhoneIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import { supabase } from '../utils/supabase';
import { subscribeUserToPush, unsubscribeFromPush } from '../utils/push';
import { useAuth } from '../context/AuthContext';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export default function Settings() {
  const navigate = useNavigate();
  const { profile: contextProfile, refreshProfile, signOut } = useAuth();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [checkingPush, setCheckingPush] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    language: 'Português (Brasil)'
  });

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  // Sync with AuthContext
  useEffect(() => {
    if (contextProfile) {
      setProfile(contextProfile);
      setFormData({
        name: contextProfile.name || '',
        email: contextProfile.email || '',
        phone: '',
        language: 'Português (Brasil)'
      });
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [contextProfile]);

  useEffect(() => {
    checkPushStatus();
  }, []);

  const checkPushStatus = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const register = await navigator.serviceWorker.ready;
        const subscription = await register.pushManager.getSubscription();
        setPushEnabled(!!subscription);
      } catch (err) {
        console.error('Error checking push status:', err);
      }
    }
  };

  const togglePush = async () => {
    if (!profile) return;
    setCheckingPush(true);
    try {
      if (pushEnabled) {
        await unsubscribeFromPush(profile.email);
        setPushEnabled(false);
        showToast('Notificações desativadas com sucesso.', 'success');
      } else {
        await subscribeUserToPush(profile.email, profile.username, profile.admin_id);
        const register = await navigator.serviceWorker.ready;
        const subscription = await register.pushManager.getSubscription();
        if (subscription) {
          setPushEnabled(true);
          showToast('Notificações ativadas com sucesso!', 'success');
        } else {
          showToast('Não foi possível ativar as notificações. Verifique as permissões do navegador.', 'error');
        }
      }
    } catch (err) {
      showToast('Erro ao alterar configuração de notificações.', 'error');
    } finally {
      setCheckingPush(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name
        })
        .eq('user_id', profile.user_id);

      if (error) throw error;
      
      await refreshProfile();
      showToast('Perfil atualizado com sucesso!', 'success');
    } catch (err: any) {
      showToast('Erro ao atualizar perfil: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('A imagem selecionada é muito grande. O limite máximo é 2MB.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.user_id}-${Date.now()}.${fileExt}`;
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
        .eq('user_id', profile.user_id);

      if (updateError) throw updateError;

      await refreshProfile();
      showToast('Foto de perfil atualizada com sucesso!', 'success');
    } catch (error: any) {
      showToast('Erro ao fazer upload: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Configurações do Perfil</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie suas informações pessoais e preferências de segurança.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
              <div className="relative group">
                <div className="size-28 rounded-full border-4 border-primary/20 overflow-hidden mb-4 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User size={48} className="text-slate-400" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="animate-spin text-white" size={24} />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-4 right-0 size-8 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform disabled:opacity-50"
                >
                  <Camera size={16} />
                </button>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profile?.name || 'Usuário'}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">@{profile?.username || 'user'}</p>
              <div className="mt-4 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/20 uppercase tracking-wider">
                ID: {profile?.id ? String(profile.id).split('-')[0].toUpperCase() : '---'}
              </div>
            </div>

            <nav className="bg-white/40 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center justify-between px-5 py-4 transition-all font-bold text-sm ${
                  activeTab === 'profile' 
                  ? 'bg-primary/10 text-primary border-l-4 border-primary' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <User size={18} />
                  <span>Dados Pessoais</span>
                </div>
                <ChevronRight size={16} className={`transition-transform ${activeTab === 'profile' ? 'translate-x-1' : ''}`} />
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center justify-between px-5 py-4 transition-all font-bold text-sm ${
                  activeTab === 'security' 
                  ? 'bg-primary/10 text-primary border-l-4 border-primary' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Lock size={18} />
                  <span>Segurança</span>
                </div>
                <ChevronRight size={16} className={`transition-transform ${activeTab === 'security' ? 'translate-x-1' : ''}`} />
              </button>
              <button 
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center justify-between px-5 py-4 transition-all font-bold text-sm ${
                  activeTab === 'notifications' 
                  ? 'bg-primary/10 text-primary border-l-4 border-primary' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Bell size={18} />
                  <span>Notificações</span>
                </div>
                <ChevronRight size={16} className={`transition-transform ${activeTab === 'notifications' ? 'translate-x-1' : ''}`} />
              </button>
              <button
                onClick={signOut}
                className="w-full flex items-center justify-between px-5 py-4 text-rose-500 hover:bg-rose-500/10 transition-colors font-bold text-sm border-t border-black/5 dark:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={18} />
                  <span>Sair da Conta</span>
                </div>
                <ChevronRight size={16} />
              </button>
            </nav>
          </div>

          <div className="lg:col-span-2 relative overflow-hidden min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeTab === 'profile' && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/40 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-sm backdrop-blur-md"
                >
                  <form onSubmit={handleSaveProfile} className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-4">Informações Básicas</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Nome Completo</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={18} className="text-slate-500" />
                          </div>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-slate-800/50 border border-black/10 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 opacity-60">
                        <label className="text-sm font-medium text-slate-500 dark:text-slate-400">E-mail (Não alterável)</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail size={18} className="text-slate-500" />
                          </div>
                          <input
                            type="email"
                            disabled
                            value={formData.email}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100/50 dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-2xl text-slate-500 dark:text-slate-400 focus:outline-none cursor-not-allowed"
                            title="Para alterar seu e-mail de acesso, entre em contato com o suporte."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-6 border-t border-black/5 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            name: contextProfile?.name || '',
                            email: contextProfile?.email || '',
                            phone: '',
                            language: 'Português (Brasil)'
                          });
                        }}
                        disabled={saving}
                        className="px-6 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all font-medium disabled:opacity-50"
                      >
                        Descartar
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-2.5 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/40 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-sm backdrop-blur-md"
                >
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-4">Segurança da Conta</h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="p-6 bg-slate-100/50 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
                                <Shield size={24} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">Autenticação em Duas Etapas</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Proteja sua conta com um nível extra de segurança.</p>
                              </div>
                            </div>
                            <div className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-12 h-6.5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </div>
                         </div>
                      </div>

                      <div className="p-6 bg-slate-100/50 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center">
                            <Lock size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">Alterar Senha</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Recomendamos trocar a senha a cada 90 dias.</p>
                          </div>
                        </div>
                        <button className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-black/5 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all">
                          Atualizar
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  key="notifications"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white/40 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-[2.5rem] p-8 space-y-8 shadow-sm backdrop-blur-md"
                >
                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-4">Preferências de Notificação</h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="p-8 bg-slate-100/50 dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all">
                        <div className="flex items-start gap-4">
                          <div className={`size-14 rounded-[1.2rem] flex items-center justify-center transition-colors ${pushEnabled ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-white/10 text-slate-400'}`}>
                            <Smartphone size={28} />
                          </div>
                          <div>
                            <p className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                              Notificações Push
                              {pushEnabled && <CheckCircle2 size={16} className="text-emerald-500" />}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                              Receba alertas de vencimento, pagamentos aprovados e gols em tempo real direto no seu dispositivo.
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {checkingPush && <Loader2 className="animate-spin text-primary" size={18} />}
                          <div 
                            onClick={!checkingPush ? togglePush : undefined}
                            className={`relative inline-flex items-center cursor-pointer transition-all ${checkingPush ? 'opacity-50 cursor-wait' : ''}`}
                          >
                            <div className={`w-14 h-7 rounded-full transition-colors duration-300 ${pushEnabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}>
                              <div className={`absolute top-1 left-1 bg-white size-5 rounded-full transition-transform duration-300 shadow-sm ${pushEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                        <p className="text-xs text-amber-700 dark:text-amber-400/80 leading-relaxed font-medium">
                          Nota: Notificações push requerem um navegador compatível e o Service Worker registrado. 
                          Se você não estiver recebendo, certifique-se de que permitiu as notificações nas configurações do navegador.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}
