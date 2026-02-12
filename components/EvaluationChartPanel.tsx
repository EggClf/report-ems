import React, { useState, useMemo } from 'react';
import { BarChart3, TrendingUp, Info, AlertCircle } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { CSVDataResponse } from '../services/csvUploadAPI';

interface EvaluationChartPanelProps {
  /** CSV data uploaded as "before_plan" */
  beforeData: CSVDataResponse | null;
  /** CSV data uploaded as "after_plan" */
  afterData: CSVDataResponse | null;
  /** Current task type */
  taskType: 'ES' | 'MRO';
  /** Current date string */
  date: string;
  /** Whether data is still loading */
  loading?: boolean;
}

/**
 * Detect numeric KPI columns from CSV columns.
 * Excludes known non-KPI columns: Datetime, Cellname, etc.
 */
const NON_KPI_COLUMNS = new Set([
  'datetime', 'Datetime', 'DATETIME',
  'cellname', 'Cellname', 'CELLNAME', 'CellName', 'cell_name',
  'ne_name', 'NE_Name', 'NE_NAME', 'neName',
  'date', 'Date', 'DATE',
  'hour', 'Hour', 'HOUR',
]);

const getKPIColumns = (columns: string[]): string[] => {
  return columns.filter((col) => !NON_KPI_COLUMNS.has(col));
};

/**
 * Extract hour from a Datetime string (YYYY-MM-DD HH:MM:SS)
 */
const extractHour = (datetime: string): number | null => {
  if (!datetime) return null;
  // Try parsing "YYYY-MM-DD HH:MM:SS" or ISO format
  const match = datetime.match(/(\d{1,2}):\d{2}/);
  if (match) return parseInt(match[1], 10);
  // Fallback: try Date parse
  const d = new Date(datetime);
  if (!isNaN(d.getTime())) return d.getHours();
  return null;
};

/**
 * Process CSV data: group by hour, compute mean(KPI) across all cells.
 * Returns an array of { hour, value } for hours 0–23.
 */
const processCSVByHour = (
  data: Record<string, any>[],
  kpiColumn: string,
  dateStr: string
): { hour: number; value: number | null }[] => {
  // Group values by hour
  const hourBuckets: Map<number, number[]> = new Map();
  for (let h = 0; h < 24; h++) {
    hourBuckets.set(h, []);
  }

  for (const row of data) {
    // Find datetime column (case-insensitive)
    const dtKey = Object.keys(row).find(
      (k) => k.toLowerCase() === 'datetime'
    );
    if (!dtKey) continue;

    const dtValue = String(row[dtKey] ?? '');

    // Optional: filter to selected date only
    if (dateStr && !dtValue.startsWith(dateStr)) continue;

    const hour = extractHour(dtValue);
    if (hour === null || hour < 0 || hour > 23) continue;

    const kpiValue = parseFloat(row[kpiColumn]);
    if (!isNaN(kpiValue)) {
      hourBuckets.get(hour)!.push(kpiValue);
    }
  }

  // Compute mean per hour
  return Array.from({ length: 24 }, (_, h) => {
    const values = hourBuckets.get(h)!;
    return {
      hour: h,
      value: values.length > 0
        ? values.reduce((a, b) => a + b, 0) / values.length
        : null,
    };
  });
};

