import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div className="w-24 h-4 skeleton rounded-md"></div>
        <div className="w-8 h-8 skeleton rounded-lg"></div>
      </div>
      <div className="w-32 h-8 skeleton rounded-lg"></div>
      <div className="w-20 h-3 skeleton rounded-md"></div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="glass-card overflow-hidden">
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
        <div className="w-40 h-6 skeleton rounded-md"></div>
        <div className="w-20 h-8 skeleton rounded-lg"></div>
      </div>
      <div className="p-5 space-y-4">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex gap-4 items-center">
            <div className="w-10 h-10 skeleton rounded-full shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="w-1/3 h-4 skeleton rounded-md"></div>
              <div className="w-1/4 h-3 skeleton rounded-md"></div>
            </div>
            <div className="w-20 h-4 skeleton rounded-md"></div>
            <div className="w-16 h-6 skeleton rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ChartSkeleton: React.FC = () => {
  return (
    <div className="glass-card p-6 flex flex-col gap-4 h-80">
      <div className="w-48 h-5 skeleton rounded-md"></div>
      <div className="flex-1 w-full skeleton rounded-xl"></div>
    </div>
  );
};
