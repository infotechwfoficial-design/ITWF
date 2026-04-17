import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Film,
    CreditCard,
    Settings as SettingsIcon,
    LifeBuoy,
    LucideIcon
} from 'lucide-react';

interface BottomNavItem {
    id?: string;
    path?: string;
    icon: LucideIcon;
    label: string;
    onClick?: () => void;
}

interface BottomNavProps {
    items?: BottomNavItem[];
    activeId?: string;
}

export default function BottomNav({ items, activeId }: BottomNavProps) {
    const location = useLocation();

    const defaultItems: BottomNavItem[] = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Painel' },
        { path: '/request-content', icon: Film, label: 'Pedir' },
        { path: '/plans', icon: CreditCard, label: 'Planos' },
        { path: '/support', icon: LifeBuoy, label: 'Suporte' },
        { path: '/settings', icon: SettingsIcon, label: 'Conta' },
    ];

    const currentItems = items || defaultItems;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-black/5 dark:border-white/10 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
            <ul className="flex items-center gap-6 overflow-x-auto custom-scrollbar px-6 pb-2">
                {currentItems.map((item, idx) => {
                    const isActive = item.path ? location.pathname === item.path : activeId === item.id;
                    const Icon = item.icon;

                    const content = (
                        <div className="flex flex-col items-center gap-1 py-1 transition-all duration-300">
                            <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                                {item.label}
                            </span>
                        </div>
                    );

                    return (
                        <li key={item.path || item.id || idx} className="flex-shrink-0 flex flex-col justify-center min-w-[64px]">
                            {item.path ? (
                                <Link
                                    to={item.path}
                                    className={isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}
                                >
                                    {content}
                                </Link>
                            ) : (
                                <button
                                    onClick={item.onClick}
                                    className={`w-full ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}
                                >
                                    {content}
                                </button>
                            )}
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
