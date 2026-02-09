import React from 'react';
import { GitBranch, Zap, TrendingUp, AlertTriangle, ChevronRight, CheckCircle, XCircle, Info, Shield, Gauge, Activity } from 'lucide-react';
import { DecisionTreeTrace } from '../types-v2';

interface DecisionTreeTracePanelProps {
  trace: DecisionTreeTrace;
}

// Feature Insight Database
interface FeatureInsight {
  displayName: string;
  formula: string;
  meaning: string;
  getRuleBasedDecision: (value: number) => {
    level: 'support' | 'neutral' | 'oppose' | 'hard-block' | 'caution';
    message: string;
    icon: string;
  };
  recommendation: string;
}

const ES_INSIGHTS: Record<string, FeatureInsight> = {
  persistent_low_load_score: {
    displayName: 'Persistent Low Load Score',
    formula: '%time(traffic_load < P20_load) in W hours',
    meaning: 'Cell consistently idle (not just a snapshot)',
    getRuleBasedDecision: (score) => {
      if (score > 0.7) return { level: 'support', message: 'Strong support for ES - sustainably idle', icon: '✓' };
      if (score >= 0.4) return { level: 'neutral', message: 'Neutral - moderate load pattern', icon: '○' };
      return { level: 'oppose', message: 'Oppose ES - insufficient idle time', icon: '✗' };
    },
    recommendation: 'Rolling window 3-6h, percentile by region + cell_type'
  },
  energy_inefficiency_score: {
    displayName: 'Energy Inefficiency Score',
    formula: 'energy_consumption / throughput_per_cell',
    meaning: 'Measures energy waste level',
    getRuleBasedDecision: (score) => {
      if (score > 0.75) return { level: 'support', message: 'Strong support for ES - high waste', icon: '⚡' };
      if (score > 0.5) return { level: 'support', message: 'Light support for ES - moderate waste', icon: '⚡' };
      return { level: 'neutral', message: 'Neutral - efficient operation', icon: '○' };
    },
    recommendation: 'Normalize by percentile, avoid absolute numbers'
  },
  stable_qos_confidence: {
    displayName: 'Stable QoS Confidence',
    formula: '1 - rate(QoS_violation)',
    meaning: 'Is ES safe for QoS?',
    getRuleBasedDecision: (score) => {
      if (score >= 0.9) return { level: 'support', message: 'Allow ES - QoS stable', icon: '✓' };
      if (score >= 0.8) return { level: 'caution', message: 'Caution - needs monitoring', icon: '⚠' };
      return { level: 'hard-block', message: 'BLOCK ES - QoS not guaranteed', icon: '🛑' };
    },
    recommendation: 'Trigger: latency > 50ms OR packet_loss > 1% OR call_drop_rate > 1%'
  },
  mobility_safety_index: {
    displayName: 'Mobility Safety Index',
    formula: 'hos * (1 - hof) * (1 - CDR) / 100',
    meaning: 'Will ES break mobility?',
    getRuleBasedDecision: (score) => {
      if (score >= 0.85) return { level: 'support', message: 'Allow ES - mobility safe', icon: '✓' };
      if (score >= 0.7) return { level: 'caution', message: 'Caution - monitor mobility', icon: '⚠' };
      return { level: 'hard-block', message: 'BLOCK ES - mobility risk', icon: '🛑' };
    },
    recommendation: 'Combine high HOS, low HOF, low drop rate'
  },
  social_event_score: {
    displayName: 'Social Event Score',
    formula: 'LLM-derived event intensity score',
    meaning: 'Event crowd/traffic assessment',
    getRuleBasedDecision: (score) => {
      if (score > 0.6) return { level: 'hard-block', message: 'BLOCK ES - large event, high load', icon: '🛑' };
      if (score >= 0.3) return { level: 'caution', message: 'Caution - monitor event', icon: '⚠' };
      return { level: 'neutral', message: 'Neutral - no major event', icon: '○' };
    },
    recommendation: 'Use LLM to assess event impact on traffic'
  },
  traffic_volatility_index: {
    displayName: 'Traffic Volatility Index',
    formula: 'std(load) / mean(load)',
    meaning: 'Traffic unpredictability',
    getRuleBasedDecision: (score) => {
      if (score < 0.3) return { level: 'support', message: 'Support ES - stable traffic', icon: '✓' };
      if (score <= 0.5) return { level: 'neutral', message: 'Neutral - moderate volatility', icon: '○' };
      return { level: 'oppose', message: 'Oppose ES - erratic traffic, ES risky', icon: '✗' };
    },
    recommendation: 'Use CV to avoid scale dependency'
  },
  weather_sensitivity_score: {
    displayName: 'Weather Sensitivity Score',
    formula: 'Fixed scores: extreme(-1), storm(-0.5), rain(-0.25), fog(0), hot(0.2), cold(0.3), clear(0.5)',
    meaning: 'Weather impact on operations',
    getRuleBasedDecision: (score) => {
      if (score > 0) return { level: 'support', message: 'Allow ES - favorable weather', icon: '☀' };
      return { level: 'oppose', message: 'Oppose ES - adverse weather', icon: '🌧' };
    },
    recommendation: 'Encode weather conditions as risk factors'
  },
  neighbor_dependency_score: {
    displayName: 'Neighbor Dependency Score',
    formula: 'successful_HO_count / total_cluster_HO',
    meaning: 'Critical cells with high HOS impact cannot be turned off',
    getRuleBasedDecision: (score) => {
      if (score > 0.5) return { level: 'hard-block', message: 'BLOCK ES - critical cell', icon: '🛑' };
      if (score >= 0.3) return { level: 'caution', message: 'Caution - limit ES', icon: '⚠' };
      return { level: 'support', message: 'Allow ES - non-critical', icon: '✓' };
    },
    recommendation: 'Identify critical cells in cluster topology'
  },
  es_opportunity_score: {
    displayName: 'ES Opportunity Score',
    formula: 'w1*LowLoad + w2*Energy - w3*Risk',
    meaning: 'Final ES decision aggregate',
    getRuleBasedDecision: (score) => {
      if (score > 0.8) return { level: 'support', message: 'Strong ES recommendation', icon: '✓✓' };
      if (score >= 0.5) return { level: 'support', message: 'Light ES recommendation', icon: '✓' };
      return { level: 'oppose', message: 'No ES recommended', icon: '✗' };
    },
    recommendation: 'Use as label or decision tree input'
  }
};

