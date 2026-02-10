import React, { useState } from 'react';
import { BookOpen, Shield, AlertTriangle, CheckCircle, XCircle, Lightbulb, GitBranch, TrendingDown, TrendingUp, ChevronDown, ChevronRight, Info } from 'lucide-react';
import { DecisionTreeTrace } from '../types-v2';

interface DecisionTreeTracePanelProps {
  trace: DecisionTreeTrace;
}

// Human-readable feature context (model-agnostic, threshold-free)
interface FeatureContext {
  name: string;
  intent: string;
  interpretation: {
    high: string;
    medium: string;
    low: string;
  };
  decisionImpact: {
    high: string;
    medium: string;
    low: string;
  };
  role: string;
  isHardBlock?: boolean;
}

// Energy Saving Feature Contexts (from YAML spec)
const ES_CONTEXTS: Record<string, FeatureContext> = {
  persistent_low_load_score: {
    name: 'Persistent Low Load',
    intent: 'Detect long-lasting idle behavior',
    interpretation: {
      high: 'Sustained low traffic over time',
      medium: 'Intermittent or unstable low load',
      low: 'No real idle condition'
    },
    decisionImpact: {
      high: 'Strongly supports ES',
      medium: 'Neutral, needs other evidence',
      low: 'Opposes ES'
    },
    role: 'Benefit indicator'
  },
  energy_inefficiency_score: {
    name: 'Energy Inefficiency',
    intent: 'Measure energy waste per carried traffic',
    interpretation: {
      high: 'Significant energy waste',
      medium: 'Mild inefficiency',
      low: 'Energy usage is efficient'
    },
    decisionImpact: {
      high: 'Strongly supports ES',
      medium: 'Weak support for ES',
      low: 'Neutral or against ES'
    },
    role: 'Energy optimization driver'
  },
  stable_qos_confidence: {
    name: 'QoS Stability',
    intent: 'Ensure ES does not degrade service quality',
    interpretation: {
      high: 'QoS consistently stable',
      medium: 'Borderline stability, requires monitoring',
      low: 'Frequent QoS violations'
    },
    decisionImpact: {
      high: 'ES allowed',
      medium: 'ES with caution',
      low: 'ES forbidden'
    },
    role: 'Hard safety constraint',
    isHardBlock: true
  },
  mobility_safety_index: {
    name: 'Mobility Safety',
    intent: 'Ensure ES does not harm handover performance',
    interpretation: {
      high: 'Handover safe and stable',
      medium: 'Mobility risk exists',
      low: 'High handover failure risk'
    },
    decisionImpact: {
      high: 'ES allowed',
      medium: 'Limit ES aggressiveness',
      low: 'ES forbidden'
    },
    role: 'Hard safety constraint',
    isHardBlock: true
  },
  social_event_score: {
    name: 'Social Event Risk',
    intent: 'Detect abnormal traffic due to mass events',
    interpretation: {
      high: 'Large event, potential traffic surge',
      medium: 'Moderate event activity',
      low: 'No event detected'
    },
    decisionImpact: {
      high: 'ES forbidden',
      medium: 'ES discouraged',
      low: 'No restriction on ES'
    },
    role: 'External contextual blocker',
    isHardBlock: true
  },
  traffic_volatility_index: {
    name: 'Traffic Stability',
    intent: 'Measure predictability of traffic behavior',
    interpretation: {
      low: 'Traffic highly stable',
      medium: 'Moderate fluctuation',
      high: 'Highly volatile traffic'
    },
    decisionImpact: {
      low: 'Supports ES',
      medium: 'Neutral',
      high: 'Opposes ES'
    },
    role: 'Risk mitigation feature'
  },
  weather_sensitivity_score: {
    name: 'Weather Impact',
    intent: 'Capture weather-driven traffic and mobility risk',
    interpretation: {
      high: 'Low operational risk (favorable weather)',
      medium: 'No significant impact',
      low: 'Increased operational risk (harsh weather)'
    },
    decisionImpact: {
      high: 'Supports ES',
      medium: 'No effect',
      low: 'Discourage ES'
    },
    role: 'External risk modifier'
  },
  neighbor_dependency_score: {
    name: 'Neighbor Dependency',
    intent: 'Identify cluster-critical cells',
    interpretation: {
      high: 'Cell is critical for cluster mobility',
      medium: 'Partial dependency',
      low: 'Non-critical cell'
    },
    decisionImpact: {
      high: 'ES forbidden',
      medium: 'Limit ES',
      low: 'ES allowed'
    },
    role: 'Hard topology constraint',
    isHardBlock: true
  },
  es_opportunity_score: {
    name: 'ES Opportunity',
    intent: 'Aggregate benefit vs risk for ES decision',
    interpretation: {
      high: 'Strong ES opportunity',
      medium: 'Limited ES opportunity',
      low: 'No ES opportunity'
    },
    decisionImpact: {
      high: 'Apply strong ES',
      medium: 'Apply light ES',
      low: 'Do not apply ES'
    },
    role: 'Final decision or label'
  },
  n_alarm: {
    name: 'Alarm Count',
    intent: 'Detect operational issues or network instability',
    interpretation: {
      low: 'No or minimal alarms',
      medium: 'Some alarms present',
      high: 'High number of active alarms'
    },
    decisionImpact: {
      low: 'Supports ES',
      medium: 'ES with caution',
      high: 'ES forbidden'
    },
    role: 'Operational health indicator',
    isHardBlock: true
  }
};

