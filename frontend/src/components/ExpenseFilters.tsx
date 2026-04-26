"use client";

import { useState } from 'react';

interface ExpenseFiltersProps {
  category: string;
  sort: 'date_desc' | 'date_asc';
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: 'date_desc' | 'date_asc') => void;
}

export default function ExpenseFilters({ category, sort, onCategoryChange, onSortChange }: ExpenseFiltersProps) {
  const [localCategory, setLocalCategory] = useState(category);

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCategoryChange(localCategory);
  };

  const handleClear = () => {
    setLocalCategory('');
    onCategoryChange('');
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-md flex-1">
      <form onSubmit={handleCategorySubmit} className="flex items-center gap-sm flex-1 max-w-md">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">filter_alt</span>
          <input
            className="w-full bg-white border-slate-200 rounded-lg pl-10 pr-10 py-2 focus:ring-primary focus:border-primary"
            placeholder="Filter by category..."
            type="text"
            value={localCategory}
            onChange={(e) => setLocalCategory(e.target.value)}
          />
          {localCategory && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-md">close</span>
            </button>
          )}
        </div>
      </form>
      
      <select
        className="bg-white border-slate-200 rounded-lg py-2 pl-4 pr-10 focus:ring-primary focus:border-primary text-body-sm w-full md:w-auto"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as 'date_desc' | 'date_asc')}
      >
        <option value="date_desc">Newest first</option>
        <option value="date_asc">Oldest first</option>
      </select>
    </div>
  );
}