const MRO_INSIGHTS: Record<string, FeatureInsight> = {
  handover_failure_pressure: {
    displayName: 'Handover Failure Pressure',
    formula: 'hof + call_drop_rate',
    meaning: 'Total HO error pressure',
    getRuleBasedDecision: (score) => {
      if (score > 0.03) return { level: 'support', message: 'Strong MRO support - high errors', icon: '⚠⚠' };
      if (score >= 0.02) return { level: 'support', message: 'Light MRO support', icon: '⚠' };
      return { level: 'neutral', message: 'Neutral - acceptable level', icon: '○' };
    },
    recommendation: 'Combine HOF + drop to catch late/early HO'
  },
  handover_success_stability: {
    displayName: 'Handover Success Stability',
    formula: 'mean(hos) - std(hos)',
    meaning: 'HO stability over time',
    getRuleBasedDecision: (score) => {
      if (score >= 0.97) return { level: 'neutral', message: 'Neutral - HO stable', icon: '○' };
      if (score >= 0.95) return { level: 'support', message: 'Light MRO support', icon: '⚠' };
      return { level: 'support', message: 'Strong MRO support - HO unstable', icon: '⚠⚠' };
    },
    recommendation: 'Use rolling window 3-6h'
  },
  congestion_induced_ho_risk: {
    displayName: 'Congestion-Induced HO Risk',
    formula: 'tu_prb_dl / 100',
    meaning: 'HO fail due to target congestion',
    getRuleBasedDecision: (score) => {
      if (score > 0.8) return { level: 'support', message: 'MRO + load balancing needed', icon: '⚠⚠' };
      if (score >= 0.6) return { level: 'caution', message: 'Caution - congestion risk', icon: '⚠' };
      return { level: 'neutral', message: 'Neutral - no congestion', icon: '○' };
    },
    recommendation: 'Differentiate radio fail vs congestion fail'
  },
  post_ho_qoe_degradation: {
    displayName: 'Post-HO QoE Degradation',
    formula: 'Δ(packet_loss, latency) after HO',
    meaning: 'Quality after HO degraded?',
    getRuleBasedDecision: (score) => {
      if (score > 0.1) return { level: 'support', message: 'Strong MRO support - QoE degraded', icon: '⚠⚠' };
      if (score >= 0.05) return { level: 'support', message: 'Light MRO support', icon: '⚠' };
      return { level: 'neutral', message: 'Neutral - acceptable QoE', icon: '○' };
    },
    recommendation: 'Compare before/after HO window'
  },
  mobility_volatility_index: {
    displayName: 'Mobility Volatility Index',
    formula: 'std(hos) or std(hof)',
    meaning: 'HO shows abnormal fluctuation',
    getRuleBasedDecision: (score) => {
      if (score > 0.05) return { level: 'support', message: 'Dynamic MRO support - HO unstable', icon: '⚠⚠' };
      if (score >= 0.03) return { level: 'caution', message: 'Caution - some instability', icon: '⚠' };
      return { level: 'neutral', message: 'Neutral - stable', icon: '○' };
    },
    recommendation: 'Catch ping-pong & instability'
  },
  weather_driven_mobility_risk: {
    displayName: 'Weather-Driven Mobility Risk',
    formula: 'Fixed scores: extreme(-1), storm(-0.5), rain(-0.25), fog(0), hot(0.2), cold(0.3), clear(0.5)',
    meaning: 'Weather impact on mobility',
    getRuleBasedDecision: (score) => {
      if (score > 0) return { level: 'support', message: 'Allow MRO - favorable weather', icon: '☀' };
      return { level: 'oppose', message: 'High weather risk - profile MRO', icon: '🌧' };
    },
    recommendation: 'Encode weather + correlation'
  },
  mro_necessity_score: {
    displayName: 'MRO Necessity Score',
    formula: 'w1*HO_fail + w2*RadioRisk + w3*Congestion',
    meaning: 'Should MRO be activated?',
    getRuleBasedDecision: (score) => {
      if (score > 0.8) return { level: 'support', message: 'Strong MRO activation', icon: '✓✓' };
      if (score >= 0.5) return { level: 'support', message: 'Light MRO activation', icon: '✓' };
      return { level: 'oppose', message: 'No MRO needed', icon: '✗' };
    },
    recommendation: 'Use as label or xApp trigger'
  }
};

