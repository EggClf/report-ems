import React, { useState } from 'react';
import { MapPin, TrendingUp, AlertCircle, ChevronRight } from 'lucide-react';
import { Hotspot, IntentLabel } from '../types-v2';

interface HotspotsMapPanelProps {
  hotspots: Hotspot[];
  onHotspotClick?: (hotspot: Hotspot) => void;
}

const getIntentColor = (label: IntentLabel) => {
  const colors = {
    'MRO': 'bg-purple-500',
    'ES': 'bg-green-500',
    'QoS': 'bg-orange-500',
    'TS': 'bg-blue-500'
  };
  return colors[label] || 'bg-gray-500';
};

const getIntentBorderColor = (label: IntentLabel) => {
  const colors = {
    'MRO': 'border-purple-500',
    'ES': 'border-green-500',
    'QoS': 'border-orange-500',
    'TS': 'border-blue-500'
  };
  return colors[label] || 'border-gray-500';
};

const getSeverityLabel = (score: number) => {
  if (score >= 0.8) return { label: 'Critical', color: 'text-red-600 bg-red-100' };
  if (score >= 0.6) return { label: 'High', color: 'text-orange-600 bg-orange-100' };
  if (score >= 0.4) return { label: 'Medium', color: 'text-yellow-600 bg-yellow-100' };
  return { label: 'Low', color: 'text-blue-600 bg-blue-100' };
};

export const HotspotsMapPanel: React.FC<HotspotsMapPanelProps> = ({ hotspots, onHotspotClick }) => {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const topKHotspots = hotspots.slice(0, 10); // Top 10

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary-600" />
          Network Hotspots Map
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'map'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            Map View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-600 text-white'
                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="relative h-96 bg-slate-100 rounded-lg border-2 border-slate-300 overflow-hidden">
          {/* Simple map visualization using positioned dots */}
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Cluster/Cell Map Visualization</p>
              <p className="text-xs mt-1">(Integration with mapping library recommended)</p>
            </div>
          </div>
          {/* Render hotspots as colored dots */}
          {topKHotspots.map((hotspot, idx) => {
            const top = ((hotspot.lat || 15) - 10.5) / 11 * 100; // Normalize to 0-100%
            const left = ((hotspot.lng || 105) - 102) / 7 * 100;
            const severity = getSeverityLabel(hotspot.severityScore);

            return (
              <div
                key={hotspot.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ top: `${100 - top}%`, left: `${left}%` }}
                onClick={() => onHotspotClick?.(hotspot)}
              >
                <div className={`w-4 h-4 rounded-full ${getIntentColor(hotspot.intentLabel)} opacity-70 group-hover:opacity-100 group-hover:scale-150 transition-all shadow-lg`}>
                  <div className="absolute inset-0 rounded-full animate-ping opacity-30 bg-current"></div>
                </div>
                {/* Tooltip on hover */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 hidden group-hover:block z-10 bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                  <div className="font-semibold">{hotspot.cellId}</div>
                  <div className="text-slate-300">{severity.label}: {(hotspot.severityScore * 100).toFixed(0)}%</div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-100 rounded-md text-xs font-semibold text-slate-600 uppercase">
            <div className="col-span-1">#</div>
            <div className="col-span-2">Cell ID</div>
            <div className="col-span-2">Cluster</div>
            <div className="col-span-1">Region</div>
            <div className="col-span-2">Severity</div>
            <div className="col-span-2">Intent</div>
            <div className="col-span-2">Reason</div>
          </div>

          {/* Hotspot rows */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {topKHotspots.map((hotspot, idx) => {
              const severity = getSeverityLabel(hotspot.severityScore);

              return (
                <div
                  key={hotspot.id}
                  className={`group grid grid-cols-12 gap-2 px-4 py-3 rounded-md border-2 hover:border-primary-400 transition-all cursor-pointer bg-white hover:shadow-md ${getIntentBorderColor(hotspot.intentLabel)} border-opacity-30`}
                  onClick={() => onHotspotClick?.(hotspot)}
                >
                  <div className="col-span-1 flex items-center">
                    <span className="font-bold text-slate-700">{idx + 1}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="font-mono text-sm font-semibold text-slate-800">{hotspot.cellId}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm text-slate-600">{hotspot.cluster}</span>
                  </div>
                  <div className="col-span-1 flex items-center">
                    <span className="text-xs bg-slate-200 px-2 py-1 rounded">{hotspot.region}</span>
                  </div>
                  <div className="col-span-2 flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-semibold ${severity.color}`}>
                      {severity.label}
                    </div>
                    <span className="text-xs text-slate-600">{(hotspot.severityScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className={`text-xs px-2 py-1 rounded text-white font-medium ${getIntentColor(hotspot.intentLabel)}`}>
                    {hotspot.intentLabel}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-xs text-slate-600 truncate">{hotspot.reason}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">{hotspots.length}</div>
          <div className="text-xs text-slate-600">Total Hotspots</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {hotspots.filter(h => h.severityScore >= 0.8).length}
          </div>
          <div className="text-xs text-slate-600">Critical</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {hotspots.filter(h => h.severityScore >= 0.6 && h.severityScore < 0.8).length}
          </div>
          <div className="text-xs text-slate-600">High Priority</div>
        </div>
      </div>
    </div>
  );
};
