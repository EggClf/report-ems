import React, { useState } from 'react';
import { Cpu, Shield, Clock, CheckCircle, XCircle, Settings, TrendingUp } from 'lucide-react';
import { PlannerOutput } from '../types-v2';

interface PlannerOutputPanelProps {
  planner: PlannerOutput;
  onActionSelect?: (actionId: string) => void;
}

const getUseCaseColor = (useCase: 'ES' | 'MRO' | 'TS' | 'QoS') => {
  const colors = {
    'ES': 'bg-green-100 text-green-700 border-green-300',
    'MRO': 'bg-purple-100 text-purple-700 border-purple-300',
    'TS': 'bg-blue-100 text-blue-700 border-blue-300',
    'QoS': 'bg-orange-100 text-orange-700 border-orange-300'
  };
  return colors[useCase];
};

const getRiskColor = (risk: number) => {
  if (risk < 0.3) return 'text-green-600 bg-green-100';
  if (risk < 0.6) return 'text-yellow-600 bg-yellow-100';
  return 'text-red-600 bg-red-100';
};

const getRiskLabel = (risk: number) => {
  if (risk < 0.3) return 'Low';
  if (risk < 0.6) return 'Medium';
  return 'High';
};

export const PlannerOutputPanel: React.FC<PlannerOutputPanelProps> = ({ planner, onActionSelect }) => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleActionClick = (actionId: string) => {
    setSelectedAction(actionId);
    onActionSelect?.(actionId);
  };

  const passedConstraints = planner.constraints.filter(c => c.passed).length;
  const totalConstraints = planner.constraints.length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Cpu className="w-6 h-6 text-primary-600" />
          Action Planner Output
        </h2>
        <div className={`px-3 py-1 rounded border font-semibold ${getUseCaseColor(planner.useCase)}`}>
          {planner.useCase}
        </div>
      </div>

      {/* Plan Metadata */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div>
          <div className="text-xs text-slate-600 mb-1">Plan ID</div>
          <div className="text-sm font-mono font-semibold text-slate-800">{planner.planId}</div>
        </div>
        <div>
          <div className="text-xs text-slate-600 mb-1">Intent ID</div>
          <div className="text-sm font-mono font-semibold text-slate-800">{planner.intentId}</div>
        </div>
        <div>
          <div className="text-xs text-slate-600 mb-1">Use Case</div>
          <div className="text-sm font-semibold text-slate-800">
            {planner.useCase === 'ES' && 'Energy Saving'}
            {planner.useCase === 'MRO' && 'Mobility Robustness Optimization'}
            {/* {planner.useCase === 'TS' && 'Traffic Steering'}
            {planner.useCase === 'QoS' && 'Quality of Service'} */}
          </div>
        </div>
      </div>

      {/* Candidate Actions */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Top-{planner.candidateActions.length} Candidate Actions
        </h3>
        <div className="space-y-3">
          {planner.candidateActions.map((action, idx) => {
            const isSelected = selectedAction === action.id;
            const riskLabel = getRiskLabel(action.riskScore);

            return (
              <div
                key={action.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-slate-200 hover:border-primary-300'
                }`}
                onClick={() => handleActionClick(action.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 mb-1">{action.action.replace(/_/g, ' ')}</div>
                      <div className="text-sm text-slate-600">
                        Target: <span className="font-mono font-semibold">{action.target}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-600">Expected Gain</div>
                    <div className="text-xl font-bold text-green-600">+{action.expectedGain.toFixed(1)}%</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <div className="text-xs text-slate-600 mb-1">Risk Score</div>
                    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded font-semibold text-sm ${getRiskColor(action.riskScore)}`}>
                      <span>{riskLabel}</span>
                      <span>({(action.riskScore * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-600 mb-1">Parameters</div>
                    <div className="text-xs text-slate-700">
                      {Object.keys(action.parameters).length} parameter(s)
                    </div>
                  </div>
                </div>

                {/* Parameters - Show when selected */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="text-xs font-semibold text-slate-600 mb-2">Action Parameters:</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(action.parameters).map(([key, value]) => (
                        <div key={key} className="bg-white rounded px-2 py-1 text-xs border border-slate-200">
                          <span className="text-slate-600">{key}:</span>{' '}
                          <span className="font-semibold text-slate-800">
                            {Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Constraints & Guardrails */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Constraints & Guardrail Checks ({passedConstraints}/{totalConstraints} Passed)
        </h3>
        <div className="space-y-2">
          {planner.constraints.map((constraint, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                constraint.passed
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className="mt-0.5">
                {constraint.passed ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium text-sm text-slate-800">{constraint.name}</div>
                {!constraint.passed && constraint.reason && (
                  <div className="text-xs text-red-700 mt-1">Reason: {constraint.reason}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Execution Timeline
        </h3>
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-slate-600 mb-1">Scheduled Time</div>
              <div className="text-sm font-semibold text-slate-800">
                {new Date(planner.timeline.when).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 mb-1">Target Locations</div>
              <div className="text-sm font-semibold text-slate-800">
                {planner.timeline.where.join(', ')}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-600 mb-1">Duration</div>
              <div className="text-sm font-semibold text-slate-800">
                {planner.timeline.durationMinutes} minutes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Vendor Compatibility */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Multi-Vendor Compatibility
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {planner.multiVendorCompatibility.map((vendor) => (
            <div
              key={vendor.vendor}
              className={`border-2 rounded-lg p-3 ${
                vendor.compatible
                  ? 'border-green-300 bg-green-50'
                  : 'border-red-300 bg-red-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-slate-800">{vendor.vendor}</div>
                {vendor.compatible ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <div className="text-xs text-slate-600 mb-1">Affected Parameters:</div>
              <div className="flex flex-wrap gap-1">
                {vendor.affectedParameters.map((param) => (
                  <span
                    key={param}
                    className="text-xs px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-700"
                  >
                    {param}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