function getFeatureInsight(featureName: string, intentLabel: string): FeatureInsight | null {
  const normalizedName = featureName.toLowerCase().replace(/[_\s-]/g, '_');
  const insightDb = intentLabel === 'ES' ? ES_INSIGHTS : MRO_INSIGHTS;
  return insightDb[normalizedName] || null;
}

function getLevelColor(level: string): string {
  switch (level) {
    case 'support': return 'bg-green-100 border-green-400 text-green-800';
    case 'hard-block': return 'bg-red-100 border-red-500 text-red-900';
    case 'caution': return 'bg-amber-100 border-amber-400 text-amber-800';
    case 'oppose': return 'bg-orange-100 border-orange-400 text-orange-800';
    default: return 'bg-slate-100 border-slate-300 text-slate-700';
  }
}

function getLevelIcon(level: string): React.ReactNode {
  switch (level) {
    case 'support': return <CheckCircle className="w-5 h-5 text-green-600" />;
    case 'hard-block': return <Shield className="w-5 h-5 text-red-600" />;
    case 'caution': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    case 'oppose': return <XCircle className="w-5 h-5 text-orange-600" />;
    default: return <Activity className="w-5 h-5 text-slate-500" />;
  }
}

export const DecisionTreeTracePanel: React.FC<DecisionTreeTracePanelProps> = ({ trace }) => {
  const leafNode = trace.path.find((node) => node.featureName === 'LEAF');
  const leafDecision = leafNode
    ? /=(\s*)true/i.test(leafNode.condition)
      ? true
      : /=(\s*)false/i.test(leafNode.condition)
        ? false
        : undefined
    : undefined;
  const finalDecision = trace.decision !== undefined ? trace.decision : leafDecision;
  const finalActionLabel = (trace.intentLabel === 'MRO' || trace.intentLabel === 'ES')
    ? (finalDecision === true
        ? `Apply ${trace.intentLabel}`
        : `Do not apply ${trace.intentLabel}`)
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

      {/* Feature Insights Explainability Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-600" />
          Feature Insights & Explainability
        </h3>
        <div className="space-y-4">
          {trace.path
            .filter(node => node.featureName !== 'LEAF')
            .map((node) => {
              const insight = getFeatureInsight(node.featureName, trace.intentLabel);
              if (!insight) return null;
              
              const ruleDecision = insight.getRuleBasedDecision(node.featureValue);
              
              return (
                <div key={node.nodeId} className={`border-2 rounded-lg p-4 ${getLevelColor(ruleDecision.level)}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getLevelIcon(ruleDecision.level)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-base font-bold">{insight.displayName}</h4>
                        <span className="text-2xl">{ruleDecision.icon}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="bg-white bg-opacity-60 rounded p-2">
                          <div className="text-xs font-semibold text-slate-600 mb-1">Current Value</div>
                          <div className="text-lg font-bold">{node.featureValue.toFixed(3)}</div>
                        </div>
                        <div className="bg-white bg-opacity-60 rounded p-2">
                          <div className="text-xs font-semibold text-slate-600 mb-1">Decision Threshold</div>
                          <div className="text-lg font-bold">{node.threshold.toFixed(3)}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <Gauge className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold">Meaning:</span> {insight.meaning}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Activity className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold">Formula:</span> <code className="text-xs bg-white bg-opacity-70 px-1 py-0.5 rounded">{insight.formula}</code>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold">Decision Logic:</span> {ruleDecision.message}
                          </div>
                        </div>
                        <div className="flex items-start gap-2 bg-white bg-opacity-50 rounded p-2 mt-2">
                          <TrendingUp className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-xs">Recommendation:</span>
                            <div className="text-xs mt-1 italic">{insight.recommendation}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Decision Path - Breadcrumb Style */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <ChevronRight className="w-4 h-4" />
            Decision Path Summary
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
          The <strong>Feature Insights</strong> section above explains the meaning, formula, and rule-based logic for each feature,
          providing context on why certain decisions were made. The decision path shows which branches were taken to reach the final intent classification.
        </div>
      </div>
    </div>
  );
};
