import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
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
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Toast from '../components/Toast';
import { supabase } from '../utils/supabase';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

export default function Settings() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    language: 'Português (Brasil)'
  });

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/');
        return;
      }

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: '',
          language: 'Português (Brasil)'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    if (file.size > 2 * 1024 * 1024) { // Limite de 2MB
      showToast('A imagem selecionada é muito grande. O limite máximo é 2MB.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('clients')
        .update({ avatar_url: publicUrl })
        .eq('user_id', session.user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      showToast('Foto de perfil atualizada com sucesso!', 'success');
    } catch (error: any) {
      showToast('Erro ao fazer upload: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (saving) return;
    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/');
        return;
      }

      const { error } = await supabase
        .from('clients')
        .update({
          name: formData.name
        })
        .eq('user_id', session.user.id);

      if (error) throw error;
      showToast('Configurações salvas com sucesso!', 'success');

      // Refresh profile data
      await fetchProfile();
    } catch (error: any) {
      showToast('Erro ao salvar: ' + error.message, 'error');
    } finally {
      setSaving(false);
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <header>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Configurações do Perfil</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie suas informações pessoais e preferências de segurança.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
              <div className="relative group">
                <div className="size-28 rounded-full border-4 border-primary/20 overflow-hidden mb-4 bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
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

            <nav className="bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
              <button className="w-full flex items-center justify-between px-5 py-4 bg-primary/10 text-primary border-l-4 border-primary font-bold text-sm">
                <div className="flex items-center gap-3">
                  <User size={18} />
                  <span>Dados Pessoais</span>
                </div>
                <ChevronRight size={16} />
              </button>
              <button className="w-full flex items-center justify-between px-5 py-4 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors font-medium text-sm">
                <div className="flex items-center gap-3">
                  <Lock size={18} />
                  <span>Segurança</span>
                </div>
                <ChevronRight size={16} />
              </button>
              <button className="w-full flex items-center justify-between px-5 py-4 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors font-medium text-sm">
                <div className="flex items-center gap-3">
                  <Bell size={18} />
                  <span>Notificações</span>
                </div>
                <ChevronRight size={16} />
              </button>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/');
                }}
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

          {/* Form Area */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/10 rounded-2xl p-8 space-y-8 shadow-sm"
            >
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-4">Informações Básicas</h3>

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
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800/50 border border-black/10 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
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
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-900/50 border border-black/5 dark:border-white/5 rounded-xl text-slate-500 dark:text-slate-400 focus:outline-none cursor-not-allowed"
                        title="Para alterar seu e-mail de acesso, entre em contato com o suporte."
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6 pt-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-black/5 dark:border-white/5 pb-4">Segurança da Conta</h3>
                <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="size-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
                      <Shield size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Autenticação em Duas Etapas</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Adicione uma camada extra de segurança.</p>
                    </div>
                  </div>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-black/5 dark:border-white/5">
                <button
                  onClick={() => fetchProfile()}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all font-medium disabled:opacity-50"
                >
                  Descartar
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="px-8 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
