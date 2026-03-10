import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Film,
    CreditCard,
    Settings as SettingsIcon,
    LifeBuoy
} from 'lucide-react';

export default function BottomNav() {
    const location = useLocation();

    const navItems = [
        { path: '/', icon: LayoutDashboard, label: 'Painel' },
        { path: '/request-content', icon: Film, label: 'Pedir' },
        { path: '/plans', icon: CreditCard, label: 'Planos' },
        { path: '/support', icon: LifeBuoy, label: 'Suporte' },
        { path: '/settings', icon: SettingsIcon, label: 'Conta' },
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-black/5 dark:border-white/10 px-4 pb-safe pt-2">
            <ul className="flex justify-between items-center max-w-lg mx-auto">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;

                    return (
                        <li key={item.path} className="flex-1">
                            <Link
                                to={item.path}
                                className={`flex flex-col items-center gap-1 py-1 transition-all duration-300 ${isActive
                                    ? 'text-primary'
                                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                            >
                                <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                    {item.label}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
