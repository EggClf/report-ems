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
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Play className="w-6 h-6 text-primary-600" />
        Execution & Outcome Analysis
      </h2>

      {/* Execution Metadata */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <div className="text-xs text-slate-600 mb-1">Execution ID</div>
          <div className="text-sm font-mono font-semibold text-slate-800">{outcome.executionId}</div>
        </div>
        <div>
          <div className="text-xs text-slate-600 mb-1">Plan ID</div>
          <div className="text-sm font-mono font-semibold text-slate-800">{outcome.planId}</div>
        </div>
        <div>
          <div className="text-xs text-slate-600 mb-1">Intent ID</div>
          <div className="text-sm font-mono font-semibold text-slate-800">{outcome.intentId}</div>
        </div>
      </div>

      {/* Execution Timeline */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Execution Timeline
        </h3>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-200"></div>

          <div className="space-y-3">
            {outcome.logs.map((log, idx) => (
              <div key={idx} className="relative flex items-start gap-4">
                {/* Timeline dot */}
                <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-4 border-white ${
                  log.status === 'applied' ? 'bg-green-500' :
                  log.status === 'failed' || log.status === 'rollback' ? 'bg-red-500' :
                  log.status === 'ack' ? 'bg-purple-500' :
                  'bg-blue-500'
                }`}>
                  <div className="text-white">
                    {getStatusIcon(log.status)}
                  </div>
                </div>

                {/* Log content */}
                <div className={`flex-1 border-2 rounded-lg p-3 ${getStatusColor(log.status)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm capitalize mb-1">
                        {log.status.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-slate-700 mb-1">
                        Target: <span className="font-mono font-semibold">{log.targetCell}</span>
                      </div>
                      {log.errorReason && (
                        <div className="text-xs text-red-700 mt-2 font-medium">
                          Error: {log.errorReason}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-600">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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

      {/* Attribution */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Attribution Analysis</h3>
        <div className={`border-2 rounded-lg p-4 ${
          outcome.attribution.success
            ? 'border-green-300 bg-green-50'
            : 'border-orange-300 bg-orange-50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {outcome.attribution.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-orange-600" />
              )}
              <span className="font-semibold text-slate-800">
                Attribution: {outcome.attribution.success ? 'Successful' : 'Uncertain'}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-slate-600">Correlation Score:</span>
              <span className="ml-2 font-bold text-slate-800">
                {(outcome.attribution.correlationScore * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-xs text-slate-700 mt-2">
            {outcome.attribution.success
              ? 'KPI improvements are strongly correlated with the executed action.'
              : 'KPI changes may be influenced by external factors. Further monitoring recommended.'}
          </div>
        </div>
      </div>

      {/* Rate Limiting */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-sm text-slate-800 mb-1">Rate Limiting & Cooldown</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Cooldown Period:</span>
                <span className="ml-2 font-semibold text-slate-800">{outcome.rateLimiting.cooldownMinutes} minutes</span>
              </div>
              <div>
                <span className="text-slate-600">Actions Remaining:</span>
                <span className="ml-2 font-semibold text-slate-800">{outcome.rateLimiting.actionsRemainingInWindow}</span>
              </div>
            </div>
            <div className="text-xs text-blue-700 mt-2">
              This prevents excessive parameter changes and ensures network stability.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