/**
 * Custom tooltip for the chart
 */
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs max-w-xs">
      <div className="font-semibold text-slate-700 mb-1.5">Hour {label}:00</div>
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ background: entry.color }}
          />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-800 ml-auto">
            {entry.value != null ? Number(entry.value).toFixed(4) : '—'}
          </span>
        </div>
      ))}
      {payload.length === 2 && payload[0].value != null && payload[1].value != null && (
        <div className="mt-1 pt-1 border-t border-slate-100 flex items-center gap-2">
          <span className="text-slate-500">Delta:</span>
          <span className={`font-bold ml-auto ${
            (payload[1].value - payload[0].value) >= 0 ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {(payload[1].value - payload[0].value) >= 0 ? '+' : ''}
            {(payload[1].value - payload[0].value).toFixed(4)}
          </span>
        </div>
      )}
    </div>
  );
};

export const EvaluationChartPanel: React.FC<EvaluationChartPanelProps> = ({
  beforeData,
  afterData,
  taskType,
  date,
  loading,
}) => {
  // Determine available KPI columns from whichever dataset is available
  const availableKPIs = useMemo(() => {
    const cols = beforeData?.columns ?? afterData?.columns ?? [];
    return getKPIColumns(cols);
  }, [beforeData, afterData]);

  const [selectedKPI, setSelectedKPI] = useState<string>('');

  // Auto-select first KPI if none selected
  React.useEffect(() => {
    if (availableKPIs.length > 0 && (!selectedKPI || !availableKPIs.includes(selectedKPI))) {
      setSelectedKPI(availableKPIs[0]);
    }
  }, [availableKPIs]);

  // Process data for the selected KPI
  const chartData = useMemo(() => {
    if (!selectedKPI) return [];

    const beforeHourly = beforeData
      ? processCSVByHour(beforeData.data, selectedKPI, date)
      : Array.from({ length: 24 }, (_, h) => ({ hour: h, value: null }));

    const afterHourly = afterData
      ? processCSVByHour(afterData.data, selectedKPI, date)
      : Array.from({ length: 24 }, (_, h) => ({ hour: h, value: null }));

    return Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      'Before Plan': beforeHourly[h].value,
      'After Plan': afterHourly[h].value,
    }));
  }, [beforeData, afterData, selectedKPI, date]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!chartData.length) return null;

    const beforeValues = chartData
      .map((d) => d['Before Plan'])
      .filter((v): v is number => v !== null);
    const afterValues = chartData
      .map((d) => d['After Plan'])
      .filter((v): v is number => v !== null);

    const mean = (arr: number[]) =>
      arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

    const beforeMean = mean(beforeValues);
    const afterMean = mean(afterValues);
    const delta =
      beforeMean !== null && afterMean !== null ? afterMean - beforeMean : null;
    const deltaPct =
      delta !== null && beforeMean !== null && beforeMean !== 0
        ? (delta / Math.abs(beforeMean)) * 100
        : null;

    return { beforeMean, afterMean, delta, deltaPct, beforeCount: beforeValues.length, afterCount: afterValues.length };
  }, [chartData]);

  const hasNoData = !beforeData && !afterData;
  const isES = taskType === 'ES';

  if (loading) {
    return (
      <div className="bg-[#fdf9f8] rounded-lg border border-gray-200 shadow-sm p-8">
        <div className="flex items-center justify-center space-x-3">
          <BarChart3 className="w-6 h-6 animate-pulse text-indigo-500" />
          <span className="text-gray-600">Loading evaluation data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fdf9f8] rounded-lg shadow-md" style={{ backgroundColor: 'var(--panel-bg, #fdf9f8)' }}>
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            KPI Evaluation &mdash; {isES ? 'Energy Saving' : 'MRO'}
          </h2>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
              isES ? 'bg-green-100 text-green-700 border-green-300' : 'bg-purple-100 text-purple-700 border-purple-300'
            }`}>
              {taskType}
            </span>
            <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              {date}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500">
          Compare mean KPI values before and after applying the plan, aggregated across all cells by hour.
        </p>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-6">
        {hasNoData ? (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <h3 className="text-base font-semibold text-slate-700 mb-1">No Evaluation Data</h3>
            <p className="text-sm text-slate-500">
              Use the <strong>Admin Panel</strong> to upload <strong>Before Plan</strong> and <strong>After Plan</strong> CSV
              files for <strong>{taskType}</strong> on <strong>{date}</strong>.
            </p>
          </div>
        ) : (
          <>
            {/* Upload status badges */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                beforeData
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200 border-dashed'
              }`}>
                <span className={`w-2 h-2 rounded-full ${beforeData ? 'bg-amber-500' : 'bg-slate-300'}`} />
                Before Plan: {beforeData ? `${beforeData.rows} rows` : 'Not uploaded'}
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                afterData
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-50 text-slate-400 border-slate-200 border-dashed'
              }`}>
                <span className={`w-2 h-2 rounded-full ${afterData ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                After Plan: {afterData ? `${afterData.rows} rows` : 'Not uploaded'}
              </div>
            </div>

            {/* KPI Selector */}
            {availableKPIs.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select KPI Column</label>
                <select
                  value={selectedKPI}
                  onChange={(e) => setSelectedKPI(e.target.value)}
                  className="w-full max-w-md px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {availableKPIs.map((kpi) => (
                    <option key={kpi} value={kpi}>{kpi}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Summary Cards */}
            {summaryStats && (summaryStats.beforeMean !== null || summaryStats.afterMean !== null) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="text-xs font-medium text-slate-500 mb-1">Before Plan (Mean)</div>
                  <div className="text-2xl font-bold text-amber-700">
                    {summaryStats.beforeMean !== null ? summaryStats.beforeMean.toFixed(4) : '—'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{summaryStats.beforeCount} hourly points</div>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-xs font-medium text-slate-500 mb-1">After Plan (Mean)</div>
                  <div className="text-2xl font-bold text-emerald-700">
                    {summaryStats.afterMean !== null ? summaryStats.afterMean.toFixed(4) : '—'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{summaryStats.afterCount} hourly points</div>
                </div>
                <div className={`rounded-lg border p-4 ${
                  summaryStats.delta !== null && summaryStats.delta >= 0
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="text-xs font-medium text-slate-500 mb-1">Delta (After − Before)</div>
                  <div className={`text-2xl font-bold ${
                    summaryStats.delta !== null && summaryStats.delta >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {summaryStats.delta !== null
                      ? `${summaryStats.delta >= 0 ? '+' : ''}${summaryStats.delta.toFixed(4)}`
                      : '—'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">absolute change</div>
                </div>
                <div className={`rounded-lg border p-4 ${
                  summaryStats.deltaPct !== null && summaryStats.deltaPct >= 0
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="text-xs font-medium text-slate-500 mb-1">Change %</div>
                  <div className={`text-2xl font-bold ${
                    summaryStats.deltaPct !== null && summaryStats.deltaPct >= 0 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {summaryStats.deltaPct !== null
                      ? `${summaryStats.deltaPct >= 0 ? '+' : ''}${summaryStats.deltaPct.toFixed(2)}%`
                      : '—'}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">relative change</div>
                </div>
              </div>
            )}

            {/* Chart */}
            {selectedKPI && chartData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                  Hourly Mean — {selectedKPI}
                </h3>
                <ResponsiveContainer width="100%" height={340}>
                  <LineChart data={chartData} margin={{ top: 10, right: 30, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11 }}
                      label={{ value: 'Hour (0–23)', position: 'insideBottom', offset: -2, fontSize: 11 }}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      label={{ value: selectedKPI, angle: -90, position: 'insideLeft', fontSize: 10, offset: 5 }}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {beforeData && (
                      <Line
                        type="monotone"
                        dataKey="Before Plan"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ fill: '#f59e0b', r: 3 }}
                        connectNulls
                        name="Before Plan"
                      />
                    )}
                    {afterData && (
                      <Line
                        type="monotone"
                        dataKey="After Plan"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        dot={{ fill: '#10b981', r: 3 }}
                        connectNulls
                        name="After Plan"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Partial data warning */}
            {(beforeData && !afterData) || (!beforeData && afterData) ? (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  Only <strong>{beforeData ? 'Before Plan' : 'After Plan'}</strong> data is available.
                  Upload the <strong>{beforeData ? 'After Plan' : 'Before Plan'}</strong> CSV via the Admin Panel
                  to see the full before/after comparison.
                </span>
              </div>
            ) : null}

            {/* Info footer */}
            <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                Data is grouped by hour (extracted from <code className="bg-slate-100 px-1 rounded">Datetime</code>)
                and aggregated as <code className="bg-slate-100 px-1 rounded">mean(KPI)</code> across all
                cells for <strong>{taskType}</strong> on <strong>{date}</strong>.
                Upload evaluation CSVs via the <strong>Admin Panel</strong>.
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
