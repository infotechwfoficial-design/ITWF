import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  Info,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Notification } from '../types';

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    fetch(`${apiUrl}/api/notifications`)
      .then(res => res.json())
      .then(data => {
        setNotifications(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="animate-spin text-primary" size={48} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Notificações e Avisos</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Fique por dentro de tudo o que acontece na sua conta.</p>
          </div>
        </header>

        <div className="space-y-4">
          {notifications.map((notif, i) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-slate-50 dark:bg-slate-900/40 border border-black/5 dark:border-white/5 rounded-2xl p-6 flex items-start gap-6 group hover:bg-slate-100 dark:hover:bg-white/5 transition-all shadow-sm`}
            >
              <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${notif.type === 'warning' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' :
                notif.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' :
                  notif.type === 'info' ? 'bg-primary/10 text-primary' :
                    'bg-rose-500/10 text-rose-600 dark:text-rose-500'
                }`}>
                {notif.type === 'warning' ? <AlertCircle size={24} /> :
                  notif.type === 'success' ? <CheckCircle2 size={24} /> :
                    notif.type === 'info' ? <Info size={24} /> :
                      <Bell size={24} />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">{notif.title}</h3>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(notif.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{notif.message}</p>
              </div>
            </motion.div>
          ))}
          {notifications.length === 0 && (
            <div className="py-20 text-center text-slate-500 italic">
              Nenhuma notificação encontrada.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
