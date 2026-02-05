import React, { useState, useEffect } from 'react';
import {
  Network,
  RefreshCw,
  Activity
} from 'lucide-react';
import { fetchMetricsSnapshot } from '../services/api';
import { MetricsSnapshot } from '../types';
import { MetricsOverview } from './MetricsOverview';
import { RealtimeDashboard } from './RealtimeDashboard';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<MetricsSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'metrics' | 'realtime'>('metrics');

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await fetchMetricsSnapshot();
      setMetrics(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMetrics();
  };

  useEffect(() => {
    loadMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Navbar */}
      <nav className="bg-slate-900 text-white px-6 py-4 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">TaoQuan AI <span className="text-indigo-400">EMS</span></h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Intelligent Optimization</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Switch */}
            <div className="bg-slate-800 p-1 rounded-lg flex items-center border border-slate-700 mr-2">
              <button
                onClick={() => setViewMode('metrics')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'metrics'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Metrics
              </button>
              <button
                onClick={() => setViewMode('realtime')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${viewMode === 'realtime'
                  ? 'bg-red-600 text-white shadow-sm animate-pulse'
                  : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                Real-time
              </button>
            </div>

            {viewMode === 'metrics' && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md border border-slate-700 transition-colors flex items-center gap-2 ${refreshing ? 'opacity-70 cursor-wait' : ''}`}
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
              </button>
            )}

            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold ring-2 ring-slate-800">
              OP
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 space-y-6">
        {viewMode === 'realtime' ? (
          <RealtimeDashboard />
        ) : (
          <>
            {/* Header */}
            <header className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    CRL Metrics Dashboard
                  </h2>
                  <div className="text-xs text-slate-500 mt-1">
                    Closed-loop monitoring: Strategic, Tactical & Operational metrics
                  </div>
                </div>
              </div>
              {metrics && (
                <div className="text-xs text-slate-500">
                  Last updated: {new Date(metrics.last_updated).toLocaleString()}
                </div>
              )}
            </header>

            {/* Metrics Overview */}
            <MetricsOverview metrics={metrics} loading={loading} />
          </>
        )}
      </main>
    </div>
  );
};