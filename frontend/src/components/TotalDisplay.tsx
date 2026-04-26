"use client";

interface TotalDisplayProps {
  formattedTotal: string;
}

export default function TotalDisplay({ formattedTotal }: TotalDisplayProps) {
  return (
    <div className="text-right flex-shrink-0">
      <span className="text-slate-500 font-label-md uppercase tracking-wider block mb-1">
        Total Spending
      </span>
      <h2 className="font-display text-display text-primary">{formattedTotal}</h2>
    </div>
  );
}
