import React, { useState, useEffect, useCallback } from 'react';
import { Database, Search, ChevronLeft, ChevronRight, Eye, X, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchContextSnapshot, ContextSnapshotResponse, ContextSnapshotRow } from '../services/contextSnapshotAPI';

// Known JSON-like columns that should render as key-value chips
const JSON_COLUMNS = new Set(['metadata', 'common_sense', 'kpi', 'alarm']);

// Color themes for each JSON column category
const COLUMN_THEME: Record<string, { bg: string; text: string; border: string; badge: string; badgeText: string }> = {
  metadata:     { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200', badge: 'bg-purple-100',  badgeText: 'text-purple-800' },
  common_sense: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   badge: 'bg-blue-100',    badgeText: 'text-blue-800' },
  kpi:          { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',  badge: 'bg-green-100',   badgeText: 'text-green-800' },
  alarm:        { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200', badge: 'bg-orange-100',  badgeText: 'text-orange-800' },
};

const DEFAULT_THEME = { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', badge: 'bg-gray-100', badgeText: 'text-gray-800' };

/** Try to parse a string as JSON; return null on failure */
function tryParseJson(val: any): Record<string, any> | null {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val);
  try {
    const parsed = JSON.parse(str);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // Try common Python-like dict format: single-quote to double-quote
    try {
      const fixed = str.replace(/'/g, '"');
      const parsed = JSON.parse(fixed);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) return parsed;
    } catch { /* not parsable */ }
  }
  return null;
}

/** Format a numeric value for display */
function formatValue(val: any): string {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return val.toLocaleString();
    return val.toFixed(4);
  }
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
}

// ─── Inline JSON Chips ──────────────────────────────────
const MAX_INLINE_KEYS = 4;

const JsonChips: React.FC<{ value: any; column: string; onExpandAll: () => void }> = ({ value, column, onExpandAll }) => {
  const parsed = tryParseJson(value);
  const theme = COLUMN_THEME[column] || DEFAULT_THEME;

  if (!parsed) {
    const str = String(value ?? '');
    if (str.length === 0) return <span className="text-gray-400 italic text-xs">—</span>;
    return <span className="text-xs text-gray-700 truncate block max-w-[220px]" title={str}>{str}</span>;
  }

  const entries = Object.entries(parsed);
  const shown = entries.slice(0, MAX_INLINE_KEYS);
  const remaining = entries.length - shown.length;

  return (
    <div className="flex flex-wrap gap-1 items-center max-w-[320px]">
      {shown.map(([k, v]) => (
        <span
          key={k}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] leading-tight ${theme.badge} ${theme.badgeText} border ${theme.border}`}
          title={`${k}: ${JSON.stringify(v)}`}
        >
          <span className="font-semibold opacity-70">{k}:</span>
          <span className="font-mono">{formatValue(v)}</span>
        </span>
      ))}
      {remaining > 0 && (
        <button
          onClick={onExpandAll}
          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] leading-tight ${theme.bg} ${theme.text} border ${theme.border} hover:opacity-80 cursor-pointer`}
          title={`Show all ${entries.length} fields`}
        >
          +{remaining} more
        </button>
      )}
    </div>
  );
};

// ─── Plain cell value ────────────────────────────────────
const CellValue: React.FC<{ value: any; column: string; onExpand: () => void }> = ({ value, column, onExpand }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400 italic text-xs">—</span>;
  }

  if (JSON_COLUMNS.has(column)) {
    return <JsonChips value={value} column={column} onExpandAll={onExpand} />;
  }

  const str = String(value);
  return <span className="text-sm text-gray-800 truncate block max-w-[200px]" title={str}>{str}</span>;
};

