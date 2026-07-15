import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const Layout: React.FC = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1 h-full min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto px-8 py-8 bg-slate-50/50 dark:bg-slate-950/20">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
