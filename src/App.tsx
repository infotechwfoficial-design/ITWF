/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { supabase } from './utils/supabase';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Invoices from './pages/Invoices';
import Support from './pages/Support';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import Plans from './pages/Plans';
import Tutorials from './pages/Tutorials';
import Terms from './pages/Terms';
import Maintenance from './pages/Maintenance';
import Notifications from './pages/Notifications';
import Admin from './pages/Admin';
import AdminLogin from './pages/AdminLogin';
import RequestContent from './pages/RequestContent';
import UpdatePassword from './pages/UpdatePassword';
import SaaS from './pages/SaaS';
import PWAInstallModal from './components/PWAInstallModal';

import { ThemeProvider } from './context/ThemeContext';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isMaintenance, setIsMaintenance] = useState(false);

  // Lógica de Subdomínio (Opção A para Vercel)
  const hostname = window.location.hostname;
  const isSubdomain = hostname.startsWith('painel.') || hostname.startsWith('app.');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  // PWAs Update Handling
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  useEffect(() => {
    // CAPTURA GLOBAL DO LINK DE INDICAÇÃO (?ref=...)
    // Isso garante que não importa em qual aba o cliente caia primeiro (/plans, /login, /), 
    // ele ficará eternamente vinculado ao revendedor nas memórias do dispositivo.
    const params = new URLSearchParams(window.location.search);
    const referralId = params.get('ref');
    if (referralId) {
      localStorage.setItem('referralId', referralId);
    }

    console.log('App: Verificando sessão do Supabase...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('App: Sessão recuperada:', !!session);
      setIsAuthenticated(!!session);
      if (session?.user) {
        supabase
          .from('admins')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => setIsAdmin(!!data));
      } else {
        setIsAdmin(false);
      }
    }).catch(err => {
      console.error('App: Erro ao recuperar sessão:', err);
      setIsAuthenticated(false); // Fallback para não ficar carregando infinito
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('App: Mudança de estado Auth:', _event, !!session);
      
      if (_event === 'PASSWORD_RECOVERY') {
        window.location.href = '/update-password';
        return;
      }

      setIsAuthenticated(!!session);
      if (session?.user) {
        supabase
          .from('admins')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => setIsAdmin(!!data));
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Delay showing the modal for better UX (3 seconds after load)
      const hasDismissed = localStorage.getItem('pwa_install_dismissed');
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

      if (!hasDismissed && !isStandalone) {
        setShowInstallModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also check for iOS (which doesn't fire beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const hasDismissed = localStorage.getItem('pwa_install_dismissed');
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

    if (isIOS && !isStandalone && !hasDismissed) {
      setShowInstallModal(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // Show a loading screen while resolving initial session
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-6">
        <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain animate-pulse" />
        <p className="text-primary font-bold animate-pulse uppercase tracking-widest text-sm">Carregando Segurança...</p>
      </div>
    );
  }

  if (isMaintenance) {
    return <Maintenance />;
  }

  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to={isSubdomain ? "/admin" : "/dashboard"} replace />
              ) : (
                <Login onLogin={() => setIsAuthenticated(true)} />
              )
            }
          />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />}
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/" element={isSubdomain ? <Navigate to="/login" /> : <SaaS />} />
          <Route path="/revenda" element={<Navigate to="/" />} />
          <Route path="/saas" element={<Navigate to="/" />} />

          <Route
            path="/checkout"
            element={isAuthenticated ? <Checkout /> : <Navigate to="/" />}
          />
          <Route
            path="/success"
            element={isAuthenticated ? <Success /> : <Navigate to="/" />}
          />
          <Route
            path="/invoices"
            element={isAuthenticated ? <Invoices /> : <Navigate to="/" />}
          />
          <Route
            path="/support"
            element={isAuthenticated ? <Support /> : <Navigate to="/" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <Settings /> : <Navigate to="/" />}
          />
          <Route
            path="/plans"
            element={isAuthenticated ? <Plans /> : <Navigate to="/" />}
          />
          <Route
            path="/tutorials"
            element={isAuthenticated ? <Tutorials /> : <Navigate to="/" />}
          />
          <Route
            path="/notifications"
            element={isAuthenticated ? <Notifications /> : <Navigate to="/" />}
          />
          <Route
            path="/request-content"
            element={isAuthenticated ? <RequestContent /> : <Navigate to="/" />}
          />

          <Route
            path="/admin"
            element={isAuthenticated && isAdmin ? <Admin /> : <Navigate to="/admin/login" />}
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>

      {/* PWA Toast Notification */}
      <AnimatePresence>
        {(offlineReady || needRefresh) && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 z-[9999] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-black/5 dark:border-white/10 flex flex-col gap-4 min-w-[320px] max-w-[400px]"
          >
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center animate-pulse">
                <RefreshCw size={24} />
              </div>
              <div className="flex flex-col">
                <h4 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight leading-tight">
                  {offlineReady ? 'App Offline Pronto!' : 'Nova Versão! 🚀'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {offlineReady ? 'O sistema está pronto para uso sem internet.' : 'Acabamos de lançar melhorias incríveis.'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {needRefresh && (
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="flex-1 bg-primary hover:bg-primary/90 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                  Atualizar Agora
                </button>
              )}
              <button
                onClick={close}
                className="flex-1 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
              >
                Ignorar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {showInstallModal && (
        <PWAInstallModal
          deferredPrompt={deferredPrompt}
          onClose={() => {
            setShowInstallModal(false);
            localStorage.setItem('pwa_install_dismissed', 'true');
          }}
        />
      )}
    </ThemeProvider>
  );
}
