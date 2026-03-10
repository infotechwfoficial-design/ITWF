import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import { supabase } from '../utils/supabase';

export default function MobileHeader() {
    const navigate = useNavigate();

    return (
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-black/5 dark:border-white/5 sticky top-0 z-40">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                <img src="/logo.png" alt="Logo" className="w-11 h-11 object-contain" />
                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">ITWF</h1>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => navigate('/notifications')}
                    className="relative p-2 rounded-xl bg-black/5 dark:bg-white/5 text-slate-500 dark:text-slate-400"
                >
                    <div className="size-2 bg-primary rounded-full absolute top-2 right-2 animate-pulse" />
                    <Bell size={20} />
                </button>
                <button
                    onClick={async () => {
                        await supabase.auth.signOut();
                        navigate('/login');
                    }}
                    className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors"
                    title="Sair"
                >
                    <LogOut size={20} />
                </button>
            </div>
        </header>
    );
}
