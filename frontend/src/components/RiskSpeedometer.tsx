import React, { useEffect, useState } from 'react';

interface SpeedometerProps {
  probability: number; // 0.0 to 1.0
  rating: string;      // 'Low', 'Medium', 'High'
}

export const RiskSpeedometer: React.FC<SpeedometerProps> = ({ probability, rating }) => {
  const [needleRotation, setNeedleRotation] = useState(-90);
  const percentage = Math.round(probability * 100);

  useEffect(() => {
    // Animate needle on mount: map 0-1 to -90 to +90 degrees
    const angle = (probability * 180) - 90;
    const timer = setTimeout(() => {
      setNeedleRotation(angle);
    }, 150);
    return () => clearTimeout(timer);
  }, [probability]);

  // Color config
  const ratings = {
    Low: {
      text: 'text-emerald-500',
      label: 'Low Risk',
      bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30'
    },
    Medium: {
      text: 'text-amber-500',
      label: 'Medium Risk',
      bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30'
    },
    High: {
      text: 'text-red-500',
      label: 'High Risk',
      bg: 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
    }
  };

  const current = ratings[rating as 'Low' | 'Medium' | 'High'] || ratings.Low;

  return (
    <div className="flex flex-col items-center p-4">
      <div className="relative w-56 h-32 flex justify-center overflow-hidden">
        {/* Speedometer SVG */}
        <svg className="w-56 h-56" viewBox="0 0 200 200">
          <defs>
            {/* Speedometer scale gradients */}
            <linearGradient id="speedGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />   {/* Green */}
              <stop offset="40%" stopColor="#F59E0B" />  {/* Orange */}
              <stop offset="100%" stopColor="#EF4444" /> {/* Red */}
            </linearGradient>
            
            {/* Shadow for needle */}
            <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Core Arch Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#E2E8F0"
            strokeWidth="16"
            strokeLinecap="round"
            className="dark:stroke-slate-800"
          />

          {/* Color Gradient Overlay Track */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#speedGradient)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray="251.3"
            strokeDashoffset="0"
          />

          {/* Center Hub */}
          <circle cx="100" cy="100" r="10" fill="#1E293B" className="dark:fill-slate-200" />
          <circle cx="100" cy="100" r="4" fill="#3B82F6" />

          {/* Speedometer Needle */}
          <g 
            transform={`rotate(${needleRotation} 100 100)`}
            className="transition-transform duration-1000 ease-out"
            filter="url(#needleShadow)"
          >
            {/* Needle line pointing straight up when rotation is 0 */}
            <line 
              x1="100" 
              y1="100" 
              x2="100" 
              y2="30" 
              stroke="#2563EB" 
              strokeWidth="4" 
              strokeLinecap="round" 
              className="dark:stroke-brand-400"
            />
            {/* Triangular needle base pointer */}
            <polygon 
              points="96,100 104,100 100,24" 
              fill="#2563EB"
              className="dark:fill-brand-400"
            />
          </g>
          
          {/* Tick Marks */}
          <line x1="20" y1="100" x2="30" y2="100" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="180" y1="100" x2="170" y2="100" stroke="#FFFFFF" strokeWidth="2" />
          <line x1="100" y1="20" x2="100" y2="30" stroke="#FFFFFF" strokeWidth="2" />
        </svg>

        {/* Readout label */}
        <div className="absolute bottom-2 flex flex-col items-center">
          <span className="text-3xl font-extrabold tracking-tight text-slate-850 dark:text-white">
            {percentage}%
          </span>
          <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest">Default Risk</span>
        </div>
      </div>

      {/* Badge classification */}
      <div className={`mt-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${current.bg} ${current.text}`}>
        {current.label}
      </div>
    </div>
  );
};