// MRO Feature Contexts
const MRO_CONTEXTS: Record<string, FeatureContext> = {
  handover_failure_pressure: {
    name: 'HO Failure Pressure',
    intent: 'Measure overall handover failure stress',
    interpretation: {
      high: 'Severe HO failure',
      medium: 'Noticeable HO degradation',
      low: 'Acceptable HO performance'
    },
    decisionImpact: {
      high: 'Strongly supports MRO',
      medium: 'Light MRO',
      low: 'No MRO needed'
    },
    role: 'Primary trigger'
  },
  handover_success_stability: {
    name: 'HO Stability',
    intent: 'Detect temporal instability of handover success',
    interpretation: {
      high: 'Stable HO behavior',
      medium: 'Slight instability',
      low: 'Highly unstable HO'
    },
    decisionImpact: {
      high: 'No MRO',
      medium: 'Light MRO',
      low: 'Strong MRO'
    },
    role: 'Stability indicator'
  },
  congestion_induced_ho_risk: {
    name: 'Congestion-Induced HO Risk',
    intent: 'Identify HO failures caused by target congestion',
    interpretation: {
      high: 'HO fails mainly due to congestion',
      medium: 'Partial congestion impact',
      low: 'HO failures are radio-related'
    },
    decisionImpact: {
      high: 'Enable MRO with load balancing',
      medium: 'Monitor and tune',
      low: 'Neutral'
    },
    role: 'Root-cause discriminator'
  },
  post_ho_qoe_degradation: {
    name: 'Post-HO QoE Degradation',
    intent: 'Detect QoE deterioration after handover',
    interpretation: {
      high: 'QoE significantly worse after HO',
      medium: 'Mild QoE degradation',
      low: 'QoE unchanged'
    },
    decisionImpact: {
      high: 'Strong MRO',
      medium: 'Light MRO',
      low: 'No MRO'
    },
    role: 'User-experience driven trigger'
  },
  mobility_volatility_index: {
    name: 'Mobility Volatility',
    intent: 'Capture abnormal HO fluctuation and ping-pong',
    interpretation: {
      high: 'Highly volatile mobility',
      medium: 'Mild volatility',
      low: 'Stable mobility'
    },
    decisionImpact: {
      high: 'Dynamic MRO required',
      medium: 'Monitor',
      low: 'No MRO'
    },
    role: 'Instability detector'
  },
  weather_driven_mobility_risk: {
    name: 'Weather-Driven Mobility Risk',
    intent: 'Capture environmental impact on mobility',
    interpretation: {
      high: 'Stable conditions (favorable weather)',
      medium: 'No major impact',
      low: 'High mobility risk (harsh weather)'
    },
    decisionImpact: {
      high: 'Allow aggressive optimization',
      medium: 'No effect',
      low: 'Conservative MRO/ES'
    },
    role: 'External risk modifier'
  },
  mro_necessity_score: {
    name: 'MRO Necessity',
    intent: 'Aggregate need for MRO activation',
    interpretation: {
      high: 'Strong MRO required',
      medium: 'Light MRO required',
      low: 'No MRO needed'
    },
    decisionImpact: {
      high: 'Activate strong MRO',
      medium: 'Activate light MRO',
      low: 'Do not activate MRO'
    },
    role: 'Final decision or trigger'
  }
};

