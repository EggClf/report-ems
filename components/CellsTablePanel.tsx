import React, { useState } from 'react';
import { Server, AlertCircle, Activity, ChevronRight } from 'lucide-react';
import { CellFeatures } from '../services/networkScanAPI';

interface CellsTablePanelProps {
  cells: CellFeatures[];
  onCellClick: (cell: CellFeatures, modelType: 'ES' | 'MRO') => void;
  loading?: boolean;
}

export const CellsTablePanel: React.FC<CellsTablePanelProps> = ({ cells, onCellClick, loading = false }) => {
  const [selectedModelType, setSelectedModelType] = useState<'ES' | 'MRO'>('ES');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter cells based on search
  const filteredCells = cells.filter(cell =>
    cell.cellname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cell.ne_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

// Check if cell has null/missing features
  const hasValidFeatures = (cell: CellFeatures, modelType: 'ES' | 'MRO'): boolean => {
    if (modelType === 'ES') {
      const hasES = (cell['Energy Inefficiency Score'] !== null && cell['Energy Inefficiency Score'] !== undefined) &&
                    (cell['Persistent Low Load Score'] !== null && cell['Persistent Low Load Score'] !== undefined);
      return hasES;
    } else {
      const hasMRO = (cell['Handover Failure Pressure'] !== null && cell['Handover Failure Pressure'] !== undefined) &&
                     (cell['Handover Success Stability'] !== null && cell['Handover Success Stability'] !== undefined);
      if (!hasMRO) {
        console.log(`Cell ${cell.cellname} MRO feature check:`, {
          'HO Failure': cell['Handover Failure Pressure'],
          'HO Stability': cell['Handover Success Stability'],
          'typeof HO Failure': typeof cell['Handover Failure Pressure'],
          'typeof HO Stability': typeof cell['Handover Success Stability']
        });
      }
      return hasMRO;
    }
  };

  // Get severity color based on alarm count and features
  const getSeverityStyle = (cell: CellFeatures): string => {
    const alarmCount = cell.n_alarm ?? 0;
    if (alarmCount > 5) return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50';
    if (alarmCount > 2) return 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/50';
    return 'bg-[#fdf9f8] dark:bg-slate-800 border-gray-200 dark:border-slate-700';
  };

  if (loading) {
    return (
      <div className="bg-[#fdf9f8] rounded-lg shadow-md p-6" style={{ backgroundColor: 'var(--panel-bg, #fdf9f8)' }}>
        <style>{`.dark { --panel-bg: #5D0E41; }`}</style>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Loading cell data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fdf9f8] rounded-lg shadow-md p-6" style={{ backgroundColor: 'var(--panel-bg, #fdf9f8)' }}>
      <style>{`.dark { --panel-bg: #5D0E41; }`}</style>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Server className="w-6 h-6 text-primary-600" />
          Network Cells ({cells.length})
        </h2>

        {/* Model Type Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedModelType('ES')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedModelType === 'ES'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            ES Model
          </button>
          <button
            onClick={() => setSelectedModelType('MRO')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedModelType === 'MRO'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            MRO Model
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by cell name or NE name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Info Banner */}
      <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/50 rounded-lg">
        <div className="text-sm text-primary-800 dark:text-primary-300">
          <strong>Instructions:</strong> Click on any cell to run {selectedModelType} model prediction
          and view the decision tree trace with feature importance analysis.
        </div>
      </div>

      {/* Cells Table */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase">
          <div className="col-span-3">Cell Name</div>
          <div className="col-span-2">NE Name</div>
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-1 text-center">Alarms</div>
          <div className="col-span-3">Key Metrics</div>
          <div className="col-span-1 text-center">Action</div>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-y-auto">
          {filteredCells.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              No cells found matching your search
            </div>
          ) : (
            filteredCells.map((cell, index) => {
              const hasFeatures = hasValidFeatures(cell, selectedModelType);
              const alarmCount = cell.n_alarm ?? 0;

              return (
                <div
                  key={`${cell.cellname}-${index}`}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 hover:bg-[#fdf9f8] dark:hover:bg-primary-900/10 cursor-pointer transition-all group ${getSeverityStyle(cell)}`}
                  onClick={() => hasFeatures && onCellClick(cell, selectedModelType)}
                >
                  {/* Cell Name */}
                  <div className="col-span-3 flex items-center">
                    <span className="text-sm font-mono font-semibold text-slate-700 dark:text-slate-200 group-hover:text-primary-600">
                      {cell.cellname}
                    </span>
                  </div>

                  {/* NE Name */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{cell.ne_name}</span>
                  </div>

                  {/* Timestamp */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      {new Date(cell.timestamp).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Alarms */}
                  <div className="col-span-1 flex items-center justify-center">
                    {alarmCount > 0 ? (
                      <span className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                        alarmCount > 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        alarmCount > 2 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                        'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        <AlertCircle className="w-3 h-3" />
                        {alarmCount}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-600">—</span>
                    )}
                  </div>

                  {/* Key Metrics */}
                  <div className="col-span-3 flex items-center">
                    {selectedModelType === 'ES' ? (
                      <div className="flex flex-col gap-0.5 text-xs">
                        <div className="flex gap-2">
                          <span className="text-gray-500 dark:text-gray-500">Load:</span>
                          <span className="font-medium dark:text-gray-300">
                            {(cell['Persistent Low Load Score'] !== null && cell['Persistent Low Load Score'] !== undefined)
                              ? (cell['Persistent Low Load Score']! * 100).toFixed(0) + '%'
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 dark:text-gray-500">Inefficiency:</span>
                          <span className="font-medium dark:text-gray-300">
                            {(cell['Energy Inefficiency Score'] !== null && cell['Energy Inefficiency Score'] !== undefined)
                              ? (cell['Energy Inefficiency Score']!).toFixed(0)
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5 text-xs">
                        <div className="flex gap-2">
                          <span className="text-gray-500 dark:text-gray-500">HO Fail:</span>
                          <span className="font-medium dark:text-gray-300">
                            {(cell['Handover Failure Pressure'] !== null && cell['Handover Failure Pressure'] !== undefined)
                              ? (cell['Handover Failure Pressure']! * 100).toFixed(0) + '%'
                              : 'N/A'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 dark:text-gray-500">HO Stability:</span>
                          <span className="font-medium dark:text-gray-300">
                            {(cell['Handover Success Stability'] !== null && cell['Handover Success Stability'] !== undefined)
                              ? (cell['Handover Success Stability']!).toFixed(0)
                              : 'N/A'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="col-span-1 flex items-center justify-center">
                    {hasFeatures ? (
                      <ChevronRight className="w-5 h-5 text-primary-600 group-hover:translate-x-1 transition-transform" />
                    ) : (
                      <span className="text-xs text-gray-400">No data</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Cells</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-slate-100">{cells.length}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-900/50">
          <div className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">With Alarms</div>
          <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-500">
            {cells.filter(c => (c.n_alarm ?? 0) > 0).length}
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 border border-blue-200 dark:border-blue-900/50">
          <div className="text-xs text-blue-700 dark:text-blue-400 mb-1">Selected Model</div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-500">{selectedModelType}</div>
        </div>
      </div>
    </div>
  );
};
