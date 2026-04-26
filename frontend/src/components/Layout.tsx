"use client";

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* SideNavBar (Desktop Only) */}
      <aside className="hidden lg:flex flex-col gap-2 p-4 h-full bg-white text-slate-700 font-['Inter'] text-sm font-medium w-64 border-r border-slate-200">
        <div className="mb-8 px-4">
          <h2 className="text-lg font-black text-slate-900">FinPrecision</h2>
          <p className="text-xs text-slate-500">{user?.name || 'Personal Tier'}</p>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 bg-slate-100 text-slate-900 rounded-lg shadow-sm">
            <span className="material-symbols-outlined">dashboard</span>
            <span>Dashboard</span>
          </Link>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-lg transition-transform duration-200">
            <span className="material-symbols-outlined">receipt_long</span>
            <span>Transactions</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-lg transition-transform duration-200">
            <span className="material-symbols-outlined">account_balance_wallet</span>
            <span>Budgets</span>
          </a>
        </nav>
        <div className="mt-auto border-t border-slate-100 pt-4 flex flex-col gap-1">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-transform duration-200 w-full text-left"
          >
            <span className="material-symbols-outlined">logout</span>
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopAppBar */}
        <header className="bg-white border-b border-slate-200 shadow-sm flex justify-between items-center h-16 px-4 md:px-6 w-full sticky top-0 z-40 shrink-0">
          <div className="flex items-center gap-4 md:gap-8">
            <span className="text-xl font-bold tracking-tight text-slate-800 lg:hidden">FinPrecision</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-sm text-slate-600 font-medium">
              {user?.email}
            </div>
            <button className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-all active:scale-95 lg:hidden" onClick={logout}>
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 lg:pb-6">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </main>

        {/* BottomNavBar (Mobile Only) */}
        <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-4 pb-safe lg:hidden bg-white text-slate-700 border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] rounded-t-xl">
          <Link href="/" className="flex flex-col items-center justify-center text-slate-900 bg-slate-50 rounded-xl px-3 py-1">
            <span className="material-symbols-outlined" data-weight="fill">home</span>
            <span className="text-[10px] font-medium tracking-wide uppercase">Home</span>
          </Link>
          <a href="#" className="flex flex-col items-center justify-center text-slate-400">
            <span className="material-symbols-outlined">list_alt</span>
            <span className="text-[10px] font-medium tracking-wide uppercase">Activity</span>
          </a>
          <button onClick={logout} className="flex flex-col items-center justify-center text-red-400">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-[10px] font-medium tracking-wide uppercase">Logout</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
