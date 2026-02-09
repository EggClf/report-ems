import React from 'react';
import { BookOpen, Shield, AlertTriangle, CheckCircle, XCircle, Lightbulb } from 'lucide-react';
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

  // Generate human-readable narrative
  const narratives = trace.path
    .filter(node => node.featureName !== 'LEAF')
    .map((node, idx) => {
      const context = getFeatureContext(node.featureName, trace.intentLabel);
      if (!context) return null;

      const level = determineQualitativeLevel(node.featureValue, node.threshold, node.passed, node.condition);
      const interpretation = context.interpretation[level];
      const impact = context.decisionImpact[level];

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <BookOpen className="w-6 h-6 text-indigo-600" />
        Decision Explanation: Why {finalActionLabel}?
      </h2>

      <div className="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-600 rounded">
        <div className="flex items-center gap-3 mb-2">
          {finalDecision ? (
            <CheckCircle className="w-8 h-8 text-green-600" />
          ) : (
            <XCircle className="w-8 h-8 text-red-600" />
          )}
          <div>
            <div className="text-sm text-slate-600 font-medium">Final Decision</div>
            <div className="text-2xl font-bold text-indigo-700">{finalActionLabel}</div>
          </div>
        </div>
        <div className="text-sm text-slate-700 mt-2">
          The decision tree analyzed <strong>{narratives.length} key factors</strong> from the network context to reach this conclusion.
        </div>
      </div>

      {/* Human-Readable Narrative */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Step-by-Step Decision Logic
        </h3>

        {narratives.map((narrative: any, idx) => {
          const isHardBlock = narrative.context.isHardBlock;
          const borderColor = isHardBlock ? 'border-red-500' : 'border-indigo-300';
          const bgColor = isHardBlock ? 'bg-red-50' : 'bg-slate-50';

          return (
            <div key={idx} className={`border-l-4 ${borderColor} ${bgColor} rounded-r-lg p-4`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {narrative.stepNumber}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-lg font-bold text-slate-800">{narrative.context.name}</h4>
                    {isHardBlock && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded">
                        <Shield className="w-3 h-3" />
                        SAFETY CRITICAL
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 min-w-[80px]">Purpose:</span>
                      <span className="text-slate-600">{narrative.context.intent}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 min-w-[80px]">Observation:</span>
                      <span className="text-slate-800 font-medium">{narrative.interpretation}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-700 min-w-[80px]">Impact:</span>
                      <span className={`font-semibold ${narrative.passed ? 'text-green-700' : 'text-red-700'}`}>
                        {narrative.impact}
                      </span>
                    </div>

                    <div className={`mt-3 p-3 rounded-lg ${narrative.passed ? 'bg-green-100 border border-green-300' : 'bg-orange-100 border border-orange-300'}`}>
                      <div className="flex items-center gap-2">
                        {narrative.passed ? (
                          <CheckCircle className="w-5 h-5 text-green-700" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-orange-700" />
                        )}
                        <span className="font-semibold text-sm">
                          {narrative.passed 
                            ? `✓ This factor supports the decision` 
                            : `⚠ This factor opposes or blocks the decision`}
                        </span>
                      </div>
                    </div>
                  </div>
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
            Each step above represents a <strong>factor</strong> the AI model considered when making this decision.
            The factors are evaluated in sequence, building up to the final recommendation.
          </p>
          <p>
            <strong className="text-indigo-700">Purpose</strong> explains what the factor measures.{' '}
            <strong className="text-indigo-700">Observation</strong> describes what was detected in the current network state.{' '}
            <strong className="text-indigo-700">Impact</strong> shows how this factor influences the decision.
          </p>
          <p>
            Factors marked <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-600 text-white text-xs font-semibold rounded">
              <Shield className="w-3 h-3" />
              SAFETY CRITICAL
            </span> are hard constraints that can block actions to protect network quality and user experience.
          </p>
        </div>
      </div>
    </div>
  );
};