// Determine qualitative level from value, threshold, and condition direction
function determineQualitativeLevel(
  featureValue: number,
  threshold: number,
  passed: boolean,
  condition: string
): 'high' | 'medium' | 'low' {
  // Parse condition to understand directionality
  const isLessThanOrEqual = condition.includes('<=') || condition.includes('<');
  const isGreaterThan = condition.includes('>');

  // For features where high values support the action (most cases)
  if (isGreaterThan) {
    if (passed) return 'high';  // Value > threshold, so it's high
    // Not passed, so value <= threshold
    const ratio = featureValue / threshold;
    return ratio > 0.7 ? 'medium' : 'low';
  }

  // For features where low values support the action (volatility, risk indices)
  if (isLessThanOrEqual) {
    if (passed) return 'low';   // Value <= threshold, so it's low
    // Not passed, so value > threshold
    const ratio = featureValue / threshold;
    return ratio < 1.5 ? 'medium' : 'high';
  }

  // Default fallback based on threshold relationship
  const ratio = featureValue / threshold;
  if (ratio >= 1.2) return 'high';
  if (ratio >= 0.8) return 'medium';
  return 'low';
}

function getFeatureContext(featureName: string, intentLabel: string): FeatureContext | null {
  const normalizedName = featureName.toLowerCase().replace(/[_\s-]/g, '_');
  const contextDb = intentLabel === 'ES' ? ES_CONTEXTS : MRO_CONTEXTS;
  return contextDb[normalizedName] || null;
}

// Convert feature name to question format
function featureToQuestion(featureName: string): string {
  const questionMap: Record<string, string> = {
    // ES-related features
    'Persistent Low Load': 'Is the cell persistently under low load?',
    'Energy Inefficiency': 'Is energy usage inefficient relative to traffic?',
    'QoS Stability': 'Is there a risk of unstable QoS?',
    'Mobility Safety': 'Is there a risk to mobility safety?',
    'Social Event Risk': 'Is there a high-impact social event nearby?',
    'Traffic Stability': 'Is traffic instability detected?',
    'Weather Impact': 'Is weather posing a risk to operation?',
    'Neighbor Dependency': 'Is this cell critical to neighbor mobility?',
    'Alarm Count': 'Are there active alarms indicating operational issues?',
    // MRO-related features
    'HO Failure Pressure': 'Is handover failure pressure high?',
    'HO Stability': 'Is handover stability degraded?',
    'Congestion-Induced HO Risk': 'Is congestion causing handover failures?',
    'Post-HO QoE Degradation': 'Is user experience degraded after handover?',
    'Mobility Volatility': 'Is mobility behavior unstable?',
    'Weather-Driven Mobility Risk': 'Is weather increasing mobility risk?',
  };

  return questionMap[featureName] ?? featureName;
}

// Check if impact contains "neutral"
function isNeutralImpact(impact: string): boolean {
  return impact.toLowerCase().includes('neutral');
}

