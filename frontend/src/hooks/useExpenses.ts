/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface Expense {
  _id: string;
  userId: string;
  amountCents: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

interface UseExpensesProps {
  category?: string;
  sort?: 'date_desc' | 'date_asc';
}

export function useExpenses({ category, sort = 'date_desc' }: UseExpensesProps = {}) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [totalCents, setTotalCents] = useState<number>(0);
  const [formattedTotal, setFormattedTotal] = useState<string>('₹0.00');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (sort) params.append('sort', sort);

      const res = await api.get(`/expenses?${params.toString()}`);
      
      const { expenses: data, totalCents: tc, formattedTotal: ft } = res.data.data;
      setExpenses(data);
      setTotalCents(tc);
      setFormattedTotal(ft);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as any;
        setError(axiosErr.response?.data?.message || 'Failed to load expenses');
      } else {
        setError('Failed to load expenses');
      }
    } finally {
      setLoading(false);
    }
  }, [category, sort]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  return { expenses, totalCents, formattedTotal, loading, error, refetch: fetchExpenses };
}
