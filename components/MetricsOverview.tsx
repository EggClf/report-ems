import React from 'react';
import { MetricsSnapshot } from '../types';
import { 
  Activity, 
  Zap, 
  Target, 
  TrendingUp, 
  Clock, 
  Cpu, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield
} from 'lucide-react';

interface MetricsOverviewProps {
  metrics: MetricsSnapshot | null;
  loading: boolean;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <p className="text-slate-500">No metrics data available</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      case 'rejected_by_safety_layer':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'rejected_by_safety_layer':
        return <Shield className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'ES':
        return 'bg-green-500';
      case 'MRO':
        return 'bg-blue-500';
      case 'TS':
        return 'bg-purple-500';
      case 'QoS':
        return 'bg-orange-500';
      default:
        return 'bg-slate-500';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Calculate summary stats
  const actionStats = {
    total: metrics.tactical_actions.length,
    success: metrics.tactical_actions.filter(a => a.status === 'success').length,
    failed: metrics.tactical_actions.filter(a => a.status === 'failed').length,
    rejected: metrics.tactical_actions.filter(a => a.status === 'rejected_by_safety_layer').length,
  };

  const avgConfidence = (
    metrics.strategic.reduce((sum, m) => sum + m.value, 0) / metrics.strategic.length
  ).toFixed(2);

  const avgLoopLatency = (
    metrics.operational
      .filter(m => m.metric_name === 'loop_latency_seconds')
      .reduce((sum, m) => sum + m.value, 0) / 
    metrics.operational.filter(m => m.metric_name === 'loop_latency_seconds').length
  ).toFixed(3);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Avg Confidence</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{avgConfidence}</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Success Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {((actionStats.success / actionStats.total) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Avg Loop Latency</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{avgLoopLatency}s</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase font-medium">Active Agents</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{metrics.strategic.length}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Activity className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Strategic Metrics - IC Agent */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Target className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">Strategic Metrics (IC Agent)</h2>
          </div>
          <p className="text-indigo-100 text-xs mt-1">Intent decision and confidence tracking</p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {metrics.strategic.map((metric, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`w-2 h-12 rounded-full ${getIntentColor(metric.intent_type)}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{metric.intent_type}</span>
                      <span className="text-xs text-slate-500">→</span>
                      <span className="text-sm text-slate-600">{metric.target_scope}</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      <span className="font-mono">{metric.decision_path}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Confidence</p>
                    <p className="text-lg font-bold text-slate-900">{(metric.value * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Model</p>
                    <p className="text-sm font-mono text-slate-700">{metric.model_version}</p>
                  </div>
                  <div className="text-right min-w-[80px]">
                    <p className="text-xs text-slate-500">{formatTimestamp(metric.timestamp)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tactical Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tactical Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Tactical Actions</h2>
            </div>
            <p className="text-blue-100 text-xs mt-1">Action execution status</p>
          </div>
          <div className="p-6">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {metrics.tactical_actions.map((action, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${getStatusColor(action.status)}`}>
                      {getStatusIcon(action.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-900">{action.agent_type}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-600">{action.action_name}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{action.target}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{action.value > 0 ? '+' : ''}{action.value}</p>
                    <p className="text-xs text-slate-500">{formatTimestamp(action.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tactical Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-white" />
              <h2 className="text-lg font-bold text-white">Model Performance</h2>
            </div>
            <p className="text-purple-100 text-xs mt-1">RL Agent metrics</p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {['ES', 'MRO', 'QoS', 'TS'].map((agentType) => {
                const agentMetrics = metrics.tactical_performance.filter(m => m.agent_type === agentType);
                if (agentMetrics.length === 0) return null;
                
                return (
                  <div key={agentType} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">{agentType} Agent</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {agentMetrics.map((metric, idx) => (
                        <div key={idx} className="text-center">
                          <p className="text-xs text-slate-500 capitalize">{metric.metric_type.replace('_', ' ')}</p>
                          <p className="text-lg font-bold text-slate-900 mt-1">
                            {metric.metric_type === 'episode_length' 
                              ? metric.value.toFixed(0) 
                              : metric.value.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <Cpu className="w-5 h-5 text-white" />
            <h2 className="text-lg font-bold text-white">Operational Metrics (AIOps)</h2>
          </div>
          <p className="text-orange-100 text-xs mt-1">Infrastructure and loop health monitoring</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Loop Latency */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Loop Latency
              </h3>
              <div className="space-y-2">
                {metrics.operational
                  .filter(m => m.metric_name === 'loop_latency_seconds')
                  .map((metric, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-xs text-slate-600">{metric.labels?.agent}</span>
                      <span className="text-sm font-bold text-slate-900">{metric.value.toFixed(3)}s</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Model Drift */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Model Drift Score
              </h3>
              <div className="space-y-2">
                {metrics.operational
                  .filter(m => m.metric_name === 'model_drift_score')
                  .map((metric, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-xs text-slate-600">{metric.labels?.agent}</span>
                      <span className={`text-sm font-bold ${metric.value > 0.2 ? 'text-red-600' : 'text-green-600'}`}>
                        {metric.value.toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Resource Usage */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Cpu className="w-4 h-4" />
                Resource Usage (H100)
              </h3>
              <div className="space-y-2">
                {metrics.operational
                  .filter(m => m.metric_name === 'resource_usage')
                  .map((metric, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-xs text-slate-600">
                        {metric.labels?.agent} {metric.labels?.resource_type}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${metric.value > 80 ? 'bg-red-500' : metric.value > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-slate-900 w-12 text-right">
                          {metric.value.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
