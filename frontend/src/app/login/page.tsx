/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const isExpired = searchParams.get('expired') === 'true';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as any;
        setError(axiosErr.response?.data?.message || 'Failed to login. Please check your credentials.');
      } else {
        setError('Failed to login. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col">
      <header className="bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-['Inter'] antialiased text-sm shadow-sm dark:shadow-none border-b border-slate-200 dark:border-slate-800 flex justify-between items-center h-16 px-6 w-full sticky top-0 z-40">
        <div className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-50">FinPrecision</div>
        <div className="flex items-center gap-sm">
          <span className="material-symbols-outlined text-slate-500" data-icon="help_outline">help_outline</span>
          <span className="font-label-md text-slate-500">Support</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-md">
        <div className="w-full max-w-[440px] flex flex-col gap-sm">
          {isExpired && (
            <div className="bg-error-container text-on-error-container p-md rounded-xl border border-error/10 flex items-start gap-sm shadow-sm animate-pulse-subtle">
              <span className="material-symbols-outlined text-error" data-icon="error_outline">error_outline</span>
              <div className="flex flex-col">
                <p className="font-label-md">Session expired</p>
                <p className="text-label-sm opacity-90">Please log in again to continue managing your expenses.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-md rounded-xl border border-red-200 flex items-start gap-sm shadow-sm">
              <span className="material-symbols-outlined text-red-500" data-icon="error">error</span>
              <div className="flex flex-col">
                <p className="font-label-md">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-xl shadow-elevated">
            <div className="mb-xl text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-fixed mb-md">
                <span className="material-symbols-outlined text-primary text-2xl" data-icon="lock_open">lock_open</span>
              </div>
              <h1 className="font-h1 text-primary">Welcome Back</h1>
              <p className="text-secondary font-body-sm mt-xs">Securely access your financial dashboard</p>
            </div>

            <form className="flex flex-col gap-lg" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-on-surface-variant" htmlFor="email">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" data-icon="mail">mail</span>
                  <input
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-surface-bright font-body-md"
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-xs">
                <div className="flex justify-between items-center">
                  <label className="font-label-md text-on-surface-variant" htmlFor="password">Password</label>
                  <a className="text-label-sm text-primary hover:underline" href="#">Forgot password?</a>
                </div>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline" data-icon="key">key</span>
                  <input
                    className="w-full pl-10 pr-12 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-surface-bright font-body-md"
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary active:scale-95 transition-transform"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined" data-icon={showPassword ? "visibility_off" : "visibility"}>
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <button
                className="bg-primary text-on-primary font-label-md py-4 rounded-xl shadow-lg hover:bg-primary-container active:scale-[0.98] transition-all flex items-center justify-center gap-sm disabled:opacity-70 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Logging In...' : 'Log In'}
                {!loading && <span className="material-symbols-outlined" data-icon="arrow_forward">arrow_forward</span>}
              </button>
            </form>

            <div className="relative my-xl">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold">
                <span className="bg-surface-container-lowest px-4 text-outline">or</span>
              </div>
            </div>

            <p className="text-center text-body-sm text-secondary">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-label-md text-primary hover:underline decoration-primary/30 underline-offset-4">
                Register
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
