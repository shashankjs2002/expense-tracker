"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <span className="material-symbols-outlined text-primary text-4xl animate-spin" data-icon="refresh">refresh</span>
          <p className="mt-4 text-on-surface-variant font-label-md">Loading session...</p>
        </div>
      </div>
    );
  }

  // If we're authenticated, render the children
  if (user) {
    return <>{children}</>;
  }

  // Fallback (shouldn't be reached due to router.push)
  return null;
}