// ─── JSON detail modal (full key-value table) ────────────
const JsonDetailModal: React.FC<{ column: string; value: string; onClose: () => void }> = ({ column, value, onClose }) => {
  const theme = COLUMN_THEME[column] || DEFAULT_THEME;
  const parsed = tryParseJson(value);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-3 border-b ${theme.border} ${theme.bg}`}>
          <h3 className={`font-semibold flex items-center gap-2 ${theme.text}`}>
            <Eye className="w-4 h-4" />
            {column.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        {parsed ? (
          <div className="overflow-auto flex-1 p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase w-1/3">Key</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase">Value</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(parsed).map(([k, v]) => (
                  <tr key={k} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className={`py-2 px-3 font-medium text-sm ${theme.text}`}>{k}</td>
                    <td className="py-2 px-3 font-mono text-sm text-gray-800">
                      {typeof v === 'object' && v !== null
                        ? <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
                        : formatValue(v)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <pre className="p-5 text-xs font-mono whitespace-pre-wrap overflow-auto flex-1 text-gray-700 bg-gray-50">
            {value}
          </pre>
        )}
      </div>
    </div>
  );
};

// ─── Expanded row (all JSON fields shown inline) ─────────
const ExpandedRowContent: React.FC<{ row: ContextSnapshotRow; columns: string[] }> = ({ row, columns }) => {
  const jsonCols = columns.filter(c => JSON_COLUMNS.has(c));

  return (
    <tr>
      <td colSpan={columns.length + 2} className="px-4 py-3 bg-gray-50/80">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {jsonCols.map(col => {
            const parsed = tryParseJson(row[col]);
            const theme = COLUMN_THEME[col] || DEFAULT_THEME;
            if (!parsed) return null;

            return (
              <div key={col} className={`rounded-lg border ${theme.border} ${theme.bg} p-3`}>
                <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme.text}`}>
                  {col.replace(/_/g, ' ')}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {Object.entries(parsed).map(([k, v]) => (
                    <div key={k} className="flex items-baseline gap-1.5">
                      <span className="text-[11px] text-gray-500 font-medium truncate">{k}:</span>
                      <span className="text-[12px] font-mono text-gray-800">{formatValue(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </td>
    </tr>
  );
};

// ─── Props ───────────────────────────────────────────────
interface ContextSnapshotPanelProps {
  selectedDate: Date;
}

// ─── Main Panel ──────────────────────────────────────────
export const ContextSnapshotPanel: React.FC<ContextSnapshotPanelProps> = ({ selectedDate }) => {
  const [data, setData] = useState<ContextSnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Search
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded rows (set of row indices)
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // JSON detail modal
  const [modalData, setModalData] = useState<{ column: string; value: string } | null>(null);

  // Build date range from selectedDate (full day)
  const formatDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const dateStr = formatDate(selectedDate);
  const startTime = `${dateStr} 00:00:00`;
  const endTime = `${dateStr} 23:59:59`;

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetchContextSnapshot(page, pageSize, searchQuery || undefined, startTime, endTime);
      setData(resp);
    } catch (err: any) {
      console.error('Failed to load context snapshot:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, searchQuery, startTime, endTime]);

  // Reset page when date or search changes
  useEffect(() => {
    setPage(1);
    setExpandedRows(new Set());
  }, [dateStr, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = () => {
    setPage(1);
    setSearchQuery(searchInput);
  };

  const toggleRow = (idx: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1;

  // ─── Render ────────────────────────────────────────────
  if (loading && !data) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-red-100">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-spin text-[#EE0434] mx-auto mb-2" />
            <p className="text-gray-600">Loading context snapshot…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-red-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
          <Database className="w-6 h-6 text-[#EE0434]" />
          Context Snapshot
        </h2>
        <div className="text-center py-8 text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">{error}</p>
          <button onClick={loadData} className="mt-3 text-sm text-[#EE0434] hover:underline">Retry</button>
        </div>
      </div>
    );
  }

  const columns = data?.columns ?? [];
  const rows: ContextSnapshotRow[] = data?.data ?? [];

  // Separate plain columns from JSON columns for display ordering
  const plainColumns = columns.filter(c => !JSON_COLUMNS.has(c));
  const jsonColumnsPresent = columns.filter(c => JSON_COLUMNS.has(c));

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-red-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-[#EE0434]" />
          Context Snapshot
          {data && (
            <span className="text-base font-normal text-gray-500">
              — {dateStr} ({data.total} rows)
            </span>
          )}
        </h2>

        {/* Search bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search cell name…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EE0434]/30 w-56"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-3 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: '#EE0434' }}
          >
            Search
          </button>
        </div>
      </div>

      {/* Legend for JSON column categories */}
      {jsonColumnsPresent.length > 0 && rows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {jsonColumnsPresent.map(col => {
            const theme = COLUMN_THEME[col] || DEFAULT_THEME;
            return (
              <span key={col} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${theme.bg} ${theme.text} border ${theme.border}`}>
                <span className={`w-2 h-2 rounded-full ${theme.badge}`} />
                {col.replace(/_/g, ' ')}
              </span>
            );
          })}
          <span className="text-xs text-gray-400 self-center ml-1">Click a row to expand all JSON details</span>
        </div>
      )}

      {/* Table */}
      {rows.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-semibold text-gray-600 mb-1">No Data Available</p>
          <p className="text-sm">No context snapshot data for {dateStr}. Try selecting another date.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-2 py-2 text-center text-xs font-semibold text-gray-500 w-8"></th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                {plainColumns.map(col => (
                  <th key={col} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    {col}
                  </th>
                ))}
                {jsonColumnsPresent.map(col => {
                  const theme = COLUMN_THEME[col] || DEFAULT_THEME;
                  return (
                    <th key={col} className={`px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${theme.text}`}>
                      {col.replace(/_/g, ' ')}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {rows.map((row, idx) => {
                const isExpanded = expandedRows.has(idx);
                return (
                  <React.Fragment key={idx}>
                    <tr
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${isExpanded ? 'bg-gray-50' : ''}`}
                      onClick={() => toggleRow(idx)}
                    >
                      <td className="px-2 py-2 text-center">
                        {isExpanded
                          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 mx-auto" />
                          : <ChevronDown className="w-3.5 h-3.5 text-gray-400 mx-auto" />
                        }
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-400 font-mono">
                        {(page - 1) * pageSize + idx + 1}
                      </td>
                      {plainColumns.map(col => (
                        <td key={col} className="px-3 py-2">
                          <CellValue value={row[col]} column={col} onExpand={() => {}} />
                        </td>
                      ))}
                      {jsonColumnsPresent.map(col => (
                        <td key={col} className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                          <CellValue
                            value={row[col]}
                            column={col}
                            onExpand={() => setModalData({ column: col, value: String(row[col] ?? '') })}
                          />
                        </td>
                      ))}
                    </tr>
                    {isExpanded && <ExpandedRowContent row={row} columns={columns} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {data && data.total > pageSize && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)} of {data.total}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700 font-medium">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="p-1.5 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-100 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* JSON detail modal */}
      {modalData && (
        <JsonDetailModal column={modalData.column} value={modalData.value} onClose={() => setModalData(null)} />
      )}
    </div>
  );
};