export const DecisionTreeTracePanel: React.FC<DecisionTreeTracePanelProps> = ({ trace }) => {
  const [activeTab, setActiveTab] = useState<'explanation' | 'details'>('explanation');
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

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

  // Generate human-readable narrative
  const narratives = trace.path
    .filter(node => node.featureName !== 'LEAF')
    .map((node, idx) => {
      const context = getFeatureContext(node.featureName, trace.intentLabel);
      if (!context) {
        console.warn(`No context found for feature: "${node.featureName}". Normalized: "${node.featureName.toLowerCase().replace(/[_\s-]/g, '_')}"`);
        return null;
      }

      const level = determineQualitativeLevel(node.featureValue, node.threshold, node.passed, node.condition);
      const interpretation = context.interpretation[level];
      const impact = context.decisionImpact[level];

      console.log(`Feature: ${node.featureName}, Level: ${level}, Impact: ${impact}, Passed: ${node.passed}`);

      return {
        stepNumber: idx + 1,
        context,
        level,
        interpretation,
        impact,
        passed: node.passed
      };
    })
    .filter(Boolean);

  // Filter to show only non-neutral impacts
  const impactfulNarratives = narratives.filter((narrative: any) =>
    !isNeutralImpact(narrative.impact)
  );

  const toggleNodeExpansion = (stepNumber: number) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  return (
    <div className="bg-[#fdf9f8] rounded-lg shadow-md p-6" style={{ backgroundColor: 'var(--panel-bg, #fdf9f8)' }}>
      <style>{`.dark { --panel-bg: #5D0E41; }`}</style>
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-primary-600" />
        Decision Explanation: Why {finalActionLabel}?
      </h2>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('explanation')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'explanation'
                ? 'text-primary-700 dark:text-primary-400 border-b-2 border-primary-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Explanation
            </span>
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`px-6 py-3 font-semibold text-sm transition-colors relative ${
              activeTab === 'details'
                ? 'text-primary-700 border-b-2 border-primary-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Reasoning Path
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'explanation' ? (
        <>
          <div className="mb-6 p-4 bg-primary-50 border-l-4 border-primary-600 rounded">
        <div className="flex items-center gap-3 mb-2">
          {finalDecision ? (
            <CheckCircle className="w-8 h-8 text-green-600" />
          ) : (
            <XCircle className="w-8 h-8 text-red-600" />
          )}
          <div>
            <div className="text-sm text-slate-600 font-medium">Final Decision</div>
            <div className="text-2xl font-bold text-primary-700">{finalActionLabel}</div>
          </div>
        </div>
        <div className="text-sm text-slate-700 mt-2">
          The decision tree analyzed <strong>{impactfulNarratives.length} key factors</strong> with significant impact to reach this conclusion.
        </div>
      </div>

      {/* Human-Readable Narrative */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Key Decision Factors
        </h3>

        {impactfulNarratives.map((narrative: any, idx) => {
          const isHardBlock = narrative.context.isHardBlock;
          const isExpanded = expandedNodes.has(narrative.stepNumber);
          const question = featureToQuestion(narrative.context.name);
          const combinedAnswer = `${narrative.interpretation}. ${narrative.impact}.`;

          const borderColor = isHardBlock ? 'border-red-500' : 'border-primary-300';
          const bgColor = isHardBlock ? 'bg-red-50' : 'bg-slate-50';

          return (
            <div key={narrative.stepNumber} className={`border-l-4 ${borderColor} ${bgColor} rounded-r-lg p-4`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <h4 className="text-lg font-bold text-slate-800">{question}</h4>
                      {isHardBlock && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded">
                          <Shield className="w-3 h-3" />
                          CRITICAL
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleNodeExpansion(narrative.stepNumber)}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      aria-label="Toggle details"
                    >
                      <Info className="w-4 h-4" />
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Combined Answer */}
                  <div className={`p-3 rounded-lg mb-3 ${
                    narrative.passed
                      ? 'bg-green-100 border border-green-300'
                      : 'bg-orange-100 border border-orange-300'
                  }`}>
                    <div className="flex items-start gap-2">
                      {narrative.passed ? (
                        <CheckCircle className="w-5 h-5 text-green-700 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-700 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="font-semibold text-sm mb-1">
                          {narrative.passed ? 'Yes' : 'No'}
                        </div>
                        <div className="text-sm text-slate-700">
                          {combinedAnswer}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div className="space-y-2 text-sm pl-4 border-l-2 border-slate-300 ml-2">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-slate-700 min-w-[90px]">Purpose:</span>
                        <span className="text-slate-600">{narrative.context.intent}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-slate-700 min-w-[90px]">Observation:</span>
                        <span className="text-slate-800">{narrative.interpretation}</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-slate-700 min-w-[90px]">Impact:</span>
                        <span className={`font-semibold ${narrative.passed ? 'text-green-700' : 'text-red-700'}`}>
                          {narrative.impact}
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="font-semibold text-slate-700 min-w-[90px]">Role:</span>
                        <span className="text-slate-600">{narrative.context.role}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Interpretation */}
      <div className="mt-6 p-4 bg-slate-100 border border-slate-300 rounded-lg">
        <h4 className="font-bold text-slate-800 mb-2">📖 How to Interpret This Decision</h4>
        <div className="text-sm text-slate-700 space-y-2">
          <p>
            Each factor above represents a <strong>key question</strong> the AI model considered when making this decision.
            Only factors with significant impact (non-neutral) are shown for clarity.
          </p>
          <p>
            The <strong>combined answer</strong> includes both what was observed and its impact on the decision.
            Click the <Info className="w-3 h-3 inline mx-1" /> icon to see detailed analysis including purpose, detailed observation, and impact breakdown.
          </p>
          <p>
            Factors marked <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded">
              <Shield className="w-3 h-3" />
              CRITICAL
            </span> are hard constraints that can block actions to protect network quality and user experience.
          </p>
        </div>
      </div>
        </>
      ) : (
        /* Details Tab - Tree Visualization */
        <div className="space-y-6">
          <div className="mb-4 p-4 bg-primary-50 border-l-4 border-primary-600 rounded">
            <div className="flex items-center gap-3 mb-2">
              {finalDecision ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : (
                <XCircle className="w-8 h-8 text-red-600" />
              )}
              <div>
                <div className="text-sm text-slate-600 font-medium">Final Decision</div>
                <div className="text-2xl font-bold text-primary-700">{finalActionLabel}</div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-6 overflow-x-auto">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-primary-600" />
              Decision Tree Visualization
            </h3>

            {/* Tree Visualization */}
            <div className="flex justify-center py-8">
              {renderTreeNode(trace.path, 0, finalDecision)}
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-300 rounded">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div className="text-sm">
                <div className="font-semibold text-green-900">Condition Met</div>
                <div className="text-green-700">Branch taken</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-300 rounded">
              <XCircle className="w-5 h-5 text-red-600" />
              <div className="text-sm">
                <div className="font-semibold text-red-900">Condition Not Met</div>
                <div className="text-red-700">Branch not taken</div>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-300 rounded">
              <GitBranch className="w-5 h-5 text-blue-600" />
              <div className="text-sm">
                <div className="font-semibold text-blue-900">Leaf Node</div>
                <div className="text-blue-700">Final decision</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Recursive function to render scikit-learn-style tree nodes
function renderTreeNode(path: DecisionTreeTrace['path'], index: number, finalDecision?: boolean): React.ReactNode {
  if (index >= path.length) return null;

  const node = path[index];
  const isLeaf = node.featureName === 'LEAF';
  const nextNode = index + 1 < path.length ? path[index + 1] : null;

  if (isLeaf) {
    return (
      <div className="flex flex-col items-center">
        <div className={`px-6 py-4 rounded-lg border-2 shadow-lg ${
          finalDecision
            ? 'bg-green-100 border-green-500'
            : 'bg-red-100 border-red-500'
        }`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {finalDecision ? (
                <CheckCircle className="w-6 h-6 text-green-700" />
              ) : (
                <XCircle className="w-6 h-6 text-red-700" />
              )}
              <div className="font-bold text-lg">Leaf Node</div>
            </div>
            <div className={`text-sm font-semibold ${finalDecision ? 'text-green-800' : 'text-red-800'}`}>
              {node.condition}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {/* Current Node */}
      <div className={`px-6 py-4 rounded-lg border-2 shadow-md min-w-[280px] ${
        node.passed
          ? 'bg-[#fdf9f8] border-green-400'
          : 'bg-[#fdf9f8] border-slate-300 opacity-60'
      }`}>
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            {node.passed ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <div className="w-5 h-5 rounded-full border-2 border-slate-400" />
            )}
            <span className="text-xs font-semibold text-slate-600">Node {node.nodeId}</span>
          </div>

          <div className="font-bold text-sm text-slate-800 break-words">
            {node.featureName}
          </div>

          <div className="text-xs text-slate-700 bg-slate-100 rounded px-2 py-1">
            {node.condition}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200">
            <div>
              <div className="text-slate-600">Threshold</div>
              <div className="font-semibold text-slate-800">{node.threshold.toFixed(3)}</div>
            </div>
            <div>
              <div className="text-slate-600">Value</div>
              <div className="font-semibold text-slate-800">{node.featureValue.toFixed(3)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow and Next Node */}
      {nextNode && (
        <div className="flex flex-col items-center">
          <div className={`w-0.5 h-12 ${node.passed ? 'bg-green-500' : 'bg-slate-300'}`} />
          <div className={`px-3 py-1 rounded text-xs font-semibold ${
            node.passed
              ? 'bg-green-500 text-white'
              : 'bg-slate-300 text-slate-600'
          }`}>
            {node.passed ? (
              <span className="flex items-center gap-1">
                <TrendingDown className="w-3 h-3" />
                True
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                False
              </span>
            )}
          </div>
          <div className={`w-0.5 h-12 ${node.passed ? 'bg-green-500' : 'bg-slate-300'}`} />
          {renderTreeNode(path, index + 1, finalDecision)}
        </div>
      )}
    </div>
  );
}
