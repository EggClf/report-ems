import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { KPIMetric } from '../types';

interface Props {
  kpis: KPIMetric[];
}

export const KpiTable: React.FC<Props> = ({ kpis }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-500">KPI Name</th>
            <th className="px-3 py-2 text-right font-medium text-slate-500">Value</th>
            <th className="px-3 py-2 text-right font-medium text-slate-500">Threshold</th>
            <th className="px-3 py-2 text-center font-medium text-slate-500">Trend</th>
            <th className="px-3 py-2 text-right font-medium text-slate-500">Impact</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {kpis.map((kpi, idx) => (
            <tr key={idx} className="hover:bg-slate-50/50">
              <td className="px-3 py-2.5 text-slate-700 font-medium">
                {kpi.name.replace(/_/g, ' ')}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                {kpi.value}
              </td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-400">
                {kpi.threshold}
              </td>
              <td className="px-3 py-2.5 flex justify-center text-slate-600">
                {kpi.trend === 'UP' && <ArrowUpRight className="w-4 h-4 text-red-500" />}
                {kpi.trend === 'DOWN' && <ArrowDownRight className="w-4 h-4 text-green-500" />}
                {kpi.trend === 'STABLE' && <Minus className="w-4 h-4 text-slate-400" />}
              </td>
              <td className="px-3 py-2.5 text-right text-slate-600">
                {(kpi.importance * 100).toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
