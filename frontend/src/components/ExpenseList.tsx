"use client";

import { Expense } from '@/hooks/useExpenses';
import { formatAmount } from '@/lib/utils';

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  isFiltered: boolean;
  onClearFilter: () => void;
}

export default function ExpenseList({ expenses, loading, error, onRetry, isFiltered, onClearFilter }: ExpenseListProps) {
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-pulse">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between">
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 border-b border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4 w-1/2">
              <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
              <div className="flex flex-col gap-2 w-full">
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
            <div className="h-6 bg-slate-200 rounded w-1/5"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-md rounded-xl border border-red-200 flex flex-col items-center justify-center py-10 shadow-sm">
        <span className="material-symbols-outlined text-red-500 text-4xl mb-2" data-icon="error">error</span>
        <p className="font-label-md mb-4 text-center">{error}</p>
        <button 
          onClick={onRetry}
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-slate-50 text-slate-500 p-md rounded-xl border border-slate-200 flex flex-col items-center justify-center py-12 shadow-sm">
        <span className="material-symbols-outlined text-slate-300 text-6xl mb-4" data-icon="receipt_long">receipt_long</span>
        {isFiltered ? (
          <>
            <p className="font-label-md mb-2">No expenses found for this category.</p>
            <button 
              onClick={onClearFilter}
              className="text-primary hover:underline font-semibold"
            >
              Clear filter to see all
            </button>
          </>
        ) : (
          <p className="font-label-md">No expenses yet. Add your first one above!</p>
        )}
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-lg py-md font-label-sm text-label-sm text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-lg py-md font-label-sm text-label-sm text-slate-500 uppercase tracking-wider">Category</th>
              <th className="px-lg py-md font-label-sm text-label-sm text-slate-500 uppercase tracking-wider">Description</th>
              <th className="px-lg py-md font-label-sm text-label-sm text-slate-500 uppercase tracking-wider text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((expense) => (
              <tr key={expense._id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-lg py-md text-body-sm text-slate-600 whitespace-nowrap">{formatDate(expense.date)}</td>
                <td className="px-lg py-md">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                    {expense.category}
                  </span>
                </td>
                <td className="px-lg py-md text-body-sm text-slate-900 font-medium break-words">
                  {expense.description || <span className="text-slate-400 italic">No description</span>}
                </td>
                <td className="px-lg py-md text-body-md text-slate-900 font-bold text-right whitespace-nowrap">
                  {formatAmount(expense.amountCents)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-lg py-md bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-body-sm text-slate-500">Showing {expenses.length} transactions</span>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-sm">
        {expenses.map((expense) => (
          <div key={expense._id} className="bg-white p-md rounded-xl border border-outline-variant shadow-sm flex items-center justify-between active:bg-slate-50 transition-colors">
            <div className="flex items-center gap-md truncate pr-4">
              <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-xl" data-icon="receipt">receipt</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="font-label-md text-on-surface truncate">{expense.description || expense.category}</span>
                <span className="font-body-sm text-on-surface-variant text-xs">{formatDate(expense.date)}</span>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <span className="font-h3 text-h3 text-on-surface">{formatAmount(expense.amountCents)}</span>
              <span className="text-[10px] font-label-sm uppercase text-on-surface-variant px-2 py-0.5 bg-slate-100 rounded-full mt-1">
                {expense.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
