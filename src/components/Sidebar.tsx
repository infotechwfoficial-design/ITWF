import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  CreditCard,
  ReceiptText,
  Headset,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Film,
  LogOut
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../utils/supabase';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Painel Geral' },
    { path: '/request-content', icon: Film, label: 'Pedir Conteúdo' },
    { path: '/plans', icon: CreditCard, label: 'Assinaturas' },
    { path: '/invoices', icon: ReceiptText, label: 'Faturas' },
    { path: '/support', icon: Headset, label: 'Suporte Técnico', separator: true },
    { path: '/settings', icon: SettingsIcon, label: 'Configurações' },
  ];

  return (
    <aside className="hidden md:flex w-64 flex-col border-r border-black/5 dark:border-white/5 bg-slate-50 dark:bg-slate-900/50 backdrop-blur-sm p-4 h-full overflow-y-auto transition-colors duration-300">
      <div className="flex items-center gap-4 text-slate-900 dark:text-white mb-8 px-2 cursor-pointer" onClick={() => navigate('/')}>
        <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" />
        <h2 className="text-xl font-bold tracking-tight">ITWF</h2>
      </div>

      <nav className="flex flex-col gap-2 flex-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <React.Fragment key={item.path}>
              {item.separator && <div className="mt-6 border-t border-black/5 dark:border-white/5 pt-6" />}
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <Icon size={20} className={isActive ? 'text-primary' : 'group-hover:text-primary'} />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-black/5 dark:border-white/5 space-y-1">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          {theme === 'light' ? (
            <>
              <Moon size={20} className="group-hover:text-primary" />
              <span className="text-sm font-medium">Modo Escuro</span>
            </>
          ) : (
            <>
              <Sun size={20} className="group-hover:text-primary" />
              <span className="text-sm font-medium">Modo Claro</span>
            </>
          )}
        </button>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate('/login');
          }}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all font-bold"
        >
          <LogOut size={20} />
          <span className="text-sm">Sair da Conta</span>
        </button>
      </div>
    </aside>
  );
}
