import React from 'react';
import { GitBranch, Zap, TrendingUp, AlertTriangle, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import { DecisionTreeTrace } from '../types-v2';

interface DecisionTreeTracePanelProps {
  trace: DecisionTreeTrace;
}

export const DecisionTreeTracePanel: React.FC<DecisionTreeTracePanelProps> = ({ trace }) => {
  const finalActionLabel = trace.intentLabel === 'MRO'
    ? 'Apply MRO'
    : trace.intentLabel === 'ES'
      ? 'Apply ES'
      : trace.intentLabel;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <GitBranch className="w-6 h-6 text-indigo-600" />
        Decision Tree Trace Analysis
      </h2>

      <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-600">Final Intent</div>
            <div className="text-2xl font-bold text-indigo-700">{finalActionLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Intent ID</div>
            <div className="text-sm font-mono text-slate-700">{trace.intentId}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Decision Path - Breadcrumb Style */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Decision Path
          </h3>
          <div className="space-y-2">
            {trace.path.map((node, idx) => {
              const isLeaf = node.featureName === 'LEAF';
              
              return (
                <div key={node.nodeId} className="relative">
                  {idx > 0 && (
                    <div className="absolute left-5 -top-2 w-0.5 h-4 bg-slate-300"></div>
                  )}
                  <div className={`flex items-start gap-3 p-3 rounded-lg border-2 ${
                    node.passed 
                      ? 'bg-green-50 border-green-300' 
                      : 'bg-red-50 border-red-300'
                  }`}>
                    <div className="mt-0.5">
                      {isLeaf ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : node.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-600">
                        Node {node.nodeId}
                      </div>
                      <div className="text-sm font-medium text-slate-800 mt-1">
                        {isLeaf ? node.condition : node.condition}
                      </div>
                      {!isLeaf && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-600">Threshold:</span>
                            <span className="ml-1 font-semibold">{node.threshold.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-600">Actual:</span>
                            <span className="ml-1 font-semibold">{node.featureValue.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Features */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Top-3 Deciding Features
          </h3>
          <div className="space-y-3">
            {trace.topFeatures.map((feature, idx) => (
              <div key={feature.name} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-sm text-slate-800">{feature.name}</span>
                  </div>
                  <span className="text-sm font-mono text-slate-700">{feature.value.toFixed(2)}</span>
                </div>
                <div className="relative">
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all"
                      style={{ width: `${feature.importance * 100}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Importance: {(feature.importance * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Snapshot Table */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Feature Snapshot
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(trace.featureSnapshot).map(([name, value]) => (
            <div key={name} className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <div className="text-xs text-slate-600 mb-1">{name}</div>
              <div className="text-sm font-semibold text-slate-800">{typeof value === 'number' ? value.toFixed(2) : value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Counterfactual Analysis */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Counterfactual: "What if?" Scenarios
        </h3>
        <div className="space-y-2">
          {trace.counterfactual.map((cf, idx) => (
            <div key={idx} className="border border-amber-300 rounded-lg p-4 bg-amber-50">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-bold">
                  ?
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-800 mb-2">
                    If <span className="font-semibold text-amber-700">{cf.feature}</span> changes from{' '}
                    <span className="font-mono font-semibold">{cf.currentValue.toFixed(2)}</span> to{' '}
                    <span className="font-mono font-semibold">{cf.thresholdValue.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600">Intent would change to:</span>
                    <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700 font-semibold border border-purple-300">
                    {cf.alternativeIntent}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Explanation Footer */}
      <div className="mt-4 p-3 bg-slate-100 border border-slate-300 rounded-lg">
        <div className="text-xs text-slate-700">
          <strong>How to read:</strong> The decision tree evaluated {trace.path.length} nodes. 
          Each node checked a condition against feature values from the network snapshot. 
          The path shows which branches were taken to reach the final intent classification.
        </div>
      </div>
    </div>
  );
};
