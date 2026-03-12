import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell, ArrowLeft } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface MobileHeaderProps {
    title?: string;
    showBackButton?: boolean;
    onBack?: () => void;
    onLogout?: () => void;
    showNotifications?: boolean;
    logoUrl?: string;
}

export default function MobileHeader({ 
    title = "ITWF", 
    showBackButton, 
    onBack, 
    onLogout, 
    showNotifications = true,
    logoUrl = "/logo.png"
}: MobileHeaderProps) {
    const navigate = useNavigate();

    const handleLogout = onLogout || (async () => {
        await supabase.auth.signOut();
        navigate('/login');
    });

    return (
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-black/5 dark:border-white/5 sticky top-0 z-40">
            <div className="flex items-center gap-3">
                {showBackButton && (
                    <button onClick={onBack || (() => navigate(-1))} className="p-2 -ml-2 text-slate-500">
                        <ArrowLeft size={20} />
                    </button>
                )}
                {!showBackButton && (
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                        <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
                        <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase font-display">{title}</h1>
                    </div>
                )}
                {showBackButton && <h1 className="text-lg font-black tracking-tight font-display">{title}</h1>}
            </div>
            <div className="flex items-center gap-2">
                {showNotifications && (
                    <button
                        onClick={() => navigate('/notifications')}
                        className="relative p-2 rounded-xl bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                    >
                        <div className="size-2 bg-primary rounded-full absolute top-2 right-2 animate-pulse" />
                        <Bell size={20} />
                    </button>
                )}
                <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                    title="Sair"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}
