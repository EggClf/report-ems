import React from 'react';
import { Activity, AlertTriangle, CheckCircle, Pause, Clock, Layers } from 'lucide-react';
import { OverviewData, LoopStatus, AlertType, Priority } from '../types-v2';

interface OverviewPanelProps {
  data: OverviewData;
}

const getStatusColor = (status: LoopStatus) => {
  switch (status) {
    case 'running':
      return 'text-green-600 bg-green-100';
    case 'degraded':
      return 'text-yellow-600 bg-yellow-100';
    case 'paused':
      return 'text-gray-600 bg-gray-100';
  }
};

const getStatusIcon = (status: LoopStatus) => {
  switch (status) {
    case 'running':
      return <CheckCircle className="w-5 h-5" />;
    case 'degraded':
      return <AlertTriangle className="w-5 h-5" />;
    case 'paused':
      return <Pause className="w-5 h-5" />;
  }
};

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-100 text-red-700 border-red-300';
    case 'high':
      return 'bg-orange-100 text-orange-700 border-orange-300';
    case 'medium':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'low':
      return 'bg-blue-100 text-blue-700 border-blue-300';
  }
};

const getAlertIcon = (type: AlertType) => {
  return <AlertTriangle className="w-4 h-4" />;
};

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ data }) => {
  const getDataFreshnessStatus = () => {
    if (data.dataFreshness.snapshotAge < 30 && data.dataFreshness.featureCoverage > 95) {
      return { color: 'text-green-600', status: 'Excellent' };
    } else if (data.dataFreshness.snapshotAge < 60 && data.dataFreshness.featureCoverage > 90) {
      return { color: 'text-yellow-600', status: 'Good' };
    } else {
      return { color: 'text-red-600', status: 'Attention Needed' };
    }
  };

  const freshnessStatus = getDataFreshnessStatus();

  return (
    <div className="bg-[#fdf9f8] dark:bg-slate-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <Activity className="w-6 h-6 text-primary-600" />
        Loop Status Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Loop Status */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">Loop Status</div>
          <div className={`flex items-center gap-2 font-semibold text-lg px-3 py-2 rounded-md ${getStatusColor(data.loopStatus)}`}>
            {getStatusIcon(data.loopStatus)}
            <span className="capitalize">{data.loopStatus}</span>
          </div>
        </div>

        {/* Data Freshness */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Data Freshness
          </div>
          <div className="space-y-1">
            <div className="text-sm dark:text-slate-300">
              Snapshot: <span className="font-semibold">{data.dataFreshness.snapshotAge}s ago</span>
            </div>
            <div className="text-sm dark:text-slate-300">
              Coverage: <span className="font-semibold">{data.dataFreshness.featureCoverage.toFixed(1)}%</span>
            </div>
            <div className={`text-xs font-medium ${freshnessStatus.color}`}>
              {freshnessStatus.status}
            </div>
          </div>
        </div>

        {/* Total Active Intents */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
            <Layers className="w-3 h-3" />
            Active Intents
          </div>
          <div className="text-3xl font-bold text-primary-600">
            {data.activeIntents.reduce((sum, region) => sum + region.count, 0)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Across all regions</div>
        </div>

        {/* Alerts Count */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <div className="text-sm text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Active Alerts
          </div>
          <div className="text-3xl font-bold text-red-600">
            {data.alerts.length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-500 mt-1">Requiring attention</div>
        </div>
      </div>

      {/* Active Intents by Region */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Active Intents by Region & Priority</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {data.activeIntents.map((region) => (
            <div
              key={region.region}
              className={`border dark:border-slate-700 rounded-lg p-3 ${getPriorityColor(region.priority)}`}
            >
              <div className="text-xs font-medium uppercase mb-1">{region.region}</div>
              <div className="text-2xl font-bold">{region.count}</div>
              <div className="text-xs capitalize mt-1">{region.priority} priority</div>
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      {data.alerts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            Active Alerts
          </h3>
          <div className="space-y-2">
            {data.alerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 rounded-r-lg p-3 bg-slate-50 dark:bg-slate-700/50 ${
                  alert.severity === 'critical' || alert.severity === 'high'
                    ? 'border-red-500'
                    : alert.severity === 'medium'
                    ? 'border-yellow-500'
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <div className="font-medium text-sm text-slate-800 dark:text-slate-200">{alert.message}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Type: <span className="font-medium">{alert.type.replace(/_/g, ' ')}</span> •
                        {' '}{new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(alert.severity)}`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
    </div>
  );
};
