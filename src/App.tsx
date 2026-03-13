/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import PWAInstallModal from './components/PWAInstallModal';

import { ThemeProvider } from './context/ThemeContext';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
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
    console.log('App: Verificando sessão do Supabase...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('App: Sessão recuperada:', !!session);
      setIsAuthenticated(!!session);
      setIsAdmin(session?.user?.email === 'info.tech.wf.oficial@gmail.com');
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
      setIsAdmin(session?.user?.email === 'info.tech.wf.oficial@gmail.com');
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
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={isAdmin ? <Admin /> : <Navigate to="/admin/login" />}
          />

          <Route
            path="/"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/checkout"
            element={isAuthenticated ? <Checkout /> : <Navigate to="/login" />}
          />
          <Route
            path="/success"
            element={isAuthenticated ? <Success /> : <Navigate to="/login" />}
          />
          <Route
            path="/invoices"
            element={isAuthenticated ? <Invoices /> : <Navigate to="/login" />}
          />
          <Route
            path="/support"
            element={isAuthenticated ? <Support /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <Settings /> : <Navigate to="/login" />}
          />
          <Route
            path="/plans"
            element={isAuthenticated ? <Plans /> : <Navigate to="/login" />}
          />
          <Route
            path="/tutorials"
            element={isAuthenticated ? <Tutorials /> : <Navigate to="/login" />}
          />
          <Route
            path="/notifications"
            element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />}
          />
          <Route
            path="/request-content"
            element={isAuthenticated ? <RequestContent /> : <Navigate to="/login" />}
          />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>

      {/* PWA Toast Notification */}
      {(offlineReady || needRefresh) && (
        <div className="fixed bottom-4 right-4 z-[9999] bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 flex flex-col gap-3 min-w-[300px] animate-in slide-in-from-bottom-5">
          <div className="flex flex-col gap-1">
            <h4 className="font-bold text-slate-900 dark:text-white">
              {offlineReady ? 'App pronto para uso offline!' : 'Nova atualização disponível!'}
            </h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {offlineReady ? 'Você pode usar o app sem internet.' : 'Clique em atualizar para ver as novidades.'}
            </p>
          </div>
          <div className="flex gap-2">
            {needRefresh && (
              <button
                onClick={() => updateServiceWorker(true)}
                className="flex-1 bg-primary text-white py-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20"
              >
                Atualizar Agora
              </button>
            )}
            <button
              onClick={close}
              className="flex-1 bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white py-2 rounded-xl text-sm font-bold"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
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
