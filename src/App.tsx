/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';
import { supabase } from './utils/supabase';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy loading pages for performance
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Sports = lazy(() => import('./pages/Sports'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Success = lazy(() => import('./pages/Success'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Support = lazy(() => import('./pages/Support'));
const Settings = lazy(() => import('./pages/Settings'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Plans = lazy(() => import('./pages/Plans'));
const Tutorials = lazy(() => import('./pages/Tutorials'));
const Terms = lazy(() => import('./pages/Terms'));
const Maintenance = lazy(() => import('./pages/Maintenance'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Admin = lazy(() => import('./pages/Admin'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const RequestContent = lazy(() => import('./pages/RequestContent'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const SaaS = lazy(() => import('./pages/SaaS'));

import PWAInstallModal from './components/PWAInstallModal';
import { ThemeProvider } from './context/ThemeContext';
import { useRegisterSW } from 'virtual:pwa-register/react';

const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-6">
    <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain animate-pulse" />
    <p className="text-primary font-bold animate-pulse uppercase tracking-widest text-sm">Carregando Experiência...</p>
  </div>
);

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(false);

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

  // Efeito 1: Verificação INICIAL da sessão (executa apenas uma vez)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referralId = params.get('ref');
    if (referralId) {
      localStorage.setItem('referralId', referralId);
    }

    const checkSession = async () => {
      try {
        console.log('App: Verificando sessão inicial...');
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: adminData } = await supabase
            .from('admins')
            .select('id')
            .eq('user_id', session.user.id)
            .maybeSingle();
          setIsAdmin(!!adminData);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('App: Erro na verificação de sessão inicial:', err);
        setIsAuthenticated(false);
        setIsAdmin(false);
      }
    };

    checkSession();

    // Aviso após 15 segundos se ainda estiver no carregamento inicial
    const loadingTimer = setTimeout(() => {
      setSessionTimeout(prev => {
        // Só ativa o timeout se ainda não há estado definido
        if (isAuthenticated === null) return true;
        return prev;
      });
    }, 15000);

    return () => clearTimeout(loadingTimer);
  }, []); // <- Array vazio: executa apenas na montagem

  // Efeito 2: Listener de mudanças de autenticação em tempo real
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('App: Auth state changed ->', _event);

      if (_event === 'PASSWORD_RECOVERY') {
        window.location.href = '/update-password';
        return;
      }

      if (_event === 'SIGNED_OUT') {
        // Limpa tudo e redireciona
        localStorage.removeItem('isAdminAuthenticated');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('currentUser');
        setIsAuthenticated(false);
        setIsAdmin(false);
        return;
      }

      const isAuth = !!session;
      setIsAuthenticated(isAuth);

      if (isAuth && session?.user) {
        const { data: adminData } = await supabase
          .from('admins')
          .select('id')
          .eq('user_id', session.user.id)
          .maybeSingle();
        setIsAdmin(!!adminData);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // <- Array vazio: registra o listener apenas uma vez

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-6 p-6 text-center">
        <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain animate-pulse" />
        <p className="text-primary font-bold animate-pulse uppercase tracking-widest text-sm">Carregando Experiência...</p>
        
        {sessionTimeout && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex flex-col items-center gap-4"
          >
            <p className="text-xs text-slate-500 max-w-[250px]">
              O carregamento está demorando mais que o normal. Verifique sua conexão.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="text-xs font-bold text-primary underline"
            >
              Recarregar Página
            </button>
          </motion.div>
        )}
      </div>
    );
  }

  if (isMaintenance) {
    return <Maintenance />;
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
        <Suspense fallback={<LoadingFallback />}>
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
            <Route
              path="/sports"
              element={isAuthenticated ? <Sports /> : <Navigate to="/" />}
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
        </Suspense>
      </Router>

      {/* PWA Update Modal Centralizado */}
      <AnimatePresence>
        {(offlineReady || needRefresh) && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
              onClick={close}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-2xl border border-white/10 flex flex-col items-center text-center gap-6"
            >
              <div className="size-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center animate-bounce shadow-inner">
                <RefreshCw size={40} />
              </div>
              
              <div className="space-y-2">
                <h4 className="font-black text-2xl text-slate-900 dark:text-white tracking-tight uppercase">
                  {offlineReady ? 'Sistema Pronto!' : 'Nova Atualização!'}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed px-4">
                  {offlineReady 
                    ? 'O ITWF já pode ser usado totalmente offline no seu dispositivo.' 
                    : 'Lançamos melhorias críticas de performance e segurança para sua experiência.'}
                </p>
              </div>
              
              <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => {
                      updateServiceWorker(true);
                      // Fallback: se não recarregar em 1.5s, força o recarregamento
                      setTimeout(() => window.location.reload(), 1500);
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/30 transition-all active:scale-95"
                  >
                    ATUALIZAR AGORA 🚀
                  </button>
                <button
                  onClick={close}
                  className="w-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                >
                  DEIXAR PARA DEPOIS
                </button>
              </div>
            </motion.div>
          </div>
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
    </ErrorBoundary>
  );
}
