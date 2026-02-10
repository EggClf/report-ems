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
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-[1920px] mx-auto px-6 py-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Loop Status */}
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} animate-pulse`}></div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Loop</div>
              <div className="text-sm font-semibold text-slate-800 capitalize">{loopStatus}</div>
            </div>
            <Activity className="w-4 h-4 text-slate-400 ml-auto group-hover:text-primary-600" />
          </button>

          {/* Alerts */}
          <button
            onClick={() => onNavigate('overview')}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Alerts</div>
              <div className="text-sm font-semibold text-red-600">{alertCount}</div>
            </div>
          </button>

          {/* Hotspots */}
          <button
            onClick={() => onNavigate('hotspots')}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Hotspots</div>
              <div className="text-sm font-semibold text-orange-600">{hotspotCount}</div>
            </div>
          </button>

          {/* Intents */}
          <button
            onClick={() => onNavigate('intents')}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Intents</div>
              <div className="text-sm font-semibold text-primary-600">{intentCount}</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
