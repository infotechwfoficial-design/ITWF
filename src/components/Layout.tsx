import React from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import BottomNav from './BottomNav';
import { Chatbot } from './Chatbot';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row h-screen bg-white dark:bg-background-dark text-slate-900 dark:text-slate-100 font-sans overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 pb-24 md:pb-8 custom-scrollbar">
          {children}
        </main>
        <BottomNav />
      </div>
      <Chatbot />
    </div>
  );
}
