/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from './utils/supabase';
import { ThemeProvider } from './context/ThemeContext';
import { useRegisterSW } from 'virtual:pwa-register/react';
import PWAInstallModal from './components/PWAInstallModal';

// Autenticação carrega primeiro, o resto é baixo sob demanda (Lazy Loading)
import Login from './pages/Login';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const Success = React.lazy(() => import('./pages/Success'));
const Invoices = React.lazy(() => import('./pages/Invoices'));
const Support = React.lazy(() => import('./pages/Support'));
const Settings = React.lazy(() => import('./pages/Settings'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const Plans = React.lazy(() => import('./pages/Plans'));
const Tutorials = React.lazy(() => import('./pages/Tutorials'));
const Terms = React.lazy(() => import('./pages/Terms'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Admin = React.lazy(() => import('./pages/Admin'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const RequestContent = React.lazy(() => import('./pages/RequestContent'));
const UpdatePassword = React.lazy(() => import('./pages/UpdatePassword'));




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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setIsAdmin(session?.user?.email === 'info.tech.wf.oficial@gmail.com');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
      const hasDismissed = sessionStorage.getItem('pwa_install_dismissed');
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

      if (!hasDismissed && !isStandalone) {
        setShowInstallModal(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Also check for iOS (which doesn't fire beforeinstallprompt)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const hasDismissed = sessionStorage.getItem('pwa_install_dismissed');
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
        <Suspense fallback={
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-6">
            <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain animate-pulse" />
            <p className="text-primary font-bold animate-pulse uppercase tracking-widest text-sm">Carregando Tela...</p>
          </div>
        }>
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
        </Suspense>
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
            sessionStorage.setItem('pwa_install_dismissed', 'true');
          }}
        />
      )}
    </ThemeProvider>
  );
}
