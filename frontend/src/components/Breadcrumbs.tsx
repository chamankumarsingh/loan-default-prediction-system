import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 select-none mb-4">
      <Link
        to="/"
        className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Portal</span>
      </Link>
      
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-800" />
            {isLast || !item.to ? (
              <span className="text-slate-600 dark:text-slate-200 font-bold max-w-[200px] truncate">
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="hover:text-slate-605 dark:hover:text-slate-250 transition-colors max-w-[200px] truncate"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
