import React from 'react';
import { Info } from 'lucide-react';

export const IntentLegend: React.FC = () => {
  const intents = [
    {
      label: 'MRO',
      name: 'Mobility Robustness Optimization',
      description: 'Optimizes handover parameters to reduce failures and improve mobility performance',
      color: 'bg-purple-100 text-purple-700 border-purple-300'
    },
    {
      label: 'ES',
      name: 'Energy Saving',
      description: 'Identifies opportunities to reduce power consumption while maintaining QoS',
      color: 'bg-green-100 text-green-700 border-green-300'
    }
    // {
    //   label: 'QoS',
    //   name: 'Quality of Service',
    //   description: 'Ensures service level agreements and 5QI requirements are met',
    //   color: 'bg-orange-100 text-orange-700 border-orange-300'
    // },
    // {
    //   label: 'TS',
    //   name: 'Traffic Steering',
    //   description: 'Balances load across cells and optimize inter-frequency resource allocation',
    //   color: 'bg-blue-100 text-blue-700 border-blue-300'
    // }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Info className="w-5 h-5 text-primary-600" />
        Intent Classification Reference
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {intents.map((intent) => (
          <div
            key={intent.label}
            className={`border-2 rounded-lg p-4 ${intent.color}`}
          >
            <div className="text-2xl font-bold mb-2">{intent.label}</div>
            <div className="text-sm font-semibold mb-2">{intent.name}</div>
            <div className="text-xs leading-relaxed">{intent.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
