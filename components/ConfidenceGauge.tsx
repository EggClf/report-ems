import React from 'react';

interface Props {
  value: number; // 0 to 1
}

export const ConfidenceGauge: React.FC<Props> = ({ value }) => {
  const percentage = Math.round(value * 100);
  
  let colorClass = 'bg-red-500';
  if (percentage >= 70) colorClass = 'bg-yellow-500';
  if (percentage >= 85) colorClass = 'bg-emerald-500';

  return (
    <div className="flex flex-col gap-1 w-full max-w-[200px]">
      <div className="flex justify-between text-xs text-slate-500">
        <span>AI Confidence</span>
        <span className="font-medium text-slate-700">{percentage}%</span>
      </div>
      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
