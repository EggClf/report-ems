import React from 'react';
import { Play, CheckCircle, XCircle, AlertCircle, Clock, TrendingUp, TrendingDown, Target } from 'lucide-react';
import { ExecutionOutcome, ExecutionStatus } from '../types-v2';

interface ExecutionOutcomePanelProps {
  outcome: ExecutionOutcome;
}

const getStatusColor = (status: ExecutionStatus) => {
  const colors = {
    'sent': 'bg-blue-100 text-blue-700 border-blue-300',
    'ack': 'bg-purple-100 text-purple-700 border-purple-300',
    'applied': 'bg-green-100 text-green-700 border-green-300',
    'failed': 'bg-red-100 text-red-700 border-red-300',
    'rollback': 'bg-orange-100 text-orange-700 border-orange-300'
  };
  return colors[status];
};

const getStatusIcon = (status: ExecutionStatus) => {
  switch (status) {
    case 'sent':
      return <Play className="w-4 h-4" />;
    case 'ack':
      return <CheckCircle className="w-4 h-4" />;
    case 'applied':
      return <CheckCircle className="w-4 h-4" />;
    case 'failed':
      return <XCircle className="w-4 h-4" />;
    case 'rollback':
      return <AlertCircle className="w-4 h-4" />;
  }
};

export const ExecutionOutcomePanel: React.FC<ExecutionOutcomePanelProps> = ({ outcome }) => {
  const lastLog = outcome.logs[outcome.logs.length - 1];
  const isFailed = lastLog.status === 'failed' || lastLog.status === 'rollback';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Play className="w-6 h-6 text-blue-600" />
        Execution & Outcome Analysis
      </h2>

      {/* Execution Metadata - Under Development */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Execution Metadata</h3>
        <div className="flex flex-col items-center justify-center py-8 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Play className="w-8 h-8 mb-2 opacity-20 text-slate-400" />
          <p className="text-sm font-medium">This feature is under development and will be available soon.</p>
        </div>
      </div>

      {/* Execution Timeline - Under Development */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Execution Timeline
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Clock className="w-8 h-8 mb-2 opacity-20 text-slate-400" />
          <p className="text-sm font-medium">This feature is under development and will be available soon.</p>
        </div>

      </div>

      {/* KPI Deltas */}
      {!isFailed && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4" />
            KPI Delta (Before → After)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {outcome.kpiDeltas.map((kpi) => {
              const isPositive = kpi.deltaPercent > 0;
              const isImprovement =
                (kpi.metric.includes('Throughput') || kpi.metric.includes('Success')) ? isPositive :
                (kpi.metric.includes('Drop') || kpi.metric.includes('Utilization')) ? !isPositive :
                isPositive;

              return (
                <div key={kpi.metric} className={`border-2 rounded-lg p-4 ${
                  isImprovement
                    ? 'border-green-300 bg-green-50'
                    : 'border-orange-300 bg-orange-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold text-slate-800">{kpi.metric.replace(/_/g, ' ')}</div>
                    {isImprovement ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-orange-600" />
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                    <div>
                      <div className="text-xs text-slate-600">Before</div>
                      <div className="font-semibold text-slate-800">{kpi.before.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600">After</div>
                      <div className="font-semibold text-slate-800">{kpi.after.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-600">Delta</div>
                      <div className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isPositive ? '+' : ''}{kpi.delta.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Change:</span>
                    <span className={`font-bold ${isImprovement ? 'text-green-600' : 'text-orange-600'}`}>
                      {isPositive ? '+' : ''}{kpi.deltaPercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="mt-2 text-xs text-slate-600">
                    Window: {kpi.timeWindowMinutes} minutes
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Attribution Analysis - Under Development */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Attribution Analysis</h3>
        <div className="flex flex-col items-center justify-center py-8 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <Target className="w-8 h-8 mb-2 opacity-20 text-slate-400" />
          <p className="text-sm font-medium">This feature is under development and will be available soon.</p>
        </div>
      </div>

      {/* Rate Limiting - Under Development */}
      <div className="p-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
        <div className="flex flex-col items-center justify-center py-4 text-slate-500">
          <Clock className="w-8 h-8 mb-2 opacity-20 text-slate-400" />
          <p className="text-sm font-medium">Rate Limiting & Cooldown</p>
          <p className="text-xs text-slate-400 mt-1">This feature is under development and will be available soon.</p>
        </div>
      </div>
    </div>
  );
};
