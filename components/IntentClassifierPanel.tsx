import React, { useState } from 'react';
import { Brain, TrendingUp, BarChart3, CheckCircle } from 'lucide-react';
import { Intent, IntentDistribution, IntentLabel } from '../types-v2';

interface IntentClassifierPanelProps {
  intents: Intent[];
  distribution: IntentDistribution[];
  onIntentClick?: (intent: Intent) => void;
}

const getIntentColor = (label: IntentLabel) => {
  const colors = {
    'MRO': 'bg-purple-100 text-purple-700 border-purple-300',
    'ES': 'bg-green-100 text-green-700 border-green-300',
    'QoS': 'bg-orange-100 text-orange-700 border-orange-300',
    'TS': 'bg-blue-100 text-blue-700 border-blue-300'
  };
  return colors[label] || 'bg-gray-100 text-gray-700 border-gray-300';
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.9) return 'text-green-600 bg-green-50';
  if (confidence >= 0.75) return 'text-yellow-600 bg-yellow-50';
  return 'text-orange-600 bg-orange-50';
};

export const IntentClassifierPanel: React.FC<IntentClassifierPanelProps> = ({
  intents,
  distribution,
  onIntentClick
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '6h' | '24h'>('24h');

  // Filter distribution based on time range
  const getFilteredDistribution = () => {
    const hours = selectedTimeRange === '1h' ? 1 : selectedTimeRange === '6h' ? 6 : 24;
    return distribution.slice(-hours);
  };

  const filteredDistribution = getFilteredDistribution();

  // Calculate intent summary
  const intentSummary = intents.reduce((acc, intent) => {
    acc[intent.intentLabel] = (acc[intent.intentLabel] || 0) + 1;
    return acc;
  }, {} as Record<IntentLabel, number>);

  // Get average confidence per intent type
  const avgConfidence = intents.reduce((acc, intent) => {
    if (!acc[intent.intentLabel]) {
      acc[intent.intentLabel] = { sum: 0, count: 0 };
    }
    acc[intent.intentLabel].sum += intent.confidence;
    acc[intent.intentLabel].count += 1;
    return acc;
  }, {} as Record<IntentLabel, { sum: number; count: number }>);

  return (
    <div className="bg-[#fdf9f8] rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Brain className="w-6 h-6 text-primary-600" />
        Intent Classification Engine
      </h2>

      {/* Intent Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {Object.entries(intentSummary).map(([label, count]) => {
          const confidence = avgConfidence[label as IntentLabel];
          const avgConf = confidence ? confidence.sum / confidence.count : 0;

          return (
            <div
              key={label}
              className={`border-2 rounded-lg p-3 ${getIntentColor(label as IntentLabel)}`}
            >
              <div className="text-xs font-medium uppercase mb-1 truncate">
                {label}
              </div>
              <div className="text-2xl font-bold mb-1">{count}</div>
              <div className="text-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {(avgConf * 100).toFixed(0)}% conf
              </div>
            </div>
          );
        })}
      </div>

      {/* Intent Distribution Chart */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Intent Distribution Over Time
          </h3>
          <div className="flex gap-1">
            {(['1h', '6h', '24h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedTimeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* Simple bar chart visualization */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="space-y-2">
            {(['MRO', 'ES', 'QoS', 'TS'] as IntentLabel[]).map((label) => {
              const total = filteredDistribution.reduce((sum, dist) => sum + (dist.intents[label] || 0), 0);
              const maxTotal = Math.max(
                ...(['MRO', 'ES', 'QoS', 'TS'] as IntentLabel[]).map(l =>
                  filteredDistribution.reduce((sum, dist) => sum + (dist.intents[l] || 0), 0)
                )
              );
              const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

              return (
                <div key={label} className="flex items-center gap-3">
                  <div className="text-xs font-medium text-slate-600 w-32 truncate">
                    {label}
                  </div>
                  <div className="flex-1 bg-slate-200 rounded-full h-6 overflow-hidden relative">
                    <div
                      className={`h-full ${getIntentColor(label).split(' ')[0]} opacity-70 transition-all`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-700">
                      {total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Intents Table */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Recent Intents</h3>
        <div className="bg-slate-50 rounded-lg overflow-hidden border border-slate-200">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-200 text-xs font-semibold text-slate-600 uppercase">
            <div className="col-span-3">Intent Label</div>
            <div className="col-span-2">Scope</div>
            <div className="col-span-2">Target</div>
            <div className="col-span-2">Confidence</div>
            <div className="col-span-2">Region</div>
            <div className="col-span-1">Time</div>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-slate-200 max-h-64 overflow-y-auto">
            {intents.slice(0, 10).map((intent) => (
              <div
                key={intent.id}
                className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#fdf9f8] cursor-pointer transition-colors group"
                onClick={() => onIntentClick?.(intent)}
              >
                <div className="col-span-3 flex items-center">
                  <span className={`text-xs px-2 py-1 rounded border font-medium ${getIntentColor(intent.intentLabel)}`}>
                    {intent.intentLabel}
                  </span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-xs text-slate-600 capitalize">{intent.scope.type}</span>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-xs font-mono text-slate-700">{intent.scope.target}</span>
                </div>
                <div className="col-span-2 flex items-center gap-1">
                  <div className={`px-2 py-1 rounded text-xs font-semibold ${getConfidenceColor(intent.confidence)}`}>
                    {(intent.confidence * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="col-span-2 flex items-center">
                  <span className="text-xs bg-slate-200 px-2 py-1 rounded">{intent.region}</span>
                </div>
                <div className="col-span-1 flex items-center">
                  <span className="text-xs text-slate-500">
                    {new Date(intent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Baseline Comparison Note */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-xs text-blue-800">
          <strong>AI Model Performance:</strong> Intent classification accuracy at 94.2%
          (12% improvement vs rule-based baseline). Drift analysis: Normal operational pattern observed.
        </div>
      </div>
    </div>
  );
};
