import React from 'react';

interface RiskGaugeProps {
  probability: number; // 0 to 1
  rating: string;      // 'Low', 'Medium', 'High'
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ probability, rating }) => {
  const percentage = Math.round(probability * 100);
  
  // Circumference of half circle = PI * R
  const R = 70;
  const circumference = Math.PI * R;
  // Offset formula: circumference * (1 - fraction)
  const offset = circumference * (1 - probability);

  // Set colors based on rating
  const colorMap = {
    Low: {
      text: 'text-emerald-500',
      stroke: '#10B981',
      bg: 'bg-emerald-500/10 text-emerald-500',
      label: 'Low Default Risk',
      glow: 'shadow-emerald-500/10'
    },
    Medium: {
      text: 'text-amber-500',
      stroke: '#F59E0B',
      bg: 'bg-amber-500/10 text-amber-500',
      label: 'Medium Default Risk',
      glow: 'shadow-amber-500/10'
    },
    High: {
      text: 'text-red-500',
      stroke: '#EF4444',
      bg: 'bg-red-500/10 text-red-500',
      label: 'High Default Risk',
      glow: 'shadow-red-500/10'
    }
  };

  const current = colorMap[rating as 'Low' | 'Medium' | 'High'] || colorMap.Low;

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="relative w-48 h-28 flex justify-center">
        {/* SVG Arc Gauge */}
        <svg className="w-48 h-48 -rotate-180" viewBox="0 0 160 100">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />    {/* Emerald */}
              <stop offset="50%" stopColor="#F59E0B" />   {/* Amber */}
              <stop offset="100%" stopColor="#EF4444" />  {/* Red */}
            </linearGradient>
          </defs>
          
          {/* Base track */}
          <path
            d="M 10 90 A 70 70 0 0 1 150 90"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="12"
            strokeLinecap="round"
            className="dark:stroke-slate-800"
          />
          
          {/* Filled track */}
          <path
            d="M 10 90 A 70 70 0 0 1 150 90"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        
        {/* Floating Percentage Text */}
        <div className="absolute top-12 flex flex-col items-center">
          <span className="text-4xl font-extrabold tracking-tight text-slate-850 dark:text-white">
            {percentage}%
          </span>
          <span className="text-xs font-semibold text-slate-400 mt-0.5">probability</span>
        </div>
      </div>
      
      {/* Category Badge */}
      <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${current.bg} ${current.glow} shadow-sm`}>
        {current.label}
      </div>
    </div>
  );
};
