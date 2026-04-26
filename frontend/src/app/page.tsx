"use client";

import { useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Layout from '@/components/Layout';
import ExpenseForm from '@/components/ExpenseForm';
import ExpenseFilters from '@/components/ExpenseFilters';
import TotalDisplay from '@/components/TotalDisplay';
import ExpenseList from '@/components/ExpenseList';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [category, setCategory] = useState<string>('');
  const [sort, setSort] = useState<'date_desc' | 'date_asc'>('date_desc');

  const { expenses, formattedTotal, loading, error, refetch } = useExpenses({
    category,
    sort
  });

  return (
    <AuthGuard>
      <Layout>
        <div className="flex flex-col gap-xl">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-md border-b border-slate-200 pb-md">
            <div>
              <h1 className="font-display text-display text-slate-900 tracking-tight">Overview</h1>
              <p className="text-secondary font-body-sm mt-1">
                Welcome back, {user?.name || 'User'}
              </p>
            </div>
            <TotalDisplay formattedTotal={formattedTotal} />
          </div>

          {/* Top Row: Quick Add */}
          <ExpenseForm onSuccess={refetch} />

          {/* Bottom Row: List and Filters */}
          <section className="flex flex-col gap-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
              <h3 className="font-h3 text-h3 text-primary flex items-center gap-sm">
                <span className="material-symbols-outlined text-xl" data-icon="list_alt">list_alt</span>
                Recent Transactions
              </h3>
              
              <ExpenseFilters
                category={category}
                sort={sort}
                onCategoryChange={setCategory}
                onSortChange={setSort}
              />
            </div>

            <ExpenseList
              expenses={expenses}
              loading={loading}
              error={error}
              onRetry={refetch}
              isFiltered={!!category}
              onClearFilter={() => setCategory('')}
            />
          </section>

        </div>
      </Layout>
    </AuthGuard>
  );
}
