import React from 'react';
import { Settings, Play, Sliders, CheckCircle } from 'lucide-react';
import { RecommendedAction } from '../types';

interface Props {
  action: RecommendedAction;
}

export const ActionPanel: React.FC<Props> = ({ action }) => {
  return (
    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4">
      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Settings className="w-4 h-4 text-slate-500" />
        Recommended Parameters
      </h4>

      <div className="space-y-3">
        {action.profile && (
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Profile</span>
            <span className="text-sm font-medium text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
              {action.profile}
            </span>
          </div>
        )}

        {action.mode && (
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
             <span className="text-xs text-slate-500 uppercase tracking-wide">Mode</span>
             <span className="text-sm font-medium text-slate-800">{action.mode}</span>
          </div>
        )}

        {action.scope && (
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
             <span className="text-xs text-slate-500 uppercase tracking-wide">Scope</span>
             <span className="text-sm font-medium text-slate-800">{action.scope}</span>
          </div>
        )}

        {action.duration_min && (
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
             <span className="text-xs text-slate-500 uppercase tracking-wide">Duration</span>
             <span className="text-sm font-medium text-slate-800">{action.duration_min} min</span>
          </div>
        )}

        {action.parameters && (
          <div className="pt-1">
            <span className="text-xs text-slate-500 uppercase tracking-wide block mb-2">Detailed Params</span>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(action.parameters).map(([key, val]) => (
                <div key={key} className="bg-[#fdf9f8] p-2 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-400 mb-0.5 truncate" title={key}>
                    {key.replace(/_/g, ' ')}
                  </div>
                  <div className="font-mono text-sm font-semibold text-slate-700">{val}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
