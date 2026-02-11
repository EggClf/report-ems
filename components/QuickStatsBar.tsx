import React, { useState } from 'react';
import { X, AlertCircle, Activity, MapPin, Brain } from 'lucide-react';

interface QuickStatsBarProps {
  loopStatus: 'running' | 'degraded' | 'paused';
  alertCount: number;
  intentCount: number;
  hotspotCount: number;
  onNavigate: (sectionId: string) => void;
}

export const QuickStatsBar: React.FC<QuickStatsBarProps> = ({
  loopStatus,
  alertCount,
  intentCount,
  hotspotCount,
  onNavigate
}) => {
  const getStatusColor = () => {
    switch (loopStatus) {
      case 'running': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'paused': return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-[1920px] mx-auto px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {/* Loop Status */}
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-4 p-3 rounded-xl transition-colors group border border-transparent hover:border-gray-100 hover:bg-gray-50"
          >
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse shadow-sm`}></div>
            <div className="text-left">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Loop Status</div>
              <div className="text-base font-bold text-[#44494D] capitalize">{loopStatus}</div>
            </div>
            <Activity className="w-5 h-5 text-gray-300 ml-auto group-hover:text-[#EE0033] transition-colors" />
          </button>

          {/* Alerts */}
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-4 p-3 rounded-xl transition-colors group border border-transparent hover:border-gray-100 hover:bg-gray-50"
          >
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-[#EE0033] group-hover:text-white transition-colors">
              <AlertCircle className="w-6 h-6 text-[#EE0033] group-hover:text-white" />
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Active Alerts</div>
              <div className="text-2xl font-bold text-[#44494D] group-hover:text-[#EE0033] transition-colors">{alertCount}</div>
            </div>
          </button>

          {/* Hotspots */}
          <button
            onClick={() => onNavigate('hotspots')}
            className="flex items-center gap-4 p-3 rounded-xl transition-colors group border border-transparent hover:border-gray-100 hover:bg-gray-50"
          >
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Hotspots</div>
              <div className="text-2xl font-bold text-[#44494D]">{hotspotCount}</div>
            </div>
          </button>

          {/* Intents */}
          <button
            onClick={() => onNavigate('intents')}
            className="flex items-center gap-4 p-3 rounded-xl transition-colors group border border-transparent hover:border-gray-100 hover:bg-gray-50"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Brain className="w-6 h-6 text-blue-500" />
            </div>
            <div className="text-left">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Active Intents</div>
              <div className="text-2xl font-bold text-[#44494D]">{intentCount}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
