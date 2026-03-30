import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import PWAInstallModal from './components/PWAInstallModal';

// Pages
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Plans from './pages/Plans';
import Sports from './pages/Sports';
import Checkout from './pages/Checkout';
import Success from './pages/Success';
import Invoices from './pages/Invoices';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Tutorials from './pages/Tutorials';
import Notifications from './pages/Notifications';
import RequestContent from './pages/RequestContent';
import Admin from './pages/Admin';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';
import Terms from './pages/Terms';
import Maintenance from './pages/Maintenance';
import SaaS from './pages/SaaS';

const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-6">
    <img src="/logo.png" alt="Logo" className="w-24 h-24 object-contain animate-pulse" />
    <p className="text-primary font-bold animate-pulse uppercase tracking-widest text-sm">Carregando Experiência...</p>
  </div>
);

function AppContent() {
  const { user, loading, isAdmin } = useAuth();
  const [isMaintenance] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const [updateDismissed, setUpdateDismissed] = useState(() => 
    sessionStorage.getItem('pwa_update_dismissed') === 'true'
  );

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setUpdateDismissed(true);
    sessionStorage.setItem('pwa_update_dismissed', 'true');
  };

  // Efeito para atualização automática do PWA sem pedir confirmação
  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const hasDismissed = localStorage.getItem('pwa_install_dismissed');
      if (!hasDismissed) setShowInstallModal(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (loading) return <LoadingFallback />;
  if (isMaintenance) return <Maintenance />;

  return (
    <Router>
      <ErrorBoundary>
        <ThemeProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                <Route path="/" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
                <Route path="/admin-login" element={!user ? <AdminLogin /> : <Navigate to="/admin" replace />} />
                <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/" replace />} />
                <Route path="/plans" element={user ? <Plans /> : <Navigate to="/" replace />} />
                <Route path="/sports" element={user ? <Sports /> : <Navigate to="/" replace />} />
                <Route path="/checkout" element={user ? <Checkout /> : <Navigate to="/" replace />} />
                <Route path="/success" element={user ? <Success /> : <Navigate to="/" replace />} />
                <Route path="/invoices" element={user ? <Invoices /> : <Navigate to="/" replace />} />
                <Route path="/support" element={user ? <Support /> : <Navigate to="/" replace />} />
                <Route path="/settings" element={user ? <Settings /> : <Navigate to="/" replace />} />
                <Route path="/tutorials" element={user ? <Tutorials /> : <Navigate to="/" replace />} />
                <Route path="/notifications" element={user ? <Notifications /> : <Navigate to="/" replace />} />
                <Route path="/request-content" element={user ? <RequestContent /> : <Navigate to="/" replace />} />
                <Route path="/admin/*" element={user && isAdmin ? <Admin /> : <Navigate to="/admin-login" replace />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/update-password" element={<UpdatePassword />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/saas" element={<SaaS />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>

            {showInstallModal && (
              <PWAInstallModal 
                deferredPrompt={deferredPrompt} 
                onClose={() => setShowInstallModal(false)} 
              />
            )}
          </div>
        </ThemeProvider>
      </ErrorBoundary>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
