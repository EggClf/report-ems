import React, { useState, useEffect } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { Activity, Radio, Search } from 'lucide-react';
import { generateMockKpiHistory, generateMockKpiUpdate, KPI_DEFINITIONS, KpiDataPoint } from '../services/mockData';
import { fetchRealtimeKpi } from '../services/api';

export const RealtimeDashboard: React.FC = () => {
    const [data, setData] = useState<KpiDataPoint[]>([]);
    const [cellId, setCellId] = useState<string>('gNB_1023');
    const [selectedCellId, setSelectedCellId] = useState<string>('gNB_1023');

    useEffect(() => {
        // Initial load when cell ID changes
        const loadInitialData = async () => {
            const history = await fetchRealtimeKpi(selectedCellId, 4);
            setData(history);
        };
        loadInitialData();

        // Real-time updates
        const interval = setInterval(() => {
            setData(prev => {
                const update = generateMockKpiUpdate(selectedCellId);
                const newData = [...prev, update];
                if (newData.length > 50) return newData.slice(newData.length - 50);
                return newData;
            });
        }, 2000); // Update every 2 seconds

        return () => clearInterval(interval);
    }, [selectedCellId]);

    const handleCellSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (cellId.trim()) {
            setSelectedCellId(cellId.trim());
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg animate-pulse">
                    <Radio className="w-6 h-6 text-red-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Real-time Network Monitoring</h2>
                    <p className="text-sm text-slate-500">Live KPI telemetry stream (simulated)</p>
                </div>
            </div>

            {/* Cell ID Selector */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                <form onSubmit={handleCellSearch} className="flex items-center gap-2 flex-1 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={cellId}
                            onChange={(e) => setCellId(e.target.value)}
                            placeholder="Enter Cell ID (e.g. gNB_1023)"
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Monitor Cell
                    </button>
                </form>
                <div className="h-6 w-px bg-slate-200"></div>
                <div className="text-sm text-slate-500">
                    Monitoring: <span className="font-mono font-bold text-slate-700">{selectedCellId}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {KPI_DEFINITIONS.map((kpi) => (
                    <div key={kpi.key} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-800 text-sm truncate" title={kpi.name}>
                                {kpi.name}
                            </h3>
                            <Activity className="w-4 h-4 text-indigo-500" />
                        </div>

                        <div className="h-[200px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                    <XAxis
                                        dataKey="timestamp"
                                        tick={{ fontSize: 10 }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        domain={[0, 'auto']}
                                        tick={{ fontSize: 10 }}
                                        label={{ value: kpi.unit, angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ fontSize: '12px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey={kpi.key}
                                        stroke="#6366f1"
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                        animationDuration={300}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex justify-between items-end mt-2">
                            <span className="text-xs text-slate-400">Current Value</span>
                            <div className="text-lg font-bold text-slate-900">
                                {data.length > 0 ? data[data.length - 1][kpi.key] : '-'} <span className="text-xs font-normal text-slate-500">{kpi.unit}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
