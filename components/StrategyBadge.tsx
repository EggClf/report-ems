import React from 'react';
import { Activity, BatteryCharging, Eye } from 'lucide-react';

interface Props {
  strategy: 'MRO' | 'ENERGY_SAVING' | 'MONITORING';
}

export const StrategyBadge: React.FC<Props> = ({ strategy }) => {
  const config = {
    MRO: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Activity,
      label: 'Mobility Optimization (MRO)'
    },
    ENERGY_SAVING: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: BatteryCharging,
      label: 'Energy Saving'
    },
    MONITORING: {
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: Eye,
      label: 'Monitoring Only'
    }
  };

  const { color, icon: Icon, label } = config[strategy];

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border w-fit ${color}`}>
      <Icon className="w-4 h-4" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
};
