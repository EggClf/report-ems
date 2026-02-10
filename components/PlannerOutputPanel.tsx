import React, { useState, useMemo } from 'react';
import { Cpu, Zap, Settings, BarChart3, Clock, Power, PowerOff, TrendingUp, Info } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, Cell, ReferenceLine, ComposedChart
} from 'recharts';
import {
  PlanLoadResponse, ESPlanData, MROPlanData,
  ESScheduleEntry, ESForecastEntry, MROConfigPlanEntry
} from '../services/api';

interface PlannerOutputPanelProps {
  planResponse: PlanLoadResponse | null;
}

// ─── Color palette ──────────────────────────────────────────────────
const CELL_COLORS = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
];

const getColor = (idx: number) => CELL_COLORS[idx % CELL_COLORS.length];

// ─── Helper: extract cell names from schedule/forecast ──────────────
const extractCellNames = (entries: ESScheduleEntry[] | ESForecastEntry[]): string[] => {
  if (!entries || entries.length === 0) return [];
  return Object.keys(entries[0]).filter((k) => k !== 'hour');
};

// ─── Custom tooltip ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs max-w-xs">
      <div className="font-semibold text-slate-700 mb-1.5">Hour {label}:00</div>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 py-0.5">
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: entry.color }} />
          <span className="text-slate-600 truncate">{entry.name}:</span>
          <span className="font-semibold text-slate-800 ml-auto">
            {typeof entry.value === 'number' ? entry.value.toFixed(4) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
//  ES Visualizations
// ═══════════════════════════════════════════════════════════════════════

const ESScheduleHeatmap: React.FC<{ schedule: ESScheduleEntry[] }> = ({ schedule }) => {
  const cellNames = extractCellNames(schedule);

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Power className="w-4 h-4 text-green-600" />
        24-Hour Cell Schedule (ON/OFF)
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 bg-slate-100 text-left px-2 py-1.5 border border-slate-200 font-semibold text-slate-600 min-w-[140px]">
                Cell
              </th>
              {schedule.map((entry) => (
                <th key={entry.hour} className="px-1 py-1.5 border border-slate-200 text-center font-medium text-slate-500 min-w-[32px]">
                  {entry.hour}
                </th>
              ))}
              <th className="px-2 py-1.5 border border-slate-200 text-center font-semibold text-slate-600 min-w-[50px]">
                ON hrs
              </th>
            </tr>
          </thead>
          <tbody>
            {cellNames.map((cell, cellIdx) => {
              const onCount = schedule.filter((e) => e[cell] === 1).length;
              return (
                <tr key={cell}>
                  <td className="sticky left-0 bg-white px-2 py-1.5 border border-slate-200 font-mono text-slate-700 whitespace-nowrap">
                    <span className="w-2 h-2 rounded-full inline-block mr-1.5" style={{ background: getColor(cellIdx) }} />
                    {cell}
                  </td>
                  {schedule.map((entry) => {
                    const isOn = entry[cell] === 1;
                    return (
                      <td
                        key={entry.hour}
                        className={`px-1 py-1.5 border border-slate-200 text-center transition-colors ${
                          isOn
                            ? 'bg-green-500 text-white font-bold'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                        title={`${cell} hour ${entry.hour}: ${isOn ? 'ON' : 'OFF'}`}
                      >
                        {isOn ? '1' : '0'}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1.5 border border-slate-200 text-center font-semibold text-slate-700">
                    {onCount}/{schedule.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ESScheduleChart: React.FC<{ schedule: ESScheduleEntry[] }> = ({ schedule }) => {
  const cellNames = extractCellNames(schedule);

  const chartData = schedule.map((entry) => {
    const row: Record<string, any> = { hour: `${entry.hour}` };
    cellNames.forEach((c) => {
      row[c] = entry[c];
    });
    return row;
  });

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-indigo-600" />
        Active Cells per Hour (Stacked)
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="hour" tick={{ fontSize: 11 }} label={{ value: 'Hour', position: 'insideBottom', offset: -2, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} label={{ value: 'Cells ON', angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {cellNames.map((cell, idx) => (
            <Bar key={cell} dataKey={cell} stackId="a" fill={getColor(idx)} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ESForecastChart: React.FC<{ forecast: ESForecastEntry[] }> = ({ forecast }) => {
  const cellNames = extractCellNames(forecast);

  const chartData = forecast.map((entry) => {
    const row: Record<string, any> = { hour: `${entry.hour}` };
    cellNames.forEach((c) => {
      row[c] = parseFloat((entry[c] as number).toFixed(4));
    });
    return row;
  });

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-amber-600" />
        Traffic Load Forecast (24h)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <defs>
            {cellNames.map((cell, idx) => (
              <linearGradient key={cell} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getColor(idx)} stopOpacity={0.3} />
                <stop offset="95%" stopColor={getColor(idx)} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="hour" tick={{ fontSize: 11 }} label={{ value: 'Hour', position: 'insideBottom', offset: -2, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={[0, 1]} label={{ value: 'Load Factor', angle: -90, position: 'insideLeft', fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {cellNames.map((cell, idx) => (
            <Area
              key={cell}
              type="monotone"
              dataKey={cell}
              stroke={getColor(idx)}
              fill={`url(#grad-${idx})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const ESSummaryCards: React.FC<{ schedule: ESScheduleEntry[]; forecast: ESForecastEntry[] }> = ({
  schedule,
  forecast,
}) => {
  const cellNames = extractCellNames(schedule);
  const totalSlots = cellNames.length * 24;
  const offSlots = schedule.reduce(
    (sum, entry) => sum + cellNames.filter((c) => entry[c] === 0).length,
    0,
  );
  const savingPct = totalSlots > 0 ? ((offSlots / totalSlots) * 100).toFixed(1) : '0';

  const avgLoad = useMemo(() => {
    const allValues = forecast.flatMap((entry) => cellNames.map((c) => entry[c] as number));
    return allValues.length > 0 ? (allValues.reduce((a, b) => a + b, 0) / allValues.length) : 0;
  }, [forecast, cellNames]);

  const peakHour = useMemo(() => {
    let maxLoad = 0;
    let maxHour = 0;
    forecast.forEach((entry) => {
      const hourLoad = cellNames.reduce((sum, c) => sum + (entry[c] as number), 0) / cellNames.length;
      if (hourLoad > maxLoad) {
        maxLoad = hourLoad;
        maxHour = entry.hour;
      }
    });
    return { hour: maxHour, load: maxLoad };
  }, [forecast, cellNames]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SummaryCard
        label="Cells Managed"
        value={cellNames.length.toString()}
        sub="active cells"
        color="indigo"
      />
      <SummaryCard
        label="Energy Saving"
        value={`${savingPct}%`}
        sub={`${offSlots}/${totalSlots} slots OFF`}
        color="green"
      />
      <SummaryCard
        label="Avg Load"
        value={`${(avgLoad * 100).toFixed(1)}%`}
        sub="across all cells"
        color="amber"
      />
      <SummaryCard
        label="Peak Hour"
        value={`${peakHour.hour}:00`}
        sub={`load: ${(peakHour.load * 100).toFixed(1)}%`}
        color="red"
      />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
//  MRO Visualizations
// ═══════════════════════════════════════════════════════════════════════

const MROConfigChart: React.FC<{ configPlan: MROConfigPlanEntry[] }> = ({ configPlan }) => {
  const chartData = configPlan.map((entry) => ({
    hour: `${entry.hour}`,
    HOM: entry.hom,
    TTT: entry.ttt,
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4 text-purple-600" />
        MRO Configuration Parameters (24h) &mdash; HOM &amp; TTT
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 50, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="hour" tick={{ fontSize: 11 }} label={{ value: 'Hour', position: 'insideBottom', offset: -2, fontSize: 11 }} />
          <YAxis
            yAxisId="left"
            domain={[0, 15]}
            tick={{ fontSize: 11 }}
            label={{ value: 'HOM (dB)', angle: -90, position: 'insideLeft', fontSize: 11, offset: 5 }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 320]}
            tick={{ fontSize: 11 }}
            label={{ value: 'TTT (ms)', angle: 90, position: 'insideRight', fontSize: 11, offset: 5 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar yAxisId="left" dataKey="HOM" fill="#6366f1" radius={[3, 3, 0, 0]} barSize={20} name="HOM (dB)" />
          <Bar yAxisId="right" dataKey="TTT" fill="#f59e0b" radius={[3, 3, 0, 0]} barSize={20} name="TTT (ms)" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

const MROHOSTimeSeriesChart: React.FC<{ configPlan: MROConfigPlanEntry[] }> = ({ configPlan }) => {
  const chartData = configPlan.map((entry) => ({
    hour: `${entry.hour}`,
    'Predicted HOS': parseFloat((entry.predicted_hos * 100).toFixed(2)),
  }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-600" />
        Predicted Handover Success Rate (24h)
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <defs>
            <linearGradient id="hosGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="hour" tick={{ fontSize: 11 }} label={{ value: 'Hour', position: 'insideBottom', offset: -2, fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={[90, 100]} label={{ value: 'HOS (%)', angle: -90, position: 'insideLeft', fontSize: 11, offset: 5 }} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={95} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '95% target', fontSize: 10, fill: '#ef4444', position: 'right' }} />
          <Area
            type="monotone"
            dataKey="Predicted HOS"
            stroke="#10b981"
            strokeWidth={2.5}
            fill="url(#hosGradient)"
            dot={{ fill: '#10b981', r: 3 }}
            name="HOS (%)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const MROParamTable: React.FC<{ configPlan: MROConfigPlanEntry[] }> = ({ configPlan }) => {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-600" />
        Hourly Parameter Configuration
      </h3>
      <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100">
              <th className="px-3 py-2 border border-slate-200 text-left font-semibold text-slate-600">Hour</th>
              <th className="px-3 py-2 border border-slate-200 text-center font-semibold text-slate-600">HOM (dB)</th>
              <th className="px-3 py-2 border border-slate-200 text-center font-semibold text-slate-600">TTT (ms)</th>
              <th className="px-3 py-2 border border-slate-200 text-center font-semibold text-slate-600">Predicted HOS</th>
              <th className="px-3 py-2 border border-slate-200 text-center font-semibold text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {configPlan.map((entry) => {
              const hosOk = entry.predicted_hos >= 0.95;
              return (
                <tr key={entry.hour} className="hover:bg-slate-50">
                  <td className="px-3 py-1.5 border border-slate-200 font-semibold text-slate-700">
                    {String(entry.hour).padStart(2, '0')}:00
                  </td>
                  <td className="px-3 py-1.5 border border-slate-200 text-center font-mono text-indigo-700 font-semibold">
                    {entry.hom}
                  </td>
                  <td className="px-3 py-1.5 border border-slate-200 text-center font-mono text-amber-700 font-semibold">
                    {entry.ttt}
                  </td>
                  <td className="px-3 py-1.5 border border-slate-200 text-center font-mono">
                    <span className={hosOk ? 'text-green-700' : 'text-amber-700'}>
                      {(entry.predicted_hos * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-1.5 border border-slate-200 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      hosOk ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {hosOk ? '✓ OK' : '⚠ Below target'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MROSummaryCards: React.FC<{ configPlan: MROConfigPlanEntry[]; cellNames: string[] }> = ({
  configPlan,
  cellNames,
}) => {
  const avgHOS = configPlan.reduce((s, e) => s + e.predicted_hos, 0) / configPlan.length;
  const minHOS = Math.min(...configPlan.map((e) => e.predicted_hos));
  const maxHOS = Math.max(...configPlan.map((e) => e.predicted_hos));
  const uniqueHOM = new Set(configPlan.map((e) => e.hom)).size;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SummaryCard
        label="Cells"
        value={cellNames.length.toString()}
        sub={cellNames.slice(0, 2).join(', ') + (cellNames.length > 2 ? ` +${cellNames.length - 2}` : '')}
        color="indigo"
      />
      <SummaryCard
        label="Avg HOS"
        value={`${(avgHOS * 100).toFixed(2)}%`}
        sub={avgHOS >= 0.95 ? 'Above target' : 'Below 95% target'}
        color={avgHOS >= 0.95 ? 'green' : 'amber'}
      />
      <SummaryCard
        label="HOS Range"
        value={`${(minHOS * 100).toFixed(1)}–${(maxHOS * 100).toFixed(1)}%`}
        sub="min – max"
        color="purple"
      />
      <SummaryCard
        label="HOM Variants"
        value={uniqueHOM.toString()}
        sub={`across 24 hours`}
        color="blue"
      />
    </div>
  );
};

// ─── Shared summary card ────────────────────────────────────────────
const colorVariantMap: Record<string, { bg: string; text: string; border: string }> = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

const SummaryCard: React.FC<{
  label: string;
  value: string;
  sub: string;
  color: string;
}> = ({ label, value, sub, color }) => {
  const c = colorVariantMap[color] ?? colorVariantMap.indigo;
  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
      <div className="text-xs font-medium text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${c.text}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
//  Main Panel
// ═══════════════════════════════════════════════════════════════════════

export const PlannerOutputPanel: React.FC<PlannerOutputPanelProps> = ({ planResponse }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'detail'>('overview');

  if (!planResponse) {
    return (
      <div className="bg-[#fdf9f8] rounded-lg shadow-md p-8 text-center text-slate-500">
        <Cpu className="w-12 h-12 mx-auto mb-3 text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No Plan Data</h3>
        <p className="text-sm">Could not load plan data from the backend. Please try again.</p>
      </div>
    );
  }

  const { task_type, date, data } = planResponse;
  const isES = task_type === 'ES';
  const isMRO = task_type === 'MRO';

  return (
    <div className="bg-[#fdf9f8] rounded-lg shadow-md" style={{ backgroundColor: 'var(--panel-bg, #fdf9f8)' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary-600" />
            Action Planner &mdash; {isES ? 'Energy Saving' : 'Mobility Robustness Optimization'}
          </h2>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isES ? 'bg-green-100 text-green-700 border-green-300' : 'bg-purple-100 text-purple-700 border-purple-300'
            }`}>
              {task_type}
            </span>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {date}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5 w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'overview'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview &amp; Charts
          </button>
          <button
            onClick={() => setActiveTab('detail')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'detail'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Detailed Data
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-6">
        {/* ─── ES Task ────────────────────────────────────────── */}
        {isES && (() => {
          const esData = data as ESPlanData;
          return (
            <>
              <ESSummaryCards schedule={esData.schedule} forecast={esData.forecast} />

              {activeTab === 'overview' && (
                <>
                  <ESScheduleChart schedule={esData.schedule} />
                  <ESForecastChart forecast={esData.forecast} />
                </>
              )}

              {activeTab === 'detail' && (
                <ESScheduleHeatmap schedule={esData.schedule} />
              )}
            </>
          );
        })()}

        {/* ─── MRO Task ───────────────────────────────────────── */}
        {isMRO && (() => {
          const mroData = data as MROPlanData;
          return (
            <>
              <MROSummaryCards configPlan={mroData.config_plan} cellNames={mroData.cell_names} />

              {activeTab === 'overview' && (
                <>
                  <MROConfigChart configPlan={mroData.config_plan} />
                  <MROHOSTimeSeriesChart configPlan={mroData.config_plan} />
                </>
              )}

              {activeTab === 'detail' && (
                <MROParamTable configPlan={mroData.config_plan} />
              )}
            </>
          );
        })()}

        {/* Info footer */}
        <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            Plan loaded from <code className="bg-slate-100 px-1 rounded">POST /plan/load</code> for
            <strong> {task_type}</strong> on <strong>{date}</strong>.
            {isES && ' Schedule shows ON (1) / OFF (0) per cell per hour. Forecast shows predicted load factor (0–1).'}
            {isMRO && ' HOM = Handover Margin (dB), TTT = Time To Trigger (ms), HOS = Handover Success Rate.'}
          </span>
        </div>
      </div>
    </div>
  );
};
