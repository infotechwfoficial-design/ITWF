import React from 'react';
import Sidebar, { NavItem } from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';
import { Chatbot } from './Chatbot';
import { useAuth } from '../context/AuthContext';
import { isClient } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  sidebarItems?: NavItem[];
  bottomNavItems?: any[];
  mobileHeaderTitle?: string;
  mobileHeaderShowBack?: boolean;
  mobileHeaderOnBack?: () => void;
  onLogout?: () => void;
  activeTab?: string;
  showNotifications?: boolean;
}

export default function Layout({ 
  children, 
  sidebarItems, 
  bottomNavItems, 
  mobileHeaderTitle,
  mobileHeaderShowBack,
  mobileHeaderOnBack,
  onLogout,
  activeTab,
  showNotifications = true
}: LayoutProps) {
  const { profile } = useAuth();
  const customLogo = isClient(profile) ? profile.push_logo_url : undefined;
  // Se o título não for passado, tenta usar o nome que injetamos no perfil via AuthContext ou ITWF
  const systemTitle = mobileHeaderTitle || (isClient(profile) && (profile as any).admin_name) || "ITWF";

  return (
    <div className="flex flex-col md:flex-row h-screen bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      <Sidebar 
        items={sidebarItems} 
        title={systemTitle} 
        logoUrl={customLogo}
        activeId={activeTab} 
        onLogout={onLogout} 
      />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <MobileHeader 
          title={systemTitle} 
          logoUrl={customLogo}
          showBackButton={mobileHeaderShowBack}
          onBack={mobileHeaderOnBack}
          onLogout={onLogout}
          showNotifications={showNotifications}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pb-24 md:pb-8 custom-scrollbar">
          {children}
        </main>
        <BottomNav items={bottomNavItems} activeId={activeTab} />
      </div>
      <Chatbot />
    </div>
  );
}
