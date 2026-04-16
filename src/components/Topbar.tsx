import React, { useEffect, useRef } from 'react';
import { Search, Bell, User, MessageSquare } from 'lucide-react';

interface TopbarProps {
  moneyBalance?: number;
  userName?: string;
  onNotificationsClick?: () => void;
}

export default function Topbar({ moneyBalance = 0, userName = "Admin", onNotificationsClick }: TopbarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="hidden md:flex h-20 w-full items-center justify-between px-8 bg-white/50 dark:bg-background-dark/50 backdrop-blur-xl border-b border-black/5 dark:border-white/5 sticky top-0 z-30 transition-colors duration-300">
      <div className="flex-1 flex max-w-xl">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Pesquisa rápida... (Ctrl+K)"
            className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:text-white transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          {/* Shortcuts like Teste Rapido or Add Credits could go here */}
          <button className="hidden lg:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-xl text-sm font-semibold">
            Adicionar Créditos
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

        <div className="flex items-center gap-3">
          <button 
            onClick={onNotificationsClick}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors relative"
          >
            <MessageSquare size={18} />
          </button>
          <button 
            onClick={onNotificationsClick}
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-primary transition-colors relative"
          >
            <Bell size={18} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full animate-pulse-subtle"></span>
          </button>
        </div>

        <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{userName}</span>
            <span className="text-xs font-medium text-success">{moneyBalance.toFixed(2)} créditos</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-lg">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
