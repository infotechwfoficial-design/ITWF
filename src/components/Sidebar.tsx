import React from 'react';
import {
  LayoutDashboard,
  CreditCard,
  ReceiptText,
  Headset,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Film,
  LogOut,
  Bell,
  LucideIcon,
  ShieldCheck,
  Trophy
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../utils/supabase';

export interface NavItem {
  id?: string;
  path?: string;
  icon: LucideIcon;
  label: string;
  separator?: boolean;
  onClick?: () => void;
}

interface SidebarProps {
  items?: NavItem[];
  title?: string;
  logoUrl?: string;
  onLogout?: () => void;
  activeId?: string;
}

export default function Sidebar({ items, title = "ITWF", logoUrl = "/logo.png", onLogout, activeId }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const defaultItems: NavItem[] = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Painel Geral' },
    { path: '/sports', icon: Trophy, label: 'Arena Esportiva' },
    { path: '/request-content', icon: Film, label: 'Pedir Conteúdo' },
    { path: '/plans', icon: CreditCard, label: 'Assinaturas' },
    { path: '/invoices', icon: ReceiptText, label: 'Faturas' },
    { path: '/support', icon: Headset, label: 'Suporte Técnico', separator: true },
    { path: '/settings', icon: SettingsIcon, label: 'Configurações' },
  ];

  if (localStorage.getItem('isAdminAuthenticated') === 'true') {
    defaultItems.push({
      path: '/admin',
      icon: ShieldCheck,
      label: 'Painel Admin',
      separator: true
    });
  }

  const currentItems = items || defaultItems;

  const handleLogout = onLogout || (async () => {
    await supabase.auth.signOut();
    navigate('/');
  });

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 backdrop-blur-sm p-4 h-full overflow-y-auto transition-colors duration-300">
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white cursor-pointer" onClick={() => navigate('/dashboard')}>
          <img src={logoUrl} alt="Logo" className="w-12 h-12 object-contain" />
          <h2 className="text-xl font-black tracking-tight font-display">{title}</h2>
        </div>
        <button 
          onClick={() => navigate('/notifications')}
          className="p-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-all"
          title="Notificações"
        >
          <Bell size={20} />
        </button>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {currentItems.map((item, idx) => {
          const isActive = item.path ? location.pathname === item.path : activeId === item.id;
          const Icon = item.icon;

          const content = (
            <>
              <Icon size={20} className={isActive ? 'text-primary' : 'group-hover:text-primary'} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-sm ${isActive ? 'font-black' : 'font-medium'}`}>{item.label}</span>
            </>
          );

          return (
            <React.Fragment key={item.path || item.id || idx}>
              {item.separator && <div className="mt-6 border-t border-black/5 dark:border-white/5 pt-6" />}
              {item.path ? (
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {content}
                </Link>
              ) : (
                <button
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {content}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all group font-medium"
        >
          {theme === 'light' ? (
            <>
              <Moon size={20} className="group-hover:text-primary" />
              <span className="text-sm">Modo Escuro</span>
            </>
          ) : (
            <>
              <Sun size={20} className="group-hover:text-primary" />
              <span className="text-sm">Modo Claro</span>
            </>
          )}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all font-black uppercase text-xs tracking-widest mt-2"
        >
          <LogOut size={20} />
          <span>Sair da Conta</span>
        </button>
      </div>
    </aside>
  );
}
