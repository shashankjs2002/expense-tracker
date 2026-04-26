/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { generateIdempotencyKey } from '@/lib/utils';

interface ExpenseFormProps {
  onSuccess: () => void;
}

export default function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  useEffect(() => {
    // Check for an existing idempotency key in sessionStorage when the form mounts
    let key = sessionStorage.getItem('pendingIdempotencyKey');
    if (!key) {
      key = generateIdempotencyKey();
      sessionStorage.setItem('pendingIdempotencyKey', key);
    }
    setIdempotencyKey(key);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        amount, // sending as string
        category,
        description,
        date: new Date(date).toISOString(),
      };

      await api.post('/expenses', payload, {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      });

      // Clear the idempotency key upon success
      sessionStorage.removeItem('pendingIdempotencyKey');
      
      // Generate a new one for the next potential submission
      const newKey = generateIdempotencyKey();
      sessionStorage.setItem('pendingIdempotencyKey', newKey);
      setIdempotencyKey(newKey);

      setSuccessMessage('✅ Expense saved!');
      setTimeout(() => setSuccessMessage(null), 2000);

      // Reset form
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);

      // Notify parent to refetch expenses
      onSuccess();

    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as any;
        if (axiosErr.response?.data?.errors) {
          setError(axiosErr.response.data.errors.map((e: any) => e.message).join(', '));
        } else {
          setError(axiosErr.response?.data?.message || 'Failed to add expense. Please try again.');
        }
      } else {
        setError('Failed to add expense. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white p-lg rounded-xl shadow-sm border border-slate-200">
      <h3 className="font-h3 text-h3 mb-md text-primary">Quick Add Expense</h3>
      
      {successMessage ? (
        <div className="bg-green-50 text-green-700 p-md rounded-xl border border-green-200 flex items-center justify-center h-24">
          <p className="font-h3">{successMessage}</p>
        </div>
      ) : (
        <form className="flex flex-col gap-md" onSubmit={handleSubmit}>
          <div className="flex flex-wrap lg:flex-nowrap items-end gap-md">
            <div className="flex-1 min-w-[180px]">
              <label className="block font-label-md text-label-md text-outline mb-xs">Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">₹</span>
                <input
                  className="w-full border-slate-200 rounded-lg pl-8 focus:ring-primary focus:border-primary text-body-md py-2 disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block font-label-md text-label-md text-outline mb-xs">Category</label>
              <input
                className="w-full border-slate-200 rounded-lg focus:ring-primary focus:border-primary text-body-md py-2 disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="e.g. Food"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="flex-1 min-w-[240px]">
              <label className="block font-label-md text-label-md text-outline mb-xs">Description</label>
              <input
                className="w-full border-slate-200 rounded-lg focus:ring-primary focus:border-primary text-body-md py-2 disabled:bg-slate-50 disabled:text-slate-400"
                placeholder="What was this for?"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block font-label-md text-label-md text-outline mb-xs">Date</label>
              <input
                className="w-full border-slate-200 rounded-lg focus:ring-primary focus:border-primary text-body-md py-2 disabled:bg-slate-50 disabled:text-slate-400"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <button
              className="bg-primary text-white px-lg py-[10px] rounded-lg font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap disabled:opacity-70 flex items-center justify-center h-10 w-full lg:w-auto"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin" data-icon="refresh">refresh</span>
              ) : (
                'Add Expense'
              )}
            </button>
          </div>
          
          {error && (
            <div className="text-red-600 font-label-md text-sm flex items-center gap-2 bg-red-50 p-2 rounded border border-red-100">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}
        </form>
      )}
    </section>
  );
}
